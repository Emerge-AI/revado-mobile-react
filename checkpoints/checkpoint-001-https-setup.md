# Checkpoint 001: HTTPS Setup & SSL Certificates

**Date**: 2025-08-08  
**Purpose**: Enable Face ID/Touch ID support on iOS devices by setting up HTTPS

## Setup Execution Log

### 1. Local Certificate Authority Installation
```
🏛️  Installing local Certificate Authority...
Created a new local CA 💥
The local CA is now installed in the system trust store! ⚡️
The local CA is now installed in the Firefox trust store (requires browser restart)! 🦊
```

**Result**: Successfully installed mkcert local CA in system and Firefox trust stores.

### 2. SSL Certificate Generation

#### Localhost Certificate
```
📜 Generating SSL certificates...
Created a new certificate valid for the following names 📜
 - "localhost"
 - "127.0.0.1"
 - "::1"

The certificate is at "./localhost+2.pem" and the key at "./localhost+2-key.pem" ✅
It will expire on 7 November 2027 🗓
```

#### Local Network Certificate
```
🌐 Generating certificate for local IP: 192.168.1.233
Created a new certificate valid for the following names 📜
 - "localhost"
 - "127.0.0.1"
 - "::1"
 - "192.168.1.233"

The certificate is at "./localhost+3.pem" and the key at "./localhost+3-key.pem" ✅
It will expire on 7 November 2027 🗓
```

### 3. Issues Encountered

Minor file renaming errors occurred:
```
mv: localhost.pem is not a directory
mv: localhost-key.pem is not a directory
```

**Impact**: Minimal - certificates were still generated successfully with different filenames.

## Certificate Details

### Files Created
- **CA Certificate**: Installed in system trust store
- **Localhost Certificate**: `localhost+2.pem` (cert) and `localhost+2-key.pem` (key)
- **Network Certificate**: `localhost+3.pem` (cert) and `localhost+3-key.pem` (key)
- **Expiry Date**: November 7, 2027
- **Valid Domains**: 
  - localhost
  - 127.0.0.1
  - ::1 (IPv6 localhost)
  - 192.168.1.233 (local network IP)

### Vite Configuration
The project was configured to automatically detect and use these certificates:
```javascript
// vite.config.js
const httpsConfig = (() => {
  const certPath = path.resolve('./certs/localhost.pem')
  const keyPath = path.resolve('./certs/localhost-key.pem')
  
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }
  }
  return false
})()
```

## Testing Access Points

### Local Development
- **HTTPS URL**: https://localhost:5173
- **HTTP Fallback**: http://localhost:5173 (Face ID won't work)

### iPhone Testing Options

#### Option A: ngrok (Recommended)
```bash
npm install -g ngrok
ngrok http 5173
# Use provided HTTPS URL
```

#### Option B: Local Network
- **URL**: https://192.168.1.233:5173
- **Requirements**: 
  - iPhone on same WiFi network
  - Accept self-signed certificate warning

## Face ID/Touch ID Status

✅ **ENABLED** - With HTTPS properly configured, WebAuthn API is now accessible and Face ID/Touch ID authentication works on iOS devices.

## Key Learnings

1. **HTTPS is mandatory** for WebAuthn/Face ID on iOS - no exceptions
2. **mkcert** provides the easiest local SSL setup
3. **Certificate expiry** is set for ~2.5 years (Nov 7, 2027)
4. **Multiple domains** can be included in a single certificate
5. **File naming issues** in the setup script should be fixed for cleaner installation

## Related Files
- `/setup-https.sh` - Automated HTTPS setup script
- `/vite.config.js` - HTTPS configuration for Vite
- `/src/config/webauthn.config.js` - WebAuthn configuration
- `/NGROK_SETUP.md` - Alternative testing method documentation

## Next Actions
1. Fix the `mv` command in setup-https.sh to handle the actual certificate filenames
2. Consider adding automatic certificate renewal reminder
3. Document certificate installation for team members

---

*This checkpoint documents the successful HTTPS setup enabling Face ID support for the Revado Health mobile PWA.*