import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConnections } from '../contexts/ConnectionsContext';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  Cog6ToothIcon,
  CalendarIcon,
  DocumentTextIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

function ConnectedAccountsPage() {
  const navigate = useNavigate();
  const { connections, getProvider, syncConnection, deleteConnection, loading } = useConnections();
  const [syncing, setSyncing] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState({});

  const connectedAccounts = connections.filter(c => c.status === 'connected');
  const errorAccounts = connections.filter(c => c.status === 'error');

  const getStatusConfig = (status) => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircleIcon,
          color: 'text-success-600',
          bg: 'bg-success-100',
          label: 'Connected',
        };
      case 'connecting':
        return {
          icon: ClockIcon,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          label: 'Connecting',
        };
      case 'error':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-red-600',
          bg: 'bg-red-100',
          label: 'Connection Error',
        };
      default:
        return {
          icon: ClockIcon,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          label: status,
        };
    }
  };

  const formatLastSync = (lastSync) => {
    if (!lastSync) return 'Never synced';
    
    const now = new Date();
    const then = new Date(lastSync);
    const diffInHours = Math.floor((now - then) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return then.toLocaleDateString();
  };

  const handleSync = async (connectionId) => {
    if (syncing[connectionId]) return;
    
    setSyncing(prev => ({ ...prev, [connectionId]: true }));
    
    try {
      const result = await syncConnection(connectionId);
      if (result.success) {
        console.log(`Synced ${result.recordsImported} records`);
      } else {
        console.error('Sync failed:', result.message);
      }
    } catch (error) {
      console.error('Error syncing connection:', error);
    } finally {
      setSyncing(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const handleDelete = async (connectionId) => {
    if (deleting[connectionId]) return;
    
    setDeleting(prev => ({ ...prev, [connectionId]: true }));
    
    try {
      const result = await deleteConnection(connectionId);
      if (result.success) {
        setShowDeleteConfirm(null);
        console.log('Connection deleted successfully');
      } else {
        console.error('Delete failed:', result.message);
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
    } finally {
      setDeleting(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const renderConnectionCard = (connection) => {
    const provider = getProvider(connection.providerId);
    const statusConfig = getStatusConfig(connection.status);
    const StatusIcon = statusConfig.icon;
    const issyncing = syncing[connection.id];
    const isDeleting = deleting[connection.id];

    return (
      <motion.div
        key={connection.id}
        whileHover={{ scale: 1.01 }}
        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-all"
      >
        <div className="flex items-start space-x-4">
          {/* Provider icon */}
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
            {provider?.logo ? (
              <span className="text-xl">{provider.logo}</span>
            ) : (
              <div className="w-6 h-6 bg-gradient-to-br from-gray-300 to-gray-400 rounded" />
            )}
          </div>
          
          {/* Connection info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900 truncate">
                  {connection.accountName || provider?.name || 'Unknown Provider'}
                </h3>
                <p className="text-sm text-gray-600">
                  {connection.connectionType === 'insurance' ? 'Insurance Provider' : 'Healthcare System'}
                </p>
              </div>
              
              {/* Status badge */}
              <div className={`${statusConfig.bg} rounded-full px-2 py-1 flex items-center gap-1 flex-shrink-0 ml-2`}>
                <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
                <span className={`text-xs font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>
            
            {/* Last sync info */}
            <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                <span>Last sync: {formatLastSync(connection.lastSync)}</span>
              </div>
              {connection.metadata?.recordsCount && (
                <div className="flex items-center gap-1">
                  <DocumentTextIcon className="w-3 h-3" />
                  <span>{connection.metadata.recordsCount} records</span>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              {connection.status === 'connected' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSync(connection.id)}
                  disabled={issyncing || isDeleting}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    issyncing 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  <ArrowPathIcon className={`w-3 h-3 ${issyncing ? 'animate-spin' : ''}`} />
                  {issyncing ? 'Syncing...' : 'Sync Now'}
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDeleteConfirm(connection.id)}
                disabled={issyncing || isDeleting}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isDeleting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                <TrashIcon className="w-3 h-3" />
                {isDeleting ? 'Removing...' : 'Disconnect'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
            </div>
            
            <div className="bg-primary-100 rounded-full px-3 py-1">
              <span className="text-sm font-semibold text-primary-700">
                {connections.length} total
              </span>
            </div>
          </div>

          <p className="text-gray-600 font-medium mb-6">
            Manage your connected insurance and healthcare accounts.
          </p>
        </div>

        {/* Connected Accounts */}
        {connectedAccounts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-success-600" />
              Active Connections ({connectedAccounts.length})
            </h2>
            <div className="space-y-4">
              {connectedAccounts.map(renderConnectionCard)}
            </div>
          </div>
        )}

        {/* Error Accounts */}
        {errorAccounts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              Connection Issues ({errorAccounts.length})
            </h2>
            <div className="space-y-4">
              {errorAccounts.map(renderConnectionCard)}
            </div>
          </div>
        )}

        {/* Empty State */}
        {connections.length === 0 && (
          <div className="text-center py-12">
            <Cog6ToothIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Connected Accounts
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't connected any insurance or healthcare accounts yet.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/connect')}
              className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              Connect Your First Account
            </motion.button>
          </div>
        )}

        {/* Sync Info */}
        {connections.length > 0 && (
          <div className="mt-8 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  Automatic Sync
                </p>
                <p className="text-xs text-gray-600">
                  Your connected accounts sync automatically every 24 hours. 
                  You can also trigger manual syncs anytime for the latest data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Disconnect Account?
              </h3>
              
              <p className="text-sm text-gray-600 mb-6">
                This will stop syncing data from this provider. 
                You can reconnect anytime, but previously synced data will remain.
              </p>
              
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={deleting[showDeleteConfirm]}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting[showDeleteConfirm] ? 'Disconnecting...' : 'Disconnect'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default ConnectedAccountsPage;