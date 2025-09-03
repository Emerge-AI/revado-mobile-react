import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import config from '../config/webauthn.config';

function FaceIDDebugger() {
  const [expanded, setExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(() => {
    return localStorage.getItem('hideDebugPanel') === 'true';
  });
  const [storageData, setStorageData] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadStorageData();
  }, [refreshKey]);

  useEffect(() => {
    // Add keyboard shortcut to toggle debug panel (Ctrl/Cmd + Shift + D)
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsHidden(prev => {
          const newValue = !prev;
          localStorage.setItem('hideDebugPanel', newValue.toString());
          return newValue;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const loadStorageData = () => {
    const data = {};
    
    // Check all WebAuthn related storage keys
    const keysToCheck = [
      config.storage.credentials,
      config.storage.userEmail,
      config.storage.lastCredentialId,
      config.storage.biometricEnabled,
      'userEmail', // Legacy key
      'user' // Auth context key
    ];

    keysToCheck.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      } else {
        data[key] = null;
      }
    });

    setStorageData(data);
  };

  const clearCredentials = () => {
    if (window.confirm('Clear all Face ID credentials?')) {
      localStorage.removeItem(config.storage.credentials);
      localStorage.removeItem(config.storage.lastCredentialId);
      localStorage.removeItem(config.storage.biometricEnabled);
      localStorage.removeItem(config.storage.userEmail);
      setRefreshKey(prev => prev + 1);
    }
  };
  
  const resetFaceID = () => {
    if (window.confirm('Reset Face ID completely? This will clear all stored credentials and require re-registration.')) {
      // Clear all Face ID related storage
      const keysToRemove = [
        config.storage.credentials,
        config.storage.lastCredentialId,
        config.storage.biometricEnabled,
        config.storage.userEmail
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`[FaceIDDebugger] Removed ${key}`);
      });
      
      // Clear test credentials if any
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.startsWith('test-credential-')) {
          localStorage.removeItem(key);
          console.log(`[FaceIDDebugger] Removed test key: ${key}`);
        }
      });
      
      console.log('[FaceIDDebugger] Face ID reset complete');
      alert('Face ID has been reset. Please refresh the page and set up Face ID again.');
      setRefreshKey(prev => prev + 1);
    }
  };

  const testStoreCredential = () => {
    const testCredentialId = 'test-credential-' + Date.now();
    const testData = {
      [testCredentialId]: {
        id: testCredentialId,
        userEmail: 'test@example.com',
        createdAt: new Date().toISOString(),
        deviceName: 'Test Device'
      }
    };
    
    localStorage.setItem(config.storage.credentials, JSON.stringify(testData));
    localStorage.setItem(config.storage.lastCredentialId, testCredentialId);
    localStorage.setItem(config.storage.biometricEnabled, 'true');
    
    console.log('Test credential stored:', testData);
    setRefreshKey(prev => prev + 1);
  };

  // Don't render anything if hidden
  if (isHidden) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-gray-800/90 text-white rounded-lg p-3 text-xs font-mono max-w-md mx-auto">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full mb-2"
      >
        <span className="font-bold">Face ID Storage Debug</span>
        {expanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
      </button>
      
      {expanded && (
        <>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Object.entries(storageData).map(([key, value]) => (
              <div key={key} className="border-t border-gray-700 pt-2">
                <div className="font-semibold text-green-400">{key}:</div>
                <pre className="text-[10px] overflow-x-auto whitespace-pre-wrap break-all">
                  {value === null ? 
                    <span className="text-red-400">null</span> : 
                    typeof value === 'object' ? 
                      JSON.stringify(value, null, 2) : 
                      value
                  }
                </pre>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
            <button
              onClick={loadStorageData}
              className="px-2 py-1 bg-blue-600 rounded text-[10px]"
            >
              Refresh
            </button>
            <button
              onClick={testStoreCredential}
              className="px-2 py-1 bg-green-600 rounded text-[10px]"
            >
              Test Store
            </button>
            <button
              onClick={clearCredentials}
              className="px-2 py-1 bg-yellow-600 rounded text-[10px]"
            >
              Clear
            </button>
            <button
              onClick={resetFaceID}
              className="px-2 py-1 bg-red-600 rounded text-[10px]"
            >
              Reset Face ID
            </button>
            <button
              onClick={() => {
                setIsHidden(true);
                localStorage.setItem('hideDebugPanel', 'true');
              }}
              className="px-2 py-1 bg-gray-600 rounded text-[10px]"
            >
              Hide Panel
            </button>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-400">
            <div>Expected keys:</div>
            <div>• {config.storage.credentials}</div>
            <div>• {config.storage.lastCredentialId}</div>
            <div>• {config.storage.biometricEnabled}</div>
            <div className="mt-2 text-yellow-400">Press Ctrl+Shift+D to toggle panel</div>
          </div>
        </>
      )}
    </div>
  );
}

export default FaceIDDebugger;