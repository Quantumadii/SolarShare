import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCircle, Heart, Eye, Send, X, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Notifications = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
    const { isDarkMode } = useTheme();

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'success': return <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center"><CheckCircle size={20} className="text-emerald-500" /></div>;
            case 'interest': return <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center"><Heart size={20} className="text-blue-500" /></div>;
            case 'view': return <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center"><Eye size={20} className="text-purple-500" /></div>;
            case 'sent': return <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center"><Send size={20} className="text-orange-500" /></div>;
            default: return <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><Bell size={20} className="text-gray-500" /></div>;
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="theme-page-bg fixed inset-0 z-50">
            <div className="max-w-md mx-auto h-full flex flex-col">
                <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center">
                                <Bell size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Notifications</h2>
                                <p className="text-sm text-gray-500">{unreadCount} unread</p>
                            </div>
                        </div>
                        <button onClick={clearNotifications} className={`p-2 rounded-xl ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                            <Trash2 size={20} />
                        </button>
                    </div>
                    {unreadCount > 0 && (
                        <button 
                            onClick={markAllAsRead}
                            className="w-full py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {notifications.length > 0 ? (
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <div 
                                    key={notification.id}
                                    onClick={() => markAsRead(notification.id)}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all ${
                                        notification.read 
                                            ? isDarkMode ? 'bg-gray-800' : 'bg-gray-50' 
                                            : isDarkMode ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-emerald-50 border border-emerald-100'
                                    }`}
                                >
                                    <div className="flex gap-4">
                                        {getNotificationIcon(notification.type)}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatTime(notification.timestamp)}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className={`w-20 h-20 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
                                <Bell size={40} className={isDarkMode ? 'text-gray-600' : 'text-gray-300'} />
                            </div>
                            <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No notifications yet</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>You'll see updates here when they happen</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
