# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a mobile-optimized Progressive Web App (PWA) for managing and sharing health records with doctors. Built with Vite + React 19, it provides an iOS-native-like experience with 60fps animations, touch gestures, and offline support.

## Essential Commands

```bash
# Install dependencies
npm install

# Development (starts dev server with HMR on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## Architecture

### Core Stack
- **Build Tool**: Vite 7 with React plugin
- **UI Framework**: React 19 with React Router v6
- **Styling**: Tailwind CSS with mobile-first utilities
- **Animations**: Framer Motion for iOS-like transitions
- **Icons**: Heroicons 2 (24px solid variant)
- **State Management**: React Context API (AuthContext, HealthRecordsContext)

### Project Structure
```
src/
├── components/       # Reusable UI components
│   ├── TabBar.jsx   # iOS-style bottom navigation
│   ├── TransitionWrapper.jsx # Page transition animations
│   └── PWAInstallPrompt.jsx # PWA installation banner
├── contexts/        # Global state management
│   ├── AuthContext.jsx # Authentication state
│   └── HealthRecordsContext.jsx # Health records state
├── pages/           # Route components
│   ├── AuthPage.jsx # Email + SMS authentication
│   ├── HomePage.jsx # Dashboard with quick actions
│   ├── UploadPage.jsx # File upload & provider connection
│   ├── SharePage.jsx # Share records with doctor
│   └── TimelinePage.jsx # Health records timeline
└── App.jsx          # Root component with routing
```

### Mobile-First Features
- **Viewport**: `viewport-fit=cover` for notch devices
- **Safe Areas**: Uses `env(safe-area-inset-*)` for padding
- **Touch Targets**: Minimum 44x44px buttons
- **Tab Navigation**: Fixed bottom bar with 3 tabs (Home, Upload, Share)
- **Page Transitions**: Spring animations (stiffness: 350, damping: 30)
- **PWA**: Full manifest with iOS splash screens and install prompt

## Development Notes

1. **JavaScript Only**: No TypeScript. Use `.jsx` for React components.

2. **Tailwind Styling**: All styles via Tailwind utilities. Custom colors in `tailwind.config.js`:
   - `ios-blue`: #0A84FF
   - `ios-gray`: Multiple shades for iOS-like UI

3. **Authentication Flow**:
   - Email → SMS verification → Onboarding → Main app
   - Demo SMS code: `123456`
   - State persisted in localStorage

4. **Health Records Management**:
   - Upload: PDF/images with simulated OCR processing
   - Provider connection via email (Direct protocol simulation)
   - Timeline view with hide/delete functionality
   - Share package generation with AI summary

5. **ESLint Notes**: False positives for `motion` imports (used as JSX components)

## User Stories Implementation

- **E-1**: Email + SMS authentication with 5-minute timer ✓
- **E-2**: Upload files & connect providers ✓
- **E-3**: Simulated AI processing with confidence tracking ✓
- **E-4**: Timeline with hide/delete controls ✓
- **E-5**: Share package generation with doctor email ✓
- **E-6-8**: Backend features (simulated in contexts)

## Performance Targets

- Max bundle size: 250KB gzipped (currently ~120KB)
- Page transitions: 60fps with hardware acceleration
- LCP < 2s on iPhone SE 2022 over 4G
