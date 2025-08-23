<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class GeminiService
{
    protected $apiKey;
    protected $baseUrl;
    protected $model;

    public function __construct()
    {
        $this->apiKey = config('gemini.api_key');
        $this->baseUrl = config('gemini.base_url');
        $this->model = config('gemini.model');
    }

    /**
     * Generate content menggunakan Gemini API
     */
    public function generateContent($prompt, $context = [])
    {
        if (!$this->apiKey) {
            Log::warning('Gemini API key tidak ditemukan');
            return null;
        }

        try {
            $url = "{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}";
            
            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            [
                                'text' => $this->buildPrompt($prompt, $context)
                            ]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => config('gemini.temperature'),
                    'topK' => config('gemini.top_k'),
                    'topP' => config('gemini.top_p'),
                    'maxOutputTokens' => config('gemini.max_tokens'),
                ]
            ];

            Log::info('Gemini API request', [
                'url' => $url,
                'model' => $this->model,
                'temperature' => config('gemini.temperature'),
                'max_tokens' => config('gemini.max_tokens')
            ]);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])
            ->timeout(config('gemini.timeout'))
            ->withoutVerifying() // Skip SSL verification for development
            ->post($url, $payload);

            Log::info('Gemini API response received', [
                'status' => $response->status(),
                'body_length' => strlen($response->body())
            ]);

            if ($response->successful()) {
                $parsedResponse = $this->parseResponse($response->json());
                Log::info('Gemini API response parsed successfully', [
                    'has_response' => $parsedResponse !== null
                ]);
                return $parsedResponse;
            }

            Log::error('Gemini API request failed', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return null;

        } catch (\Exception $e) {
            Log::error('Gemini API Error: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Build prompt untuk logbook generation
     */
    protected function buildPrompt($prompt, $context = [])
    {
        $systemPrompt = "Anda adalah asisten AI profesional untuk logbook magang mahasiswa IPB. Tugas Anda adalah menganalisis deskripsi kegiatan yang diberikan dan menghasilkan judul dan keterangan yang SPESIFIK, KREATIF, dan PROFESIONAL.

**ATURAN PENTING:**
- WAJIB menggunakan kata-kata yang KREATIF dan SPESIFIK
- Analisis KONTEKS kegiatan dan buat versi yang lebih menarik
- Hindari kata-kata generik seperti 'Perancangan', 'Implementasi', 'Pengembangan'
- Gunakan istilah teknis yang lebih spesifik dan menarik

**ATURAN UNTUK JUDUL:**
- Gunakan bahasa Indonesia yang baik dan benar
- Judul harus UNIK, KREATIF, dan MENARIK
- Gunakan kapitalisasi Title Case yang tepat
- Panjang judul 4-7 kata
- Gunakan istilah teknis yang spesifik
- Contoh format: 'Pembuatan Interface Dashboard HRIS' atau 'Coding Frontend Sistem Karyawan'

**ATURAN UNTUK KETERANGAN:**
- Gunakan bahasa semi formal yang sopan dan profesional
- Struktur kalimat yang jelas dan teratur
- Sertakan detail kegiatan yang RELEVAN dengan konteks
- Panjang 2-3 kalimat yang informatif
- Jelaskan: APA yang dilakukan, BAGAIMANA prosesnya, dan HASIL yang dicapai
- Buat deskripsi yang KONTEKSTUAL dengan judul

**CONTOH JUDUL YANG KREATIF DAN SPESIFIK:**
- Input: 'Mengerjakan sistem management karyawan (HRIS) membuat tampilan utama'
  Output: 'Pembuatan Interface Dashboard HRIS Telkomsigma'
  
- Input: 'meeting dengan tim development'
  Output: 'Koordinasi Sprint Planning Tim Frontend'
  
- Input: 'debug website dan fix error'
  Output: 'Troubleshooting Bug Aplikasi Web'

**WAJIB HINDARI KATA-KATA INI:**
- Perancangan, Implementasi, Pengembangan (terlalu generik)
- Sistem (ganti dengan aplikasi/platform/software)
- Melakukan (langsung sebutkan aktivitasnya)

**WAJIB GUNAKAN KATA-KATA INI:**
- Pembuatan, Coding, Building, Programming
- Interface, Dashboard, Frontend, Backend
- Troubleshooting, Debugging, Testing
- Integrasi, Konfigurasi, Optimasi

**CONTOH DESKRIPSI KONTEKSTUAL:**
Judul: 'Pembuatan Interface Dashboard HRIS Telkomsigma'
Deskripsi: 'Membangun antarmuka dashboard utama untuk aplikasi Human Resource Information System (HRIS) di Telkomsigma menggunakan React.js dan Tailwind CSS. Proses coding meliputi pembuatan komponen UI responsif, integrasi API untuk menampilkan data karyawan, dan testing fungsionalitas untuk memastikan user experience yang optimal.'

**FORMAT RESPONSE (JSON):**
{
    \"judul\": \"Judul Kegiatan yang Spesifik dan Relevan\",
    \"keterangan\": \"Deskripsi detail yang semi formal, terstruktur, dan informatif sesuai konteks.\"
}

**CATATAN:**
- Fokus pada KONTEKS kegiatan yang sebenarnya
- Buat judul yang SPESIFIK dan RELEVAN
- Deskripsi harus menjelaskan kegiatan yang SEBENARNYA dilakukan
- Gunakan bahasa yang profesional dan akademis";

        return $systemPrompt . "\n\n**DESKRIPSI KEGIATAN YANG DIBERIKAN:**\n" . $prompt . "\n\n**TUGAS ANDA:**\nBuat judul yang KREATIF dan SPESIFIK menggunakan kata-kata teknis yang menarik. HINDARI kata generik seperti 'Perancangan', 'Implementasi', 'Pengembangan'. Gunakan kata seperti 'Pembuatan', 'Coding', 'Building', 'Programming'. Buat deskripsi yang menjelaskan proses teknis yang sebenarnya dilakukan.";
    }

    /**
     * Parse response dari Gemini API
     */
    protected function parseResponse($response)
    {
        try {
            $content = $response['candidates'][0]['content']['parts'][0]['text'] ?? '';
            
            if (empty($content)) {
                Log::warning('Gemini API response content kosong');
                return null;
            }

            // Clean content dari markdown formatting
            $content = preg_replace('/```json\s*|\s*```/', '', $content);
            $content = trim($content);

            // Parse JSON
            $parsedContent = json_decode($content, true);

            if (json_last_error() === JSON_ERROR_NONE && 
                isset($parsedContent['judul']) && 
                isset($parsedContent['keterangan'])) {
                
                Log::info('Gemini API response berhasil diparse', [
                    'judul' => $parsedContent['judul'],
                    'keterangan_length' => strlen($parsedContent['keterangan'])
                ]);
                
                return $parsedContent;
            }

            Log::warning('Gemini API response JSON tidak valid', [
                'content' => $content,
                'json_error' => json_last_error_msg()
            ]);

            return null;

        } catch (\Exception $e) {
            Log::error('Error parsing Gemini response: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Test koneksi ke Gemini API
     */
    public function testConnection()
    {
        try {
            $response = $this->generateContent('Test koneksi Gemini API');
            return $response !== null;
        } catch (\Exception $e) {
            Log::error('Gemini connection test failed: ' . $e->getMessage());
            return false;
        }
    }
}
