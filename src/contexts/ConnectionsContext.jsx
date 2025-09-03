/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const ConnectionsContext = createContext();

export const useConnections = () => {
  const context = useContext(ConnectionsContext);
  if (!context) {
    throw new Error('useConnections must be used within ConnectionsProvider');
  }
  return context;
};

export function ConnectionsProvider({ children }) {
  const [providers, setProviders] = useState([]);
  const [connections, setConnections] = useState([]);
  const [syncStatus, setSyncStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useBackend, setUseBackend] = useState(false);

  // Demo providers data
  const demoProviders = {
    insurance: [
      {
        id: 'blue-cross-blue-shield',
        name: 'Blue Cross Blue Shield',
        type: 'insurance',
        category: 'health_insurance',
        description: 'Access your claims, coverage, and benefits',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['claims', 'eligibility', 'benefits'],
        status: 'available',
        logo: '/images/insurance-logos/blue-cross-blue-shield.svg',
        brandColor: '#1e40af',
        brandColorLight: '#dbeafe',
        isPopular: true,
      },
      {
        id: 'unitedhealth',
        name: 'UnitedHealth Group',
        type: 'insurance',
        category: 'health_insurance',
        description: 'Connect to UnitedHealthcare plans',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['claims', 'eligibility', 'benefits'],
        status: 'available',
        logo: '/images/insurance-logos/unitedhealth.svg',
        brandColor: '#0073e6',
        brandColorLight: '#dbeafe',
        isPopular: true,
      },
      {
        id: 'aetna',
        name: 'Aetna',
        type: 'insurance',
        category: 'health_insurance',
        description: 'Access Aetna insurance information',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['claims', 'eligibility', 'benefits'],
        status: 'available',
        logo: '/images/insurance-logos/aetna.svg',
        brandColor: '#a855f7',
        brandColorLight: '#f3e8ff',
        isPopular: true,
      },
      {
        id: 'anthem',
        name: 'Anthem',
        type: 'insurance',
        category: 'health_insurance',
        description: 'Connect to Anthem insurance plans',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['claims', 'eligibility', 'benefits'],
        status: 'available',
        logo: '/images/insurance-logos/anthem.svg',
        brandColor: '#e11d48',
        brandColorLight: '#fce7f3',
        isPopular: true,
      },
      {
        id: 'kaiser-permanente',
        name: 'Kaiser Permanente',
        type: 'insurance',
        category: 'health_insurance',
        description: 'Access your Kaiser health plan',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['claims', 'eligibility', 'benefits', 'records'],
        status: 'available',
        logo: '/images/insurance-logos/kaiser-permanente.svg',
        brandColor: '#00a651',
        brandColorLight: '#dcfce7',
        isPopular: true,
      },
      {
        id: 'cigna',
        name: 'Cigna',
        type: 'insurance',
        category: 'health_insurance',
        description: 'Connect to Cigna health plans',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['claims', 'eligibility', 'benefits'],
        status: 'available',
        logo: '/images/insurance-logos/cigna.svg',
        brandColor: '#00a651',
        brandColorLight: '#dcfce7',
        isPopular: true,
      },
      {
        id: 'delta-dental',
        name: 'Delta Dental',
        type: 'insurance',
        category: 'dental',
        description: 'Access your Delta Dental coverage',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['claims', 'eligibility', 'benefits'],
        status: 'available',
        logo: '/images/insurance-logos/delta-dental.svg',
        brandColor: '#1e40af',
        brandColorLight: '#dbeafe',
        isPopular: true,
      },
      {
        id: 'vsp-vision',
        name: 'VSP Vision Care',
        type: 'insurance',
        category: 'vision',
        description: 'VSP vision insurance benefits',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['claims', 'eligibility', 'benefits'],
        status: 'available',
        logo: '/images/insurance-logos/vsp-vision.svg',
        brandColor: '#0073e6',
        brandColorLight: '#dbeafe',
        isPopular: true,
      },
      {
        id: 'humana',
        name: 'Humana',
        type: 'insurance',
        category: 'health_insurance',
        description: 'Humana health insurance plans',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['claims', 'eligibility', 'benefits'],
        status: 'available',
        logo: '/images/insurance-logos/humana.svg',
        brandColor: '#ff6b35',
        brandColorLight: '#fed7ca',
        isPopular: false,
      },
      {
        id: 'molina-healthcare',
        name: 'Molina Healthcare',
        type: 'insurance',
        category: 'health_insurance',
        description: 'Molina Healthcare Medicaid plans',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['claims', 'eligibility', 'benefits'],
        status: 'available',
        logo: '/images/insurance-logos/molina-healthcare.svg',
        brandColor: '#0066cc',
        brandColorLight: '#dbeafe',
        isPopular: false,
      },
      {
        id: 'medicare',
        name: 'Medicare',
        type: 'insurance',
        category: 'health_insurance',
        description: 'Federal Medicare insurance program',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['claims', 'eligibility', 'benefits'],
        status: 'available',
        logo: '/images/insurance-logos/medicare.svg',
        brandColor: '#0066cc',
        brandColorLight: '#dbeafe',
        isPopular: true,
      },
      {
        id: 'medicaid',
        name: 'Medicaid',
        type: 'insurance',
        category: 'health_insurance',
        description: 'State Medicaid insurance programs',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['claims', 'eligibility', 'benefits'],
        status: 'available',
        logo: '/images/insurance-logos/medicaid.svg',
        brandColor: '#009639',
        brandColorLight: '#dcfce7',
        isPopular: true,
      },
    ],
    healthcare: [
      {
        id: 'epic-mychart',
        name: 'Epic MyChart',
        type: 'healthcare',
        category: 'hospital_system',
        description: 'Connect to Epic-powered health systems',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['records', 'appointments', 'test_results'],
        status: 'available',
        logo: '📋',
      },
      {
        id: 'cerner-healthelife',
        name: 'Cerner HealtheLife',
        type: 'healthcare',
        category: 'hospital_system',
        description: 'Access Cerner health records',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['records', 'appointments', 'test_results'],
        status: 'available',
        logo: '🏥',
      },
      {
        id: 'mayo-clinic',
        name: 'Mayo Clinic',
        type: 'healthcare',
        category: 'hospital',
        description: 'Mayo Clinic patient portal',
        authMethods: ['oauth2'],
        supportedFeatures: ['records', 'appointments', 'test_results'],
        status: 'available',
        logo: '🩺',
      },
      {
        id: 'cleveland-clinic',
        name: 'Cleveland Clinic',
        type: 'healthcare',
        category: 'hospital',
        description: 'Cleveland Clinic MyChart',
        authMethods: ['oauth2', 'credentials'],
        supportedFeatures: ['records', 'appointments', 'test_results'],
        status: 'available',
        logo: '🏨',
      },
      {
        id: 'johns-hopkins',
        name: 'Johns Hopkins',
        type: 'healthcare',
        category: 'hospital',
        description: 'Johns Hopkins patient portal',
        authMethods: ['oauth2'],
        supportedFeatures: ['records', 'appointments', 'test_results'],
        status: 'available',
        logo: '🔬',
      },
    ]
  };

  useEffect(() => {
    // Check if backend is available
    const initializeConnections = async () => {
      setLoading(true);
      try {
        const available = await apiService.isBackendAvailable();
        setUseBackend(available);
        
        if (available) {
          console.log('[Connections] Backend API available, using server storage');
          await loadProvidersFromBackend();
          await loadConnectionsFromBackend();
        } else {
          console.log('[Connections] Backend API not available, using demo data');
          // Load demo providers
          setProviders([...demoProviders.insurance, ...demoProviders.healthcare]);
          
          // Load cached connections from localStorage
          const cachedConnections = localStorage.getItem('userConnections');
          if (cachedConnections) {
            setConnections(JSON.parse(cachedConnections));
          }
          
          // Load sync status
          const cachedSyncStatus = localStorage.getItem('connectionSyncStatus');
          if (cachedSyncStatus) {
            setSyncStatus(JSON.parse(cachedSyncStatus));
          }
        }
      } catch (error) {
        console.error('[Connections] Error initializing:', error);
        setError('Failed to initialize connections');
        // Fallback to demo data
        setProviders([...demoProviders.insurance, ...demoProviders.healthcare]);
      } finally {
        setLoading(false);
      }
    };

    initializeConnections();
  }, []);

  const loadProvidersFromBackend = async () => {
    try {
      const response = await apiService.getProviders();
      if (response.success) {
        setProviders(response.providers);
      } else {
        setProviders([...demoProviders.insurance, ...demoProviders.healthcare]);
      }
    } catch (error) {
      console.error('[Connections] Error loading providers:', error);
      setProviders([...demoProviders.insurance, ...demoProviders.healthcare]);
    }
  };

  const loadConnectionsFromBackend = async () => {
    try {
      const response = await apiService.getConnections();
      if (response.success) {
        setConnections(response.connections);
        // Update sync status
        const status = {};
        response.connections.forEach(conn => {
          status[conn.id] = {
            lastSync: conn.lastSync,
            status: conn.status,
            nextSync: conn.nextSync,
          };
        });
        setSyncStatus(status);
      }
    } catch (error) {
      console.error('[Connections] Error loading connections:', error);
    }
  };

  const getProviders = (type = null) => {
    if (type) {
      return providers.filter(p => p.type === type);
    }
    return providers;
  };

  const getProvider = (providerId) => {
    return providers.find(p => p.id === providerId);
  };

  const createConnection = async (providerId, credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = getProvider(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      let result;
      if (useBackend) {
        result = await apiService.createConnection(providerId, credentials);
      } else {
        // Simulate connection creation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newConnection = {
          id: `conn_${Date.now()}`,
          providerId,
          userId: 'demo_user',
          accountId: credentials.username || `account_${Date.now()}`,
          accountName: credentials.accountName || provider.name,
          connectionType: provider.type,
          status: 'connected',
          lastSync: new Date().toISOString(),
          nextSync: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Next day
          syncInterval: 24 * 60 * 60 * 1000, // Daily
          metadata: {
            providerName: provider.name,
            features: provider.supportedFeatures,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedConnections = [...connections, newConnection];
        setConnections(updatedConnections);
        
        // Update sync status
        const updatedSyncStatus = {
          ...syncStatus,
          [newConnection.id]: {
            lastSync: newConnection.lastSync,
            status: 'connected',
            nextSync: newConnection.nextSync,
          }
        };
        setSyncStatus(updatedSyncStatus);

        // Persist to localStorage
        localStorage.setItem('userConnections', JSON.stringify(updatedConnections));
        localStorage.setItem('connectionSyncStatus', JSON.stringify(updatedSyncStatus));

        result = { success: true, connection: newConnection };
      }

      return result;
    } catch (error) {
      console.error('[Connections] Error creating connection:', error);
      setError(error.message || 'Failed to create connection');
      return { success: false, message: error.message || 'Failed to create connection' };
    } finally {
      setLoading(false);
    }
  };

  const deleteConnection = async (connectionId) => {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (useBackend) {
        result = await apiService.deleteConnection(connectionId);
      } else {
        // Simulate deletion
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const updatedConnections = connections.filter(c => c.id !== connectionId);
        setConnections(updatedConnections);
        
        // Remove from sync status
        const { [connectionId]: removed, ...updatedSyncStatus } = syncStatus;
        setSyncStatus(updatedSyncStatus);

        // Persist to localStorage
        localStorage.setItem('userConnections', JSON.stringify(updatedConnections));
        localStorage.setItem('connectionSyncStatus', JSON.stringify(updatedSyncStatus));

        result = { success: true };
      }

      return result;
    } catch (error) {
      console.error('[Connections] Error deleting connection:', error);
      setError(error.message || 'Failed to delete connection');
      return { success: false, message: error.message || 'Failed to delete connection' };
    } finally {
      setLoading(false);
    }
  };

  const syncConnection = async (connectionId) => {
    setError(null);

    try {
      let result;
      if (useBackend) {
        result = await apiService.syncConnection(connectionId);
      } else {
        // Simulate sync
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const connection = connections.find(c => c.id === connectionId);
        if (connection) {
          const updatedConnection = {
            ...connection,
            lastSync: new Date().toISOString(),
            nextSync: new Date(Date.now() + connection.syncInterval).toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const updatedConnections = connections.map(c => 
            c.id === connectionId ? updatedConnection : c
          );
          setConnections(updatedConnections);

          // Update sync status
          const updatedSyncStatus = {
            ...syncStatus,
            [connectionId]: {
              lastSync: updatedConnection.lastSync,
              status: 'connected',
              nextSync: updatedConnection.nextSync,
            }
          };
          setSyncStatus(updatedSyncStatus);

          // Persist to localStorage
          localStorage.setItem('userConnections', JSON.stringify(updatedConnections));
          localStorage.setItem('connectionSyncStatus', JSON.stringify(updatedSyncStatus));
        }

        result = { success: true, recordsImported: Math.floor(Math.random() * 10) + 1 };
      }

      return result;
    } catch (error) {
      console.error('[Connections] Error syncing connection:', error);
      setError(error.message || 'Failed to sync connection');
      return { success: false, message: error.message || 'Failed to sync connection' };
    }
  };

  const getConnectionStatus = (connectionId) => {
    return syncStatus[connectionId] || { status: 'unknown' };
  };

  const getConnectedProvidersCount = () => {
    return connections.filter(c => c.status === 'connected').length;
  };

  const value = {
    providers,
    connections,
    syncStatus,
    loading,
    error,
    useBackend,
    getProviders,
    getProvider,
    createConnection,
    deleteConnection,
    syncConnection,
    getConnectionStatus,
    getConnectedProvidersCount,
  };

  return (
    <ConnectionsContext.Provider value={value}>
      {children}
    </ConnectionsContext.Provider>
  );
}