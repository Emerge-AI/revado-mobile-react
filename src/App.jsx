import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import TabBar from './components/TabBar';
import TransitionWrapper from './components/TransitionWrapper';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import SharePage from './pages/SharePage';
import AuthPage from './pages/AuthPage';
import TimelinePage from './pages/TimelinePage';
import OnboardingPage from './pages/OnboardingPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import PrivacySecurityPage from './pages/PrivacySecurityPage';
import TermsPage from './pages/TermsPage';
import LogsPage from './pages/LogsPage';
import { AuthProvider } from './contexts/AuthContext';
import { HealthRecordsProvider } from './contexts/HealthRecordsContext';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import HTTPSWarning from './components/HTTPSWarning';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      setShowOnboarding(false);
    }
  }, []);

  return (
    <AuthProvider>
      <HealthRecordsProvider>
        <Router>
          <div className="min-h-screen max-w-[600px] mx-auto relative">
            {/* Subtle gradient background */}
            <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
            </div>
            
            <div className="relative z-10">
              <AnimatePresence mode="wait">
              <Routes>
                {!isAuthenticated ? (
                  <>
                    <Route path="/auth" element={
                      <TransitionWrapper>
                        <AuthPage onAuthenticated={() => {
                          setIsAuthenticated(true);
                          setShowOnboarding(true);
                        }} />
                      </TransitionWrapper>
                    } />
                    <Route path="*" element={<Navigate to="/auth" replace />} />
                  </>
                ) : showOnboarding ? (
                  <>
                    <Route path="/onboarding" element={
                      <TransitionWrapper>
                        <OnboardingPage onComplete={() => setShowOnboarding(false)} />
                      </TransitionWrapper>
                    } />
                    <Route path="*" element={<Navigate to="/onboarding" replace />} />
                  </>
                ) : (
                  <>
                    <Route path="/" element={
                      <TransitionWrapper>
                        <HomePage />
                      </TransitionWrapper>
                    } />
                    <Route path="/upload" element={
                      <TransitionWrapper>
                        <UploadPage />
                      </TransitionWrapper>
                    } />
                    <Route path="/share" element={
                      <TransitionWrapper>
                        <SharePage />
                      </TransitionWrapper>
                    } />
                    <Route path="/timeline" element={
                      <TransitionWrapper>
                        <TimelinePage />
                      </TransitionWrapper>
                    } />
                    <Route path="/settings" element={
                      <TransitionWrapper>
                        <SettingsPage />
                      </TransitionWrapper>
                    } />
                    <Route path="/settings/notifications" element={
                      <TransitionWrapper>
                        <NotificationsPage />
                      </TransitionWrapper>
                    } />
                    <Route path="/settings/privacy" element={
                      <TransitionWrapper>
                        <PrivacySecurityPage />
                      </TransitionWrapper>
                    } />
                    <Route path="/settings/terms" element={
                      <TransitionWrapper>
                        <TermsPage />
                      </TransitionWrapper>
                    } />
                    <Route path="/settings/logs" element={
                      <TransitionWrapper>
                        <LogsPage />
                      </TransitionWrapper>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                )}
              </Routes>
            </AnimatePresence>
            
            {isAuthenticated && !showOnboarding && <TabBar />}
            <PWAInstallPrompt />
            <HTTPSWarning />
            </div>
          </div>
        </Router>
      </HealthRecordsProvider>
    </AuthProvider>
  );
}

export default App;