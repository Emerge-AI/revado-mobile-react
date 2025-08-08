/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationStep, setVerificationStep] = useState('email'); // email, sms, complete

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        // In a real app, validate token with backend
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        setUser(userData);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const checkExistingUser = async (email) => {
    // Simulate API call to check if user exists
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if email exists in our "database"
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    return existingUsers.includes(email);
  };

  const signIn = async (email, password, isBiometric = false) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo, check stored credentials
    const users = JSON.parse(localStorage.getItem('userDatabase') || '{}');
    const user = users[email];
    
    if (isBiometric) {
      // Biometric auth bypasses password check
      if (user) {
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        };
        
        const token = btoa(JSON.stringify(userData));
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userEmail', email);
        
        setUser(userData);
        setVerificationStep('complete');
        return { success: true, user: userData };
      } else {
        // For biometric auth, create a user if they have valid credentials
        // This handles the case where Face ID was set up but user doesn't exist in DB
        console.log('User not in database, creating from biometric auth:', email);
        
        const newUser = {
          id: Date.now().toString(),
          email: email,
          name: email.split('@')[0], // Use email prefix as name
          createdAt: new Date().toISOString(),
          isBiometricUser: true
        };
        
        // Store the new user
        const users = JSON.parse(localStorage.getItem('userDatabase') || '{}');
        users[email] = newUser;
        localStorage.setItem('userDatabase', JSON.stringify(users));
        
        // Create user session
        const userData = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          createdAt: newUser.createdAt,
        };
        
        const token = btoa(JSON.stringify(userData));
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userEmail', email);
        
        setUser(userData);
        setVerificationStep('complete');
        return { success: true, user: userData };
      }
    }
    
    // Regular password sign in
    if (user && user.password === password) {
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      };
      
      const token = btoa(JSON.stringify(userData));
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('userEmail', email);
      
      setUser(userData);
      setVerificationStep('complete');
      return { success: true, user: userData };
    }
    
    return { success: false, message: 'Invalid email or password' };
  };

  const signUp = async (email, password, name) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('userDatabase') || '{}');
    if (users[email]) {
      return { success: false, message: 'Email already registered' };
    }
    
    // Store new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password, // In production, this would be hashed
      name,
      createdAt: new Date().toISOString(),
    };
    
    users[email] = newUser;
    localStorage.setItem('userDatabase', JSON.stringify(users));
    
    // Update registered users list
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    registeredUsers.push(email);
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    
    // Store temporary data for verification
    localStorage.setItem('pendingEmail', email);
    localStorage.setItem('pendingUser', JSON.stringify(newUser));
    setVerificationStep('sms');
    
    return { success: true, needsVerification: true, user: newUser };
  };

  const verifyPhone = async (phone) => {
    // Simulate sending SMS
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    localStorage.setItem('pendingPhone', phone);
    return { success: true, message: 'SMS code sent' };
  };

  const verifySMSCode = async (code) => {
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (code === '123456') { // Demo code
      const email = localStorage.getItem('pendingEmail');
      const phone = localStorage.getItem('pendingPhone');
      const pendingUser = JSON.parse(localStorage.getItem('pendingUser') || '{}');
      
      const userData = {
        id: pendingUser.id || Date.now().toString(),
        email: pendingUser.email || email,
        name: pendingUser.name,
        phone,
        createdAt: pendingUser.createdAt || new Date().toISOString(),
      };
      
      const token = btoa(JSON.stringify(userData));
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('userEmail', email);
      localStorage.removeItem('pendingEmail');
      localStorage.removeItem('pendingPhone');
      localStorage.removeItem('pendingUser');
      
      setUser(userData);
      setVerificationStep('complete');
      
      return { success: true, user: userData };
    }
    
    return { success: false, message: 'Invalid code' };
  };

  const signOut = () => {
    // Remove auth tokens but preserve biometric registration
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // Keep userEmail and biometric credentials for quick sign-in
    // Only remove these if user explicitly disables biometric
    setUser(null);
    setVerificationStep('email');
  };


  const value = {
    user,
    loading,
    verificationStep,
    checkExistingUser,
    signIn,
    signUp,
    verifyPhone,
    verifySMSCode,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}