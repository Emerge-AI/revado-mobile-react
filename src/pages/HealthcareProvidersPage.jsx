import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConnections } from '../contexts/ConnectionsContext';
import ProviderCard from '../components/ProviderCard';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

function HealthcareProvidersPage() {
  const navigate = useNavigate();
  const { getProviders, connections, createConnection, loading: contextLoading } = useConnections();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isConnecting, setIsConnecting] = useState({});

  const healthcareProviders = getProviders('healthcare');
  
  // Get connected provider IDs for status tracking
  const connectedProviderIds = useMemo(() => {
    return connections
      .filter(c => c.status === 'connected')
      .map(c => c.providerId);
  }, [connections]);

  // Filter providers based on search and category
  const filteredProviders = useMemo(() => {
    let filtered = healthcareProviders;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(provider =>
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(provider => provider.category === selectedCategory);
    }
    
    // Sort: connected first, then popular, then alphabetical
    return filtered.sort((a, b) => {
      const aConnected = connectedProviderIds.includes(a.id);
      const bConnected = connectedProviderIds.includes(b.id);
      
      if (aConnected && !bConnected) return -1;
      if (!aConnected && bConnected) return 1;
      
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      
      return a.name.localeCompare(b.name);
    });
  }, [healthcareProviders, searchQuery, selectedCategory, connectedProviderIds]);

  const categories = [
    { id: 'all', name: 'All Healthcare', count: healthcareProviders.length },
    { id: 'hospital_system', name: 'Health Systems', count: healthcareProviders.filter(p => p.category === 'hospital_system').length },
    { id: 'hospital', name: 'Hospitals', count: healthcareProviders.filter(p => p.category === 'hospital').length },
    { id: 'clinic', name: 'Clinics', count: healthcareProviders.filter(p => p.category === 'clinic').length },
  ];

  const handleConnect = async (provider) => {
    if (connectedProviderIds.includes(provider.id)) {
      // Navigate to provider details/settings
      navigate(`/connect/provider/${provider.id}`);
      return;
    }

    if (isConnecting[provider.id]) return;

    setIsConnecting(prev => ({ ...prev, [provider.id]: true }));
    
    try {
      // For demo, simulate authentication
      const mockCredentials = {
        username: 'demo_user',
        accountName: provider.name,
      };
      
      const result = await createConnection(provider.id, mockCredentials);
      
      if (result.success) {
        // Show success message or navigate to auth flow
        console.log('Connection created successfully');
      } else {
        console.error('Failed to create connection:', result.message);
      }
    } catch (error) {
      console.error('Error connecting to provider:', error);
    } finally {
      setIsConnecting(prev => ({ ...prev, [provider.id]: false }));
    }
  };

  const connectedCount = connectedProviderIds.length;

  return (
    <div className="min-h-screen pb-20">
      <div className="pt-safe-top px-4">
        {/* Header */}
        <div className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </motion.button>
              <h1 className="text-2xl font-bold text-gray-900">Healthcare Systems</h1>
            </div>
            
            {connectedCount > 0 && (
              <div className="bg-success-100 rounded-full px-3 py-1">
                <span className="text-sm font-semibold text-success-700">
                  {connectedCount} connected
                </span>
              </div>
            )}
          </div>

          <p className="text-gray-600 font-medium mb-6">
            Connect to hospitals and clinics to automatically import your medical records and test results.
          </p>

          {/* Search Bar */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search healthcare providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors bg-white"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full border transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-100 border-primary-200 text-primary-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{category.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    selectedCategory === category.id
                      ? 'bg-primary-200 text-primary-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {category.count}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-purple-50 rounded-xl p-4 mb-6 border border-purple-100">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-purple-800 mb-1">
                What We Can Access
              </p>
              <p className="text-xs text-purple-700">
                Medical records, test results, appointment history, and immunization records. 
                All connections are read-only and HIPAA compliant.
              </p>
            </div>
          </div>
        </div>

        {/* Popular/Featured Section */}
        {filteredProviders.some(p => p.isPopular) && selectedCategory === 'all' && !searchQuery && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-orange-600" />
              Popular Health Systems
            </h3>
            <div className="grid gap-3">
              {filteredProviders
                .filter(p => p.isPopular && !connectedProviderIds.includes(p.id))
                .slice(0, 3)
                .map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onConnect={handleConnect}
                    isConnected={false}
                    connectionStatus={isConnecting[provider.id] ? 'connecting' : null}
                    size="compact"
                  />
                ))
              }
            </div>
          </div>
        )}

        {/* Provider List */}
        <div className="space-y-4">
          {contextLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProviders.length === 0 ? (
            // No results
            <div className="text-center py-12">
              <BuildingOffice2Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No providers found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? `No healthcare providers match "${searchQuery}"`
                  : 'No providers available in this category'
                }
              </p>
              {searchQuery && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchQuery('')}
                  className="text-primary-600 font-medium hover:text-primary-700"
                >
                  Clear search
                </motion.button>
              )}
            </div>
          ) : (
            // Provider cards
            <>
              {/* Connected providers first */}
              {filteredProviders.filter(p => connectedProviderIds.includes(p.id)).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-success-600" />
                    Connected Providers
                  </h3>
                  <div className="space-y-3">
                    {filteredProviders
                      .filter(p => connectedProviderIds.includes(p.id))
                      .map((provider) => (
                        <ProviderCard
                          key={provider.id}
                          provider={provider}
                          onConnect={handleConnect}
                          isConnected={true}
                          connectionStatus="connected"
                        />
                      ))
                    }
                  </div>
                </div>
              )}
              
              {/* Available providers */}
              {filteredProviders.filter(p => !connectedProviderIds.includes(p.id)).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BuildingOffice2Icon className="w-4 h-4 text-purple-600" />
                    {selectedCategory === 'all' ? 'All Healthcare Providers' : `${categories.find(c => c.id === selectedCategory)?.name || 'Providers'}`}
                  </h3>
                  <div className="space-y-3">
                    {filteredProviders
                      .filter(p => !connectedProviderIds.includes(p.id))
                      .filter(p => selectedCategory === 'all' || !p.isPopular) // Don't repeat popular ones
                      .map((provider) => (
                        <ProviderCard
                          key={provider.id}
                          provider={provider}
                          onConnect={handleConnect}
                          isConnected={false}
                          connectionStatus={isConnecting[provider.id] ? 'connecting' : null}
                        />
                      ))
                    }
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Local Provider Tip */}
        {!searchQuery && selectedCategory === 'all' && (
          <div className="mt-8 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-start gap-3">
              <MapPinIcon className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  Don't see your provider?
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  Many local healthcare providers use Epic MyChart or Cerner HealtheLife systems. 
                  Try connecting through these popular platforms.
                </p>
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSearchQuery('Epic')}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-full"
                  >
                    Search Epic
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSearchQuery('Cerner')}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-full"
                  >
                    Search Cerner
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom spacing for better UX */}
        <div className="h-8" />
      </div>
    </div>
  );
}

export default HealthcareProvidersPage;