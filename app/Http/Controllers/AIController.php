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
                    // Check if this is a prompt-based request
        if ($request->has('prompt')) {
            return $this->handlePromptRequest($request);
        }

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
        
        // Dictionary untuk perbaikan kata-kata umum
        $improvements = [
            // General terms
            'meeting' => 'Meeting',
            'diskusi' => 'Diskusi',
            'presentasi' => 'Presentasi',
            'project' => 'Proyek',
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
        ];

        // Perbaiki kata-kata
        foreach ($improvements as $wrong => $correct) {
            $title = preg_replace('/\b' . preg_quote($wrong, '/') . '\b/i', $correct, $title);
        }

        // Kapitalisasi yang benar
        $title = ucfirst($title);
        
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
            'prompt' => 'required|string|min:10',
            'jenis_kegiatan' => 'nullable|string',
            'dosen_penggerak' => 'nullable|string',
            'lokasi' => 'nullable|string',
        ]);

        $prompt = $request->prompt;
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