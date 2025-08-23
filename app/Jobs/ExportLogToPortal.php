<?php

namespace App\Jobs;

use App\Models\LogEntry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ExportLogToPortal implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $logEntry;

    public function __construct(LogEntry $logEntry)
    {
        $this->logEntry = $logEntry;
    }

    public function handle()
    {
        try {
            // Simulasi proses ekspor ke portal IPB
            $this->exportToPortalIPB();
            
            // Update status menjadi success
            $this->logEntry->update(['export_status' => 'success']);
            
            Log::info("Log ID {$this->logEntry->id} berhasil diekspor ke portal IPB");
            
        } catch (\Exception $e) {
            // Update status menjadi failed
            $this->logEntry->update(['export_status' => 'failed']);
            
            Log::error("Gagal mengekspor log ID {$this->logEntry->id}: " . $e->getMessage());
            
            // Re-throw exception agar job bisa di-retry
            throw $e;
        }
    }

    private function exportToPortalIPB()
    {
        // Untuk development, gunakan simulasi
        if (env('APP_ENV') === 'local' && !env('ENABLE_REAL_EXPORT', false)) {
            sleep(2);
            Log::info("Simulasi ekspor log ID {$this->logEntry->id} ke portal IPB berhasil");
            return;
        }

        // Implementasi Playwright untuk production
        $username = env('PORTAL_IPB_USERNAME');
        $password = env('PORTAL_IPB_PASSWORD');
        
        if (!$username || !$password) {
            throw new \Exception('Kredensial portal IPB tidak ditemukan. Set PORTAL_IPB_USERNAME dan PORTAL_IPB_PASSWORD di .env');
        }

        // Prepare log data
        $logData = [
            'tanggal' => \Carbon\Carbon::parse($this->logEntry->tanggal)->format('d/m/Y'),
            'waktu_mulai' => $this->logEntry->waktu_mulai,
            'waktu_selesai' => $this->logEntry->waktu_selesai,
            'jenis_kegiatan' => $this->logEntry->jenis_kegiatan,
            'lokasi' => $this->logEntry->lokasi,
            'judul' => $this->logEntry->judul,
            'keterangan' => $this->logEntry->keterangan,
            'bukti_path' => $this->logEntry->bukti_path ? Storage::path('public/' . $this->logEntry->bukti_path) : null
        ];

        $credentials = [
            'username' => $username,
            'password' => $password
        ];

        // Execute Playwright script
        $scriptPath = base_path('scripts/export-portal.js');
        $logDataJson = json_encode($logData);
        $credentialsJson = json_encode($credentials);
        
        $command = "cd " . base_path() . " && node {$scriptPath} '{$logDataJson}' '{$credentialsJson}' 2>&1";
        $output = shell_exec($command);
        
        if (strpos($output, 'SUCCESS') === false) {
            throw new \Exception('Playwright export failed: ' . $output);
        }
        
        Log::info("Ekspor log ID {$this->logEntry->id} ke portal IPB berhasil");
    }

    public function failed(\Throwable $exception)
    {
        // Update status jika job gagal setelah retry
        $this->logEntry->update(['export_status' => 'failed']);
        
        Log::error("Job eksport log ID {$this->logEntry->id} gagal: " . $exception->getMessage());
    }
}