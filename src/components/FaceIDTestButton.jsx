import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

function FaceIDTestButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [autoCopied, setAutoCopied] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setShowResults(true);
    const results = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: HTTPS Check
    const httpsTest = {
      name: 'HTTPS Protocol',
      description: 'WebAuthn requires HTTPS',
      passed: window.location.protocol === 'https:',
      details: {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        href: window.location.href
      }
    };
    results.tests.push(httpsTest);
    setTestResults({ ...results });
    await sleep(300);

    // Test 2: Secure Context
    const secureContextTest = {
      name: 'Secure Context',
      description: 'Browser security requirements',
      passed: window.isSecureContext === true,
      details: {
        isSecureContext: window.isSecureContext,
        origin: window.location.origin
      }
    };
    results.tests.push(secureContextTest);
    setTestResults({ ...results });
    await sleep(300);

    // Test 3: WebAuthn API Availability
    const webauthnTest = {
      name: 'WebAuthn API',
      description: 'PublicKeyCredential availability',
      passed: !!window.PublicKeyCredential,
      details: {
        hasPublicKeyCredential: !!window.PublicKeyCredential,
        hasNavigatorCredentials: !!navigator.credentials,
        credentialMethods: window.PublicKeyCredential ? 
          Object.getOwnPropertyNames(window.PublicKeyCredential) : []
      }
    };
    results.tests.push(webauthnTest);
    setTestResults({ ...results });
    await sleep(300);

    // Test 4: Platform Authenticator Method
    const methodTest = {
      name: 'Platform Auth Method',
      description: 'isUserVerifyingPlatformAuthenticatorAvailable',
      passed: false,
      details: {}
    };
    
    if (window.PublicKeyCredential) {
      methodTest.passed = typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
      methodTest.details.methodExists = methodTest.passed;
      methodTest.details.methodType = typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable;
    }
    results.tests.push(methodTest);
    setTestResults({ ...results });
    await sleep(300);

    // Test 5: Platform Authenticator Available
    const platformTest = {
      name: 'Platform Authenticator',
      description: 'Face ID/Touch ID availability',
      passed: false,
      details: {}
    };

    if (methodTest.passed) {
      try {
        console.log('[Test] Calling isUserVerifyingPlatformAuthenticatorAvailable()...');
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        platformTest.passed = available === true;
        platformTest.details = {
          available,
          timestamp: new Date().toISOString()
        };
        console.log('[Test] Platform authenticator result:', available);
      } catch (error) {
        platformTest.passed = false;
        platformTest.error = {
          name: error.name,
          message: error.message
        };
        console.error('[Test] Platform authenticator error:', error);
      }
    }
    results.tests.push(platformTest);
    setTestResults({ ...results });
    await sleep(300);

    // Test 6: Stored Credentials
    const credentialsTest = {
      name: 'Stored Credentials',
      description: 'Check for existing Face ID setup',
      passed: false,
      details: {
        biometricCredentialId: localStorage.getItem('biometricCredentialId'),
        webauthnCredentials: localStorage.getItem('webauthn_credentials'),
        userEmail: localStorage.getItem('userEmail') || localStorage.getItem('webauthn_user_email')
      }
    };
    
    credentialsTest.passed = !!(credentialsTest.details.biometricCredentialId || 
                                credentialsTest.details.webauthnCredentials);
    results.tests.push(credentialsTest);
    setTestResults({ ...results });
    await sleep(300);

    // Test 7: Device & Browser Info
    const deviceTest = {
      name: 'Device Information',
      description: 'Browser and device compatibility',
      passed: true, // Informational only
      details: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
        isAndroid: /Android/i.test(navigator.userAgent),
        isSafari: /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent),
        isChrome: /Chrome/i.test(navigator.userAgent),
        isMobile: /Mobile/i.test(navigator.userAgent)
      }
    };
    results.tests.push(deviceTest);
    setTestResults({ ...results });
    await sleep(300);

    // Test 8: Relying Party Configuration
    const rpTest = {
      name: 'Relying Party Config',
      description: 'WebAuthn RP settings',
      passed: true,
      details: {
        rpId: window.location.hostname,
        expectedRpId: import.meta.env.VITE_WEBAUTHN_RP_ID || window.location.hostname,
        rpName: import.meta.env.VITE_WEBAUTHN_RP_NAME || 'Revado Health'
      }
    };
    results.tests.push(rpTest);
    setTestResults({ ...results });

    // Calculate summary
    results.summary = {
      total: results.tests.length,
      passed: results.tests.filter(t => t.passed).length,
      failed: results.tests.filter(t => !t.passed).length,
      passRate: Math.round((results.tests.filter(t => t.passed).length / results.tests.length) * 100)
    };

    // Log full results
    console.log('[Face ID Test Results]', results);
    
    // Auto-copy results to clipboard
    try {
      const resultsText = JSON.stringify(results, null, 2);
      await navigator.clipboard.writeText(resultsText);
      console.log('[Test] Results automatically copied to clipboard');
      setAutoCopied(true);
      
      // Show visual feedback
      setTimeout(() => {
        alert('✅ Test complete!\n\n📋 Results automatically copied to clipboard.\n\nPaste and share the results for Face ID support.');
      }, 100);
      
      // Reset auto-copied indicator after 5 seconds
      setTimeout(() => {
        setAutoCopied(false);
      }, 5000);
    } catch (error) {
      console.error('[Test] Failed to auto-copy results:', error);
      // Fallback: try to copy without formatting
      try {
        await navigator.clipboard.writeText(JSON.stringify(results));
        setAutoCopied(true);
        setTimeout(() => {
          alert('📋 Results copied to clipboard (compact format)');
        }, 100);
      } catch (fallbackError) {
        console.error('[Test] Fallback copy also failed:', fallbackError);
        alert('⚠️ Could not auto-copy results.\n\nPlease use the "Copy Full Results" button below.');
      }
    }
    
    setIsRunning(false);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const copyResults = () => {
    const resultsText = JSON.stringify(testResults, null, 2);
    navigator.clipboard.writeText(resultsText);
    alert('Test results copied to clipboard!');
  };

  return (
    <div className="w-full space-y-4">
      {/* Test Button */}
      <motion.button
        onClick={runTests}
        disabled={isRunning}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors"
      >
        {isRunning ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
            Running Face ID Tests...
          </>
        ) : (
          <>
            <BeakerIcon className="w-5 h-5" />
            Run Face ID Diagnostic Tests
          </>
        )}
      </motion.button>

      {/* Test Results */}
      {showResults && testResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-100 rounded-xl p-4 space-y-3"
        >
          {/* Auto-copied notification */}
          {autoCopied && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-100 text-green-800 p-3 rounded-lg text-sm font-medium text-center mb-3"
            >
              📋 Results automatically copied to clipboard!
            </motion.div>
          )}

          {/* Summary */}
          {testResults.summary && (
            <div className="pb-3 border-b border-gray-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">
                  Test Results
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  testResults.summary.passRate === 100 
                    ? 'bg-green-100 text-green-800'
                    : testResults.summary.passRate >= 50
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {testResults.summary.passRate}% Passed
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {testResults.summary.passed} passed, {testResults.summary.failed} failed
              </div>
            </div>
          )}

          {/* Individual Tests */}
          <div className="space-y-2">
            {testResults.tests.map((test, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-2 rounded-lg bg-white"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {test.passed ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">
                    {test.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {test.description}
                  </div>
                  {test.error && (
                    <div className="text-xs text-red-600 mt-1">
                      Error: {test.error.message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-300 flex gap-2">
            <button
              onClick={copyResults}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
            >
              Copy Full Results
            </button>
            <button
              onClick={runTests}
              className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg font-medium transition-colors"
            >
              Run Again
            </button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 pt-2">
            <p>📱 Share these results when reporting Face ID issues</p>
            <p>🔍 Check console for detailed logs</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default FaceIDTestButton;