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
                    'candidateCount' => 1, // Force single response
                ],
                'safetySettings' => [
                    [
                        'category' => 'HARM_CATEGORY_HARASSMENT',
                        'threshold' => 'BLOCK_NONE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_HATE_SPEECH', 
                        'threshold' => 'BLOCK_NONE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        'threshold' => 'BLOCK_NONE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        'threshold' => 'BLOCK_NONE'
                    ]
                ]
            ];

            Log::info('Gemini API request', [
                'url' => $url,
                'model' => $this->model,
                'temperature' => config('gemini.temperature'),
                'max_tokens' => config('gemini.max_tokens'),
                'prompt_length' => strlen($this->buildPrompt($prompt, $context))
            ]);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0'
            ])
            ->timeout(config('gemini.timeout'))
            ->withoutVerifying() // Skip SSL verification for development
            ->post($url, $payload);

            Log::info('Gemini API response received', [
                'status' => $response->status(),
                'body_length' => strlen($response->body()),
                'headers' => $response->headers()
            ]);

            if ($response->successful()) {
                $parsedResponse = $this->parseResponse($response->json());
                Log::info('Gemini API response parsed successfully', [
                    'has_response' => $parsedResponse !== null,
                    'response_data' => $parsedResponse
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
        $systemPrompt = "Anda adalah asisten AI profesional untuk logbook magang mahasiswa IPB. Tugas Anda adalah memperbaiki, mengkonsistenkan, dan menyempurnakan judul kegiatan yang diberikan, serta menghasilkan keterangan yang LENGKAP, DETAIL, dan PROFESIONAL.

**ATURAN PENTING:**
- WAJIB memperbaiki tata bahasa judul yang diberikan user
- Konsistenkan format penulisan dan kapitalisasi
- Perbaiki ejaan dan struktur kalimat
- Buat versi yang lebih profesional namun tetap mempertahankan makna asli
- Gunakan bahasa Indonesia yang baik dan benar sesuai KBBI dan EYD

**ATURAN UNTUK JUDUL:**
- Gunakan bahasa Indonesia yang baik dan benar
- Perbaiki dan konsistenkan kapitalisasi Title Case yang tepat
- Panjang judul 5-10 kata (detail dan deskriptif, TIDAK SINGKAT)
- Gunakan istilah teknis yang spesifik dan profesional
- Perbaiki kesalahan ejaan, tata bahasa, dan struktur kalimat
- Buat judul yang informatif dan jelas menggambarkan kegiatan
- Contoh format: 'Pembuatan Interface Dashboard Human Resource Information System' atau 'Coding Frontend Sistem Manajemen Data Karyawan'

**ATURAN UNTUK KETERANGAN:**
- Gunakan bahasa formal yang sopan dan profesional
- Struktur kalimat yang jelas, teratur, dan mudah dipahami
- Sertakan detail kegiatan yang LENGKAP dan KOMPREHENSIF
- Panjang 3-5 kalimat yang informatif dan detail (TIDAK SINGKAT)
- Jelaskan secara mendetail: APA yang dilakukan, MENGAPA dilakukan, BAGAIMANA prosesnya, TEKNOLOGI apa yang digunakan, dan HASIL yang dicapai
- Buat deskripsi yang KONTEKSTUAL dan RELEVAN dengan judul
- Gunakan paragraf yang kohesif dan terstruktur dengan baik

**CONTOH PERBAIKAN JUDUL (Dari Bahasa Kasual ke Profesional):**
- Input: 'bikin api'
  Output: 'Pembuatan Application Programming Interface untuk Integrasi Data'

- Input: 'ngerjain dashboard'
  Output: 'Pengembangan Dashboard Analytics untuk Sistem Monitoring'

- Input: 'buat dashboard hris'
  Output: 'Pembuatan Interface Dashboard Human Resource Information System Telkomsigma'

- Input: 'meeting tim dev'
  Output: 'Koordinasi Sprint Planning dengan Tim Development Frontend'

- Input: 'fix bug website'
  Output: 'Troubleshooting dan Perbaikan Bug pada Aplikasi Web Portal'

- Input: 'deploy aplikasi'
  Output: 'Deployment Aplikasi Web ke Production Server'

**PERBAIKAN KATA KASUAL ke PROFESIONAL:**
- 'bikin' → 'Pembuatan' atau 'Pengembangan'
- 'ngerjain' → 'Mengerjakan' atau 'Pengembangan'
- 'buat' → 'Pembuatan' atau 'Pembangunan'
- 'coding' → 'Pengembangan Kode' atau 'Programming'
- 'fix' → 'Perbaikan' atau 'Troubleshooting'
- 'deploy' → 'Deployment'
- 'testing' → 'Pengujian' atau 'Quality Assurance'

**WAJIB HINDARI KATA-KATA INI:**
- Kata-kata yang terlalu singkat atau tidak jelas
- Singkatan yang tidak standar (kecuali singkatan teknis yang umum seperti HRIS, API, UI/UX)

**WAJIB GUNAKAN KATA-KATA INI:**
- Pembuatan, Pengembangan, Perancangan, Implementasi
- Interface, Dashboard, Frontend, Backend, Full-Stack
- Troubleshooting, Debugging, Testing, Quality Assurance
- Integrasi, Konfigurasi, Optimasi, Deployment
- Sistem, Aplikasi, Platform, Software

**CONTOH KETERANGAN YANG LENGKAP DAN DETAIL:**
Judul: 'Pembuatan Interface Dashboard Human Resource Information System Telkomsigma'
Keterangan: 'Melaksanakan pengembangan antarmuka pengguna untuk dashboard utama aplikasi Human Resource Information System (HRIS) di PT Telkomsigma menggunakan teknologi React.js sebagai framework frontend dan Tailwind CSS untuk styling. Proses development meliputi perancangan komponen UI yang responsif dan user-friendly, implementasi integrasi RESTful API untuk menampilkan data karyawan secara real-time dari backend, serta pelaksanaan comprehensive testing untuk memastikan fungsionalitas berjalan optimal di berbagai perangkat dan browser. Hasil dari kegiatan ini adalah antarmuka dashboard yang interaktif, informatif, dan memudahkan tim HR dalam mengelola data karyawan dengan efisien.'

**FORMAT RESPONSE (JSON):**
{
    \"judul\": \"Judul Kegiatan yang Telah Diperbaiki, Dikonsistenkan, dan Diprofesionalkan (5-10 kata, detail dan deskriptif)\",
    \"keterangan\": \"Deskripsi lengkap dan komprehensif yang menjelaskan kegiatan secara mendetail dengan bahasa formal dan profesional (3-5 kalimat yang informatif, TIDAK SINGKAT).\"
}

**CATATAN PENTING:**
- Fokus pada PERBAIKAN dan PENYEMPURNAAN judul yang diberikan user
- Buat judul yang PROFESIONAL dan mudah dipahami
- Deskripsi harus LENGKAP, DETAIL, dan menjelaskan kegiatan secara komprehensif
- Gunakan bahasa yang profesional, formal, dan akademis
- JANGAN membuat deskripsi yang singkat, buat yang DETAIL dan INFORMATIF
- Pastikan tata bahasa Indonesia yang sempurna sesuai EYD dan KBBI";

        $finalPrompt = $systemPrompt . "\n\n**JUDUL KEGIATAN YANG DIBERIKAN USER (PERLU DIPERBAIKI):**\n" . $prompt . "\n\n**TUGAS ANDA:**\n1. Perbaiki tata bahasa, ejaan, dan kapitalisasi judul yang diberikan\n2. Konsistenkan format penulisan agar profesional (5-10 kata, detail dan deskriptif)\n3. Buat keterangan yang LENGKAP dan DETAIL (3-5 kalimat) yang menjelaskan kegiatan secara komprehensif\n4. Gunakan bahasa Indonesia yang formal, profesional, dan sesuai EYD\n5. Pastikan judul dan keterangan saling berkaitan dan kontekstual";

        return $finalPrompt;
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

            // Log raw response untuk debugging
            Log::info('Gemini raw response received', [
                'content_length' => strlen($content),
                'content_preview' => substr($content, 0, 200) . '...',
                'full_content' => $content
            ]);

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
                    'keterangan_length' => strlen($parsedContent['keterangan']),
                    'keterangan_preview' => substr($parsedContent['keterangan'], 0, 100) . '...',
                    'parsed_data' => $parsedContent
                ]);
                
                return $parsedContent;
            }

            Log::warning('Gemini API response JSON tidak valid', [
                'content' => $content,
                'json_error' => json_last_error_msg(),
                'parsed_attempt' => $parsedContent
            ]);

            return null;

        } catch (\Exception $e) {
            Log::error('Error parsing Gemini response: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
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
    
    /**
     * Test generate content dengan prompt yang berbeda untuk memastikan response unik
     */
    public function testGenerateUniqueContent()
    {
        $testPrompts = [
            'Mengerjakan sistem management karyawan (HRIS) membuat tampilan utama',
            'Meeting dengan tim development untuk planning sprint',
            'Debug website dan fix error yang ditemukan',
            'Coding frontend untuk dashboard admin',
            'Testing aplikasi mobile di berbagai device'
        ];
        
        $results = [];
        
        foreach ($testPrompts as $index => $prompt) {
            Log::info("Testing prompt {$index}: {$prompt}");
            
            $response = $this->generateContent($prompt);
            
            if ($response) {
                $results[] = [
                    'prompt' => $prompt,
                    'response' => $response,
                    'timestamp' => now()->toISOString()
                ];
                
                Log::info("Prompt {$index} response", [
                    'prompt' => $prompt,
                    'judul' => $response['judul'] ?? 'N/A',
                    'keterangan_length' => strlen($response['keterangan'] ?? '')
                ]);
            } else {
                Log::warning("Prompt {$index} failed");
                $results[] = [
                    'prompt' => $prompt,
                    'response' => null,
                    'error' => 'Failed to generate response'
                ];
            }
            
            // Delay kecil antara request untuk menghindari rate limiting
            if ($index < count($testPrompts) - 1) {
                sleep(1);
            }
        }
        
        return $results;
    }

    /**
     * Get chat response (simple text response for chatbot)
     */
    public function getChatResponse($prompt)
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
                                'text' => $prompt
                            ]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.9, // Lebih creative untuk chatbot
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 2048,
                ],
                'safetySettings' => [
                    [
                        'category' => 'HARM_CATEGORY_HARASSMENT',
                        'threshold' => 'BLOCK_NONE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_HATE_SPEECH',
                        'threshold' => 'BLOCK_NONE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        'threshold' => 'BLOCK_NONE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        'threshold' => 'BLOCK_NONE'
                    ]
                ]
            ];

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])
            ->timeout(30)
            ->withoutVerifying() // Skip SSL verification for development
            ->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();

                // Extract text response
                if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    return trim($data['candidates'][0]['content']['parts'][0]['text']);
                }
            }

            Log::error('Gemini chat response error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return null;

        } catch (\Exception $e) {
            Log::error('Gemini chat error: ' . $e->getMessage());
            return null;
        }
    }
}
