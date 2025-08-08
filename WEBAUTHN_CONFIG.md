# WebAuthn / Face ID Configuration Guide

This guide explains how to configure WebAuthn (Face ID/Touch ID) authentication for your Revado Health deployment.

## Quick Start

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your production values
3. Deploy your application

## Configuration Options

### Relying Party (RP) Settings

The Relying Party represents your application in the WebAuthn flow.

#### `VITE_WEBAUTHN_RP_NAME`
- **Default**: "Revado Health"
- **Description**: Your app/company name shown to users during Face ID/Touch ID prompts
- **Example**: `VITE_WEBAUTHN_RP_NAME="My Health App"`

#### `VITE_WEBAUTHN_RP_ID`
- **Default**: Current hostname (automatic)
- **Description**: Your domain name for production
- **Important**: 
  - Leave empty for localhost development
  - Must match your production domain exactly
  - Cannot include protocol or port
- **Example**: `VITE_WEBAUTHN_RP_ID="myapp.com"`

#### `VITE_WEBAUTHN_RP_ICON` (Optional)
- **Default**: None
- **Description**: URL to your app icon (shown in some authenticator UIs)
- **Example**: `VITE_WEBAUTHN_RP_ICON="https://myapp.com/icon.png"`

### Authentication Options

#### `VITE_WEBAUTHN_USER_VERIFICATION`
- **Default**: "required"
- **Options**: 
  - `"required"` - Always require Face ID/Touch ID
  - `"preferred"` - Use if available, fallback to device PIN
  - `"discouraged"` - Skip biometric check
- **Recommendation**: Use "required" for health data

#### `VITE_WEBAUTHN_AUTHENTICATOR`
- **Default**: "platform"
- **Options**:
  - `"platform"` - Face ID/Touch ID only
  - `"cross-platform"` - USB security keys only
  - Leave empty - Allow both
- **Recommendation**: Use "platform" for mobile apps

#### `VITE_WEBAUTHN_RESIDENT_KEY`
- **Default**: "required"
- **Description**: Enable passwordless sign-in (passkeys)
- **Options**:
  - `"required"` - Create passkeys (iOS 16+)
  - `"preferred"` - Create if supported
  - `"discouraged"` - Don't create passkeys

### Security Settings

#### `VITE_WEBAUTHN_ATTESTATION`
- **Default**: "direct"
- **Options**:
  - `"none"` - No attestation (fastest)
  - `"indirect"` - Privacy-preserving attestation
  - `"direct"` - Full attestation from authenticator
  - `"enterprise"` - Enterprise attestation (requires configuration)
- **Recommendation**: Use "direct" for health applications

#### `VITE_WEBAUTHN_TIMEOUT`
- **Default**: 60000 (60 seconds)
- **Description**: Timeout for authentication operations in milliseconds
- **Example**: `VITE_WEBAUTHN_TIMEOUT=120000` (2 minutes)

### Feature Flags

#### `VITE_WEBAUTHN_MULTI_DEVICE`
- **Default**: true
- **Description**: Allow users to register multiple devices
- **Example**: `VITE_WEBAUTHN_MULTI_DEVICE=false`

#### `VITE_WEBAUTHN_AUTO_PROMPT`
- **Default**: true
- **Description**: Automatically prompt for Face ID on sign-in page
- **Example**: `VITE_WEBAUTHN_AUTO_PROMPT=false`

#### `VITE_WEBAUTHN_ALLOW_BACKUP`
- **Default**: true
- **Description**: Allow credential backup to iCloud Keychain
- **Example**: `VITE_WEBAUTHN_ALLOW_BACKUP=false`

## Platform-Specific Notes

### iOS (iPhone/iPad)
- Requires iOS 14+ for Face ID/Touch ID in web apps
- iOS 16+ recommended for passkey support
- Credentials sync via iCloud Keychain if backup is enabled

### macOS
- Requires macOS Big Sur (11.0+) for Touch ID in browsers
- macOS Ventura (13.0+) recommended for passkey support
- Works in Safari, Chrome, Edge, and Firefox

### Android
- Requires Android 7+ with fingerprint sensor
- Android 9+ recommended for better biometric support
- Credentials sync via Google Password Manager

## Production Deployment Checklist

1. **Set your production domain**:
   ```env
   VITE_WEBAUTHN_RP_ID="yourdomain.com"
   ```

2. **Configure HTTPS**:
   - WebAuthn requires HTTPS in production
   - localhost is exempt from this requirement

3. **Update RP name**:
   ```env
   VITE_WEBAUTHN_RP_NAME="Your App Name"
   ```

4. **Consider timeout for your use case**:
   ```env
   VITE_WEBAUTHN_TIMEOUT=120000  # 2 minutes for slower devices
   ```

5. **Test on target devices**:
   - iOS devices with Face ID
   - iOS devices with Touch ID
   - MacBooks with Touch ID
   - Android devices with fingerprint

## Troubleshooting

### "Face ID not available"
- Check device compatibility
- Ensure HTTPS in production
- Verify browser support

### "Registration failed"
- Check RP ID matches domain
- Ensure user verification settings
- Check timeout isn't too short

### "Cannot find credentials"
- Verify RP ID consistency
- Check localStorage isn't cleared
- Ensure same domain/subdomain

## Advanced Configuration

### Custom Storage Keys

Edit `src/config/webauthn.config.js` to customize localStorage keys:

```javascript
storage: {
  credentials: "my_app_webauthn_creds",
  userEmail: "my_app_user_email",
  // ... other keys
}
```

### Algorithm Preferences

Edit `src/config/webauthn.config.js` to change supported algorithms:

```javascript
pubKeyCredParams: [
  { alg: -7, type: "public-key" },   // ES256
  { alg: -257, type: "public-key" },  // RS256
  { alg: -8, type: "public-key" }     // EdDSA
]
```

### Server Integration

For production, implement these endpoints:

1. **Registration**:
   - `POST /api/webauthn/register/begin` - Generate challenge
   - `POST /api/webauthn/register/complete` - Verify and store credential

2. **Authentication**:
   - `POST /api/webauthn/authenticate/begin` - Generate challenge
   - `POST /api/webauthn/authenticate/complete` - Verify assertion

## Security Best Practices

1. **Always use HTTPS** in production
2. **Validate RP ID** matches your domain
3. **Store credentials securely** on the server
4. **Implement rate limiting** for authentication attempts
5. **Log authentication events** for audit trails
6. **Use strong challenge generation** (cryptographically random)
7. **Verify attestation** for high-security deployments

## Support

For WebAuthn issues or questions:
- Check browser console for detailed errors
- Review [WebAuthn spec](https://www.w3.org/TR/webauthn/)
- Test with [webauthn.io](https://webauthn.io)