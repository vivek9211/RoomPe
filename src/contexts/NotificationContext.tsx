import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { NotificationService } from '../services/notifications/notificationService';
import { NotificationStatus } from '../types/notification.types';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  markAllAsViewed: () => void;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch unread notification count
  const refreshUnreadCount = async () => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const notifications = await NotificationService.getUserNotifications(user.uid, 100);
      const unreadNotifications = notifications.filter(n => n.status !== NotificationStatus.READ);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as viewed (clear badge)
  const markAllAsViewed = () => {
    setUnreadCount(0);
  };

  // Refresh count when user changes
  useEffect(() => {
    refreshUnreadCount();
  }, [user?.uid]);

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    if (!user?.uid) return;

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user?.uid]);

  const value: NotificationContextType = {
    unreadCount,
    refreshUnreadCount,
    markAllAsViewed,
    loading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
