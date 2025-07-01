import React, { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: 'score_change' | 'trend_shift' | 'data_update' | 'quality_alert' | 'collaboration';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  read: boolean;
  action_required: boolean;
  action_url?: string;
}

interface NotificationCenterProps {
  problemId: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'score_change',
    title: 'Market Opportunity Score Updated',
    message: 'Market data indicates 15% growth in renewable energy sector, affecting your assessment score.',
    severity: 'medium',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    action_required: true,
    action_url: '/assessment'
  },
  {
    id: '2',
    type: 'trend_shift',
    title: 'New Regulatory Changes Detected',
    message: 'Government announces new sustainability requirements that may impact feasibility scoring.',
    severity: 'high',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    read: false,
    action_required: true
  },
  {
    id: '3',
    type: 'data_update',
    title: 'Patent Activity Spike',
    message: 'Patent filings in your technology area increased by 25% in the last quarter.',
    severity: 'medium',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    read: true,
    action_required: false
  },
  {
    id: '4',
    type: 'quality_alert',
    title: 'Source Verification Required',
    message: '3 sources in your assessment need verification to maintain quality standards.',
    severity: 'high',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    read: false,
    action_required: true
  },
  {
    id: '5',
    type: 'collaboration',
    title: 'New Expert Review Available',
    message: 'Dr. Sarah Chen has completed her review of your assessment and provided feedback.',
    severity: 'low',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    read: false,
    action_required: false
  }
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ problemId }) => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'action_required'>('all');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'score_change': return '📊';
      case 'trend_shift': return '📈';
      case 'data_update': return '🔄';
      case 'quality_alert': return '⚠️';
      case 'collaboration': return '👥';
      default: return '📢';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'action_required') return n.action_required;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.action_required).length;

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-4 p-4 border rounded bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Notification Center</h2>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 text-sm hover:underline"
          >
            {showAll ? 'Show Summary' : 'Show All'}
          </button>
        </div>
      </div>

      {/* Summary View */}
      {!showAll && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
            <div className="text-sm text-gray-600">Unread</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded">
            <div className="text-2xl font-bold text-orange-600">{actionRequiredCount}</div>
            <div className="text-sm text-gray-600">Action Required</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">{notifications.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 rounded text-sm ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('action_required')}
          className={`px-3 py-1 rounded text-sm ${filter === 'action_required' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Action Required ({actionRequiredCount})
        </button>
      </div>

      {/* Notifications List */}
      {showAll && (
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notifications to display
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded p-3 ${notification.read ? 'bg-gray-50' : 'bg-white'} ${
                  notification.action_required ? 'border-l-4 border-l-orange-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-xl">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(notification.severity)}`}>
                          {notification.severity}
                        </span>
                        {notification.action_required && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            Action Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatTime(notification.timestamp)}</span>
                        {notification.action_url && (
                          <a href={notification.action_url} className="text-blue-600 hover:underline">
                            View Details →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Actions */}
      {showAll && notifications.length > 0 && (
        <div className="flex justify-between items-center pt-4 border-t">
          <button
            onClick={markAllAsRead}
            className="text-blue-600 text-sm hover:underline"
          >
            Mark All as Read
          </button>
          <button
            onClick={() => setNotifications([])}
            className="text-red-600 text-sm hover:underline"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}; 