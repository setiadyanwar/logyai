# Export Automation ke Portal IPB

Dokumentasi untuk menggunakan fitur export otomatis logbook ke Student Portal IPB menggunakan Playwright.

## Setup

### 1. Install Dependencies

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 2. Konfigurasi Environment

Tambahkan kredensial portal IPB ke file `.env`:

```env
# Portal IPB Credentials
PORTAL_IPB_USERNAME=setiadyanwar
PORTAL_IPB_PASSWORD=your_password_here

# Enable real export (default: false untuk development)
ENABLE_REAL_EXPORT=false
```

⚠️ **PENTING**: Jangan commit file `.env` dengan password asli ke Git!

### 3. Setup Queue Worker

Export menggunakan Laravel Queue untuk background processing. Jalankan worker:

```bash
php artisan queue:work
```

Atau untuk development dengan auto-reload:

```bash
php artisan queue:listen
```

## Cara Penggunaan

### Melalui Web Interface

1. Buat atau edit logbook entry
2. Pastikan semua field required terisi:
   - Tanggal
   - Waktu Mulai & Selesai
   - Jenis Kegiatan
   - Dosen Penggerak
   - Tipe Penyelenggaraan (Hybrid/Offline/Online)
   - Lokasi
   - Keterangan
   - Bukti Aktivitas (foto/PDF)

3. Klik tombol **"Ekspor"** pada entry yang ingin dikirim
4. Status export akan berubah:
   - `queued` - Sedang dalam antrian
   - `processing` - Sedang diproses
   - `success` - Berhasil dikirim ke portal
   - `failed` - Gagal, coba lagi

### Testing Manual

Untuk testing script secara manual:

```bash
cd scripts
node export-portal.js '{"tanggal":"2025-01-10","waktu_mulai":"08:30","waktu_selesai":"17:30","jenis_kegiatan":"Berita Acara Kegiatan","dosen_penggerak":"Amata Fami, M.Ds. - 201807198507182001","tipe_penyelenggaraan":"hybrid","lokasi":"PT Telkomsigma","keterangan":"Test logbook entry","bukti_path":"./storage/app/public/bukti/test.jpg"}' '{"username":"setiadyanwar","password":"your_password"}'
```

### Debugging

Untuk melihat browser saat export (non-headless mode), edit `scripts/export-portal.js`:

```bash
# Set environment variable
HEADLESS=false node export-portal.js ...
```

Screenshot error akan tersimpan otomatis di folder root jika terjadi kesalahan.

## Struktur Data

### Logbook Entry Format

```json
{
  "tanggal": "2025-01-10",           // Format: YYYY-MM-DD
  "waktu_mulai": "08:30",            // Format: HH:mm
  "waktu_selesai": "17:30",          // Format: HH:mm
  "jenis_kegiatan": "Berita Acara Kegiatan",
  "dosen_penggerak": "Amata Fami, M.Ds. - 201807198507182001",
  "tipe_penyelenggaraan": "hybrid",  // hybrid | offline | online
  "lokasi": "PT Telkomsigma, Jakarta",
  "keterangan": "Deskripsi lengkap kegiatan...",
  "bukti_path": "/path/to/file.jpg"
}
```

### Jenis Kegiatan Options

- `Berita Acara Pembimbingan (Konsultasi/Mentoring/Coaching)` → ID: 1
- `Berita Acara Ujian` → ID: 2
- `Berita Acara Kegiatan` → ID: 3

## Troubleshooting

### Export Gagal

1. **Cek kredensial**:
   ```bash
   php artisan tinker
   >>> env('PORTAL_IPB_USERNAME')
   >>> env('PORTAL_IPB_PASSWORD')
   ```

2. **Cek queue worker berjalan**:
   ```bash
   php artisan queue:work --once
   ```

3. **Lihat log error**:
   ```bash
   tail -f storage/logs/laravel.log
   ```

4. **Test koneksi portal**:
   - Buka https://studentportal.ipb.ac.id/Account/Login
   - Login manual dengan kredensial
   - Pastikan akses ke halaman logbook tersedia

### Browser Tidak Ditemukan

```bash
npx playwright install chromium
```

### File Bukti Tidak Ditemukan

Pastikan path file benar dan file ada di storage:

```bash
ls -la storage/app/public/bukti/
```

## Development Mode

Saat development (`APP_ENV=local` dan `ENABLE_REAL_EXPORT=false`), export akan:
- **Simulasi saja** (tidak benar-benar mengirim ke portal)
- Delay 2 detik untuk simulasi processing
- Auto-mark sebagai success
- Log output: "Simulasi ekspor log ID X berhasil"

Untuk testing real export di development:

```env
ENABLE_REAL_EXPORT=true
```

## Production Deployment

1. Set environment variables di server:
   ```env
   APP_ENV=production
   ENABLE_REAL_EXPORT=true
   PORTAL_IPB_USERNAME=your_username
   PORTAL_IPB_PASSWORD=your_password
   ```

2. Install Playwright di server:
   ```bash
   npm install -D @playwright/test
   npx playwright install chromium --with-deps
   ```

3. Setup supervisor untuk queue worker:
   ```ini
   [program:logyai-queue]
   command=php /path/to/artisan queue:work --sleep=3 --tries=3
   autostart=true
   autorestart=true
   user=www-data
   redirect_stderr=true
   stdout_logfile=/path/to/storage/logs/queue.log
   ```

## Security Notes

⚠️ **PENTING**:
- Jangan commit kredensial ke Git
- Gunakan `.env` untuk menyimpan password
- Pastikan `.env` ada di `.gitignore`
- Untuk production, gunakan Laravel Encryption atau Vault untuk credentials
- Set proper file permissions untuk script: `chmod 755 scripts/export-portal.js`

## Fitur Automation

✅ **Yang Sudah Bisa**:
- Login otomatis ke portal IPB
- Navigasi ke halaman Log Aktivitas Kampus Merdeka
- Fill form dengan data dari database lokal
- Upload bukti aktivitas
- Submit dan verifikasi success
- Retry mechanism jika gagal
- Screenshot otomatis saat error
- Queue-based processing

🔜 **Roadmap**:
- Bulk export (export beberapa log sekaligus)
- Export scheduling (auto-export setiap hari)
- Email notification saat export success/failed
- Export history dan audit log
- Integration test automation

## Support

Jika ada masalah atau pertanyaan:
1. Cek dokumentasi Laravel Queue: https://laravel.com/docs/queues
2. Cek dokumentasi Playwright: https://playwright.dev/docs/intro
3. Buka issue di repository
