import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { notificationsApi } from '../api/notificationsApi';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const connectionRef = useRef(null);

  const refreshCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch {
      // silently fail
    }
  }, [isAuthenticated]);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
      await refreshCount();
    } catch {
      // silently fail
    }
  }, [isAuthenticated, refreshCount]);

  // Set up SignalR listener for real-time unread updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/chat', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on('UnreadCountUpdated', () => {
      refreshCount();
    });

    connection.on('ReceiveMessage', () => {
      refreshCount();
    });

    connection.start().catch(() => {
      // Fall back to polling if SignalR fails
    });

    return () => {
      connection.stop();
    };
  }, [isAuthenticated, refreshCount]);

  // Polling fallback
  useEffect(() => {
    if (isAuthenticated) {
      refreshCount();
      const interval = setInterval(refreshCount, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, refreshCount]);

  const markRead = async (id) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, refreshNotifications, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
