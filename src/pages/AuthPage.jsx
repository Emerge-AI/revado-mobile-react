import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import useBiometricAuth from '../hooks/useBiometricAuth';
import config from '../config/webauthn.config';
import authLogger from '../utils/authLogger';
import FaceIDDebugPanel from '../components/FaceIDDebugPanel';
import FaceIDTestButton from '../components/FaceIDTestButton';
import FaceIDDebugger from '../components/FaceIDDebugger';
import RevadoLogo from '../components/RevadoLogo';
import { 
  EnvelopeIcon, 
  DevicePhoneMobileIcon, 
  ShieldCheckIcon, 
  FaceSmileIcon, 
  LockClosedIcon,
  UserPlusIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

function AuthPage({ onAuthenticated }) {
  const { signIn, signUp, verifyPhone, verifySMSCode, verificationStep, checkExistingUser } = useAuth();
  const { isAvailable, authenticateWithBiometric, registerBiometric } = useBiometricAuth();
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [name, setName] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState('initial'); // initial, signin, signup
  
  // Check for biometric setup on component mount
  const [showBiometric, setShowBiometric] = useState(false);

  useEffect(() => {
    // Check for biometric setup
    const checkBiometric = async () => {
      // Use config storage keys
      const storedEmail = localStorage.getItem(config.storage.userEmail) || localStorage.getItem('userEmail');
      const biometricCredential = localStorage.getItem(config.storage.lastCredentialId);
      const credentials = localStorage.getItem(config.storage.credentials);
      
      // Debug logging for mobile
      console.log('Auth page biometric check:', {
        storedEmail,
        hasBiometricCredential: !!biometricCredential,
        hasCredentials: !!credentials,
        isAvailable,
        userAgent: navigator.userAgent
      });
      
      // Update biometric availability when it changes  
      const shouldShowBiometric = !!(storedEmail && (biometricCredential || credentials) && isAvailable);
      setShowBiometric(shouldShowBiometric);
      
      // Reset to initial state
      setAuthMode('initial');
      setEmail('');
      setPassword('');
      setError('');
      
      // Auto-trigger Face ID on mobile after a short delay
      if (shouldShowBiometric && isAvailable) {
        // Check if on mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
          // Add a subtle animation to draw attention to the Face ID button
          setTimeout(() => {
            // Trigger a visual pulse on the Face ID button
            const faceIdButton = document.getElementById('face-id-button');
            if (faceIdButton) {
              faceIdButton.classList.add('animate-pulse');
              setTimeout(() => {
                faceIdButton.classList.remove('animate-pulse');
              }, 2000);
            }
          }, 500);
        }
      }
    };
    
    checkBiometric();
  }, [isAvailable]);

  const handleEmailCheck = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const exists = await checkExistingUser(email);
      
      if (exists) {
        setAuthMode('signin');
        authLogger.startTracking('signin');
      } else {
        setAuthMode('signup');
        authLogger.startTracking('signup');
      }
    } catch {
      setError('Failed to check email');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Start tracking if not already started
    if (!authLogger.startTime) {
      authLogger.startTracking('signin');
    }

    try {
      const result = await signIn(email, password);
      if (result.success) {
        // Log successful sign in
        const logData = await authLogger.stopTracking({
          email: email,
          success: true,
          method: 'password'
        });
        console.log('Sign in completed:', logData);
        // If biometric is available and not registered, offer to set it up
        const hasBiometricCredential = localStorage.getItem(config.storage.lastCredentialId);
        const hasCredentials = localStorage.getItem(config.storage.credentials);
        
        console.log('Sign in successful, checking Face ID setup:', {
          isAvailable,
          hasBiometricCredential,
          hasCredentials
        });
        
        if (isAvailable && !hasBiometricCredential && !hasCredentials) {
          // Use a more mobile-friendly confirmation dialog
          setTimeout(async () => {
            const setupBiometric = window.confirm(
              'Would you like to enable Face ID for faster sign in next time?\n\nYou can always change this in Settings.'
            );
            if (setupBiometric) {
              console.log('User agreed to Face ID setup');
              const biometricResult = await registerBiometric(result.user.id, email);
              console.log('Face ID registration result:', biometricResult);
              if (biometricResult.success) {
                alert('Face ID enabled successfully! You can now use Face ID to sign in.');
              } else {
                console.error('Face ID registration failed:', biometricResult.error);
              }
            }
          }, 500); // Small delay to ensure the page has loaded
        }
        onAuthenticated();
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Start tracking if not already started
    if (!authLogger.startTime) {
      authLogger.startTracking('signup');
    }

    try {
      const result = await signUp(email, password, name);
      if (result.success) {
        if (result.needsVerification) {
          // Move to phone verification
          setAuthMode('verify');
        } else {
          // If biometric is available, offer to set it up
          console.log('Sign up successful, checking Face ID availability:', isAvailable);
          
          if (isAvailable) {
            setTimeout(async () => {
              const setupBiometric = window.confirm(
                'Would you like to enable Face ID for faster sign in?\n\nYou can always change this in Settings.'
              );
              if (setupBiometric) {
                console.log('User agreed to Face ID setup during sign up');
                const biometricResult = await registerBiometric(result.user.id, email);
                console.log('Face ID registration result:', biometricResult);
                if (biometricResult.success) {
                  alert('Face ID enabled successfully! You can now use Face ID to sign in.');
                } else {
                  console.error('Face ID registration failed:', biometricResult.error);
                }
              }
            }, 500);
          }
          onAuthenticated();
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await verifyPhone(phone);
      if (!result.success) {
        setError(result.message);
      }
    } catch {
      setError('Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };

  const handleSMSSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await verifySMSCode(smsCode);
      if (result.success) {
        // Log successful sign up completion
        const logData = await authLogger.stopTracking({
          email: result.user?.email || localStorage.getItem('pendingEmail'),
          success: true,
          method: 'sms_verification'
        });
        console.log('Sign up completed:', logData);
        
        // If biometric is available, offer to set it up
        console.log('SMS verification successful, checking Face ID availability:', isAvailable);
        
        if (isAvailable) {
          const userEmail = result.user?.email || localStorage.getItem('pendingEmail');
          setTimeout(async () => {
            const setupBiometric = window.confirm(
              'Would you like to enable Face ID for faster sign in?\n\nYou can always change this in Settings.'
            );
            if (setupBiometric) {
              console.log('User agreed to Face ID setup after SMS verification');
              const biometricResult = await registerBiometric(result.user.id, userEmail);
              console.log('Face ID registration result:', biometricResult);
              if (biometricResult.success) {
                alert('Face ID enabled successfully! You can now use Face ID to sign in.');
              } else {
                console.error('Face ID registration failed:', biometricResult.error);
              }
            }
          }, 500);
        }
        onAuthenticated();
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('SMS verification error:', err);
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    // Haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    setLoading(true);
    setError('');

    try {
      // Start tracking for biometric sign in
      authLogger.startTracking('signin');
      
      const result = await authenticateWithBiometric();
      if (result.success) {
        // Try multiple storage locations for email
        const storedEmail = result.userEmail || 
                           localStorage.getItem(config.storage.userEmail) || 
                           localStorage.getItem('userEmail');
        if (storedEmail) {
          const signInResult = await signIn(storedEmail, null, true); // biometric sign in
          if (signInResult.success) {
            // Log successful biometric sign in
            const logData = await authLogger.stopTracking({
              email: storedEmail,
              success: true,
              method: 'biometric'
            });
            console.log('Biometric sign in completed:', logData);
            // Success haptic
            if (navigator.vibrate) {
              navigator.vibrate([10, 50, 10]);
            }
            onAuthenticated();
          } else {
            console.error('Sign in failed after biometric auth:', signInResult);
            setError(signInResult.message || 'Authentication failed. Please try again.');
            setAuthMode('initial');
          }
        }
      } else {
        setError(result.error || 'Biometric authentication failed');
      }
    } catch (err) {
      setError('Authentication failed. Please try email sign in.');
      console.error('Biometric auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetToInitial = () => {
    setAuthMode('initial');
    setError('');
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="pt-safe-top px-4 pb-8 flex-1 flex flex-col">
        
        
        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
          
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            className="mb-8 text-center"
          >
            <div className="flex justify-center mb-6">
              <RevadoLogo size="large" animated={true} />
            </div>
            <p className="text-gray-600 font-medium">
              Your health records, simplified
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            
            {/* Initial Screen - Choose Sign In Method */}
            {authMode === 'initial' && showBiometric && (
              <motion.div
                key="biometric"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <motion.div 
                    className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-primary-50 to-primary-100 mb-4"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  >
                    <FaceSmileIcon className="w-16 h-16 text-primary-600" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome Back!
                  </h2>
                  <p className="text-gray-600">
                    Tap below to sign in with Face ID
                  </p>
                </div>

                <motion.button
                  id="face-id-button"
                  onClick={handleBiometricAuth}
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-3 relative"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    <>
                      <FaceSmileIcon className="w-6 h-6" />
                      <span>Continue with Face ID</span>
                      <motion.span
                        className="absolute -top-1 -right-1 flex h-3 w-3"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                      </motion.span>
                    </>
                  )}
                </motion.button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">
                      or
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setAuthMode('email')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-xl font-semibold text-lg transition-colors"
                >
                  Sign in with Email
                </button>

                <button
                  onClick={() => setAuthMode('signup')}
                  className="w-full text-primary-600 hover:text-primary-700 py-2 font-medium transition-colors"
                >
                  New user? Create account
                </button>
              </motion.div>
            )}

            {/* Initial Screen - No Biometric */}
            {authMode === 'initial' && !showBiometric && (
              <motion.div
                key="no-biometric"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Debug info for mobile - remove in production */}
                {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
                  <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded-lg">
                    <p>Debug: Mobile detected</p>
                    <p>Face ID available: {isAvailable ? 'Yes' : 'No'}</p>
                    <p>Has stored email: {localStorage.getItem(config.storage.userEmail) ? 'Yes' : 'No'}</p>
                    <p>Has credential: {localStorage.getItem(config.storage.lastCredentialId) ? 'Yes' : 'No'}</p>
                    <p>Has credentials obj: {localStorage.getItem(config.storage.credentials) ? 'Yes' : 'No'}</p>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    authLogger.startTracking('signin');
                  }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-3"
                >
                  <ArrowLeftIcon className="w-5 h-5 rotate-180" />
                  Sign In
                </button>

                <button
                  onClick={() => {
                    setAuthMode('signup');
                    authLogger.startTracking('signup');
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-3"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  Create Account
                </button>
                
                {/* Face ID Diagnostic Tests - Always show */}
                <div className="pt-4 border-t border-gray-100">
                  <FaceIDTestButton />
                </div>
                
                {/* Show Face ID setup option if available but not registered */}
                {isAvailable && (
                  <>
                    <button
                      onClick={() => setAuthMode('signin')}
                      className="w-full text-primary-600 hover:text-primary-700 py-2 font-medium transition-colors text-sm"
                    >
                      Have Face ID set up? Sign in to enable it
                    </button>
                    
                    {/* Manual Face ID test button - remove in production */}
                    <button
                      onClick={async () => {
                        console.log('Manual Face ID setup triggered');
                        const testEmail = prompt('Enter your email for Face ID setup:');
                        if (testEmail) {
                          const result = await registerBiometric('test-user-' + Date.now(), testEmail);
                          console.log('Manual Face ID result:', result);
                          if (result.success) {
                            alert('Face ID registered! Refresh the page to see the Face ID login button.');
                            // Force refresh to show Face ID button
                            window.location.reload();
                          } else {
                            alert('Face ID registration failed: ' + result.error);
                          }
                        }
                      }}
                      className="w-full bg-success-600 hover:bg-success-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
                    >
                      🔧 Test: Setup Face ID Manually
                    </button>
                    
                    {/* Diagnostic Test Button */}
                    <div className="pt-2">
                      <FaceIDTestButton />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Email Check Screen */}
            {authMode === 'email' && (
              <motion.form
                key="email-check"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailCheck}
                className="space-y-5"
              >
                <button
                  type="button"
                  onClick={resetToInitial}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back
                </button>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-100"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Checking...' : 'Continue'}
                </motion.button>
              </motion.form>
            )}

            {/* Sign In Screen */}
            {authMode === 'signin' && (
              <motion.form
                key="signin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSignIn}
                className="space-y-5"
              >
                <button
                  type="button"
                  onClick={resetToInitial}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back
                </button>

                <h2 className="text-2xl font-bold text-gray-900">
                  Welcome back!
                </h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-100"
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </motion.button>

                <button
                  type="button"
                  className="w-full text-primary-600 hover:text-primary-700 py-2 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </motion.form>
            )}

            {/* Sign Up Screen */}
            {authMode === 'signup' && (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSignUp}
                className="space-y-5"
              >
                <button
                  type="button"
                  onClick={resetToInitial}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back
                </button>

                <h2 className="text-2xl font-bold text-gray-900">
                  Create your account
                </h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full px-4 py-4 bg-white rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    At least 8 characters
                  </p>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </motion.button>

                <p className="text-xs text-center text-gray-500">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </motion.form>
            )}

            {/* Phone Verification Screen */}
            {authMode === 'verify' && verificationStep === 'sms' && !phone && (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handlePhoneSubmit}
                className="space-y-5"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  Verify your phone
                </h2>
                <p className="text-gray-600">
                  We'll send you a code to verify your identity
                </p>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <DevicePhoneMobileIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-100"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Code'}
                </motion.button>
              </motion.form>
            )}

            {/* SMS Code Verification */}
            {verificationStep === 'sms' && phone && (
              <motion.form
                key="sms"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSMSSubmit}
                className="space-y-5"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  Enter verification code
                </h2>
                <p className="text-gray-600">
                  We sent a code to {phone}
                </p>

                <div>
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    placeholder="123456"
                    required
                    maxLength={6}
                    className="w-full px-4 py-4 bg-white rounded-xl text-gray-900 text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-100"
                  />
                </div>

                <p className="text-xs text-center text-gray-500">
                  Demo: Use code 123456
                </p>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </motion.button>
              </motion.form>
            )}

          </AnimatePresence>

          {/* Error Display */}
          {error && authMode === 'initial' && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl text-center mt-4"
            >
              {error}
            </motion.p>
          )}
        </div>
      </div>
      
      {/* Debug Panel for Face ID issues */}
      <FaceIDDebugPanel />
      <FaceIDDebugger />
    </div>
  );
}

export default AuthPage;