<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\GeminiService;

class TestGemini extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'gemini:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Gemini AI service dengan prompt yang sama seperti user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== TEST GEMINI AI ===');
        
        $prompt = 'Mengerjakan sistem management karyawan (HRIS) membuat tampilan utama';
        
        $this->line("Prompt: " . $prompt);
        
        try {
            $geminiService = new GeminiService();
            $result = $geminiService->generateContent($prompt);
            
            if ($result) {
                $this->info('✅ Berhasil!');
                $this->line('Judul: ' . $result['judul']);
                $this->line('Keterangan: ' . $result['keterangan']);
            } else {
                $this->error('❌ Gagal generate content');
            }
        } catch (\Exception $e) {
            $this->error('❌ Error: ' . $e->getMessage());
        }
        
        $this->line('');
        $this->line('=== END TEST ===');
    }
}
