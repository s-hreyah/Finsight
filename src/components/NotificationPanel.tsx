import { useState } from 'react';
import {
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Settings,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Notification } from '../types';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../services/notification';
import { Timestamp } from "firebase/firestore";

interface NotificationsPanelProps {
  notifications: Notification[];
  userId: string;
  onRefresh?: () => void;
}

export function NotificationsPanel({
  notifications,
  userId,
  onRefresh
}: NotificationsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  // ✅ SAFE DATE HANDLER (FIXED)
  const getDate = (timestamp: any) => {
    if (!timestamp) return null;

    if (timestamp instanceof Timestamp) {
      return new Date(timestamp.toMillis());
    }

    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  };

  // ✅ TIME AGO FORMATTER (FIXED)
  const formatTimeAgo = (timestamp: any) => {
    const date = getDate(timestamp);
    if (!date) return "No date";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter(n => n.status === 'unread')
      : notifications;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'budget_alert':
        return <AlertTriangle className="text-amber-500" size={20} />;
      case 'income_update':
        return <TrendingUp className="text-emerald-500" size={20} />;
      case 'reminder':
        return <Clock className="text-blue-500" size={20} />;
      case 'system':
        return <Settings className="text-gray-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const getNotificationBg = (type: Notification['type']) => {
    switch (type) {
      case 'budget_alert':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'income_update':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'reminder':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'system':
        return 'bg-gray-500/10 border-gray-500/20';
      default:
        return 'bg-gray-800 border-gray-700';
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    onRefresh?.();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId);
    onRefresh?.();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    onRefresh?.();
  };

  return (
    <div className="relative">

      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-md transition-colors",
          isOpen
            ? "bg-gray-800 text-white"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
        )}
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-12 w-96 bg-[#0F1115] border border-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden"
          >

            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-bold">Notifications</h3>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-emerald-500"
                  >
                    Mark all read
                  </button>
                )}

                <button onClick={() => setIsOpen(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex border-b border-gray-800">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  "flex-1 py-2 text-xs",
                  filter === 'all'
                    ? "text-white border-b-2 border-emerald-500"
                    : "text-gray-500"
                )}
              >
                All
              </button>

              <button
                onClick={() => setFilter('unread')}
                className={cn(
                  "flex-1 py-2 text-xs",
                  filter === 'unread'
                    ? "text-white border-b-2 border-emerald-500"
                    : "text-gray-500"
                )}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  No notifications
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <motion.div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-gray-800 hover:bg-gray-800/50",
                      notification.status === 'unread' && "bg-gray-800/30"
                    )}
                  >
                    <div className="flex gap-3">

                      <div className={cn("p-2 rounded-lg border", getNotificationBg(notification.type))}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white">
                          {notification.title}
                        </h4>

                        <p className="text-xs text-gray-500 mt-1">
                          {notification.message}
                        </p>

                        <p className="text-[10px] text-gray-600 mt-2">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        {notification.status === 'unread' && (
                          <button onClick={() => handleMarkAsRead(notification.id)}>
                            <Check size={14} />
                          </button>
                        )}

                        <button onClick={() => handleDelete(notification.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>

                    </div>
                  </motion.div>
                ))
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}