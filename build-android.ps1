# PowerShell script untuk build Logyai Android APK
Write-Host "🚀 Building Logyai Android APK..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if Java is installed
try {
    $javaVersion = java -version 2>&1
    Write-Host "✅ Java is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Java is not installed. Please install Java 11+ first." -ForegroundColor Red
    exit 1
}

# Check if Android SDK is installed
if (-not $env:ANDROID_HOME) {
    Write-Host "❌ ANDROID_HOME is not set. Please install Android SDK first." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Android SDK found at: $env:ANDROID_HOME" -ForegroundColor Green
}

# Install Bubblewrap globally if not installed
try {
    $bubblewrapVersion = bubblewrap --version
    Write-Host "✅ Bubblewrap version: $bubblewrapVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing Bubblewrap..." -ForegroundColor Yellow
    npm install -g @bubblewrap/cli
}

# Create TWA project directory
Write-Host "📁 Creating TWA project..." -ForegroundColor Yellow
if (Test-Path "twa-build") {
    Remove-Item -Recurse -Force "twa-build"
}
New-Item -ItemType Directory -Path "twa-build" | Out-Null
Set-Location "twa-build"

# Initialize TWA project
Write-Host "🔧 Initializing TWA project..." -ForegroundColor Yellow
bubblewrap init --manifest ../twa-manifest.json

# Build APK
Write-Host "🔨 Building APK..." -ForegroundColor Yellow
bubblewrap build

Write-Host "✅ APK build completed!" -ForegroundColor Green
Write-Host "📱 APK file location: twa-build/app-release.apk" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Install the APK on your Android device" -ForegroundColor White
Write-Host "2. The app will work offline and online" -ForegroundColor White
Write-Host "3. Updates will be automatic when you deploy new versions" -ForegroundColor White
Write-Host ""
Write-Host "💡 To distribute:" -ForegroundColor Yellow
Write-Host "- Upload APK to Google Play Store" -ForegroundColor White
Write-Host "- Share APK file directly" -ForegroundColor White
Write-Host "- Use internal distribution methods" -ForegroundColor White

# Return to original directory
Set-Location ..
