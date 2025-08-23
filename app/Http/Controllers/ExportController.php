<?php

namespace App\Http\Controllers;

use App\Models\LogEntry;
use App\Jobs\ExportLogToPortal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ExportController extends Controller
{
    public function export(Request $request, LogEntry $log)
    {
        try {
            // Validasi log entry
            if (empty($log->bukti_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Log tidak memiliki bukti aktivitas. Upload bukti terlebih dahulu.'
                ], 400);
            }

            // Validasi data yang diperlukan
            $requiredFields = ['tanggal', 'waktu_mulai', 'waktu_selesai', 'jenis_kegiatan', 'dosen_penggerak', 'lokasi', 'keterangan'];
            foreach ($requiredFields as $field) {
                if (empty($log->$field)) {
                    return response()->json([
                        'success' => false,
                        'message' => "Field {$field} harus diisi sebelum ekspor."
                    ], 400);
                }
            }

            // Dispatch job untuk ekspor
            ExportLogToPortal::dispatch($log);

            // Update status export
            $log->update(['export_status' => 'queued']);

            return response()->json([
                'success' => true,
                'message' => 'Log berhasil diantrekan untuk ekspor ke portal IPB.'
            ]);

        } catch (\Exception $e) {
            Log::error('Export Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengekspor log. Silakan coba lagi.'
            ], 500);
        }
    }
}