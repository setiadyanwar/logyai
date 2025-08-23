# Setup Gemini API untuk LogYAI

## Langkah 1: Dapatkan API Key Gemini

1. Kunjungi [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Login dengan akun Google Anda
3. Klik "Create API Key"
4. Copy API key yang dihasilkan

## Langkah 2: Konfigurasi Environment

Buat file `.env` di root project dan tambahkan:

```env
# Gemini AI API Configuration
GEMINI_API_KEY=AIzaSyByUvTf0fojvTSRQupgwtzw4DvmrsS4ANM
```

## Langkah 3: Test Koneksi

Setelah setup selesai, test koneksi dengan mengunjungi:

```
http://localhost:8000/ai/test
```

## Fitur Gemini API

### Keunggulan:
- **Judul yang Lebih Rapih**: Tidak hanya copy-paste dari input user
- **Kapitalisasi yang Benar**: Title Case yang konsisten
- **Bahasa Semi Formal**: Sopan dan profesional
- **Deskripsi Kontekstual**: Relevan dengan aktivitas yang dilakukan

### Contoh Input/Output:

**Input:**
```
finishing sistem management karyawan, fix bug, merging branch feature dan deployment FE dan BE
```

**Output Gemini:**
```json
{
  "judul": "Penyelesaian Sistem Manajemen Karyawan (HRIS) dan Deployment",
  "keterangan": "Menyelesaikan pengembangan sistem manajemen karyawan (HRIS) dengan fokus pada perbaikan bug yang ditemukan selama proses integrasi. Melakukan merging branch fitur untuk memastikan konsistensi dan stabilitas kode, serta melanjutkan proses deployment untuk frontend dan backend agar sistem dapat berjalan optimal di lingkungan produksi."
}
```

## Troubleshooting

### Error "API Key tidak ditemukan"
- Pastikan file `.env` ada dan berisi `GEMINI_API_KEY`
- Restart server Laravel setelah mengubah `.env`

### Error "Gemini API gagal"
- Periksa log Laravel di `storage/logs/laravel.log`
- Pastikan API key valid dan tidak expired
- Cek koneksi internet

### Response tidak sesuai format
- Gemini akan menggunakan fallback jika response tidak valid
- Periksa prompt yang dikirim ke API

## Konfigurasi Tambahan

File konfigurasi tersedia di `config/gemini.php`:

```php
'temperature' => 0.2,        // Kreativitas (0.0 = sangat konsisten, 1.0 = sangat kreatif)
'max_tokens' => 1000,        // Maksimal token output
'timeout' => 30,             // Timeout dalam detik
```

## Fallback System

Jika Gemini API gagal, sistem akan menggunakan fallback yang sudah dioptimasi:
- Judul yang diperbaiki dengan kapitalisasi yang benar
- Deskripsi yang kontekstual dan semi formal
- Tidak ada downtime meskipun API bermasalah
