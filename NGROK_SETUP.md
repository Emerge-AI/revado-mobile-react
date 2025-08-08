# ngrok Setup for iPhone Face ID Testing

This guide helps you test Face ID on your iPhone by creating a secure HTTPS tunnel to your local development server.

## Why ngrok?

Face ID and Touch ID require HTTPS to work. When testing on an iPhone, you can't use `localhost` or your computer's IP address with HTTP. ngrok provides a secure HTTPS tunnel that makes your local development server accessible from your iPhone.

## Quick Setup

### 1. Install ngrok

```bash
# Using npm (recommended)
npm install -g ngrok

# Or using Homebrew (macOS)
brew install ngrok

# Or download from https://ngrok.com/download
```

### 2. Start Your Development Server

```bash
npm run dev
```

Your app will run on `http://localhost:5173`

### 3. Create HTTPS Tunnel

In a new terminal window:

```bash
ngrok http 5173
```

You'll see output like:
```
Session Status    online
Account          your-email@example.com (Plan: Free)
Version          3.5.0
Region           United States (us)
Forwarding       https://abc123xyz.ngrok-free.app -> http://localhost:5173
```

### 4. Configure Your App

Copy the HTTPS URL (e.g., `https://abc123xyz.ngrok-free.app`) and:

1. Create or update `.env`:
```env
VITE_WEBAUTHN_RP_ID=abc123xyz.ngrok-free.app
```

2. Restart your dev server:
```bash
npm run dev
```

### 5. Test on iPhone

1. Open Safari on your iPhone
2. Navigate to your ngrok URL: `https://abc123xyz.ngrok-free.app`
3. You may see an ngrok warning page - tap "Visit Site"
4. Face ID should now work! 🎉

## Important Notes

### Free Tier Limitations
- URLs change each time you restart ngrok
- Limited to 40 connections per minute
- Session expires after 2 hours

### Update RP ID Each Time
When you get a new ngrok URL, update your `.env`:
```env
VITE_WEBAUTHN_RP_ID=new-url.ngrok-free.app
```

### Security Warning
ngrok URLs are public. Anyone with the URL can access your local server. Only use for testing, not for sensitive data.

## Troubleshooting

### "Face ID not available"
- Ensure you're using the HTTPS URL (not HTTP)
- Check that RP ID in `.env` matches your ngrok domain
- Verify iPhone has Face ID enabled in Settings

### "Invalid RP ID"
- The RP ID must exactly match the domain (no https://, no paths)
- Correct: `abc123xyz.ngrok-free.app`
- Wrong: `https://abc123xyz.ngrok-free.app` or `abc123xyz.ngrok-free.app/auth`

### Connection Issues
- Ensure both devices are connected to the internet
- Check that your dev server is running on port 5173
- Try restarting ngrok if the tunnel seems broken

## Alternative: Permanent Domain (Paid)

For regular testing, consider:
1. ngrok paid plan for custom domains
2. Cloudflare Tunnels (free with custom domain)
3. LocalTunnel or other alternatives

## Local HTTPS Alternative

If you prefer not to use ngrok, you can set up local HTTPS:
```bash
./setup-https.sh
```

Then access your iPhone using your computer's local IP over HTTPS (requires accepting certificate warning on iPhone).