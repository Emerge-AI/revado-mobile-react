/**
 * WebAuthn Helper Utilities
 * Handles ArrayBuffer conversions and WebAuthn data processing
 */

import config from '../config/webauthn.config';

/**
 * Convert ArrayBuffer to Base64 string
 * Optimized for large buffers and better error handling
 */
export function bufferToBase64(buffer) {
  try {
    if (!buffer) {
      console.error('[WebAuthn] bufferToBase64: buffer is null or undefined');
      return '';
    }

    const bytes = new Uint8Array(buffer);
    // Use chunking for large buffers to avoid stack overflow
    const chunkSize = 0x8000; // 32KB chunks
    let binary = '';

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, chunk);
    }

    return btoa(binary);
  } catch (error) {
    console.error('[WebAuthn] bufferToBase64 error:', error);
    return '';
  }
}

/**
 * Convert Base64 string to ArrayBuffer
 * With validation and error handling
 */
export function base64ToBuffer(base64) {
  try {
    if (!base64 || typeof base64 !== 'string') {
      console.error('[WebAuthn] base64ToBuffer: invalid input', base64);
      return new ArrayBuffer(0);
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error('[WebAuthn] base64ToBuffer error:', error);
    return new ArrayBuffer(0);
  }
}

/**
 * Convert Base64URL to Base64
 */
export function base64URLToBase64(base64url) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with = if necessary
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
}

/**
 * Convert Base64 to Base64URL
 */
export function base64ToBase64URL(base64) {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Encode credential for storage
 */
export function encodeCredential(credential) {
  return {
    id: credential.id,
    rawId: bufferToBase64(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64(credential.response.clientDataJSON),
      attestationObject: credential.response.attestationObject ?
        bufferToBase64(credential.response.attestationObject) : undefined,
      authenticatorData: credential.response.authenticatorData ?
        bufferToBase64(credential.response.authenticatorData) : undefined,
      signature: credential.response.signature ?
        bufferToBase64(credential.response.signature) : undefined,
      userHandle: credential.response.userHandle ?
        bufferToBase64(credential.response.userHandle) : undefined,
    }
  };
}

/**
 * Prepare PublicKeyCredentialCreationOptions for navigator.credentials.create()
 */
export function preparePublicKeyOptions(options) {
  return {
    ...options,
    challenge: typeof options.challenge === 'string' ?
      base64ToBuffer(options.challenge) : options.challenge,
    user: {
      ...options.user,
      id: typeof options.user.id === 'string' ?
        new TextEncoder().encode(options.user.id) : options.user.id
    },
    excludeCredentials: options.excludeCredentials?.map(cred => ({
      ...cred,
      id: typeof cred.id === 'string' ? base64ToBuffer(cred.id) : cred.id
    })),
  };
}

/**
 * Prepare PublicKeyCredentialRequestOptions for navigator.credentials.get()
 */
export function preparePublicKeyRequestOptions(options) {
  return {
    ...options,
    challenge: typeof options.challenge === 'string' ?
      base64ToBuffer(options.challenge) : options.challenge,
    allowCredentials: options.allowCredentials?.map(cred => ({
      ...cred,
      id: typeof cred.id === 'string' ? base64ToBuffer(cred.id) : cred.id
    })),
  };
}

/**
 * Generate random challenge
 */
export function generateChallenge() {
  const challenge = new Uint8Array(config.challenge.length);
  crypto.getRandomValues(challenge);
  return challenge;
}

// Note: getRelyingPartyId is now imported from config/webauthn.config.js
// to avoid duplication and ensure consistency

/**
 * Check if platform authenticator is available
 */
export async function isPlatformAuthenticatorAvailable() {
  console.log('[WebAuthn] Checking platform authenticator availability...');

  if (!window.PublicKeyCredential) {
    console.error('[WebAuthn] ❌ PublicKeyCredential not available in window');
    return false;
  }

  console.log('[WebAuthn] ✓ PublicKeyCredential exists');

  try {
    // Check if the method exists
    if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      console.error('[WebAuthn] ❌ isUserVerifyingPlatformAuthenticatorAvailable method not found');
      return false;
    }

    console.log('[WebAuthn] Calling isUserVerifyingPlatformAuthenticatorAvailable()...');
    const result = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    console.log('[WebAuthn] Platform authenticator available:', result);

    // Additional iOS-specific logging
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS) {
      console.log('[WebAuthn] 📱 iOS device detected');
      console.log('[WebAuthn] User Agent:', navigator.userAgent);
      console.log('[WebAuthn] Protocol:', window.location.protocol);
      console.log('[WebAuthn] Hostname:', window.location.hostname);
      console.log('[WebAuthn] Port:', window.location.port);
    }

    return result;
  } catch (error) {
    console.error('[WebAuthn] ❌ Error checking platform authenticator:', error);
    console.error('[WebAuthn] Error name:', error.name);
    console.error('[WebAuthn] Error message:', error.message);
    return false;
  }
}

/**
 * Store credential information
 */
export function storeCredentialInfo(credentialId, userEmail, metadata = {}) {
  try {
    console.log('[WebAuthnHelpers] Storing credential:', { credentialId, userEmail, metadata });

    const credentials = JSON.parse(localStorage.getItem(config.storage.credentials) || '{}');

    credentials[credentialId] = {
      id: credentialId,
      userEmail,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      ...metadata
    };

    const credentialsStr = JSON.stringify(credentials);
    console.log('[WebAuthnHelpers] Saving to localStorage:', {
      key: config.storage.credentials,
      value: credentialsStr
    });

    localStorage.setItem(config.storage.credentials, credentialsStr);
    localStorage.setItem(config.storage.userEmail, userEmail);

    // Verify storage
    const stored = localStorage.getItem(config.storage.credentials);
    console.log('[WebAuthnHelpers] Storage verification:', {
      stored: !!stored,
      matches: stored === credentialsStr
    });
  } catch (error) {
    console.error('[WebAuthnHelpers] Failed to store credential:', error);
    throw error;
  }
}

/**
 * Get stored credentials
 */
export function getStoredCredentials() {
  return JSON.parse(localStorage.getItem(config.storage.credentials) || '{}');
}

/**
 * Check if user has registered credentials
 */
export function hasRegisteredCredentials() {
  const credentials = getStoredCredentials();
  return Object.keys(credentials).length > 0;
}

/**
 * Clear all stored credentials
 */
export function clearStoredCredentials() {
  localStorage.removeItem(config.storage.credentials);
  localStorage.removeItem(config.storage.userEmail);
  localStorage.removeItem(config.storage.lastCredentialId);
  localStorage.removeItem(config.storage.biometricEnabled);
}

/**
 * Clean up partial or corrupted Face ID registrations
 */
export function cleanupPartialRegistration() {
  console.log('[WebAuthnHelpers] Cleaning up partial registration...');

  // Get current state
  const credentials = localStorage.getItem(config.storage.credentials);
  const lastCredentialId = localStorage.getItem(config.storage.lastCredentialId);
  const biometricEnabled = localStorage.getItem(config.storage.biometricEnabled);

  let needsCleanup = false;

  // Check for partial registration (has credential ID but no actual credentials)
  if (lastCredentialId && !credentials) {
    console.log('[WebAuthnHelpers] Found orphaned credential ID without credentials');
    needsCleanup = true;
  }

  // Check for test credentials only
  if (credentials) {
    try {
      const creds = JSON.parse(credentials);
      const hasOnlyTestCreds = Object.keys(creds).every(id => id.startsWith('test-credential-'));
      if (hasOnlyTestCreds && Object.keys(creds).length > 0) {
        console.log('[WebAuthnHelpers] Found only test credentials, cleaning up');
        needsCleanup = true;
      }
    } catch (e) {
      console.error('[WebAuthnHelpers] Invalid credentials JSON, cleaning up');
      needsCleanup = true;
    }
  }

  // Check for mismatched state
  if (biometricEnabled === 'true' && !credentials) {
    console.log('[WebAuthnHelpers] Biometric enabled but no credentials found');
    needsCleanup = true;
  }

  if (needsCleanup) {
    console.log('[WebAuthnHelpers] Performing cleanup...');
    clearStoredCredentials();
    return true;
  }

  return false;
}
