<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\GeminiService;

class AIController extends Controller
{
    public function generateSuggestion(Request $request)
    {
        try {
            // Check if this is a prompt-based request FIRST
            if ($request->has('prompt')) {
                Log::info('Handling prompt-based request');
                return $this->handlePromptRequest($request);
            }

            // If not prompt-based, validate required fields for form-based request
            $request->validate([
                'jenis_kegiatan' => 'required|string',
                'tipe_penyelenggaraan' => 'nullable|string|in:hybrid,offline,online',
                'lokasi' => 'nullable|string',
                'waktu_mulai' => 'nullable|string',
                'waktu_selesai' => 'nullable|string',
                'dosen_penggerak' => 'nullable|string',
                'judul' => 'nullable|string',
                'keterangan' => 'nullable|string',
            ]);

            Log::info('Handling form-based request');
            
            $jenisKegiatan = $request->jenis_kegiatan;
            $tipe = $request->tipe_penyelenggaraan ?: 'offline';
            $lokasi = $request->lokasi;
            $waktuMulai = $request->waktu_mulai;
            $waktuSelesai = $request->waktu_selesai;
            $dosenPenggerak = $request->dosen_penggerak;
            $judulExisting = $request->judul;
            $keteranganExisting = $request->keterangan;

        // Buat konteks untuk AI berdasarkan form portal IPB
        $konteks = $this->buildKonteks($jenisKegiatan, $tipe, $lokasi, $waktuMulai, $waktuSelesai, $dosenPenggerak, $judulExisting, $keteranganExisting);

            $judulInstruction = $judulExisting 
            ? "Perbaiki dan tingkatkan judul berikut: \"{$judulExisting}\""
            : "Buatkan judul kegiatan yang singkat dan profesional";
            
        $keteranganInstruction = $keteranganExisting 
            ? "Perbaiki dan lengkapi deskripsi berikut: \"{$keteranganExisting}\""
            : "Buatkan deskripsi detail kegiatan";

        $prompt = "Sebagai asisten AI untuk logbook magang mahasiswa IPB, {$judulInstruction} dan {$keteranganInstruction} berdasarkan informasi berikut:

{$konteks}

Berikan response dalam format JSON dengan struktur:
{
    \"judul\": \"Judul kegiatan yang diperbaiki/dibuat (maksimal 80 karakter)\",
    \"keterangan\": \"Deskripsi detail yang diperbaiki/dibuat (minimal 100 kata)\"
}

INSTRUKSI KHUSUS UNTUK JUDUL:
- Analisis judul yang diinput dan buat versi yang lebih rapi dan profesional
- Jika ada judul existing: Perbaiki ejaan, kapitalisasi, dan struktur kalimat dan pastikan judul mencerminkan aktivitas yang dilakukan dengan jelas
- Contoh perbaikan: 'finishing sistem management karyawan' → 'Penyelesaian Sistem Manajemen Karyawan (HRIS)'
- Gunakan bahasa formal tapi tidak kaku
- Pastikan judul mencerminkan aktivitas yang dilakukan dengan jelas

INSTRUKSI KHUSUS UNTUK KETERANGAN:
- Analisis judul yang diinput dan buat deskripsi yang KONTEKSTUAL dan RELEVAN
- JANGAN gunakan template statis, tapi buat deskripsi berdasarkan aktivitas yang disebutkan di judul
- Jika judul tentang 'fix bug', deskripsi harus menjelaskan bug apa, bagaimana memperbaikinya, dan hasilnya
- Jika judul tentang 'deployment', deskripsi harus menjelaskan proses deployment, teknologi yang digunakan, dan hasilnya
- Gunakan bahasa yang natural dan mudah dipahami
- Deskripsi harus mencakup: apa yang dilakukan, kenapa dilakukan, dan hasilnya apa
- Minimal 100 kata dalam bentuk paragraf yang mengalir
- Hindari kalimat yang terlalu panjang atau berbelit-belit

CONTOH DESKRIPSI KONTEKSTUAL:
Judul: 'Finishing sistem management karyawan (HRIS), fix bug, merging branch feature dan deployment FE dan BE'
Deskripsi: 'Pada tahap ini, saya menyelesaikan pengembangan sistem manajemen karyawan (HRIS) dengan fokus pada perbaikan bug yang ditemukan selama proses integrasi. Saya melakukan merging branch fitur untuk memastikan konsistensi dan stabilitas kode, serta melanjutkan proses deployment untuk frontend dan backend agar sistem dapat berjalan optimal di lingkungan produksi. Aktivitas ini mencerminkan kontribusi saya dalam pengembangan aplikasi web berbasis enterprise di Telkomsigma, khususnya dalam memastikan kualitas dan kelancaran implementasi fitur pada sistem HRIS.'

Pastikan response selalu dalam format JSON yang valid.";

                    // Simulasi response AI (ganti dengan API OpenAI yang sebenarnya)
        $aiResponse = $this->callAIService($prompt, $jenisKegiatan, $judulExisting, $lokasi);

            return response()->json([
                'success' => true,
                'data' => $aiResponse
            ]);

        } catch (\Exception $e) {
            Log::error('AI Suggestion Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal mendapatkan saran AI. Silakan coba lagi.'
            ], 500);
        }
    }

    private function buildKonteks($jenisKegiatan, $tipe, $lokasi, $waktuMulai, $waktuSelesai, $dosenPenggerak, $judulExisting = null, $keteranganExisting = null)
    {
        $konteks = "Jenis Kegiatan: {$jenisKegiatan}\n";
        $konteks .= "Tipe Penyelenggaraan: " . ucfirst($tipe) . "\n";
        
        if ($lokasi) {
            $konteks .= "Lokasi: {$lokasi}\n";
        }
        
        if ($waktuMulai && $waktuSelesai) {
            $konteks .= "Waktu: {$waktuMulai} - {$waktuSelesai}\n";
        }
        
        if ($dosenPenggerak) {
            $konteks .= "Dosen Penggerak: {$dosenPenggerak}\n";
        }
        
        if ($judulExisting) {
            $konteks .= "Judul Saat Ini: {$judulExisting}\n";
        }
        
        if ($keteranganExisting) {
            $konteks .= "Keterangan Saat Ini: {$keteranganExisting}\n";
        }

        return $konteks;
    }

        private function callAIService($prompt, $jenisKegiatan = null, $judulExisting = null, $lokasi = null)
    {
        try {
            $geminiService = new GeminiService();
            
            // Buat konteks untuk AI
            $context = [
                'jenis_kegiatan' => $jenisKegiatan,
                'judul_existing' => $judulExisting,
                'lokasi' => $lokasi
            ];
            
            // Generate content menggunakan Gemini
            $result = $geminiService->generateContent($prompt, $context);
            
            if ($result) {
                Log::info('Gemini API berhasil menghasilkan konten', [
                    'judul' => $result['judul'],
                    'keterangan_length' => strlen($result['keterangan'])
                ]);
                return $result;
            }
            
            Log::warning('Gemini API gagal, menggunakan fallback');
            return $this->getFallbackSuggestion($jenisKegiatan, $judulExisting, $lokasi);
            
        } catch (\Exception $e) {
            Log::error('Error dalam callAIService: ' . $e->getMessage());
            return $this->getFallbackSuggestion($jenisKegiatan, $judulExisting, $lokasi);
        }
    }

    private function getFallbackSuggestion($jenisKegiatan = null, $judulExisting = null, $lokasi = null)
    {
        // Fallback yang lebih baik jika API tidak tersedia
        $judul = $judulExisting ?: 'Kegiatan Magang';
        $keterangan = 'Kegiatan magang yang dilakukan sesuai dengan program yang telah direncanakan.';

        // Jika ada jenis kegiatan, buat judul yang lebih spesifik
        if ($jenisKegiatan) {
            switch (strtolower($jenisKegiatan)) {
                case 'berita acara kegiatan':
                    $judul = 'Berita Acara Kegiatan Magang';
                    break;
                case 'pelatihan':
                    $judul = 'Pelatihan dan Pengembangan Kompetensi';
                    break;
                case 'meeting':
                    $judul = 'Rapat dan Koordinasi Tim';
                    break;
                case 'workshop':
                    $judul = 'Workshop dan Praktik Kerja';
                    break;
                case 'berita acara pembimbingan (konsultasi/mentoring/coaching)':
                    $judul = 'Konsultasi dengan Dosen Pembimbing';
                    break;
                case 'berita acara ujian':
                    $judul = 'Evaluasi Progress Magang';
                    break;
                default:
                    $judul = $jenisKegiatan . ' - ' . $judul;
            }
        }

        // Jika ada lokasi, tambahkan ke keterangan
        if ($lokasi) {
            $keterangan .= ' Kegiatan dilaksanakan di ' . $lokasi . '.';
        }

        // Buat keterangan yang lebih semi formal
        $keterangan = 'Melakukan ' . strtolower($jenisKegiatan ?: 'kegiatan magang') . ' sesuai dengan program yang telah direncanakan. ' . $keterangan;

        return [
            'judul' => $judul,
            'keterangan' => $keterangan
        ];
    }

    private function improveTitle($title, $lokasi = null, $jenisKegiatan = null)
    {
        // Bersihkan judul
        $title = trim($title);

        // Ganti kata-kata yang terlalu umum/kasual
        $replacements = [
            '/^mengerjakan\s+/i' => 'Pengembangan ',
            '/^membuat\s+/i' => 'Pembuatan ',
            '/^fixing\s+/i' => 'Perbaikan ',
            '/^fix\s+/i' => 'Perbaikan ',
            '/^update\s+/i' => 'Update ',
            '/^deployment\s+/i' => 'Deployment ',
            '/^deploy\s+/i' => 'Deployment ',
        ];

        foreach ($replacements as $pattern => $replacement) {
            $title = preg_replace($pattern, $replacement, $title);
        }

        // Dictionary untuk perbaikan kata-kata umum
        $improvements = [
            // General terms
            'meeting' => 'Meeting',
            'diskusi' => 'Diskusi',
            'presentasi' => 'Presentasi',
            'project' => 'Proyek',
            'proyek' => 'Proyek',
            'client' => 'Klien',
            'tim' => 'Tim',
            'team' => 'Tim',
            'workshop' => 'Workshop',
            'training' => 'Pelatihan',
            'seminar' => 'Seminar',
            'konsultasi' => 'Konsultasi',
            'mentoring' => 'Mentoring',
            'coaching' => 'Coaching',
            'evaluasi' => 'Evaluasi',
            'review' => 'Review',
            'analisis' => 'Analisis',
            'research' => 'Penelitian',
            'study' => 'Studi',
            'survey' => 'Survei',
            'interview' => 'Wawancara',
            'observasi' => 'Observasi',
            'pengamatan' => 'Pengamatan',
            'dokumentasi' => 'Dokumentasi',
            'laporan' => 'Laporan',
            'report' => 'Laporan',
            'planning' => 'Perencanaan',
            'perencanaan' => 'Perencanaan',
            'implementasi' => 'Implementasi',
            'development' => 'Pengembangan',
            'pengembangan' => 'Pengembangan',
            'testing' => 'Pengujian',
            'pengujian' => 'Pengujian',
            'deployment' => 'Deployment',
            'maintenance' => 'Pemeliharaan',
            'pemeliharaan' => 'Pemeliharaan',
            'monitoring' => 'Monitoring',
            'assessment' => 'Penilaian',
            'penilaian' => 'Penilaian',
            
            // Frontend Development specific
            'frontend' => 'Frontend',
            'web' => 'Web',
            'website' => 'Website',
            'app' => 'Aplikasi',
            'application' => 'Aplikasi',
            'ui' => 'UI',
            'ux' => 'UX',
            'design' => 'Desain',
            'coding' => 'Coding',
            'programming' => 'Programming',
            'develop' => 'Pengembangan',
            'developing' => 'Pengembangan',
            'code' => 'Kode',
            'script' => 'Script',
            'component' => 'Komponen',
            'page' => 'Halaman',
            'layout' => 'Layout',
            'responsive' => 'Responsif',
            'mobile' => 'Mobile',
            'desktop' => 'Desktop',
            'css' => 'CSS',
            'html' => 'HTML',
            'javascript' => 'JavaScript',
            'js' => 'JavaScript',
            'react' => 'React',
            'vue' => 'Vue',
            'angular' => 'Angular',
            'bootstrap' => 'Bootstrap',
            'tailwind' => 'Tailwind',
            'api' => 'API',
            'integration' => 'Integrasi',
            'debug' => 'Debug',
            'debugging' => 'Debugging',
            'fix' => 'Perbaikan',
            'fixing' => 'Perbaikan',
            'bug' => 'Bug',
            'feature' => 'Fitur',
            'functionality' => 'Fungsionalitas',
            'user' => 'User',
            'interface' => 'Interface',
            'system' => 'Sistem',
            'ess' => 'ESS',
            'telkomsigma' => 'Telkomsigma',
            'graha' => 'Graha',
            'tangerang' => 'Tangerang',
            'tangerang selatan' => 'Tangerang Selatan',
            'lengkong gudang' => 'Lengkong Gudang',
            'cbd' => 'CBD',
            'employee' => 'Karyawan',
            'karyawan' => 'Karyawan',
            'sistem' => 'Sistem',
            'system' => 'Sistem',
            'management' => 'Management',
            'manajemen' => 'Manajemen',
            'tampilan' => 'Tampilan',
            'utama' => 'Utama',
            'dashboard' => 'Dashboard',
            'halaman' => 'Halaman',
            'fitur' => 'Fitur',
            'feature' => 'Fitur',
        ];

        // Perbaiki singkatan yang harus uppercase
        $uppercaseAbbr = [
            'hris' => 'HRIS',
            'api' => 'API',
            'ui' => 'UI',
            'ux' => 'UX',
            'fe' => 'Frontend',
            'be' => 'Backend',
            'db' => 'Database',
            'crud' => 'CRUD',
            'rest' => 'REST',
            'json' => 'JSON',
            'xml' => 'XML',
            'html' => 'HTML',
            'css' => 'CSS',
            'js' => 'JavaScript',
            'ts' => 'TypeScript',
            'sql' => 'SQL',
        ];

        // Perbaiki kata-kata
        foreach ($improvements as $wrong => $correct) {
            $title = preg_replace('/\b' . preg_quote($wrong, '/') . '\b/i', $correct, $title);
        }

        // Perbaiki singkatan
        foreach ($uppercaseAbbr as $wrong => $correct) {
            $title = preg_replace('/\b' . preg_quote($wrong, '/') . '\b/i', $correct, $title);
        }

        // Kapitalisasi setiap kata penting (Title Case)
        $title = ucwords(strtolower($title));
        
        // Perbaiki preposisi
        $title = preg_replace('/\b(dengan|di|ke|dari|untuk|oleh|pada|dalam|atas|bawah|sebelum|sesudah|selama|setelah|sebelumnya|selanjutnya)\b/i', strtolower('$1'), $title);
        
        // Buat judul yang lebih natural dan kontekstual
        $title = $this->makeTitleNatural($title, $jenisKegiatan);
        
        // Tambahkan lokasi jika ada
        if ($lokasi && !str_contains(strtolower($title), strtolower($lokasi))) {
            $title .= " di " . $lokasi;
        }

        return $title;
    }

    private function makeTitleNatural($title, $jenisKegiatan = null)
    {
        $title = strtolower($title);
        
        // Mapping untuk judul yang lebih natural berdasarkan jenis kegiatan
        $naturalMappings = [
            'Berita Acara Pembimbingan (Konsultasi/Mentoring/Coaching)' => [
                'meeting' => 'Konsultasi dengan Dosen Pembimbing',
                'diskusi' => 'Diskusi Progress Magang',
                'konsultasi' => 'Konsultasi dengan Dosen Pembimbing',
                'mentoring' => 'Sesi Mentoring dengan Dosen',
                'coaching' => 'Sesi Coaching dengan Dosen',
            ],
            'Berita Acara Ujian' => [
                'ujian' => 'Evaluasi Progress Magang',
                'evaluasi' => 'Evaluasi Progress Magang',
                'presentasi' => 'Presentasi Hasil Magang',
                'review' => 'Review Progress Magang',
                'test' => 'Evaluasi Kemampuan Magang',
            ],
            'Berita Acara Kegiatan' => [
                'coding' => 'Pengembangan Aplikasi',
                'programming' => 'Pengembangan Software',
                'develop' => 'Pengembangan Fitur',
                'debug' => 'Debug dan Perbaikan Bug',
                'meeting' => 'Meeting dengan Tim',
                'diskusi' => 'Diskusi Project',
                'workshop' => 'Workshop Pengembangan',
                'training' => 'Pelatihan Teknologi',
                'seminar' => 'Seminar Teknologi',
                'observasi' => 'Observasi Workflow',
                'pengamatan' => 'Pengamatan Proses Kerja',
                'dokumentasi' => 'Dokumentasi Project',
                'laporan' => 'Laporan Progress',
                'report' => 'Laporan Progress',
                'planning' => 'Perencanaan Project',
                'perencanaan' => 'Perencanaan Project',
                'implementasi' => 'Implementasi Fitur',
                'testing' => 'Testing Aplikasi',
                'pengujian' => 'Pengujian Aplikasi',
                'deployment' => 'Deployment Aplikasi',
                'maintenance' => 'Maintenance Sistem',
                'pemeliharaan' => 'Pemeliharaan Sistem',
                'monitoring' => 'Monitoring Sistem',
                'assessment' => 'Assessment Project',
                'penilaian' => 'Penilaian Project',
            ]
        ];

        // Cek apakah ada mapping untuk jenis kegiatan
        if ($jenisKegiatan && isset($naturalMappings[$jenisKegiatan])) {
            foreach ($naturalMappings[$jenisKegiatan] as $keyword => $naturalTitle) {
                if (str_contains($title, $keyword)) {
                    return ucfirst($naturalTitle);
                }
            }
        }

        // Jika tidak ada mapping spesifik, buat judul yang lebih natural
        $simpleImprovements = [
            'coding react' => 'Pengembangan Komponen React',
            'coding vue' => 'Pengembangan Komponen Vue',
            'coding angular' => 'Pengembangan Komponen Angular',
            'debug website' => 'Debug Website',
            'debug app' => 'Debug Aplikasi',
            'meeting client' => 'Meeting dengan Klien',
            'meeting tim' => 'Meeting dengan Tim',
            'meeting team' => 'Meeting dengan Tim',
            'diskusi project' => 'Diskusi Project',
            'diskusi proyek' => 'Diskusi Proyek',
            'presentasi hasil' => 'Presentasi Hasil Kerja',
            'workshop coding' => 'Workshop Pengembangan',
            'training react' => 'Pelatihan React',
            'training vue' => 'Pelatihan Vue',
            'seminar tech' => 'Seminar Teknologi',
            'observasi workflow' => 'Observasi Workflow',
            'dokumentasi code' => 'Dokumentasi Kode',
            'laporan progress' => 'Laporan Progress',
            'planning sprint' => 'Perencanaan Sprint',
            'implementasi fitur' => 'Implementasi Fitur',
            'testing app' => 'Testing Aplikasi',
            'deployment web' => 'Deployment Website',
            'maintenance system' => 'Maintenance Sistem',
            'monitoring app' => 'Monitoring Aplikasi',
        ];

        foreach ($simpleImprovements as $pattern => $improvement) {
            if (str_contains($title, $pattern)) {
                return ucfirst($improvement);
            }
        }

        // Jika tidak ada improvement spesifik, kembalikan judul yang sudah diperbaiki
        return ucfirst($title);
    }

    private function generateContextualDescription($judul, $jenisKegiatan = null, $lokasi = null)
    {
        $judulLower = strtolower($judul);
        $judulOriginal = $judul; // Keep original for reference
        $lokasi = $lokasi ?: 'Graha Telkomsigma II, Tangerang Selatan';
        
        // Analisis mendalam berdasarkan kata kunci spesifik dalam judul
        $specificContext = $this->analyzeTitle($judulLower, $judulOriginal);
        
        if ($specificContext) {
            return $specificContext['description'];
        }
        
        // Fallback yang lebih personal dan spesifik
        return "Hari ini saya melakukan aktivitas '{$judulOriginal}' di {$lokasi}. " .
               "Sebagai bagian dari magang frontend developer untuk pengembangan website ESS, saya belajar langsung dari tim experienced developer tentang real-world implementation. " .
               "Aktivitas ini membantu saya memahami workflow perusahaan, standar coding yang digunakan, dan cara berkolaborasi dalam tim development yang profesional. " .
               "Setiap tugas memberikan insight baru tentang teknologi modern dan best practices dalam industri IT.";
    }

    private function analyzeTitle($judulLower, $judulOriginal)
    {
        // Introduction & Onboarding
        if (str_contains($judulLower, 'pengenalan') || str_contains($judulLower, 'introduction') || str_contains($judulLower, 'perkenalan')) {
            if (str_contains($judulLower, 'karyawan') || str_contains($judulLower, 'employee')) {
                return [
                    'description' => "Hari ini adalah hari pertama saya di divisi Corporate Information System Telkomsigma. Saya diperkenalkan dengan seluruh tim developer dan intern lainnya. Tim menjelaskan struktur organisasi, workflow development yang digunakan, dan teknologi yang dipakai dalam project. Saya juga mendapat pengarahan tentang assignment awal yaitu pengembangan sistem management karyawan (HRIS) menggunakan Nuxt.js, PrimeVue, dan Tailwind CSS. Senang bisa bergabung dengan tim yang sangat supportive dan siap membantu pembelajaran saya."
                ];
            }
        }

        // Project Initiation
        if (str_contains($judulLower, 'inisiasi') || str_contains($judulLower, 'initiation') || str_contains($judulLower, 'mulai project')) {
            if (str_contains($judulLower, 'nuxt') || str_contains($judulLower, 'primevue') || str_contains($judulLower, 'tailwind')) {
                return [
                    'description' => "Memulai project pengembangan sistem HRIS dengan setup environment development. Tim menjelaskan arsitektur yang akan digunakan: Nuxt.js untuk framework, PrimeVue untuk UI components, dan Tailwind CSS untuk styling. Saya belajar cara setup project, konfigurasi development tools, dan memahami struktur folder yang akan digunakan. Tim juga memberikan dokumentasi dan best practices untuk masing-masing teknologi."
                ];
            }
        }

        // HRIS Development
        if (str_contains($judulLower, 'hris') || str_contains($judulLower, 'management karyawan') || str_contains($judulLower, 'employee management')) {
            return [
                'description' => "Fokus pada pengembangan sistem HRIS (Human Resource Information System) untuk Telkomsigma. Saya belajar tentang business requirements, user stories, dan fitur-fitur yang perlu dikembangkan seperti employee data management, attendance tracking, dan reporting. Tim menjelaskan database schema, API design, dan UI/UX requirements. Saya mulai dengan membuat wireframe dan mockup untuk beberapa halaman utama."
            ];
        }

        // Technology Learning
        if (str_contains($judulLower, 'nuxt') || str_contains($judulLower, 'vue')) {
            return [
                'description' => "Belajar dan praktik menggunakan Nuxt.js framework. Tim menjelaskan konsep SSR (Server Side Rendering), routing, state management, dan component architecture. Saya membuat beberapa komponen sederhana dan belajar cara mengintegrasikan dengan PrimeVue components. Juga belajar tentang Nuxt modules dan cara mengoptimalkan performance aplikasi."
            ];
        }

        if (str_contains($judulLower, 'primevue') || str_contains($judulLower, 'ui component')) {
            return [
                'description' => "Mempelajari PrimeVue component library untuk UI development. Saya eksplorasi berbagai komponen seperti DataTable, Form components, Charts, dan Layout components. Tim menunjukkan cara customizing theme, handling events, dan mengintegrasikan dengan data. Saya praktik membuat beberapa form dan table yang akan digunakan dalam sistem HRIS."
            ];
        }

        if (str_contains($judulLower, 'tailwind') || str_contains($judulLower, 'css') || str_contains($judulLower, 'styling')) {
            return [
                'description' => "Belajar Tailwind CSS untuk styling dan responsive design. Tim menjelaskan utility-first approach, responsive breakpoints, dan cara membuat custom components. Saya praktik membuat layout responsive, custom styling untuk PrimeVue components, dan belajar tentang design system yang konsisten. Juga belajar cara mengoptimalkan CSS bundle size."
            ];
        }

        // Development Activities
        if (str_contains($judulLower, 'coding') || str_contains($judulLower, 'develop') || str_contains($judulLower, 'programming')) {
            return [
                'description' => "Melakukan coding dan development fitur untuk sistem HRIS. Saya bekerja dengan tim untuk mengimplementasikan fitur sesuai dengan requirements yang sudah didefinisikan. Belajar tentang coding standards yang digunakan perusahaan, code review process, dan cara berkolaborasi menggunakan Git. Tim memberikan feedback langsung tentang best practices dan optimization."
            ];
        }

        // Meeting & Discussion
        if (str_contains($judulLower, 'meeting') || str_contains($judulLower, 'diskusi') || str_contains($judulLower, 'discussion')) {
            return [
                'description' => "Mengikuti meeting dan diskusi dengan tim development. Membahas progress project, technical challenges, dan planning untuk sprint berikutnya. Saya belajar tentang agile methodology yang digunakan, cara presentasi progress, dan komunikasi efektif dalam tim. Tim juga memberikan insight tentang industry trends dan best practices."
            ];
        }

        // Bug Fixing & Debugging
        if (str_contains($judulLower, 'fix') || str_contains($judulLower, 'bug') || str_contains($judulLower, 'debug')) {
            return [
                'description' => "Melakukan debugging dan perbaikan bug pada sistem yang sedang dikembangkan. Saya belajar menggunakan developer tools, logging, dan debugging techniques yang efektif. Tim menjelaskan cara menganalisis error, reproduce issues, dan testing fixes. Juga belajar tentang error handling dan prevention strategies."
            ];
        }

        // Testing
        if (str_contains($judulLower, 'test') || str_contains($judulLower, 'testing')) {
            return [
                'description' => "Melakukan testing untuk fitur yang sudah dikembangkan. Saya belajar tentang unit testing, integration testing, dan user acceptance testing. Tim menjelaskan testing strategies, test case design, dan cara menggunakan testing tools. Juga belajar tentang quality assurance dan bug reporting."
            ];
        }

        // Documentation
        if (str_contains($judulLower, 'dokumentasi') || str_contains($judulLower, 'documentation')) {
            return [
                'description' => "Membuat dokumentasi untuk project dan fitur yang dikembangkan. Saya belajar tentang technical writing, API documentation, dan user guides. Tim menjelaskan standar dokumentasi yang digunakan perusahaan dan cara membuat dokumentasi yang mudah dipahami oleh developer lain."
            ];
        }

        // Deployment
        if (str_contains($judulLower, 'deploy') || str_contains($judulLower, 'deployment')) {
            return [
                'description' => "Melakukan deployment aplikasi ke environment staging atau production. Saya belajar tentang CI/CD pipeline, environment configuration, dan deployment strategies. Tim menjelaskan cara monitoring aplikasi setelah deployment dan troubleshooting jika ada issues."
            ];
        }

        // Fallback untuk judul yang tidak spesifik
        return [
            'description' => "Melakukan aktivitas magang sesuai dengan judul '{$judulOriginal}'. Sebagai frontend developer intern di Telkomsigma, saya belajar langsung dari tim experienced developer tentang real-world project implementation. Setiap aktivitas memberikan insight baru tentang teknologi modern, best practices, dan cara berkolaborasi dalam tim development yang profesional."
        ];
    }

    private function handlePromptRequest(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string|min:3',
            'jenis_kegiatan' => 'nullable|string',
            'dosen_penggerak' => 'nullable|string',
            'lokasi' => 'nullable|string',
        ]);

        $prompt = trim($request->prompt);
        $jenisKegiatan = $request->jenis_kegiatan ?: 'praktik';
        $dosenPenggerak = $request->dosen_penggerak ?: 'Dr. Ir. Suprihatin, M.Si';
        $lokasi = $request->lokasi ?: 'Graha Telkomsigma II, Tangerang Selatan';

        Log::info('Processing prompt request', [
            'prompt' => $prompt,
            'jenis_kegiatan' => $jenisKegiatan,
            'lokasi' => $lokasi
        ]);

        // Generate structured logbook data from natural language prompt
        $suggestion = $this->generateFromPrompt($prompt, $jenisKegiatan, $dosenPenggerak, $lokasi);

        return response()->json([
            'success' => true,
            'data' => $suggestion,
            'message' => 'Logbook berhasil di-generate dari prompt'
        ]);
    }

    private function generateFromPrompt($prompt, $jenisKegiatan, $dosenPenggerak, $lokasi)
    {
        // Call AI service if available
        $aiResult = $this->callAIServiceForPrompt($prompt, $jenisKegiatan, $dosenPenggerak, $lokasi);
        
        if ($aiResult) {
            return $aiResult;
        }

        // Fallback: Parse prompt intelligently
        return $this->parsePromptFallback($prompt, $jenisKegiatan, $dosenPenggerak, $lokasi);
    }

    private function callAIServiceForPrompt($prompt, $jenisKegiatan, $dosenPenggerak, $lokasi)
    {
        $apiKey = env('OPENAI_API_KEY');
        
        Log::info('Checking OpenAI API key', [
            'api_key_exists' => !empty($apiKey),
            'api_key_length' => strlen($apiKey ?? ''),
            'api_key_preview' => substr($apiKey ?? '', 0, 10) . '...'
        ]);
        
        if (!$apiKey) {
            Log::warning('OpenAI API key not configured for prompt parsing');
            return null;
        }

        try {
            $systemPrompt = "Kamu adalah asisten AI untuk logbook magang mahasiswa IPB. Tugasmu adalah mengubah deskripsi kegiatan natural language menjadi data logbook terstruktur yang berkualitas tinggi.

PRINSIP UTAMA:
1. HINDARI kata template seperti 'hari ini', 'melakukan aktivitas magang', 'sebagai bagian dari program magang'
2. FOKUS pada teknologi, tools, dan implementasi spesifik yang disebutkan user
3. BUAT judul yang spesifik dan teknis, bukan generik
4. DESKRIPSI harus menjelaskan WHAT, HOW, dan WHY secara detail

KONTEKS MAGANG:
- Mahasiswa magang sebagai frontend web developer di Telkomsigma
- Lokasi: {$lokasi}
- Mengembangkan sistem ESS (Employee Self Service)
- Teknologi: React, Nuxt.js, Tailwind CSS, PrimeVue, API Integration
- Fokus: Frontend development, UI/UX, sistem management karyawan

ATURAN PEMBUATAN JUDUL:
- Gunakan istilah teknis yang spesifik (contoh: 'Integrasi API', 'Implementasi Component', 'Development Feature')
- Sebutkan teknologi atau fitur yang dikerjakan
- Hindari kata umum seperti 'Aktivitas Magang', 'Kegiatan Harian'
- Maksimal 80 karakter

ATURAN PEMBUATAN DESKRIPSI:
- Mulai langsung dengan action/implementasi yang dilakukan
- Jelaskan teknologi, method, atau approach yang digunakan
- Sertakan challenges atau learning yang didapat
- Gunakan bahasa teknis yang sesuai dengan frontend development
- HINDARI template pembuka/penutup generik
- Minimal 100 kata

JENIS KEGIATAN yang tersedia:
- praktik: coding, development, implementasi
- observasi: code review, learning, research
- diskusi: meeting, brainstorming, planning
- workshop: training, learning session

FORMAT OUTPUT JSON:
{
  \"judul\": \"Judul teknis spesifik\",
  \"keterangan\": \"Deskripsi detail teknis\",
  \"jenis_kegiatan\": \"praktik/observasi/diskusi/workshop\",
  \"lokasi\": \"{$lokasi}\",
  \"tanggal\": \"YYYY-MM-DD\",
  \"dosen_penggerak\": \"Dr. Ir. Suprihatin, M.Si\"
}

CONTOH BAGUS:
Input: 'integrasikan api untuk mengambil data aplikasi'
Output:
{
  \"judul\": \"Integrasi API Data Aplikasi untuk Application Hub ESS\",
  \"keterangan\": \"Mengintegrasikan REST API untuk mengambil data aplikasi yang akan ditampilkan di Application Hub. Implementasi menggunakan fetch API dengan error handling dan loading states. Menyesuaikan response data dengan struktur component React yang sudah ada. Mengatasi CORS issues dan optimasi performa dengan caching mechanism.\",
  \"jenis_kegiatan\": \"praktik\",
  \"lokasi\": \"{$lokasi}\",
  \"tanggal\": \"2024-01-15\",
  \"dosen_penggerak\": \"Dr. Ir. Suprihatin, M.Si\"
}

Berikan output dalam bahasa Indonesia yang profesional dan teknis. Pastikan JSON valid dan lengkap.";

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(60)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o-mini', // Upgrade to GPT-4 for better understanding
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $systemPrompt . "\n\nIMPORTANT: Kamu memiliki akses untuk mencari informasi terkini tentang teknologi, framework, dan best practices. Gunakan pengetahuan terkini tentang React, Vue, Nuxt.js, Tailwind CSS, PrimeVue, dan teknologi frontend lainnya untuk memberikan konteks yang akurat dan up-to-date."
                    ],
                    [
                        'role' => 'user',
                        'content' => "Prompt: {$prompt}\n\nSilakan gunakan pengetahuan terkini tentang teknologi dan best practices untuk memberikan logbook yang akurat dan profesional."
                    ]
                ],
                'max_tokens' => 800,
                'temperature' => 0.3, // Lower temperature for more consistent output
            ]);

            if ($response->successful()) {
                $result = $response->json();
                $content = $result['choices'][0]['message']['content'] ?? '';
                
                // Clean markdown formatting
                $content = preg_replace('/```json\n?/', '', $content);
                $content = preg_replace('/```\n?/', '', $content);
                $content = trim($content);
                
                $suggestion = json_decode($content, true);
                
                if ($suggestion && isset($suggestion['judul']) && isset($suggestion['keterangan'])) {
                    Log::info('AI prompt parsing successful', ['suggestion' => $suggestion]);
                    return $suggestion;
                }
            }
            
            Log::warning('AI prompt parsing failed', ['response' => $response->body()]);
            return null;
            
        } catch (\Exception $e) {
            Log::error('AI prompt parsing error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function parsePromptFallback($prompt, $jenisKegiatan, $dosenPenggerak, $lokasi)
    {
        $promptLower = strtolower($prompt);
        
        // Extract potential title from first sentence or main activity
        $sentences = explode('.', $prompt);
        $firstSentence = trim($sentences[0]);
        
        // Generate title based on keywords
        $judul = $this->extractTitleFromPrompt($firstSentence, $promptLower);
        
        // Generate description
        $keterangan = $this->generateDescriptionFromPrompt($prompt, $jenisKegiatan, $lokasi);
        
        // Determine activity type
        $detectedJenisKegiatan = $this->detectActivityType($promptLower) ?: $jenisKegiatan;
        
        // Extract or use default location
        $detectedLokasi = $this->extractLocationFromPrompt($promptLower) ?: $lokasi;
        
        return [
            'judul' => $judul,
            'keterangan' => $keterangan,
            'jenis_kegiatan' => $detectedJenisKegiatan,
            'lokasi' => $detectedLokasi,
            'tipe_penyelenggaraan' => $this->detectEventType($promptLower)
        ];
    }

    private function extractTitleFromPrompt($firstSentence, $promptLower)
    {
        // Common activity patterns for frontend development
        $patterns = [
            'integrasikan.*api' => 'Integrasi API Data Aplikasi',
            'membuat.*komponen' => 'Pengembangan Komponen React',
            'debugging.*bug' => 'Debugging dan Perbaikan Bug',
            'meeting.*tim' => 'Meeting Tim Development',
            'presentasi.*hasil' => 'Presentasi Hasil Kerja',
            'implementasi.*fitur' => 'Implementasi Fitur Baru',
            'testing.*aplikasi' => 'Testing Aplikasi Frontend',
            'dokumentasi.*code' => 'Dokumentasi Kode',
            'review.*code' => 'Code Review',
            'deploy.*aplikasi' => 'Deployment Aplikasi',
            'fix.*bug' => 'Perbaikan Bug dan Error Handling',
            'merging.*branch' => 'Merging Branch dan Code Integration',
            'development.*feature' => 'Development Fitur Baru',
            'optimasi.*perform' => 'Optimasi Performa Aplikasi',
            'styling.*ui' => 'Styling dan UI Enhancement',
            'responsive.*design' => 'Responsive Design Implementation',
            'state.*management' => 'State Management Implementation',
            'routing.*navigation' => 'Routing dan Navigation Setup',
            'form.*validation' => 'Form Validation Implementation',
            'data.*fetching' => 'Data Fetching dan API Integration',
        ];
        
        foreach ($patterns as $pattern => $title) {
            if (preg_match("/$pattern/i", $promptLower)) {
                return $title;
            }
        }
        
        // If no pattern matches, create title from first sentence
        $title = ucfirst($firstSentence);
        $title = preg_replace('/^(hari ini|saya|kita)\s+/i', '', $title);
        $title = ucfirst($title);
        
        // If title is too long or generic, create a better one
        if (strlen($title) > 50 || str_contains(strtolower($title), 'aktivitas') || str_contains(strtolower($title), 'kegiatan')) {
            // Try to extract key activity from prompt
            if (str_contains($promptLower, 'api')) {
                return 'Integrasi API dan Data Management';
            } elseif (str_contains($promptLower, 'komponen') || str_contains($promptLower, 'component')) {
                return 'Pengembangan Komponen Frontend';
            } elseif (str_contains($promptLower, 'bug') || str_contains($promptLower, 'error')) {
                return 'Debugging dan Error Handling';
            } elseif (str_contains($promptLower, 'deploy') || str_contains($promptLower, 'production')) {
                return 'Deployment dan Production Setup';
            } else {
                return 'Development dan Implementation';
            }
        }
        
        return $title;
    }

    private function generateDescriptionFromPrompt($prompt, $jenisKegiatan, $lokasi)
    {
        // Create contextual description based on prompt content
        $promptLower = strtolower($prompt);
        
        // Start with the actual activity
        $description = "";
        
        // Add context based on keywords
        if (str_contains($promptLower, 'api') || str_contains($promptLower, 'integrasikan')) {
            $description .= "Mengintegrasikan REST API untuk mengambil dan mengelola data aplikasi. Implementasi menggunakan fetch API dengan proper error handling dan loading states. Menyesuaikan response data dengan struktur component React yang sudah ada. Mengatasi CORS issues dan optimasi performa dengan caching mechanism. ";
        }
        
        if (str_contains($promptLower, 'komponen') || str_contains($promptLower, 'component')) {
            $description .= "Mengembangkan komponen React yang reusable dan maintainable. Implementasi menggunakan functional components dengan hooks, proper prop validation, dan responsive design. Memastikan komponen dapat digunakan di berbagai bagian aplikasi dengan konsistensi UI/UX. ";
        }
        
        if (str_contains($promptLower, 'bug') || str_contains($promptLower, 'error') || str_contains($promptLower, 'fix')) {
            $description .= "Melakukan debugging dan perbaikan bug yang ditemukan dalam aplikasi. Menggunakan browser developer tools, console logging, dan systematic approach untuk mengidentifikasi root cause. Implementasi proper error handling dan user feedback untuk meningkatkan user experience. ";
        }
        
        if (str_contains($promptLower, 'deploy') || str_contains($promptLower, 'production')) {
            $description .= "Melakukan deployment aplikasi ke environment production. Memastikan build process berjalan dengan baik, melakukan testing di staging environment, dan monitoring performa aplikasi setelah deployment. Mengatasi issues yang muncul dan melakukan rollback jika diperlukan. ";
        }
        
        if (str_contains($promptLower, 'meeting') || str_contains($promptLower, 'diskusi')) {
            $description .= "Berpartisipasi dalam meeting tim development untuk membahas progress, challenges, dan planning. Memberikan update status pekerjaan, sharing knowledge, dan berkontribusi dalam decision making untuk pengembangan fitur. ";
        }
        
        if (str_contains($promptLower, 'testing') || str_contains($promptLower, 'test')) {
            $description .= "Melakukan testing aplikasi untuk memastikan functionality dan user experience berjalan dengan baik. Menggunakan manual testing, browser testing, dan feedback dari user untuk mengidentifikasi areas of improvement. ";
        }
        
        // If no specific keywords found, create general description
        if (empty($description)) {
            $description = "Melakukan pengembangan frontend untuk sistem ESS (Employee Self Service) di {$lokasi}. Implementasi menggunakan React dengan best practices, responsive design, dan optimal user experience. Aktivitas ini memberikan pengalaman praktis dalam pengembangan aplikasi enterprise-level. ";
        }
        
        // Add learning outcome
        $description .= "Melalui aktivitas ini, saya mengembangkan keterampilan teknis dalam frontend development, problem-solving, dan collaboration dengan tim. Pengalaman ini sangat berharga untuk memahami workflow pengembangan software di industri IT.";
        
        return $description;
    }

    private function detectActivityType($promptLower)
    {
        $typePatterns = [
            'praktik' => ['coding', 'membuat', 'develop', 'implementasi', 'programming'],
            'observasi' => ['melihat', 'mengamati', 'observasi', 'mempelajari'],
            'diskusi' => ['diskusi', 'meeting', 'berbicara', 'membahas'],
            'workshop' => ['workshop', 'pelatihan', 'training', 'belajar'],
            'presentasi' => ['presentasi', 'demo', 'menampilkan', 'showcase'],
            'evaluasi' => ['evaluasi', 'review', 'penilaian', 'testing']
        ];
        
        foreach ($typePatterns as $type => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($promptLower, $keyword)) {
                    return $type;
                }
            }
        }
        
        return null;
    }

    private function extractLocationFromPrompt($promptLower)
    {
        $locationPatterns = [
            'telkomsigma' => 'Graha Telkomsigma II, Tangerang Selatan',
            'kantor' => 'Graha Telkomsigma II, Tangerang Selatan',
            'ruang meeting' => 'Ruang Meeting Graha Telkomsigma II',
            'lab' => 'Lab Development Graha Telkomsigma II',
            'online' => 'Online/Remote'
        ];
        
        foreach ($locationPatterns as $pattern => $location) {
            if (str_contains($promptLower, $pattern)) {
                return $location;
            }
        }
        
        return null;
    }

    private function detectEventType($promptLower)
    {
        if (str_contains($promptLower, 'online') || str_contains($promptLower, 'remote') || str_contains($promptLower, 'virtual')) {
            return 'online';
        }
        
        if (str_contains($promptLower, 'hybrid') || str_contains($promptLower, 'campuran')) {
            return 'hybrid';
        }
        
        return 'offline'; // default
    }

    /**
     * Auto-generate dari judul saja (Smart Auto-Fill)
     * Endpoint khusus untuk auto-fill semua field ketika user mengetik judul
     */
    public function autoFillFromTitle(Request $request)
    {
        try {
            $request->validate([
                'judul' => 'required|string|min:3',
            ]);

            $judul = $request->judul;

            Log::info('Auto-fill from title request', [
                'judul' => $judul
            ]);

            // Build comprehensive prompt for AI to generate all fields
            $prompt = "Kamu adalah asisten AI untuk logbook magang mahasiswa IPB di Telkomsigma (frontend developer).

INPUT DARI USER:
Judul: \"{$judul}\"

TUGASMU:
1. Perbaiki dan sempurnakan judul menjadi lebih profesional, rapi, dan konsisten
2. Generate deskripsi detail berdasarkan judul (minimal 100 kata)
3. Tentukan jenis kegiatan yang sesuai
4. Tentukan tipe penyelenggaraan yang sesuai
5. Set tanggal ke hari ini
6. Set waktu default magang (08:30 - 17:30)
7. Set dosen penggerak default
8. Set lokasi default

ATURAN PENTING:
- Analisis judul untuk menentukan jenis kegiatan yang tepat:
  * Jika tentang coding/development/implementasi/fix bug → 'Berita Acara Kegiatan'
  * Jika tentang konsultasi/mentoring/bimbingan → 'Berita Acara Pembimbingan (Konsultasi/Mentoring/Coaching)'
  * Jika tentang ujian/evaluasi/presentasi hasil → 'Berita Acara Ujian'

- Untuk tipe_penyelenggaraan:
  * Jika disebutkan 'online' atau 'remote' → 'online'
  * Jika disebutkan 'offline' atau 'kantor' → 'offline'
  * Default → 'offline'

- Judul harus KONSISTEN dengan pola berikut:

  * POLA KONSISTEN yang HARUS diikuti:
    1. Untuk aktivitas development/coding: \"Pengembangan [Fitur/Component] [Nama Sistem]\"
    2. Untuk perbaikan bug: \"Perbaikan Bug [Deskripsi Bug] pada [Sistem]\"
    3. Untuk integrasi: \"Integrasi [Teknologi/API] pada [Sistem]\"
    4. Untuk testing: \"Testing dan Quality Assurance [Nama Fitur]\"
    5. Untuk deployment: \"Deployment [Frontend/Backend/Fullstack] ke [Environment]\"
    6. Untuk meeting: \"Meeting [Topik] dengan [Tim/Stakeholder]\"

  * ATURAN KONSISTENSI:
    - Selalu gunakan kata benda di awal (Pengembangan, Perbaikan, Integrasi, Testing, Deployment)
    - JANGAN gunakan kata kerja aktif (mengerjakan, membuat, melakukan)
    - Kapitalisasi yang benar: setiap kata penting huruf besar
    - Singkatan uppercase: HRIS, API, UI, UX, REST, JSON, dll
    - Format: [Kata Benda] [Object] [Detail/Konteks]

  * CONTOH TRANSFORMASI:
    ❌ 'mengerjakan sistem management karyawan (HRIS) membuat tampilan utama'
    ✅ 'Pengembangan Dashboard Utama Sistem HRIS'

    ❌ 'fix bug api untuk data aplikasi'
    ✅ 'Perbaikan Bug API Data Aplikasi pada Application Hub'

    ❌ 'deployment fe dan be'
    ✅ 'Deployment Frontend dan Backend ke Production Server'

    ❌ 'membuat fitur login dengan google'
    ✅ 'Pengembangan Fitur Login dengan Google OAuth'

    ❌ 'ngerjain integrasi api payment'
    ✅ 'Integrasi API Payment Gateway pada Sistem Transaksi'

- Deskripsi harus KONSISTEN dengan struktur:

  * STRUKTUR KONSISTEN yang HARUS diikuti:
    Paragraf 1 (What): Menjelaskan aktivitas apa yang dilakukan
    Paragraf 2 (How): Teknologi/tools yang digunakan dan cara implementasi
    Paragraf 3 (Result/Why): Hasil yang dicapai dan impact/learning

  * POLA KALIMAT KONSISTEN:
    - Gunakan \"Melakukan [aktivitas]\" untuk pembuka
    - Gunakan \"Menggunakan [teknologi]\" untuk tools
    - Gunakan \"Hasil yang dicapai\" atau \"Melalui aktivitas ini\" untuk penutup
    - HINDARI kalimat yang terlalu personal seperti \"Saya sangat senang\", \"Hari ini menyenangkan\"
    - Fokus pada aspek teknis dan profesional

  * CONTOH DESKRIPSI KONSISTEN:
    \"Melakukan pengembangan dashboard utama untuk sistem HRIS menggunakan Nuxt.js dan PrimeVue. Dashboard dirancang untuk menampilkan summary data karyawan, grafik kehadiran, dan quick actions untuk HR team.

    Menggunakan PrimeVue components seperti DataTable, Chart, dan Card untuk membuat tampilan yang informatif dan responsif. Implementasi state management dengan Pinia untuk handle data real-time dari API backend. Styling menggunakan Tailwind CSS dengan design system yang konsisten.

    Hasil yang dicapai adalah dashboard yang user-friendly dan informatif, memudahkan HR team dalam monitoring data karyawan. Melalui aktivitas ini, saya memperdalam pemahaman tentang component-based architecture dan state management dalam aplikasi enterprise.\"

FORMAT OUTPUT JSON:
{
  \"judul\": \"Judul yang diperbaiki\",
  \"keterangan\": \"Deskripsi detail kegiatan\",
  \"jenis_kegiatan\": \"Berita Acara Kegiatan|Berita Acara Pembimbingan (Konsultasi/Mentoring/Coaching)|Berita Acara Ujian\",
  \"tipe_penyelenggaraan\": \"offline|online|hybrid\",
  \"lokasi\": \"Graha Telkomsigma II, Tangerang Selatan\",
  \"tanggal\": \"" . date('Y-m-d') . "\",
  \"waktu_mulai\": \"08:30\",
  \"waktu_selesai\": \"17:30\",
  \"dosen_penggerak\": \"Amata Fami, M.Ds. - 201807198507182001\"
}

CONTOH INPUT-OUTPUT:

Contoh 1:
Input: 'mengerjakan sistem management karyawan (HRIS) membuat tampilan utama'
Output:
{
  \"judul\": \"Pengembangan Dashboard Utama Sistem HRIS\",
  \"keterangan\": \"Melakukan pengembangan dashboard utama untuk sistem HRIS (Human Resource Information System) sebagai halaman landing setelah login. Dashboard dirancang untuk menampilkan ringkasan data karyawan, grafik kehadiran bulanan, dan quick actions untuk fungsi-fungsi HR yang sering digunakan.\\n\\nMenggunakan Nuxt.js sebagai framework utama dengan PrimeVue untuk UI components seperti DataTable, Chart, dan Card. Implementasi state management menggunakan Pinia untuk mengelola data real-time dari API backend. Styling dikembangkan dengan Tailwind CSS mengikuti design system perusahaan yang sudah ada, memastikan konsistensi visual di seluruh aplikasi.\\n\\nHasil yang dicapai adalah dashboard yang responsif, informatif, dan user-friendly. HR team dapat dengan mudah melihat overview data karyawan dan melakukan aksi cepat tanpa navigasi yang rumit. Melalui aktivitas ini, saya memperdalam pemahaman tentang component-based architecture, state management, dan best practices dalam pengembangan aplikasi enterprise.\",
  \"jenis_kegiatan\": \"Berita Acara Kegiatan\",
  \"tipe_penyelenggaraan\": \"offline\",
  \"lokasi\": \"Graha Telkomsigma II, Tangerang Selatan\",
  \"tanggal\": \"" . date('Y-m-d') . "\",
  \"waktu_mulai\": \"08:30\",
  \"waktu_selesai\": \"17:30\",
  \"dosen_penggerak\": \"Amata Fami, M.Ds. - 201807198507182001\"
}

Contoh 2:
Input: 'fix bug api untuk mengambil data aplikasi'
Output:
{
  \"judul\": \"Perbaikan Bug API Data Aplikasi pada Application Hub\",
  \"keterangan\": \"Melakukan debugging dan perbaikan bug pada API endpoint /api/applications yang digunakan untuk mengambil daftar aplikasi di Application Hub. Issue yang ditemukan adalah response API tidak konsisten, terkadang mengembalikan data null, dan sering terjadi timeout ketika data aplikasi lebih dari 50 items.\\n\\nMenggunakan Laravel Debugbar dan Postman untuk analisis performa API. Solusi yang diimplementasikan mencakup optimasi query database dengan eager loading untuk relasi, penambahan Redis caching untuk data yang jarang berubah, dan implementasi pagination untuk mengurangi beban query. Error handling diperbaiki dengan proper HTTP status codes dan informative error messages.\\n\\nHasil yang dicapai adalah API response time berkurang drastis dari rata-rata 3 detik menjadi 500ms, dan data yang dikembalikan sudah konsisten. Melalui aktivitas ini, saya memahami pentingnya database optimization, caching strategy, dan proper error handling dalam pengembangan API yang scalable.\",
  \"jenis_kegiatan\": \"Berita Acara Kegiatan\",
  \"tipe_penyelenggaraan\": \"offline\",
  \"lokasi\": \"Graha Telkomsigma II, Tangerang Selatan\",
  \"tanggal\": \"" . date('Y-m-d') . "\",
  \"waktu_mulai\": \"08:30\",
  \"waktu_selesai\": \"17:30\",
  \"dosen_penggerak\": \"Amata Fami, M.Ds. - 201807198507182001\"
}

Contoh 3:
Input: 'deployment FE dan BE ke production'
Output:
{
  \"judul\": \"Deployment Frontend dan Backend ke Production Server\",
  \"keterangan\": \"Melakukan deployment aplikasi sistem HRIS (frontend Nuxt.js dan backend Laravel) ke production server untuk fase UAT (User Acceptance Testing). Deployment mencakup persiapan environment production, build optimization, database migration, dan konfigurasi server Nginx untuk reverse proxy.\\n\\nMenggunakan CI/CD pipeline dengan GitHub Actions untuk automated deployment. Frontend di-build dengan mode production (npm run build) dengan optimasi bundle size dan lazy loading untuk performa optimal. Backend di-deploy menggunakan Laravel Forge dengan automated database migration dan cache warming. Environment variables dikonfigurasi sesuai production requirements, dan SSL certificate dipasang untuk HTTPS.\\n\\nHasil yang dicapai adalah aplikasi berhasil live di production server dengan performa yang optimal dan zero downtime. Monitoring dilakukan menggunakan Laravel Telescope dan Google Analytics untuk track error dan usage. Melalui aktivitas ini, saya memahami deployment workflow, CI/CD best practices, dan pentingnya monitoring dalam production environment.\",
  \"jenis_kegiatan\": \"Berita Acara Kegiatan\",
  \"tipe_penyelenggaraan\": \"offline\",
  \"lokasi\": \"Graha Telkomsigma II, Tangerang Selatan\",
  \"tanggal\": \"" . date('Y-m-d') . "\",
  \"waktu_mulai\": \"08:30\",
  \"waktu_selesai\": \"17:30\",
  \"dosen_penggerak\": \"Amata Fami, M.Ds. - 201807198507182001\"
}

Pastikan response HANYA berisi JSON yang valid, tanpa markdown atau format lain.";

            // Call AI service
            $result = $this->callAIServiceForAutoFill($prompt);

            if ($result) {
                Log::info('Auto-fill successful', ['result' => $result]);
                return response()->json([
                    'success' => true,
                    'data' => $result,
                    'message' => 'Auto-fill berhasil! Semua field telah diisi otomatis.'
                ]);
            }

            // Fallback jika AI gagal
            $fallback = $this->getFallbackAutoFill($judul);

            return response()->json([
                'success' => true,
                'data' => $fallback,
                'message' => 'Auto-fill berhasil (fallback mode)'
            ]);

        } catch (\Exception $e) {
            Log::error('Auto-fill Error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan auto-fill. Silakan coba lagi.'
            ], 500);
        }
    }

    private function callAIServiceForAutoFill($prompt)
    {
        try {
            $geminiService = new GeminiService();

            // Generate content menggunakan Gemini
            $result = $geminiService->generateContent($prompt, [
                'auto_fill' => true,
                'complete_data' => true
            ]);

            if ($result) {
                Log::info('Gemini API auto-fill successful', ['result' => $result]);
                return $result;
            }

            Log::warning('Gemini API auto-fill failed, using fallback');
            return null;

        } catch (\Exception $e) {
            Log::error('Error in callAIServiceForAutoFill: ' . $e->getMessage());
            return null;
        }
    }

    private function getFallbackAutoFill($judul)
    {
        // Intelligent fallback based on keywords in title
        $judulLower = strtolower($judul);

        // Determine jenis_kegiatan
        $jenisKegiatan = 'Berita Acara Kegiatan';
        if (str_contains($judulLower, 'konsultasi') || str_contains($judulLower, 'mentoring') || str_contains($judulLower, 'bimbingan')) {
            $jenisKegiatan = 'Berita Acara Pembimbingan (Konsultasi/Mentoring/Coaching)';
        } elseif (str_contains($judulLower, 'ujian') || str_contains($judulLower, 'evaluasi') || str_contains($judulLower, 'presentasi hasil')) {
            $jenisKegiatan = 'Berita Acara Ujian';
        }

        // Determine tipe_penyelenggaraan
        $tipe = 'offline';
        if (str_contains($judulLower, 'online') || str_contains($judulLower, 'remote')) {
            $tipe = 'online';
        } elseif (str_contains($judulLower, 'hybrid')) {
            $tipe = 'hybrid';
        }

        // Clean and improve title
        $improvedJudul = $this->improveTitle($judul, 'Graha Telkomsigma II, Tangerang Selatan', $jenisKegiatan);

        // Generate contextual description
        $keterangan = $this->generateContextualDescription($improvedJudul, $jenisKegiatan, 'Graha Telkomsigma II, Tangerang Selatan');

        return [
            'judul' => $improvedJudul,
            'keterangan' => $keterangan,
            'jenis_kegiatan' => $jenisKegiatan,
            'tipe_penyelenggaraan' => $tipe,
            'lokasi' => 'Graha Telkomsigma II, Tangerang Selatan',
            'tanggal' => date('Y-m-d'),
            'waktu_mulai' => '08:30',
            'waktu_selesai' => '17:30',
            'dosen_penggerak' => 'Amata Fami, M.Ds. - 201807198507182001'
        ];
    }

    /**
     * Chatbot endpoint - untuk tanya jawab tentang logbook
     */
    public function chatbot(Request $request)
    {
        try {
            $request->validate([
                'message' => 'required|string|min:1',
                'history' => 'sometimes|array', // Optional chat history
            ]);

            $userMessage = $request->message;
            $history = $request->history ?? [];

            Log::info('Chatbot request', [
                'message' => $userMessage,
                'history_count' => count($history)
            ]);

            // Build context-aware prompt
            $prompt = $this->buildChatbotPrompt($userMessage, $history);

            // Call Gemini API
            $geminiService = new GeminiService();

            // For chatbot, we use a different approach - just get text response
            $response = $geminiService->getChatResponse($prompt);

            if ($response) {
                return response()->json([
                    'success' => true,
                    'message' => $response,
                ]);
            }

            // Fallback ke chatbot rule-based jika API gagal (quota exceeded, dll)
            Log::warning('Gemini API failed, using fallback chatbot');
            $fallbackResponse = $this->getFallbackChatResponse($userMessage);

            return response()->json([
                'success' => true,
                'message' => $fallbackResponse,
                'fallback' => true
            ]);

        } catch (\Exception $e) {
            Log::error('Chatbot Error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan. Silakan coba lagi.'
            ], 500);
        }
    }

    /**
     * Build chatbot prompt dengan context
     */
    private function buildChatbotPrompt($userMessage, $history = [])
    {
        // Build conversation history
        $conversationHistory = "";
        if (!empty($history)) {
            foreach ($history as $msg) {
                $role = $msg['role'] ?? 'user';
                $content = $msg['content'] ?? '';

                if ($role === 'user') {
                    $conversationHistory .= "User: {$content}\n";
                } else {
                    $conversationHistory .= "Assistant: {$content}\n";
                }
            }
        }

        $prompt = "Kamu adalah LogyAI Assistant - asisten AI yang membantu mahasiswa IPB dalam mengisi logbook magang di Telkomsigma.

KONTEKS:
- Pengguna adalah mahasiswa magang IPB di Telkomsigma sebagai Frontend Developer
- Mereka menggunakan website Logyai untuk mencatat aktivitas harian logbook
- Logbook akan diekspor otomatis ke portal IPB

KEMAMPUAN KAMU:
1. Menjawab pertanyaan tentang cara mengisi logbook
2. Memberikan saran judul dan deskripsi kegiatan yang baik
3. Membantu troubleshooting masalah di website
4. Memberikan tips menulis logbook yang profesional
5. Menjawab tentang fitur-fitur Logyai

FITUR LOGYAI:
- Input log dengan form lengkap (tanggal, waktu, judul, deskripsi, bukti foto)
- AI Saran: klik tombol untuk auto-generate judul & deskripsi
- Upload bukti: dari device, kamera, atau Google Drive (otomatis watermark)
- Ekspor otomatis ke portal IPB
- Dark mode
- PWA (bisa di-install sebagai app)

FIELD LOGBOOK:
- Tanggal: format YYYY-MM-DD
- Waktu: mulai & selesai (format HH:MM)
- Jenis Kegiatan: Berita Acara Kegiatan / Pembimbingan / Ujian
- Dosen Penggerak: default \"Amata Fami, M.Ds.\"
- Tipe: offline / online / hybrid
- Lokasi: default \"Graha Telkomsigma II, Tangerang Selatan\"
- Judul: singkat, profesional (maks 80 karakter)
- Deskripsi: detail (min 100 kata)
- Bukti: foto aktivitas dengan watermark

CARA PAKAI AI SARAN:
1. Isi judul kegiatan (minimal)
2. Klik tombol \"AI Saran\" (ikon robot)
3. AI akan otomatis:
   - Memperbaiki judul (kapitalisasi, gaya bahasa konsisten)
   - Generate deskripsi detail (3 paragraf)
   - Auto-fill semua field lain

POLA JUDUL KONSISTEN:
- Development: \"Pengembangan [Fitur] [Sistem]\"
- Bug fix: \"Perbaikan Bug [Deskripsi] pada [Sistem]\"
- Integration: \"Integrasi [Teknologi] pada [Sistem]\"
- Testing: \"Testing dan Quality Assurance [Fitur]\"
- Deployment: \"Deployment [FE/BE] ke [Environment]\"
- Meeting: \"Meeting [Topik] dengan [Tim]\"

STRUKTUR DESKRIPSI:
Paragraf 1 (What): Melakukan [aktivitas]...
Paragraf 2 (How): Menggunakan [teknologi/tools]...
Paragraf 3 (Result): Hasil yang dicapai...

ATURAN JAWABAN:
- Jawab dengan ramah dan helpful
- Berikan contoh konkret jika diminta
- Jika ditanya cara, berikan step-by-step
- Jika tidak tahu, akui dan arahkan ke dokumentasi
- Gunakan bahasa Indonesia yang natural
- Jangan terlalu panjang, to the point

HISTORY PERCAKAPAN SEBELUMNYA:
{$conversationHistory}

PERTANYAAN USER SAAT INI:
{$userMessage}

Jawab pertanyaan user dengan helpful dan to the point. Jika user minta contoh, berikan contoh yang spesifik dan relevan.";

        return $prompt;
    }

    /**
     * Fallback chatbot response (rule-based & dynamic) jika API gagal
     */
    private function getFallbackChatResponse($userMessage)
    {
        $messageLower = strtolower($userMessage);

        // Try OpenAI as fallback for general questions
        $openAIResponse = $this->tryOpenAIFallback($userMessage);
        if ($openAIResponse) {
            return $openAIResponse;
        }

        // Simple math calculations
        $mathResult = $this->trySimpleMath($userMessage);
        if ($mathResult !== null) {
            return $mathResult;
        }

        // Simple knowledge base
        $knowledgeResult = $this->trySimpleKnowledge($userMessage);
        if ($knowledgeResult !== null) {
            return $knowledgeResult;
        }

        // Greeting
        if (str_contains($messageLower, 'hai') ||
            str_contains($messageLower, 'halo') ||
            str_contains($messageLower, 'hi') ||
            str_contains($messageLower, 'hello') ||
            str_contains($messageLower, 'hey') ||
            str_contains($messageLower, 'haii') ||
            str_contains($messageLower, 'haiii')) {
            return "Hai! 👋 Saya LogyAI Assistant. Saya siap membantu Anda dengan:\n\n• Cara mengisi logbook yang baik\n• Contoh judul dan deskripsi profesional\n• Panduan fitur Logyai\n• Tips menulis logbook magang\n\nAda yang bisa saya bantu?";
        }

        // Cara pakai AI Saran
        if (str_contains($messageLower, 'cara') && (str_contains($messageLower, 'ai') || str_contains($messageLower, 'saran'))) {
            return "**Cara Pakai AI Saran:**\n\n1. Isi **judul kegiatan** (misal: \"fix bug api data aplikasi\")\n2. Klik tombol **AI Saran** (ikon robot 🤖)\n3. AI akan otomatis:\n   • Memperbaiki judul jadi profesional\n   • Generate deskripsi detail 3 paragraf\n   • Auto-fill semua field lainnya\n4. Review hasilnya dan edit jika perlu\n5. Klik **Simpan Log**\n\nTips: Semakin detail judul Anda, semakin akurat hasil AI!";
        }

        // Contoh judul
        if (str_contains($messageLower, 'contoh') && str_contains($messageLower, 'judul')) {
            return "**Contoh Judul Logbook yang Baik:**\n\n✅ Development:\n• \"Pengembangan Dashboard HRIS dengan Nuxt.js\"\n• \"Pembuatan Komponen Login OAuth Google\"\n\n✅ Bug Fixing:\n• \"Perbaikan Bug API Data Aplikasi\"\n• \"Debugging Error Timeout pada Payment Gateway\"\n\n✅ Integration:\n• \"Integrasi REST API pada Application Hub\"\n• \"Implementasi Google Drive Picker\"\n\n✅ Testing:\n• \"Testing dan QA Fitur Dashboard Admin\"\n\n✅ Deployment:\n• \"Deployment Frontend ke Production Server\"\n\n**Pola:** [Kata Benda] [Object] [Detail/Konteks]";
        }

        // Fitur Logyai
        if (str_contains($messageLower, 'fitur') || str_contains($messageLower, 'apa saja')) {
            return "**Fitur Logyai:**\n\n🤖 **AI Saran**\n• Auto-generate judul & deskripsi profesional\n• Perbaikan otomatis kapitalisasi & format\n\n📸 **Upload Bukti**\n• Dari device, kamera, atau Google Drive\n• Auto watermark (tanggal, waktu, lokasi)\n\n📤 **Ekspor Otomatis**\n• Export ke portal IPB format Word\n• Auto-fill semua field sesuai format kampus\n\n🌙 **Dark Mode**\n• Toggle dark/light theme\n\n📱 **PWA (Progressive Web App)**\n• Install sebagai aplikasi native\n• Bisa digunakan offline";
        }

        // Jenis kegiatan
        if (str_contains($messageLower, 'jenis kegiatan')) {
            return "**Jenis Kegiatan yang tersedia:**\n\n1. **Berita Acara Kegiatan**\n   → Untuk: coding, development, meeting tim, workshop\n\n2. **Berita Acara Pembimbingan**\n   → Untuk: konsultasi dosen, mentoring, coaching\n\n3. **Berita Acara Ujian**\n   → Untuk: evaluasi, presentasi hasil, ujian progress\n\nTips: AI Saran otomatis menentukan jenis kegiatan yang sesuai berdasarkan judul Anda!";
        }

        // Tips menulis
        if (str_contains($messageLower, 'tips') || str_contains($messageLower, 'bagaimana menulis')) {
            return "**Tips Menulis Logbook yang Baik:**\n\n📝 **Judul:**\n• Singkat tapi spesifik (maks 80 karakter)\n• Gunakan kata benda (Pengembangan, Perbaikan, Integrasi)\n• Hindari kata kerja aktif (mengerjakan, membuat)\n• Singkatan uppercase (HRIS, API, UI)\n\n📄 **Deskripsi:**\n• Min 100 kata, 3 paragraf\n• Paragraf 1 (What): Apa yang dilakukan\n• Paragraf 2 (How): Teknologi & cara implementasi\n• Paragraf 3 (Result): Hasil & learning\n• Gunakan bahasa semi formal, profesional\n\n💡 **Pro Tip:** Gunakan AI Saran untuk hasil optimal!";
        }

        // Deskripsi
        if (str_contains($messageLower, 'deskripsi') && (str_contains($messageLower, 'bagaimana') || str_contains($messageLower, 'cara'))) {
            return "**Struktur Deskripsi yang Baik:**\n\n**Paragraf 1 - What (Apa):**\nJelaskan aktivitas apa yang dilakukan. Contoh:\n\"Melakukan pengembangan dashboard utama untuk sistem HRIS...\"\n\n**Paragraf 2 - How (Bagaimana):**\nTeknologi/tools yang digunakan. Contoh:\n\"Menggunakan Nuxt.js dan PrimeVue untuk UI components...\"\n\n**Paragraf 3 - Result/Why (Hasil):**\nHasil yang dicapai dan learning. Contoh:\n\"Hasil yang dicapai adalah dashboard responsif dan user-friendly...\"\n\n💡 **Tip:** Gunakan AI Saran untuk auto-generate deskripsi lengkap!";
        }

        // Upload bukti
        if (str_contains($messageLower, 'upload') || str_contains($messageLower, 'bukti') || str_contains($messageLower, 'foto')) {
            return "**Cara Upload Bukti:**\n\n📱 **3 Opsi Upload:**\n1. **File Picker** - pilih dari galeri/folder\n2. **Kamera** - ambil foto langsung\n3. **Google Drive** - pilih dari Drive folder\n\n✨ **Watermark Otomatis:**\nSemua foto otomatis di-watermark dengan:\n• Tanggal upload\n• Waktu upload\n• Lokasi (GPS)\n• Logo Logyai\n\n📝 **Format:** PNG, JPG, JPEG (maks 5MB)";
        }

        // Export
        if (str_contains($messageLower, 'ekspor') || str_contains($messageLower, 'export') || str_contains($messageLower, 'portal')) {
            return "**Ekspor ke Portal IPB:**\n\n1. Klik tombol **Export** di log yang sudah dibuat\n2. Sistem otomatis:\n   • Format ke Word (.docx)\n   • Sesuaikan dengan template portal IPB\n   • Auto-fill semua field\n   • Include bukti foto dengan watermark\n3. Download file hasil export\n4. Upload ke portal IPB\n\n✅ Format sudah 100% sesuai requirement IPB!";
        }

        // Google Drive
        if (str_contains($messageLower, 'google drive') || str_contains($messageLower, 'drive')) {
            return "**Google Drive Integration:**\n\n🔧 **Setup:**\n1. Pastikan sudah login Google\n2. Klik tombol \"Google Drive\" saat upload\n3. Pilih folder/file dari Drive\n4. Foto otomatis di-watermark\n\n📁 **Folder Default:**\nFolder ID: 1N8i9WzTJVYagwsk5MHdQ5par8k4-FPSb\n\n⚠️ **Jika error:**\n• Check API key sudah di-setup di .env\n• Pastikan browser allow popups\n• Try refresh & login ulang";
        }

        // Dark mode
        if (str_contains($messageLower, 'dark') || str_contains($messageLower, 'theme')) {
            return "**Dark Mode:**\n\n🌙 Klik toggle di header (icon sun/moon)\n🎨 Theme otomatis tersimpan di browser\n💡 Auto-switch sesuai preferensi sistem (optional)\n\nTips: Dark mode hemat baterai dan lebih nyaman untuk mata!";
        }

        // Error handling
        if (str_contains($messageLower, 'error') || str_contains($messageLower, 'gagal') || str_contains($messageLower, 'tidak bisa')) {
            return "**Troubleshooting:**\n\n❌ **AI Saran tidak jalan?**\n• Check koneksi internet\n• Pastikan judul terisi minimal 3 karakter\n• Coba refresh page\n\n❌ **Upload gagal?**\n• Check ukuran file (maks 5MB)\n• Format harus PNG/JPG/JPEG\n• Pastikan ada storage space\n\n❌ **Export error?**\n• Pastikan semua field terisi\n• Check ada bukti foto\n• Coba clear cache browser\n\n💬 Masih ada masalah? Jelaskan error spesifiknya!";
        }

        // Quota info
        if (str_contains($messageLower, 'quota') || str_contains($messageLower, 'limit')) {
            return "**Info Quota API:**\n\n⚠️ Gemini AI free tier memiliki limit:\n• 200 requests/day\n• Reset setiap 24 jam\n\n💡 **Saat quota habis:**\n• Chatbot tetap bisa menjawab (mode fallback)\n• AI Saran pakai fallback (hasil tetap bagus)\n• Tunggu 24 jam untuk reset quota\n\n🎯 **Tips hemat quota:**\n• Gunakan AI Saran hanya saat perlu\n• Review & edit manual jika memungkinkan";
        }

        // Default - tidak paham
        return "Hmm, saya kurang paham pertanyaan Anda 🤔\n\nSaya bisa membantu dengan:\n• Cara pakai AI Saran\n• Contoh judul yang baik\n• Tips menulis logbook\n• Cara upload bukti\n• Fitur-fitur Logyai\n• Troubleshooting error\n\nCoba tanya dengan lebih spesifik ya! Contoh:\n\"Bagaimana cara pakai AI Saran?\"";
    }

    /**
     * Try simple math calculations
     */
    private function trySimpleMath($userMessage)
    {
        // Pattern untuk mendeteksi operasi matematika
        $patterns = [
            // Format: "1 + 1" atau "berapa 1 + 1"
            '/(?:berapa\s+)?(\d+(?:\.\d+)?)\s*([+\-*\/x×÷])\s*(\d+(?:\.\d+)?)/i',
            // Format: "1+1" tanpa spasi
            '/(\d+(?:\.\d+)?)([+\-*\/x×÷])(\d+(?:\.\d+)?)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $userMessage, $matches)) {
                $num1 = floatval($matches[1]);
                $operator = $matches[2];
                $num2 = floatval($matches[3]);

                $result = null;
                switch ($operator) {
                    case '+':
                        $result = $num1 + $num2;
                        break;
                    case '-':
                        $result = $num1 - $num2;
                        break;
                    case '*':
                    case 'x':
                    case '×':
                        $result = $num1 * $num2;
                        break;
                    case '/':
                    case '÷':
                        if ($num2 != 0) {
                            $result = $num1 / $num2;
                        } else {
                            return "Tidak bisa membagi dengan 0! 😅";
                        }
                        break;
                }

                if ($result !== null) {
                    // Format hasil
                    $resultFormatted = is_float($result) && floor($result) != $result
                        ? number_format($result, 2, '.', ',')
                        : number_format($result, 0, '.', ',');

                    return "**Hasil:** {$num1} {$operator} {$num2} = **{$resultFormatted}** ✨";
                }
            }
        }

        return null;
    }

    /**
     * Try simple knowledge base
     */
    private function trySimpleKnowledge($userMessage)
    {
        $messageLower = strtolower($userMessage);

        // Presiden Indonesia
        if (str_contains($messageLower, 'presiden') || str_contains($messageLower, 'president')) {
            if (str_contains($messageLower, 'sekarang') || str_contains($messageLower, 'saat ini') ||
                str_contains($messageLower, 'indonesia')) {
                return "**Presiden Indonesia saat ini** (2024) adalah **Prabowo Subianto**.\n\nBeliau dilantik sebagai Presiden RI ke-8 pada tanggal **20 Oktober 2024**, dengan Wakil Presiden **Gibran Rakabuming Raka**.";
            }
        }

        // Ibukota Indonesia
        if (str_contains($messageLower, 'ibukota') && str_contains($messageLower, 'indonesia')) {
            return "**Ibukota Indonesia** saat ini masih **Jakarta** (DKI Jakarta).\n\nNamun, ibukota baru yang sedang dibangun adalah **Nusantara** (IKN - Ibu Kota Nusantara) yang terletak di Kalimantan Timur, dengan target pemindahan bertahap mulai tahun 2024-2045.";
        }

        // Tanggal kemerdekaan
        if ((str_contains($messageLower, 'kapan') || str_contains($messageLower, 'tanggal')) &&
            (str_contains($messageLower, 'merdeka') || str_contains($messageLower, 'kemerdekaan')) &&
            str_contains($messageLower, 'indonesia')) {
            return "Indonesia **merdeka** pada tanggal **17 Agustus 1945**.\n\nProklamasi kemerdekaan dibacakan oleh **Ir. Soekarno** (Presiden pertama) dan **Drs. Mohammad Hatta** (Wakil Presiden pertama).";
        }

        // Jumlah provinsi
        if (str_contains($messageLower, 'berapa') && str_contains($messageLower, 'provinsi') &&
            str_contains($messageLower, 'indonesia')) {
            return "Indonesia memiliki **38 provinsi** (per 2024).\n\nProvinsi terbaru adalah **Papua Selatan**, **Papua Tengah**, dan **Papua Pegunungan** yang merupakan hasil pemekaran dari Papua.";
        }

        // IPB (kampus)
        if (str_contains($messageLower, 'ipb')) {
            if (str_contains($messageLower, 'apa') || str_contains($messageLower, 'kepanjangan')) {
                return "**IPB** adalah singkatan dari **Institut Pertanian Bogor**.\n\nIPB adalah perguruan tinggi negeri yang fokus pada bidang pertanian, peternakan, kehutanan, teknologi pangan, dan ilmu terkait lainnya. Kampus utama IPB terletak di Dramaga, Bogor, Jawa Barat.";
            }
        }

        return null;
    }

    /**
     * Try OpenAI as fallback for general questions (pengetahuan umum, matematika, dll)
     */
    private function tryOpenAIFallback($userMessage)
    {
        $apiKey = env('OPENAI_API_KEY');

        if (!$apiKey) {
            return null;
        }

        try {
            $systemPrompt = "Kamu adalah LogyAI Assistant - AI helper yang membantu mahasiswa magang IPB.

KONTEKS:
- User adalah mahasiswa magang di Telkomsigma sebagai Frontend Developer
- Mereka pakai website Logyai untuk logbook magang

TUGAS KAMU:
1. Jawab pertanyaan APAPUN dengan ramah dan helpful
2. Untuk pertanyaan tentang logbook/Logyai, fokus pada konteks magang IPB
3. Untuk pertanyaan umum (matematika, pengetahuan umum, coding, dll), jawab dengan akurat
4. Gunakan bahasa Indonesia yang natural dan friendly
5. Jika perlu contoh, berikan yang spesifik dan mudah dipahami

ATURAN:
- Jawab langsung to the point, tidak bertele-tele
- Gunakan formatting markdown jika membantu (bold, bullet points)
- Jika tidak tahu pasti, akui saja
- Hindari jawaban terlalu panjang (max 200 kata)

Jawab pertanyaan user dengan helpful dan akurat!";

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o-mini',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $systemPrompt
                    ],
                    [
                        'role' => 'user',
                        'content' => $userMessage
                    ]
                ],
                'max_tokens' => 500,
                'temperature' => 0.7,
            ]);

            if ($response->successful()) {
                $result = $response->json();
                $content = $result['choices'][0]['message']['content'] ?? '';

                if ($content) {
                    Log::info('OpenAI fallback successful', ['message' => $userMessage]);
                    return trim($content);
                }
            }

            Log::warning('OpenAI fallback failed', ['status' => $response->status()]);
            return null;

        } catch (\Exception $e) {
            Log::error('OpenAI fallback error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Test koneksi ke Gemini API
     */
    public function testGemini()
    {
        try {
            $geminiService = new GeminiService();

            $testPrompt = "finishing sistem management karyawan, fix bug, merging branch feature dan deployment FE dan BE";

            $result = $geminiService->generateContent($testPrompt, [
                'jenis_kegiatan' => 'Berita Acara Kegiatan',
                'lokasi' => 'Graha Telkomsigma II, Tangerang Selatan'
            ]);

            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'Gemini API berhasil terhubung dan menghasilkan konten',
                    'data' => $result,
                    'test_prompt' => $testPrompt
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Gemini API gagal menghasilkan konten',
                    'test_prompt' => $testPrompt
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Test Gemini API Error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error testing Gemini API: ' . $e->getMessage(),
                'test_prompt' => $testPrompt ?? 'N/A'
            ], 500);
        }
    }
}