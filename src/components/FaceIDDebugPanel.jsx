import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useBiometricAuth from '../hooks/useBiometricAuth';
import { 
  BugAntIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';

function FaceIDDebugPanel() {
  const { isSupported, isAvailable, isRegistered, getRegisteredDevices } = useBiometricAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Gather debug information
    const gatherDebugInfo = async () => {
      const info = {
        // Environment
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        port: window.location.port || 'default',
        href: window.location.href,
        
        // Device
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
        isAndroid: /Android/i.test(navigator.userAgent),
        isSafari: /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent),
        isChrome: /Chrome/i.test(navigator.userAgent),
        
        // WebAuthn Status
        hasPublicKeyCredential: !!window.PublicKeyCredential,
        hasCredentialsAPI: !!navigator.credentials,
        webAuthnSupported: isSupported,
        platformAuthAvailable: isAvailable,
        hasRegisteredCredentials: isRegistered,
        
        // Storage
        localStorage: {
          biometricCredentialId: !!localStorage.getItem('biometricCredentialId'),
          webauthn_credentials: !!localStorage.getItem('webauthn_credentials'),
          webauthn_user_email: localStorage.getItem('webauthn_user_email'),
          userEmail: localStorage.getItem('userEmail'),
        },
        
        // Credentials
        registeredDevices: getRegisteredDevices ? getRegisteredDevices() : [],
        
        // Security Context
        isSecureContext: window.isSecureContext,
        
        // Timestamp
        timestamp: new Date().toISOString()
      };

      // Check WebAuthn methods
      if (window.PublicKeyCredential) {
        info.webAuthnMethods = {
          isUserVerifyingPlatformAuthenticatorAvailable: 
            typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function',
          isConditionalMediationAvailable:
            typeof PublicKeyCredential.isConditionalMediationAvailable === 'function',
        };
      }

      setDebugInfo(info);
    };

    gatherDebugInfo();
    
    // Refresh every 5 seconds
    const interval = setInterval(gatherDebugInfo, 5000);
    return () => clearInterval(interval);
  }, [isSupported, isAvailable, isRegistered, getRegisteredDevices]);

  const copyDebugInfo = () => {
    const debugText = JSON.stringify(debugInfo, null, 2);
    navigator.clipboard.writeText(debugText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Only show on mobile or if there's an issue
  const shouldShow = debugInfo.isIOS || debugInfo.isAndroid || 
                     !isAvailable || window.location.search.includes('debug');

  if (!shouldShow) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 left-4 right-4 z-40 max-w-lg mx-auto"
    >
      <div className="bg-gray-900 text-white rounded-xl shadow-xl overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BugAntIcon className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-semibold">Face ID Debug Info</span>
            {!isAvailable && (
              <span className="px-2 py-0.5 bg-red-500 text-xs rounded-full">Not Available</span>
            )}
          </div>
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronUpIcon className="w-4 h-4" />
          )}
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 text-xs">
            {/* Quick Status */}
            <div className="grid grid-cols-2 gap-2 py-2 border-t border-gray-700">
              <div>
                <span className="text-gray-400">HTTPS:</span>
                <span className={`ml-1 ${debugInfo.protocol === 'https:' ? 'text-green-400' : 'text-red-400'}`}>
                  {debugInfo.protocol === 'https:' ? '✓' : '✗'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">WebAuthn:</span>
                <span className={`ml-1 ${debugInfo.hasPublicKeyCredential ? 'text-green-400' : 'text-red-400'}`}>
                  {debugInfo.hasPublicKeyCredential ? '✓' : '✗'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Platform Auth:</span>
                <span className={`ml-1 ${isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                  {isAvailable ? '✓' : '✗'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Secure Context:</span>
                <span className={`ml-1 ${debugInfo.isSecureContext ? 'text-green-400' : 'text-red-400'}`}>
                  {debugInfo.isSecureContext ? '✓' : '✗'}
                </span>
              </div>
            </div>

            {/* Environment */}
            <div className="space-y-1">
              <div className="text-yellow-400 font-semibold">Environment</div>
              <div className="text-gray-300">
                <div>URL: {debugInfo.hostname}:{debugInfo.port}</div>
                <div>Protocol: {debugInfo.protocol}</div>
                <div>Device: {debugInfo.isIOS ? 'iOS' : debugInfo.isAndroid ? 'Android' : 'Other'}</div>
                <div>Browser: {debugInfo.isSafari ? 'Safari' : debugInfo.isChrome ? 'Chrome' : 'Other'}</div>
              </div>
            </div>

            {/* Credentials */}
            <div className="space-y-1">
              <div className="text-yellow-400 font-semibold">Credentials</div>
              <div className="text-gray-300">
                <div>Registered: {isRegistered ? 'Yes' : 'No'}</div>
                <div>Count: {debugInfo.registeredDevices?.length || 0}</div>
                <div>Email: {debugInfo.localStorage?.userEmail || 'None'}</div>
              </div>
            </div>

            {/* WebAuthn Methods */}
            {debugInfo.webAuthnMethods && (
              <div className="space-y-1">
                <div className="text-yellow-400 font-semibold">WebAuthn Methods</div>
                <div className="text-gray-300">
                  <div>isUVPAA: {debugInfo.webAuthnMethods.isUserVerifyingPlatformAuthenticatorAvailable ? '✓' : '✗'}</div>
                  <div>Conditional: {debugInfo.webAuthnMethods.isConditionalMediationAvailable ? '✓' : '✗'}</div>
                </div>
              </div>
            )}

            {/* Copy Button */}
            <button
              onClick={copyDebugInfo}
              className="w-full mt-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <ClipboardIcon className="w-4 h-4" />
              <span>{copied ? 'Copied!' : 'Copy Debug Info'}</span>
            </button>

            {/* Instructions */}
            <div className="text-gray-400 text-xs pt-2 border-t border-gray-700">
              <p>📱 Check browser console for detailed logs</p>
              <p>🔍 Search for [BiometricAuth] or [WebAuthn]</p>
              <p>📋 Copy and share debug info for support</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default FaceIDDebugPanel;