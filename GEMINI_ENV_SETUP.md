# Setup Environment Variables untuk Gemini API

## Langkah 1: Buat file .env

Buat file `.env` di root project (sejajar dengan `composer.json`) dengan isi berikut:

```env
APP_NAME=LogYAI
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=logyai
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME="${APP_NAME}"
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"

# Gemini AI API Configuration
GEMINI_API_KEY=AIzaSyByUvTf0fojvTSRQupgwtzw4DvmrsS4ANM
```

## Langkah 2: Generate APP_KEY

Jalankan perintah berikut di terminal:

```bash
php artisan key:generate
```

## Langkah 3: Clear Cache

Jalankan perintah berikut untuk membersihkan cache:

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

## Langkah 4: Restart Server

Restart server Laravel Anda:

```bash
# Jika menggunakan Laragon, restart dari Laragon
# Jika menggunakan artisan serve
php artisan serve
```

## Langkah 5: Test Koneksi

Setelah setup selesai, test koneksi dengan mengunjungi:

```
http://localhost:8000/ai/test
```

## Troubleshooting

### Error "Class not found"
- Pastikan file `.env` ada dan berisi `GEMINI_API_KEY`
- Jalankan `php artisan config:clear`
- Restart server

### Error "500 Internal Server Error"
- Periksa log Laravel di `storage/logs/laravel.log`
- Pastikan semua file konfigurasi valid
- Cek apakah ada syntax error di file PHP

### Modal masih reload sendiri
- Pastikan tidak ada error JavaScript di console browser
- Periksa apakah ada infinite loop di React component
- Cek apakah ada masalah dengan state management
