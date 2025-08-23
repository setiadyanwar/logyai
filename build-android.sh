#!/bin/bash

echo "🚀 Building Logyai Android APK..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 11+ first."
    exit 1
fi

# Check if Android SDK is installed
if [ -z "$ANDROID_HOME" ]; then
    echo "❌ ANDROID_HOME is not set. Please install Android SDK first."
    exit 1
fi

# Install Bubblewrap globally if not installed
if ! command -v bubblewrap &> /dev/null; then
    echo "📦 Installing Bubblewrap..."
    npm install -g @bubblewrap/cli
fi

# Create TWA project directory
echo "📁 Creating TWA project..."
mkdir -p twa-build
cd twa-build

# Initialize TWA project
echo "🔧 Initializing TWA project..."
bubblewrap init --manifest ../twa-manifest.json

# Build APK
echo "🔨 Building APK..."
bubblewrap build

echo "✅ APK build completed!"
echo "📱 APK file location: twa-build/app-release.apk"
echo ""
echo "📋 Next steps:"
echo "1. Install the APK on your Android device"
echo "2. The app will work offline and online"
echo "3. Updates will be automatic when you deploy new versions"
echo ""
echo "💡 To distribute:"
echo "- Upload APK to Google Play Store"
echo "- Share APK file directly"
echo "- Use internal distribution methods"
