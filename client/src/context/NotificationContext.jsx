import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    const savedUnreadCount = localStorage.getItem('unreadCount');

    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications);
      // Convert string dates back to Date objects
      const restored = parsed.map(n => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
      setNotifications(restored);
    }

    if (savedUnreadCount) {
      setUnreadCount(parseInt(savedUnreadCount));
    }
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    localStorage.setItem('unreadCount', unreadCount.toString());
  }, [notifications, unreadCount]);

  // Fetch unread count from server
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notices/unread/count');
      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Fetch user's groups to join socket rooms
  const fetchUserGroups = useCallback(async () => {
    try {
      const response = await api.get('/groups/my-groups');
      if (response.data.success && socketRef.current) {
        const groupIds = response.data.groups.map(g => g.group._id);
        console.log('Joining groups:', groupIds);
        socketRef.current.emit('join-groups', groupIds);
        reconnectAttempts.current = 0; // reset on success
      }
    } catch (error) {
      console.error('Failed to fetch user groups for socket:', error);
    }
  }, []);

  // Connect to socket
  useEffect(() => {
    if (!user || !token) return;

    const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const connectSocket = () => {
      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });

      socketRef.current = newSocket;

      newSocket.on('connect', async () => {
        console.log('Connected to notification server');
        await fetchUserGroups();
        fetchUnreadCount();
        reconnectAttempts.current = 0;
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reconnectAttempts.current += 1;
        if (reconnectAttempts.current > 5) {
          console.log('Max reconnection attempts reached, giving up');
          newSocket.close();
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from notification server:', reason);
        if (reason === 'io server disconnect') {
          // server disconnected, reconnect manually
          newSocket.connect();
        }
      });

      // Listen for new notices
      newSocket.on('new-notice', (data) => {
        console.log('Received new notice:', data);

        const newNotif = {
          id: data.notice._id || Date.now(),
          type: 'notice',
          title: data.priority === 'urgent' ? '🚨 URGENT NOTICE' : '📢 New Group Notice',
          message: data.message || `${data.notice.title}`,
          data: data.notice,
          priority: data.notice.priority || 'medium',
          groupId: data.notice.group,
          groupName: data.groupName, // Used by NoticeNotifications.jsx
          timestamp: new Date(),
          read: false
  };

          addNotification(newNotif);

  // OPTIONAL: Browser Native Notification (if tab is hidden)
  if (Document.visibilityState !== 'visible' && Notification.permission === 'granted') {
    new Notification(newNotif.title, { body: newNotif.message });
  }
});
      // Listen for notice updates
      newSocket.on('update-notice', (data) => {
        console.log('Notice updated:', data);
        addNotification({
          id: data.notice?._id || Date.now(),
          type: 'notice-update',
          title: 'Notice Updated',
          message: data.message,
          data: data.notice,
          groupId: data.notice?.group,
          timestamp: new Date(),
          read: false
        });
      });

      // Listen for notice deletions
      newSocket.on('delete-notice', (data) => {
        console.log('Notice deleted:', data);
        // Remove any notifications related to this notice
        setNotifications(prev => prev.filter(n => n.data?._id !== data.noticeId));
      });

      setSocket(newSocket);
    };

    connectSocket();

    return () => {
      console.log('Cleaning up socket connection');
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [user, token, fetchUserGroups, fetchUnreadCount]);

  // Poll unread count every minute as fallback
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  const addNotification = (notification) => {
    setNotifications(prev => {
      // Check if notification already exists
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;

      const newNotifications = [notification, ...prev].slice(0, 50); // Keep last 50
      return newNotifications;
    });

    setCurrentNotification(notification);
    setShowNotification(true);
    setUnreadCount(prev => prev + 1);

    // Trigger vibration if supported and in mobile
    if (window.navigator.vibrate && /Mobi|Android/i.test(navigator.userAgent)) {
      window.navigator.vibrate(200);
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === notificationId && !n.read) {
          setUnreadCount(count => Math.max(0, count - 1));
          return { ...n, read: true };
        }
        return n;
      })
    );
  };

  const markAllAsRead = () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    setUnreadCount(0);
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );

    // Optionally notify server that all are read
    unreadNotifications.forEach(notification => {
      if (notification.data?._id) {
        api.post(`/notices/${notification.data._id}/view`).catch(console.error);
      }
    });
  };

  const hideNotification = () => {
    setShowNotification(false);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const value = {
    notifications,
    unreadCount,
    showNotification,
    currentNotification,
    addNotification,
    markAsRead,
    markAllAsRead,
    hideNotification,
    clearNotification,
    fetchUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};