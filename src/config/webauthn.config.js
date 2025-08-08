/**
 * WebAuthn Configuration
 * Centralized configuration for WebAuthn/Face ID authentication
 */

const config = {
  // Relying Party (RP) Configuration
  rp: {
    // Your app/company name that will be shown to users
    name: import.meta.env.VITE_WEBAUTHN_RP_NAME || "Revado Health",
    
    // Your domain (use actual domain in production)
    // For localhost development, this will be automatically set to 'localhost'
    id: import.meta.env.VITE_WEBAUTHN_RP_ID || undefined,
    
    // Optional: URL to your app icon (shown in some authenticator UIs)
    icon: import.meta.env.VITE_WEBAUTHN_RP_ICON || undefined
  },

  // Authentication Options - Optimized for iOS Face ID
  authentication: {
    // Timeout for authentication operations (in milliseconds)
    timeout: parseInt(import.meta.env.VITE_WEBAUTHN_TIMEOUT) || 60000,
    
    // User verification requirement
    // "preferred" works better across iOS versions than "required"
    userVerification: import.meta.env.VITE_WEBAUTHN_USER_VERIFICATION || "preferred",
    
    // Attestation preference
    // "none" is more compatible with iOS Safari than "direct"
    attestation: import.meta.env.VITE_WEBAUTHN_ATTESTATION || "none",
    
    // Authenticator attachment
    // "platform" for Face ID/Touch ID only
    authenticatorAttachment: import.meta.env.VITE_WEBAUTHN_AUTHENTICATOR || "platform",
    
    // Resident key requirement (for passwordless/passkeys)
    // "preferred" for better iOS 14-15 compatibility
    residentKey: import.meta.env.VITE_WEBAUTHN_RESIDENT_KEY || "preferred"
  },

  // Supported Public Key Algorithms
  // Common algorithms in order of preference
  pubKeyCredParams: [
    { alg: -7, type: "public-key" },   // ES256 (preferred for Apple devices)
    { alg: -257, type: "public-key" },  // RS256 (fallback)
    { alg: -8, type: "public-key" }     // EdDSA (modern, efficient)
  ],

  // Transport hints for credential discovery
  // For Face ID/Touch ID, only "internal" is needed
  transports: ["internal"],

  // Challenge configuration
  challenge: {
    // Length of the challenge in bytes
    length: parseInt(import.meta.env.VITE_WEBAUTHN_CHALLENGE_LENGTH) || 32
  },

  // Storage keys for localStorage
  storage: {
    credentials: "webauthn_credentials",
    userEmail: "webauthn_user_email",
    lastCredentialId: "biometricCredentialId",
    biometricEnabled: "biometricEnabled"
  },

  // Feature flags
  features: {
    // Allow multiple devices per user
    multiDevice: import.meta.env.VITE_WEBAUTHN_MULTI_DEVICE !== "false",
    
    // Show device management in settings
    deviceManagement: import.meta.env.VITE_WEBAUTHN_DEVICE_MANAGEMENT !== "false",
    
    // Auto-prompt for biometric on sign in
    autoPromptBiometric: import.meta.env.VITE_WEBAUTHN_AUTO_PROMPT !== "false",
    
    // Allow credential backup (iCloud Keychain sync)
    allowBackup: import.meta.env.VITE_WEBAUTHN_ALLOW_BACKUP !== "false"
  }
};

// Helper function to get RP ID based on environment
export function getRelyingPartyId() {
  // If explicitly configured, use that
  if (config.rp.id) {
    console.log('[WebAuthn Config] Using configured RP ID:', config.rp.id);
    return config.rp.id;
  }
  
  // Otherwise, use hostname
  const hostname = window.location.hostname;
  console.log('[WebAuthn Config] Using hostname as RP ID:', hostname);
  
  // For localhost, use 'localhost' 
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost';
  }
  
  // For IP addresses and production, use the actual hostname
  // This includes local network IPs like 192.168.x.x
  return hostname;
}

// Helper function to get full RP configuration
export function getRelyingPartyConfig() {
  return {
    name: config.rp.name,
    id: getRelyingPartyId(),
    ...(config.rp.icon && { icon: config.rp.icon })
  };
}

// Export the configuration
export default config;