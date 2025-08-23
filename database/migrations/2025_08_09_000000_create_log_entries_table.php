<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('log_entries', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal');
            $table->time('waktu_mulai');
            $table->time('waktu_selesai');
            $table->string('jenis_kegiatan'); // sesuai opsi portal: 1/2/3 atau label
            $table->string('dosen_penggerak');
            $table->enum('tipe_penyelenggaraan', ['hybrid', 'offline', 'online'])->default('hybrid');
            $table->string('lokasi');
            $table->string('judul')->nullable();
            $table->text('keterangan');
            $table->string('bukti_path')->nullable();
            $table->enum('export_status', ['draft', 'queued', 'success', 'failed'])->default('draft');
            $table->timestamp('exported_at')->nullable();
            $table->text('export_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('log_entries');
    }
};


