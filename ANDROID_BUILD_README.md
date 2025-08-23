# 🚀 Panduan Build APK Android untuk Logyai

Aplikasi Laravel Logyai dapat diubah menjadi APK Android yang bisa diinstall dan berfungsi online/offline tanpa hosting.

## 📋 Prerequisites

Sebelum memulai, pastikan Anda telah menginstall:

### 1. Node.js & npm
```bash
# Download dari https://nodejs.org/
# Atau gunakan package manager
```

### 2. Java 11 atau lebih baru
```bash
# Download dari https://adoptium.net/
# Atau gunakan package manager
```

### 3. Android SDK
```bash
# Download Android Studio dari https://developer.android.com/
# Atau download command line tools saja
```

### 4. Set Environment Variables
```bash
# Windows (PowerShell)
$env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"

# Linux/Mac
export ANDROID_HOME="/path/to/android/sdk"
```

## 🔧 Langkah Build APK

### Opsi 1: Menggunakan Script Otomatis

#### Windows (PowerShell)
```powershell
# Jalankan sebagai Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\build-android.ps1
```

#### Linux/Mac
```bash
chmod +x build-android.sh
./build-android.sh
```

### Opsi 2: Manual Build

#### 1. Install Bubblewrap
```bash
npm install -g @bubblewrap/cli
```

#### 2. Update TWA Manifest
Edit file `twa-manifest.json`:
- Ganti `your-domain.com` dengan domain Anda
- Update `sha256_cert_fingerprints` jika ada

#### 3. Build APK
```bash
# Buat direktori build
mkdir twa-build
cd twa-build

# Initialize TWA project
bubblewrap init --manifest ../twa-manifest.json

# Build APK
bubblewrap build
```

## 📱 Fitur APK yang Dihasilkan

### ✅ Fitur Online
- Sync data real-time dengan server
- Export ke portal IPB
- AI suggestions
- Upload foto dengan watermark

### ✅ Fitur Offline
- Cache data logbook
- Form input offline
- Service worker untuk background sync
- Install sebagai aplikasi native

### ✅ Fitur Android
- Push notifications
- Background sync
- Share target
- App shortcuts
- Splash screen

## 🌐 Deployment Options

### 1. Self-Hosted (Tanpa Hosting)
- Deploy di VPS/Cloud server
- Gunakan domain sendiri
- Update APK otomatis saat deploy

### 2. Free Hosting
- **Vercel**: Deploy Laravel + PWA
- **Netlify**: Static hosting + functions
- **Railway**: Full-stack hosting
- **Render**: Free tier available

### 3. Cloud Hosting
- **AWS**: EC2 + S3 + CloudFront
- **Google Cloud**: App Engine + Cloud Storage
- **Azure**: App Service + Blob Storage

## 🔄 Update & Maintenance

### Auto-Update
- APK akan auto-update saat ada perubahan
- Service worker cache management
- Background sync untuk data

### Manual Update
- Build ulang APK dengan versi baru
- Distribute melalui Play Store atau direct APK

## 📊 Performance & Optimization

### PWA Features
- Service worker caching
- Background sync
- Offline-first approach
- Responsive design

### Laravel Optimization
- Route caching
- View caching
- Database optimization
- Asset minification

## 🚨 Troubleshooting

### Common Issues

#### 1. ANDROID_HOME not set
```bash
# Set environment variable
export ANDROID_HOME="/path/to/android/sdk"
```

#### 2. Java version incompatible
```bash
# Install Java 11+
# Set JAVA_HOME environment variable
```

#### 3. Build fails
```bash
# Clear cache
bubblewrap clean
# Rebuild
bubblewrap build
```

#### 4. PWA not installing
- Check manifest.json syntax
- Verify service worker registration
- Test in Chrome DevTools

## 📚 Resources

### Documentation
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [TWA Documentation](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap)

### Tools
- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)

## 🎯 Next Steps

1. **Test PWA**: Buka di Chrome mobile, test install
2. **Build APK**: Jalankan script build
3. **Test APK**: Install di device Android
4. **Deploy**: Upload ke server/hosting
5. **Distribute**: Share APK atau upload ke Play Store

## 💡 Tips

- Test PWA di Chrome mobile sebelum build APK
- Gunakan HTTPS untuk production
- Optimize images dan assets
- Test offline functionality
- Monitor performance dengan Lighthouse

---

**🎉 Selamat!** Aplikasi Laravel Anda sekarang bisa diinstall sebagai APK Android yang berfungsi online tanpa hosting!
