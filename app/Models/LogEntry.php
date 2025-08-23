<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'tanggal',
        'waktu_mulai',
        'waktu_selesai',
        'jenis_kegiatan',
        'dosen_penggerak',
        'tipe_penyelenggaraan',
        'lokasi',
        'judul',
        'keterangan',
        'bukti_path',
        'export_status',
        'exported_at',
        'export_notes',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'exported_at' => 'datetime',
    ];

    // Accessor untuk bukti
    public function getBuktiAttribute()
    {
        return $this->bukti_path;
    }
}


