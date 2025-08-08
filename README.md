# Revado Health Mobile PWA

A mobile-optimized Progressive Web App for managing and sharing health records with healthcare providers. Built with React 19, Vite, and WebAuthn for secure biometric authentication.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up HTTPS (required for Face ID/Touch ID)
./setup-https.sh

# Start development server with HTTPS
npm run dev

# Access the app
# Local: https://localhost:5173
# Network: https://[your-ip]:5173
```

### Optional: Backend Server

The app includes an optional Express.js backend for file storage:

```bash
# Terminal 1: Start backend server
cd backend
npm install
npm start

# Terminal 2: Start frontend (will auto-detect backend)
npm run dev
```

The frontend automatically uses the backend when available, or falls back to localStorage when offline.

## 📱 Features

- **Biometric Authentication**: Face ID/Touch ID support via WebAuthn
- **Health Records Management**: Upload, organize, and share medical documents
- **Provider Integration**: Connect with healthcare providers via Direct protocol
- **AI Processing**: Automated document analysis and summarization
- **PWA Support**: Install as native app on iOS/Android
- **Offline Capability**: Works without internet connection
- **60fps Animations**: Native-like performance with Framer Motion

## 🔐 HTTPS & Face ID Setup

Face ID and Touch ID **require HTTPS** to function. The WebAuthn API is only available in secure contexts.

### Local HTTPS Setup (Recommended)

```bash
# One-time setup
./setup-https.sh

# Start with HTTPS
npm run dev
```

**Certificate Details** (Generated 2025-08-08):
- Valid until: November 7, 2027
- Domains: localhost, 127.0.0.1, ::1, 192.168.1.233
- Location: `/certs/` directory

### Testing on iPhone

#### Option 1: ngrok (Easiest)
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Create HTTPS tunnel
npm run dev:tunnel

# Update .env with ngrok domain
VITE_WEBAUTHN_RP_ID=your-url.ngrok-free.app

# Access the ngrok URL on iPhone
```

#### Option 2: Local Network
1. Ensure iPhone is on same WiFi network
2. Access: `https://192.168.1.233:5173`
3. Accept certificate warning on iPhone
4. Face ID will now work!

See [NGROK_SETUP.md](./NGROK_SETUP.md) for detailed instructions.

## 🛠️ Technology Stack

- **Frontend**: React 19 with React Router v6
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion
- **Authentication**: WebAuthn API for biometric auth
- **Icons**: Heroicons 2
- **State Management**: React Context API

## 📂 Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/        # Global state management
├── pages/           # Route components
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
└── config/          # Configuration files
    └── webauthn.config.js  # WebAuthn/Face ID settings
```

## ⚙️ Configuration

### WebAuthn Configuration

Configure Face ID/Touch ID settings in `.env`:

```env
# Required for production
VITE_WEBAUTHN_RP_ID=yourdomain.com
VITE_WEBAUTHN_RP_NAME="Your App Name"

# Optional
VITE_WEBAUTHN_TIMEOUT=60000
VITE_WEBAUTHN_USER_VERIFICATION="required"
```

See [WEBAUTHN_CONFIG.md](./WEBAUTHN_CONFIG.md) for all options.

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run dev:https    # Setup HTTPS and start dev server
npm run dev:tunnel   # Start ngrok tunnel for iPhone testing
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run setup:https  # Set up HTTPS certificates
```

## 🔍 Development Features

### Authentication Logging
All sign-in/sign-up events are logged with duration tracking:
- View logs: Settings → Authentication Logs
- Export logs as JSON for analysis
- Automatic device type detection

### Debug Mode
On mobile devices, debug information is displayed showing:
- Face ID availability
- Stored credentials status
- HTTPS connection status

## 📋 Checkpoints

Project milestones are documented in `/checkpoints/`:
- [Checkpoint 001: HTTPS Setup](./checkpoints/checkpoint-001-https-setup.md) - SSL certificates and Face ID enablement

## 🚨 Known Issues

1. **Face ID on HTTP**: Will not work without HTTPS - this is a WebAuthn security requirement
2. **Certificate Warnings**: Self-signed certificates show warnings - normal for local development
3. **ngrok URL Changes**: Free tier URLs change on each restart - update `.env` accordingly

## 📖 Documentation

- [Claude.md](./CLAUDE.md) - AI assistant instructions
- [WebAuthn Config](./WEBAUTHN_CONFIG.md) - Face ID/Touch ID configuration
- [ngrok Setup](./NGROK_SETUP.md) - iPhone testing guide
- [Technical Prompt](./TECHNICAL_PROMPT.md) - System architecture
- [Plan](./PLAN.md) - Development roadmap

## 🔒 Security Notes

- HTTPS is mandatory for Face ID/Touch ID
- Certificates expire November 7, 2027
- WebAuthn credentials are stored locally
- No sensitive data is transmitted to external servers

## 🤝 Contributing

1. Ensure HTTPS is set up before testing authentication features
2. Test on actual iOS devices for Face ID functionality
3. Follow the existing code style and conventions
4. Update checkpoints for major feature additions

## 📱 PWA Installation

### iOS
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"

### Android
1. Open in Chrome
2. Tap menu (⋮)
3. Select "Install app"

---

Built with ❤️ for seamless health record management