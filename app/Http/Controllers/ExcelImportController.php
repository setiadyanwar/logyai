<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use App\Models\LogEntry;
use Carbon\Carbon;

class ExcelImportController extends Controller
{
    /**
     * Parse Excel file dan return preview data
     */
    public function parseExcel(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // max 10MB
            ]);

            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();

            // Get all rows
            $rows = $worksheet->toArray();

            // Detect header row (baris yang ada "Pekan", "Hari/Tanggal", "Uraian")
            $headerRowIndex = $this->detectHeaderRow($rows);

            if ($headerRowIndex === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format Excel tidak valid. Pastikan ada kolom: Pekan, Hari/Tanggal, Uraian Pekerjaan'
                ], 400);
            }

            $headers = $rows[$headerRowIndex];

            // Find column indexes
            $pekanCol = $this->findColumnIndex($headers, ['pekan', 'minggu', 'week']);
            $tanggalCol = $this->findColumnIndex($headers, ['hari', 'tanggal', 'date', 'hari/tanggal']);
            $uraianCol = $this->findColumnIndex($headers, ['uraian', 'pekerjaan', 'kegiatan', 'aktivitas', 'uraian pekerjaan']);

            if ($tanggalCol === null || $uraianCol === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kolom Hari/Tanggal atau Uraian Pekerjaan tidak ditemukan'
                ], 400);
            }

            // Parse data rows
            $parsedData = [];
            for ($i = $headerRowIndex + 1; $i < count($rows); $i++) {
                $row = $rows[$i];

                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                $tanggal = $row[$tanggalCol] ?? null;
                $uraian = $row[$uraianCol] ?? null;

                // Skip if no tanggal or uraian
                if (empty($tanggal) || empty($uraian)) {
                    continue;
                }

                // Parse tanggal
                $parsedTanggal = $this->parseTanggal($tanggal);

                if (!$parsedTanggal) {
                    continue; // Skip jika tanggal tidak valid
                }

                $parsedData[] = [
                    'row_number' => $i + 1,
                    'pekan' => $pekanCol !== null ? ($row[$pekanCol] ?? '') : '',
                    'tanggal_raw' => $tanggal,
                    'tanggal' => $parsedTanggal,
                    'uraian' => trim($uraian),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $parsedData,
                'total' => count($parsedData),
                'message' => 'Excel berhasil di-parse. ' . count($parsedData) . ' baris data ditemukan.'
            ]);

        } catch (\Exception $e) {
            Log::error('Parse Excel Error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal parse Excel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk import dengan AI processing
     */
    public function bulkImportWithAI(Request $request)
    {
        try {
            $request->validate([
                'data' => 'required|array',
                'data.*.tanggal' => 'required|string',
                'data.*.uraian' => 'required|string',
            ]);

            $data = $request->input('data');
            $geminiService = new GeminiService();
            $successCount = 0;
            $failedCount = 0;
            $errors = [];

            foreach ($data as $index => $item) {
                try {
                    $tanggal = $item['tanggal'];
                    $uraian = $item['uraian'];

                    // Generate logbook entry menggunakan AI
                    $aiResult = $this->generateLogbookFromUraian($uraian, $tanggal, $geminiService);

                    if (!$aiResult) {
                        // Fallback jika AI gagal
                        $aiResult = $this->generateFallbackLogbook($uraian, $tanggal);
                    }

                    // Create log entry
                    LogEntry::create([
                        'tanggal' => $aiResult['tanggal'],
                        'waktu_mulai' => $aiResult['waktu_mulai'],
                        'waktu_selesai' => $aiResult['waktu_selesai'],
                        'jenis_kegiatan' => $aiResult['jenis_kegiatan'],
                        'dosen_penggerak' => $aiResult['dosen_penggerak'],
                        'tipe_penyelenggaraan' => $aiResult['tipe_penyelenggaraan'],
                        'lokasi' => $aiResult['lokasi'],
                        'judul' => $aiResult['judul'],
                        'keterangan' => $aiResult['keterangan'],
                        'bukti_path' => null, // Excel import tidak ada bukti
                        'export_status' => 'pending',
                    ]);

                    $successCount++;

                } catch (\Exception $e) {
                    $failedCount++;
                    $errors[] = [
                        'row' => $index + 1,
                        'uraian' => $uraian,
                        'error' => $e->getMessage()
                    ];
                    Log::error('Bulk import error for row ' . ($index + 1) . ': ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Import selesai! Berhasil: {$successCount}, Gagal: {$failedCount}",
                'success_count' => $successCount,
                'failed_count' => $failedCount,
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            Log::error('Bulk Import Error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal import data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate logbook entry dari uraian menggunakan AI
     */
    private function generateLogbookFromUraian($uraian, $tanggal, $geminiService)
    {
        $prompt = "Kamu adalah asisten AI untuk logbook magang mahasiswa IPB di Telkomsigma (frontend developer).

INPUT DARI EXCEL:
Tanggal: {$tanggal}
Uraian Pekerjaan: \"{$uraian}\"

TUGASMU:
Generate logbook entry yang lengkap dan profesional berdasarkan uraian singkat dari Excel.

ATURAN PENTING:
- Perbaiki dan sempurnakan judul menjadi profesional (kapitalisasi benar, singkatan uppercase)
- Generate deskripsi detail (minimal 100 kata) berdasarkan uraian
- Tentukan jenis kegiatan yang sesuai
- Set waktu default (08:30 - 17:30)
- Set dosen penggerak default
- Set lokasi default

POLA KONSISTEN untuk judul:
1. Development/coding: \"Pengembangan [Fitur/Component] [Nama Sistem]\"
2. Bug fixing: \"Perbaikan Bug [Deskripsi] pada [Sistem]\"
3. Integration: \"Integrasi [Teknologi/API] pada [Sistem]\"
4. Testing: \"Testing dan Quality Assurance [Fitur]\"
5. Deployment: \"Deployment [FE/BE/Fullstack] ke [Environment]\"
6. Meeting: \"Meeting [Topik] dengan [Tim]\"

STRUKTUR DESKRIPSI:
Paragraf 1 (What): Melakukan [aktivitas]...
Paragraf 2 (How): Menggunakan [teknologi]...
Paragraf 3 (Result): Hasil yang dicapai...

FORMAT OUTPUT JSON:
{
  \"judul\": \"Judul yang diperbaiki\",
  \"keterangan\": \"Deskripsi detail kegiatan\",
  \"jenis_kegiatan\": \"Berita Acara Kegiatan|Berita Acara Pembimbingan (Konsultasi/Mentoring/Coaching)|Berita Acara Ujian\",
  \"tipe_penyelenggaraan\": \"offline|online|hybrid\",
  \"lokasi\": \"Graha Telkomsigma II, Tangerang Selatan\",
  \"tanggal\": \"{$tanggal}\",
  \"waktu_mulai\": \"08:30\",
  \"waktu_selesai\": \"17:30\",
  \"dosen_penggerak\": \"Amata Fami, M.Ds. - 201807198507182001\"
}

Pastikan response HANYA berisi JSON yang valid, tanpa markdown atau format lain.";

        try {
            $result = $geminiService->generateContent($prompt, [
                'excel_import' => true,
                'uraian' => $uraian,
                'tanggal' => $tanggal
            ]);

            return $result;
        } catch (\Exception $e) {
            Log::error('AI generation error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Fallback jika AI gagal
     */
    private function generateFallbackLogbook($uraian, $tanggal)
    {
        // Simple title improvement
        $judul = ucwords(strtolower($uraian));
        if (strlen($judul) > 80) {
            $judul = substr($judul, 0, 77) . '...';
        }

        // Determine jenis_kegiatan based on keywords
        $uraianLower = strtolower($uraian);
        $jenisKegiatan = 'Berita Acara Kegiatan';

        if (str_contains($uraianLower, 'konsultasi') || str_contains($uraianLower, 'mentoring') || str_contains($uraianLower, 'bimbingan')) {
            $jenisKegiatan = 'Berita Acara Pembimbingan (Konsultasi/Mentoring/Coaching)';
        } elseif (str_contains($uraianLower, 'ujian') || str_contains($uraianLower, 'evaluasi') || str_contains($uraianLower, 'presentasi hasil')) {
            $jenisKegiatan = 'Berita Acara Ujian';
        }

        return [
            'judul' => $judul,
            'keterangan' => "Melakukan kegiatan: {$uraian}. Aktivitas ini merupakan bagian dari program magang di Telkomsigma.",
            'jenis_kegiatan' => $jenisKegiatan,
            'tipe_penyelenggaraan' => 'offline',
            'lokasi' => 'Graha Telkomsigma II, Tangerang Selatan',
            'tanggal' => $tanggal,
            'waktu_mulai' => '08:30',
            'waktu_selesai' => '17:30',
            'dosen_penggerak' => 'Amata Fami, M.Ds. - 201807198507182001'
        ];
    }

    /**
     * Detect header row dari Excel
     */
    private function detectHeaderRow($rows)
    {
        foreach ($rows as $index => $row) {
            $rowString = strtolower(implode(' ', array_filter($row)));

            // Check if this row contains common header keywords
            if (
                (str_contains($rowString, 'pekan') || str_contains($rowString, 'minggu')) ||
                (str_contains($rowString, 'tanggal') || str_contains($rowString, 'hari')) &&
                (str_contains($rowString, 'uraian') || str_contains($rowString, 'pekerjaan') || str_contains($rowString, 'kegiatan'))
            ) {
                return $index;
            }
        }

        return null;
    }

    /**
     * Find column index berdasarkan keywords
     */
    private function findColumnIndex($headers, $keywords)
    {
        foreach ($headers as $index => $header) {
            $headerLower = strtolower(trim($header));

            foreach ($keywords as $keyword) {
                if (str_contains($headerLower, $keyword)) {
                    return $index;
                }
            }
        }

        return null;
    }

    /**
     * Parse tanggal dari berbagai format
     */
    private function parseTanggal($tanggal)
    {
        try {
            // Jika Excel date serial number
            if (is_numeric($tanggal)) {
                return Date::excelToDateTimeObject($tanggal)->format('Y-m-d');
            }

            // Parse menggunakan Carbon
            $parsed = Carbon::parse($tanggal);
            return $parsed->format('Y-m-d');

        } catch (\Exception $e) {
            // Try manual parsing for Indonesian format
            // Format: "Senin, 14 Oktober 2024" atau "14/10/2024" atau "14-10-2024"

            // Remove day name (Senin, Selasa, etc)
            $tanggal = preg_replace('/^(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu),?\s*/i', '', trim($tanggal));

            // Try parsing again
            try {
                $parsed = Carbon::parse($tanggal);
                return $parsed->format('Y-m-d');
            } catch (\Exception $e2) {
                Log::warning('Failed to parse tanggal: ' . $tanggal);
                return null;
            }
        }
    }
}
