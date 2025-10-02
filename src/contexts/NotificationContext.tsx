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
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const notifications = await NotificationService.getUserNotifications(user.uid, 100);
      const unreadNotifications = notifications.filter(n => n.status !== NotificationStatus.READ);
      setUnreadCount(unreadNotifications.length);
    } catch (error: any) {
      // Only log error if user is still authenticated (avoid logout errors)
      if (user?.uid && error?.code !== 'firestore/permission-denied') {
        console.error('Error fetching unread notification count:', error);
      }
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
    if (user?.uid) {
      refreshUnreadCount();
    } else {
      // Clear count and stop loading when user logs out
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user?.uid]);

  // Set up periodic refresh (every 30 seconds) only when user is authenticated
  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const interval = setInterval(() => {
      // Double-check user is still authenticated before refreshing
      if (user?.uid) {
        refreshUnreadCount();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user?.uid]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear state when provider unmounts
      setUnreadCount(0);
      setLoading(false);
    };
  }, []);

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
