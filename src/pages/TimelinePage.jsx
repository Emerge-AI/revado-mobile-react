import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHealthRecords } from '../contexts/HealthRecordsContext';
import RecordCard from '../components/RecordCard';
import ShareHistory from '../components/ShareHistory';
import TimelineEvent from '../components/TimelineEvent';
import RecordDetailModal from '../components/RecordDetailModal';
import {
  DocumentTextIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ClockIcon,
  ShareIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import {
  Squares2X2Icon as Squares2X2IconSolid,
  ListBulletIcon as ListBulletIconSolid
} from '@heroicons/react/24/solid';

function TimelinePage() {
  const { records, deleteRecord, toggleRecordVisibility, generateSharePackage, getShareHistory } = useHealthRecords();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [showShareHistory, setShowShareHistory] = useState(false);
  const [shareRecord, setShareRecord] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'uploads', 'shares'

  // Combine uploads and shares into a unified timeline with date grouping
  const timelineData = useMemo(() => {
    const shareHistory = getShareHistory?.() || [];

    // Add type to uploads
    const uploadEvents = records.map(record => ({
      ...record,
      type: 'upload',
      timestamp: record.uploadedAt
    }));

    // Add type to shares
    const shareEvents = shareHistory.map(share => ({
      ...share,
      type: 'share',
      timestamp: share.sharedAt
    }));

    // Combine and sort by timestamp
    const allEvents = [...uploadEvents, ...shareEvents];

    // Apply filter
    let filteredEvents = allEvents;
    if (filterType === 'uploads') {
      filteredEvents = allEvents.filter(e => e.type === 'upload');
    } else if (filterType === 'shares') {
      filteredEvents = allEvents.filter(e => e.type === 'share');
    }

    // Sort by timestamp (newest first)
    const sortedEvents = filteredEvents.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Group by date for section headers
    const groupedByDate = {};
    sortedEvents.forEach(event => {
      const date = new Date(event.timestamp);
      const dateKey = date.toDateString();

      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          date: date,
          events: []
        };
      }
      groupedByDate[dateKey].events.push(event);
    });

    return Object.values(groupedByDate).sort((a, b) => b.date - a.date);
  }, [records, getShareHistory, filterType]);

  const timelineEvents = useMemo(() => {
    return timelineData.flatMap(group => group.events);
  }, [timelineData]);

  // Removed unused sortedRecords variable

  const handleDelete = (recordId) => {
    deleteRecord(recordId);
    setDeleteConfirm(null);
  };

  const handleEventClick = (event) => {
    if (event.type === 'upload') {
      setSelectedRecord(event);
      setShowDetailModal(true);
    } else if (event.type === 'share') {
      // Could show share details modal
      console.log('Share event clicked:', event);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRecord(null);
  };

  const handleShare = async (recordId) => {
    if (recordId) {
      setShareRecord(recordId);
    } else if (shareEmail && shareRecord) {
      setIsSharing(true);
      try {
        await generateSharePackage(shareEmail, {
          recordId: shareRecord,
          recipientName: shareEmail.split('@')[0]
        });
        setShareRecord(null);
        setShareEmail('');
        // Close detail modal if open
        handleCloseDetailModal();
        // Show success message or navigate
      } catch (error) {
        console.error('Share failed:', error);
        // Show error message
      } finally {
        setIsSharing(false);
      }
    }
  };

  const handleDeleteFromModal = (recordId) => {
    setDeleteConfirm(recordId);
    handleCloseDetailModal();
  };

  const handleToggleVisibilityFromModal = (recordId) => {
    toggleRecordVisibility(recordId);
    handleCloseDetailModal();
  };

  const getStats = () => {
    const completed = records.filter(r => r.status === 'completed').length;
    const processing = records.filter(r => r.status === 'processing').length;
    const hidden = records.filter(r => r.hidden).length;
    const shareHistory = getShareHistory();
    return { completed, processing, hidden, totalShares: shareHistory.length };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="pt-safe-top">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-6 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Health Timeline
              </h1>
              <p className="text-gray-600 mt-1">
                {timelineEvents.length} events • {records.length} records
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowShareHistory(true)}
                className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100:bg-purple-900/50 transition-colors"
              >
                <ShareIcon className="w-5 h-5" />
              </motion.button>

              <div className="flex bg-white rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100:bg-gray-700'
                  }`}
                >
                  {viewMode === 'list' ? (
                    <ListBulletIconSolid className="w-4 h-4" />
                  ) : (
                    <ListBulletIcon className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100:bg-gray-700'
                  }`}
                >
                  {viewMode === 'grid' ? (
                    <Squares2X2IconSolid className="w-4 h-4" />
                  ) : (
                    <Squares2X2Icon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex space-x-2 mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterType('all')}
              className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                filterType === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <ClockIcon className="w-4 h-4" />
              All Events
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterType('uploads')}
              className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                filterType === 'uploads'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              Uploads
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterType('shares')}
              className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                filterType === 'shares'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Shares
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-green-600">Completed</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-orange-600">{stats.processing}</p>
              <p className="text-xs text-orange-600">Processing</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-600">{stats.hidden}</p>
              <p className="text-xs text-gray-600">Hidden</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-purple-600">{stats.totalShares}</p>
              <p className="text-xs text-purple-600">Shares</p>
            </div>
          </div>
        </motion.div>

        {/* Timeline Events */}
        <div className="px-4 py-6">
          {timelineEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Events Yet
              </h3>
              <p className="text-gray-600">
                {filterType === 'shares' ?
                  'Share your first record to see it here' :
                  'Upload your first health record to get started'}
              </p>
            </motion.div>
          ) : viewMode === 'grid' ? (
            /* Grid View - No timeline connectors */
            <div className="grid grid-cols-2 gap-4">
              {timelineEvents.map((event, index) => (
                <TimelineEvent
                  key={event.id || `${event.type}-${index}`}
                  event={event}
                  viewMode={viewMode}
                  showConnector={false}
                  onClick={handleEventClick}
                />
              ))}
            </div>
          ) : (
            /* Timeline View with Date Sections */
            <div className="relative">
              {timelineData.map((dateGroup, groupIndex) => {
                const formatSectionDate = (date) => {
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);

                  if (date.toDateString() === today.toDateString()) {
                    return 'Today';
                  } else if (date.toDateString() === yesterday.toDateString()) {
                    return 'Yesterday';
                  } else {
                    return date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    });
                  }
                };

                return (
                  <motion.div
                    key={dateGroup.date.toDateString()}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.1 }}
                  >
                    {/* Sticky Section Header */}
                    <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-xl px-4 py-3 mb-6 -mx-4">
                      <h3 className="font-semibold text-gray-600 text-sm">
                        {formatSectionDate(dateGroup.date)}
                      </h3>
                    </div>

                    {/* Events for this date */}
                    <div className="space-y-4">
                      {dateGroup.events.map((event, eventIndex) => {
                        const isFirst = eventIndex === 0;
                        const isLast = eventIndex === dateGroup.events.length - 1 && groupIndex === timelineData.length - 1;

                        return (
                          <TimelineEvent
                            key={event.id || `${event.type}-${eventIndex}`}
                            event={event}
                            viewMode={viewMode}
                            isFirst={isFirst && groupIndex === 0}
                            isLast={isLast}
                            showConnector={true}
                            isActive={selectedRecord?.id === event.id}
                            onClick={handleEventClick}
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Record Detail Modal */}
        <RecordDetailModal
          record={selectedRecord}
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
          onShare={handleShare}
          onDelete={handleDeleteFromModal}
          onToggleVisibility={handleToggleVisibilityFromModal}
        />

        {/* Share History Modal */}
        <ShareHistory
          isOpen={showShareHistory}
          onClose={() => setShowShareHistory(false)}
        />

        {/* Share Single Record Modal */}
        {shareRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setShareRecord(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Share Record
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Enter the healthcare provider's email address to share this record.
              </p>

              <input
                type="email"
                placeholder="provider@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white:bg-gray-700 transition-all mb-6"
              />

              <div className="flex space-x-3">
                <button
                  onClick={() => setShareRecord(null)}
                  className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleShare()}
                  disabled={!shareEmail || isSharing}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-2xl font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSharing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"
                    />
                  ) : (
                    'Share'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Record?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. The record will be permanently removed.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-red-500 text-white py-3 rounded-2xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default TimelinePage;
