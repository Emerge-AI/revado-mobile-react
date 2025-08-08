import { useState, useEffect } from 'react';
import {
  bufferToBase64,
  base64ToBuffer,
  encodeCredential,
  generateChallenge,
  isPlatformAuthenticatorAvailable,
  storeCredentialInfo,
  getStoredCredentials,
  hasRegisteredCredentials,
  clearStoredCredentials,
  cleanupPartialRegistration
} from '../utils/webauthnHelpers';
import config, { getRelyingPartyConfig, getRelyingPartyId } from '../config/webauthn.config';

function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    console.log('[BiometricAuth] === Starting biometric support check ===');
    
    try {
      // Check HTTPS first
      const isHTTPS = window.location.protocol === 'https:';
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
      
      console.log('[BiometricAuth] Environment check:', {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        href: window.location.href,
        isHTTPS,
        isLocalhost,
        isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
        isSafari: /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent)
      });
      
      // Check if WebAuthn is supported
      if (window.PublicKeyCredential) {
        console.log('[BiometricAuth] ✓ PublicKeyCredential API found');
        setIsSupported(true);
        
        // Check if platform authenticator (Face ID) is available
        console.log('[BiometricAuth] Checking platform authenticator...');
        const available = await isPlatformAuthenticatorAvailable();
        console.log('[BiometricAuth] Platform authenticator result:', available);
        setIsAvailable(available);
        
        // Check if user has registered credentials
        const registered = hasRegisteredCredentials();
        const credentials = getStoredCredentials();
        console.log('[BiometricAuth] Credential check:', {
          hasRegistered: registered,
          credentialCount: Object.keys(credentials).length,
          credentialIds: Object.keys(credentials)
        });
        setIsRegistered(registered);
        
        // Enhanced debug logging
        console.log('[BiometricAuth] 🔐 Final status:', {
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          isHTTPS,
          isLocalhost,
          webAuthnSupported: true,
          platformAuthAvailable: available,
          hasRegisteredCredentials: registered,
          credentialCount: Object.keys(credentials).length,
          userAgent: navigator.userAgent
        });
        
        // Warn if not HTTPS
        if (!isHTTPS && !isLocalhost) {
          console.warn('⚠️ Face ID requires HTTPS. Current protocol:', window.location.protocol);
          console.warn('   Run ./setup-https.sh or use ngrok for HTTPS access');
        }
      } else {
        console.error('[BiometricAuth] ❌ PublicKeyCredential not found in window');
        console.error('[BiometricAuth] Window properties:', Object.keys(window).filter(k => k.includes('Credential')));
        setIsSupported(false);
        setIsAvailable(false);
      }
    } catch (err) {
      console.error('[BiometricAuth] ❌ Fatal error during check:', err);
      console.error('[BiometricAuth] Error stack:', err.stack);
      setIsSupported(false);
      setIsAvailable(false);
    }
    
    console.log('[BiometricAuth] === Check complete ===');
  };

  const registerBiometric = async (userId, userEmail) => {
    console.log('[BiometricAuth] === Starting Face ID registration ===');
    console.log('[BiometricAuth] User:', { userId, userEmail });
    console.log('[BiometricAuth] isAvailable:', isAvailable);
    
    if (!isAvailable) {
      const errorMsg = 'Face ID is not available on this device';
      console.error('[BiometricAuth] ❌', errorMsg);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Clean up any partial registrations first
    const cleanedUp = cleanupPartialRegistration();
    if (cleanedUp) {
      console.log('[BiometricAuth] Cleaned up partial registration before starting new one');
    }

    try {
      // Generate challenge
      const challenge = generateChallenge();
      const rpId = getRelyingPartyId();
      
      console.log('[BiometricAuth] Registration config:', {
        rpId,
        rpName: config.rp.name,
        challengeLength: challenge.length,
        userId: userId
      });
      
      // Create public key credential creation options
      const publicKeyCredentialCreationOptions = {
        challenge,
        rp: getRelyingPartyConfig(),
        user: {
          id: new TextEncoder().encode(userId),
          name: userEmail,
          displayName: userEmail.split('@')[0],
        },
        pubKeyCredParams: config.pubKeyCredParams,
        authenticatorSelection: {
          authenticatorAttachment: config.authentication.authenticatorAttachment,
          residentKey: config.authentication.residentKey,
          userVerification: config.authentication.userVerification
        },
        timeout: config.authentication.timeout,
        attestation: config.authentication.attestation,
        extensions: {
          credProps: true,
          ...(config.features.allowBackup && { credentialProtectionPolicy: "userVerificationOptional" })
        }
      };

      console.log('[BiometricAuth] Credential creation options:', JSON.stringify(publicKeyCredentialCreationOptions, null, 2));

      // Create credential with detailed logging
      console.log('[BiometricAuth] === CREDENTIAL CREATION START ===');
      console.log('[BiometricAuth] Browser environment:', {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        platform: navigator.platform,
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        port: window.location.port
      });
      
      console.log('[BiometricAuth] Calling navigator.credentials.create()...');
      const startTime = Date.now();
      
      let credential;
      try {
        credential = await navigator.credentials.create({
          publicKey: publicKeyCredentialCreationOptions
        });
        
        const elapsed = Date.now() - startTime;
        console.log(`[BiometricAuth] ✅ Credential created in ${elapsed}ms`);
        
        if (credential) {
          console.log('[BiometricAuth] Credential details:', {
            id: credential.id,
            type: credential.type,
            rawIdLength: credential.rawId?.byteLength,
            hasResponse: !!credential.response,
            hasAttestationObject: !!credential.response?.attestationObject,
            attestationObjectLength: credential.response?.attestationObject?.byteLength,
            hasClientDataJSON: !!credential.response?.clientDataJSON,
            clientDataLength: credential.response?.clientDataJSON?.byteLength,
            authenticatorAttachment: credential.authenticatorAttachment,
            extensions: credential.getClientExtensionResults?.()
          });
        }
      } catch (createError) {
        const elapsed = Date.now() - startTime;
        console.error(`[BiometricAuth] ❌ Failed after ${elapsed}ms:`, createError);
        console.error('[BiometricAuth] Error breakdown:', {
          name: createError.name,
          message: createError.message,
          code: createError.code,
          stack: createError.stack?.split('\n').slice(0, 3).join('\n')
        });
        
        // Provide specific guidance based on error type
        if (createError.name === 'NotAllowedError') {
          console.error('[BiometricAuth] 💡 User cancelled or timeout. Common causes:');
          console.error('  - User cancelled Face ID prompt');
          console.error('  - Timeout reached (60 seconds)');
          console.error('  - Face ID disabled in Settings');
        } else if (createError.name === 'InvalidStateError') {
          console.error('[BiometricAuth] 💡 Credential already exists. Try clearing and re-registering.');
        } else if (createError.name === 'NotSupportedError') {
          console.error('[BiometricAuth] 💡 Configuration not supported. Check authenticator selection.');
        }
        
        throw createError;
      }
      
      console.log('[BiometricAuth] === CREDENTIAL CREATION END ===');
      
      if (!credential) {
        throw new Error('Failed to create credential - returned null');
      }

      // Encode and store credential
      const encodedCredential = encodeCredential(credential);
      const credentialId = bufferToBase64(credential.rawId);
      
      // Store credential information
      console.log('[BiometricAuth] Storing credential with ID:', credentialId);
      console.log('[BiometricAuth] Storage keys:', config.storage);
      
      // First, ensure we can write to localStorage
      try {
        localStorage.setItem('test-write', 'test');
        localStorage.removeItem('test-write');
      } catch (e) {
        console.error('[BiometricAuth] ❌ Cannot write to localStorage:', e);
        throw new Error('Storage access denied. Please check browser settings.');
      }
      
      // Store the actual credential data
      try {
        storeCredentialInfo(credentialId, userEmail, {
          userId,
          deviceName: navigator.userAgent.includes('iPhone') ? 'iPhone' : 
                     navigator.userAgent.includes('iPad') ? 'iPad' : 
                     navigator.userAgent.includes('Mac') ? 'Mac' : 'Unknown',
          credentialType: 'platform',
          residentKey: credential.response.clientExtensionResults?.credProps?.rk || false,
          encodedCredential: encodedCredential // Store the full encoded credential
        });
      } catch (e) {
        console.error('[BiometricAuth] ❌ Failed to store credential info:', e);
        throw new Error('Failed to save Face ID credential');
      }
      
      // Verify storage immediately after storing
      const storedCreds = localStorage.getItem(config.storage.credentials);
      if (!storedCreds) {
        console.error('[BiometricAuth] ❌ Credentials not found after storage!');
        throw new Error('Failed to verify credential storage');
      }
      
      console.log('[BiometricAuth] Verification - stored credentials:', storedCreds);
      
      // Store additional metadata for backward compatibility
      try {
        localStorage.setItem(config.storage.lastCredentialId, credentialId);
        localStorage.setItem(config.storage.biometricEnabled, 'true');
        localStorage.setItem(config.storage.userEmail, userEmail);
        // Also store in legacy location for compatibility
        localStorage.setItem('userEmail', userEmail);
      } catch (e) {
        console.error('[BiometricAuth] ⚠️ Failed to store metadata:', e);
        // Don't fail the whole registration if metadata fails
      }
      
      // Final verification of all storage
      const finalCheck = {
        credentials: localStorage.getItem(config.storage.credentials),
        lastCredentialId: localStorage.getItem(config.storage.lastCredentialId),
        biometricEnabled: localStorage.getItem(config.storage.biometricEnabled),
        userEmail: localStorage.getItem(config.storage.userEmail)
      };
      
      console.log('[BiometricAuth] Final storage verification:', finalCheck);
      
      // Ensure we have at least the critical credential data
      if (!finalCheck.credentials) {
        throw new Error('Critical credential data missing after registration');
      }
      
      setIsRegistered(true);
      
      console.log('[BiometricAuth] ✅ Face ID registered successfully:', {
        credentialId,
        residentKey: credential.response.clientExtensionResults?.credProps?.rk,
        userEmail,
        storedIn: [config.storage.credentials, config.storage.lastCredentialId]
      });
      
      return { 
        success: true, 
        credential: encodedCredential,
        credentialId 
      };
    } catch (err) {
      console.error('[BiometricAuth] ❌ Registration failed:', err);
      console.error('[BiometricAuth] Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      let errorMessage = 'Failed to register Face ID';
      
      if (err.name === 'NotAllowedError') {
        if (err.message.includes('timeout')) {
          errorMessage = 'Face ID registration timed out. Please try again.';
        } else {
          errorMessage = 'Face ID was cancelled. Please try again when ready.';
        }
      } else if (err.name === 'InvalidStateError') {
        errorMessage = 'Face ID is already set up. Try resetting Face ID in settings first.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Your device doesn\'t support Face ID. Please use password login.';
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Security error. Please ensure you\'re using HTTPS.';
      } else if (err.name === 'AbortError') {
        errorMessage = 'Face ID setup was interrupted. Please try again.';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const authenticateWithBiometric = async () => {
    console.log('[BiometricAuth] === Starting Face ID authentication ===');
    console.log('[BiometricAuth] isAvailable:', isAvailable);
    
    if (!isAvailable) {
      const errorMsg = 'Face ID is not available on this device';
      console.error('[BiometricAuth] ❌', errorMsg);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Validate storage state before attempting authentication
    const validationErrors = [];
    
    // Check for credentials
    const storedCredentialsRaw = localStorage.getItem(config.storage.credentials);
    if (!storedCredentialsRaw) {
      validationErrors.push('No credentials found in storage');
    }
    
    // Check for biometric enabled flag
    const biometricEnabled = localStorage.getItem(config.storage.biometricEnabled);
    if (biometricEnabled !== 'true') {
      validationErrors.push('Face ID not enabled');
    }
    
    // Log validation state
    console.log('[BiometricAuth] Validation state:', {
      hasCredentials: !!storedCredentialsRaw,
      biometricEnabled,
      errors: validationErrors
    });
    
    if (validationErrors.length > 0) {
      const errorMsg = `Face ID validation failed: ${validationErrors.join(', ')}`;
      console.error('[BiometricAuth] ❌', errorMsg);
      return { 
        success: false, 
        error: 'Face ID not set up. Please enable Face ID in Settings.',
        needsRegistration: true,
        validationErrors 
      };
    }

    try {
      // Get stored credentials
      const storedCredentials = getStoredCredentials();
      const credentialIds = Object.keys(storedCredentials);
      
      // Filter out test credentials
      const realCredentialIds = credentialIds.filter(id => !id.startsWith('test-credential-'));
      
      console.log('[BiometricAuth] Found credentials:', {
        totalCount: credentialIds.length,
        realCount: realCredentialIds.length,
        ids: realCredentialIds
      });
      
      if (realCredentialIds.length === 0) {
        return { 
          success: false, 
          error: 'No valid Face ID registered. Please set up Face ID in Settings.',
          needsRegistration: true 
        };
      }

      // Generate challenge
      const challenge = generateChallenge();
      const rpId = getRelyingPartyId();
      
      // Create public key credential request options using only real credentials
      const publicKeyCredentialRequestOptions = {
        challenge,
        rpId,
        allowCredentials: realCredentialIds.map(id => ({
          id: base64ToBuffer(id),
          type: 'public-key',
          transports: config.transports
        })),
        userVerification: config.authentication.userVerification,
        timeout: config.authentication.timeout
      };

      console.log('[BiometricAuth] Request options:', JSON.stringify({
        ...publicKeyCredentialRequestOptions,
        allowCredentials: publicKeyCredentialRequestOptions.allowCredentials.map(c => ({
          ...c,
          id: '[ArrayBuffer]'
        }))
      }, null, 2));
      
      console.log('[BiometricAuth] Calling navigator.credentials.get()...');

      // Get assertion
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (!assertion) {
        throw new Error('Failed to get assertion');
      }

      // Encode assertion for processing
      const encodedAssertion = encodeCredential(assertion);
      const credentialId = bufferToBase64(assertion.rawId);
      
      // Update last used timestamp
      const credentials = getStoredCredentials();
      if (credentials[credentialId]) {
        credentials[credentialId].lastUsed = new Date().toISOString();
        localStorage.setItem(config.storage.credentials, JSON.stringify(credentials));
      }
      
      console.log('[BiometricAuth] ✅ Face ID authentication successful');
      console.log('[BiometricAuth] Assertion received:', assertion ? '✓' : '❌');
      
      // Get user email from stored credentials (check multiple locations)
      const userEmail = credentials[credentialId]?.userEmail || 
                       localStorage.getItem(config.storage.userEmail) ||
                       localStorage.getItem('userEmail');
      
      return { 
        success: true, 
        assertion: encodedAssertion,
        credentialId,
        userEmail
      };
    } catch (err) {
      console.error('[BiometricAuth] ❌ Authentication failed:', err);
      console.error('[BiometricAuth] Error details:', {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      
      let errorMessage = 'Face ID authentication failed';
      
      if (err.name === 'NotAllowedError') {
        if (err.message.includes('timeout')) {
          errorMessage = 'Face ID timed out. Please try again.';
        } else {
          errorMessage = 'Face ID was cancelled. Please try again.';
        }
      } else if (err.name === 'InvalidStateError') {
        errorMessage = 'Face ID needs to be set up again. Please go to Settings.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Face ID is not available. Please use password login.';
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Security check failed. Please refresh and try again.';
      } else if (err.message.includes('not found') || err.message.includes('not registered')) {
        errorMessage = 'Face ID not recognized. Please set up Face ID in Settings.';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const isBiometricEnabled = () => {
    return hasRegisteredCredentials();
  };

  const disableBiometric = () => {
    clearStoredCredentials();
    setIsRegistered(false);
  };

  const getRegisteredDevices = () => {
    const credentials = getStoredCredentials();
    return Object.values(credentials).map(cred => ({
      id: cred.id,
      deviceName: cred.deviceName || 'Unknown Device',
      createdAt: cred.createdAt,
      lastUsed: cred.lastUsed
    }));
  };

  return {
    isSupported,
    isAvailable,
    isRegistered,
    error,
    registerBiometric,
    authenticateWithBiometric,
    isBiometricEnabled,
    disableBiometric,
    getRegisteredDevices
  };
}

export default useBiometricAuth;