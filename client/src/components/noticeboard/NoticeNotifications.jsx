import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import NotificationPopup from '../common/NotificationPopup';
import socket from '../../utils/socket';
import { X, Bell } from 'lucide-react';

const NoticeNotifications = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    showNotification,
    currentNotification,
    markAsRead,
    markAllAsRead,
    hideNotification,
    clearNotification
  } = useNotifications();

  const [localToasts, setLocalToasts] = useState([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ ISOLATED SOCKET FIREWALL: Only listens for 'receive_notice', NOT chat messages
  useEffect(() => {
    const handleNewSocketMessage = (rawMsg) => {
      if (!rawMsg) return;

      try {
        const newToast = {
          id: Math.random().toString(36).substring(2, 9),
          title: rawMsg?.title || (rawMsg?.sender?.name ? `Message from ${rawMsg.sender.name}` : 'New Notification'),
          body: rawMsg?.text || rawMsg?.body || 'You received a new notification.',
        };

        setLocalToasts((prev) => [...prev, newToast]);

        setTimeout(() => {
          setLocalToasts((currentToasts) => 
            currentToasts.filter((toast) => toast.id !== newToast.id)
          );
        }, 3000);

      } catch (err) {
        console.error("Blocked notification crash:", err);
      }
    };

    if (socket) {
      // It is CRITICAL that this does NOT say 'receive_message'
      socket.on('receive_notice', handleNewSocketMessage);
    }

    return () => {
      if (socket) {
        socket.off('receive_notice', handleNewSocketMessage);
      }
    };
  }, []);

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    if (notification.data?._id && notification.groupId) {
      sessionStorage.setItem('highlightNotice', notification.data._id);
      
      navigate('/groups');
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openNoticeBoard', {
          detail: {
            groupId: notification.groupId,
            noticeId: notification.data._id,
            groupName: notification.groupName
          }
        }));
      }, 100);
    }
    setShowDropdown(false);
  };

  const handleViewAll = () => {
    setShowDropdown(false);
    // navigate('/notifications');
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifTime.toLocaleDateString();
  };

  const getNotificationIcon = (type, priority) => {
    if (type === 'notice') {
      return (
        <div className={`flex-shrink-0 ${
          priority === 'urgent' ? 'text-red-500' :
          priority === 'high' ? 'text-orange-500' :
          priority === 'medium' ? 'text-yellow-500' :
          'text-green-500'
        }`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
      );
    }
    return (
      <div className="flex-shrink-0 text-blue-500">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  };

  return (
    <>
      {localToasts.length > 0 && (
        <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
          {localToasts.map((toast) => (
            <div 
              key={toast.id} 
              className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 w-72 sm:w-80 flex items-start gap-3 animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto"
            >
              <div className="bg-indigo-100 p-2 rounded-full shrink-0 mt-0.5">
                 <Bell className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0 mt-0.5">
                <h4 className="text-sm font-bold text-slate-900 truncate">{toast.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{toast.body}</p>
              </div>
              <button 
                onClick={() => setLocalToasts(t => t.filter(x => x.id !== toast.id))}
                className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notification Bell */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Notifications"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[1.5rem] h-6 animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
              <div>
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {unreadCount} unread • {notifications.length} total
                </p>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">When you get notifications, they'll appear here</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all ${
                      !notification.read ? 'bg-blue-50/30 hover:bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      {getNotificationIcon(notification.type, notification.priority)}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.groupName && (
                          <p className="text-xs text-indigo-600 mt-1 font-medium">
                            #{notification.groupName}
                          </p>
                        )}
                      </div>

                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleViewAll}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-800 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Context Notification Popup (Wrapped safely) */}
      {showNotification && currentNotification && (
        <NotificationPopup
          notification={currentNotification}
          onClose={hideNotification}
          onClick={() => {
            try {
              markAsRead(currentNotification.id);
              if (currentNotification.data?._id && currentNotification.groupId) {
                sessionStorage.setItem('targetNotice', JSON.stringify({
                  noticeId: currentNotification.data._id,
                  groupId: currentNotification.groupId
                }));
                sessionStorage.setItem('highlightNotice', currentNotification.data._id);
                
                navigate('/groups');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('openNoticeBoard', {
                    detail: {
                      groupId: currentNotification.groupId,
                      noticeId: currentNotification.data._id,
                      groupName: currentNotification.groupName
                    }
                  }));
                }, 300);
              }
              hideNotification();
            } catch (err) {
              console.error("Popup click error handled:", err);
            }
          }}
        />
      )}
    </>
  );
};

export default NoticeNotifications;