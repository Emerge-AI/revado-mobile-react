import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import TabBar from './components/TabBar';
import TransitionWrapper from './components/TransitionWrapper';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import SharePage from './pages/SharePage';
import MedicationsPage from './pages/MedicationsPage';
import PrepareQuestionsPage from './pages/PrepareQuestionsPage';
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
import { ConnectionsProvider } from './contexts/ConnectionsContext';
import ConnectPage from './pages/ConnectPage';
import InsuranceProvidersPage from './pages/InsuranceProvidersPage';
import HealthcareProvidersPage from './pages/HealthcareProvidersPage';
import ConnectedAccountsPage from './pages/ConnectedAccountsPage';
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
        <ConnectionsProvider>
          <Router>
          <div className="min-h-screen max-w-[600px] mx-auto relative">
            {/* Subtle gradient background */}
            <div className="fixed inset-0 bg-gray-50">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-gray-50" />
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
                    <Route path="/medications" element={
                      <TransitionWrapper>
                        <MedicationsPage />
                      </TransitionWrapper>
                    } />
                    <Route path="/prepare-questions" element={
                      <TransitionWrapper>
                        <PrepareQuestionsPage />
                      </TransitionWrapper>
                    } />
                    <Route path="/connect" element={
                      <TransitionWrapper>
                        <ConnectPage />
                      </TransitionWrapper>
                    } />
                    <Route path="/connect/insurance" element={
                      <TransitionWrapper>
                        <InsuranceProvidersPage />
                      </TransitionWrapper>
                    } />
                    <Route path="/connect/healthcare" element={
                      <TransitionWrapper>
                        <HealthcareProvidersPage />
                      </TransitionWrapper>
                    } />
                    <Route path="/connect/accounts" element={
                      <TransitionWrapper>
                        <ConnectedAccountsPage />
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
        </ConnectionsProvider>
      </HealthRecordsProvider>
    </AuthProvider>
  );
}

export default App;
