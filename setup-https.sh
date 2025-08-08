#!/bin/bash

# HTTPS Setup Script for Local Development
# This enables Face ID/Touch ID on iOS devices

echo "🔐 Setting up HTTPS for local development..."
echo "This will enable Face ID/Touch ID on iOS devices"
echo ""

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "📦 mkcert is not installed. Installing..."
    
    # Detect OS and install mkcert
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install mkcert
            brew install nss # for Firefox
        else
            echo "❌ Homebrew is not installed. Please install Homebrew first:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            sudo apt install libnss3-tools
            wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
            chmod +x mkcert
            sudo mv mkcert /usr/local/bin/
        else
            echo "❌ Please install mkcert manually: https://github.com/FiloSottile/mkcert"
            exit 1
        fi
    else
        echo "❌ Unsupported OS. Please install mkcert manually: https://github.com/FiloSottile/mkcert"
        exit 1
    fi
fi

# Install local CA
echo "🏛️  Installing local Certificate Authority..."
mkcert -install

# Create certificates directory
mkdir -p certs
cd certs

# Generate certificates for localhost and local network
echo "📜 Generating SSL certificates..."
mkcert localhost 127.0.0.1 ::1

# Also generate for local network access (optional)
# Get local IP
LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1)

if [ ! -z "$LOCAL_IP" ]; then
    echo "🌐 Generating certificate for local IP: $LOCAL_IP"
    mkcert localhost 127.0.0.1 ::1 $LOCAL_IP
    echo ""
    echo "📱 To test on iPhone using local network:"
    echo "   1. Connect iPhone to same WiFi network"
    echo "   2. Access: https://$LOCAL_IP:5173"
else
    echo "⚠️  Could not detect local IP address"
fi

# Rename certificates for clarity
mv localhost+*.pem localhost.pem
mv localhost+*-key.pem localhost-key.pem

cd ..

echo ""
echo "✅ HTTPS setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Run: npm run dev"
echo "   2. Access: https://localhost:5173"
echo ""
echo "📱 For iPhone testing:"
echo "   Option A: Use ngrok (recommended)"
echo "      - Install: npm install -g ngrok"
echo "      - Run: ngrok http 5173"
echo "      - Use the HTTPS URL provided"
echo ""
echo "   Option B: Local network (if certificate includes your IP)"
echo "      - Connect iPhone to same WiFi"
echo "      - Access: https://$LOCAL_IP:5173"
echo "      - Accept certificate warning"
echo ""
echo "🔑 Face ID/Touch ID should now work on iOS devices!"