import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  Notification, 
  NotificationStatus, 
  NotificationType, 
  NotificationPriority 
} from '../../types/notification.types';
import firestore from '@react-native-firebase/firestore';
import { NotificationService } from '../../services/notifications/notificationService';

interface NotificationsScreenProps {
  navigation: any;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { markAllAsViewed, refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load notifications
  const loadNotifications = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      const notificationsData = await NotificationService.getUserNotifications(user.uid, 50);
      setNotifications(notificationsData);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      
      if (error?.code === 'firestore/permission-denied' || error?.code === 'permission-denied') {
        Alert.alert(
          'Permission Error', 
          'Unable to load notifications. Please make sure you are logged in and try again.',
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load notifications. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, status: NotificationStatus.READ }
            : notification
        )
      );

      // Refresh unread count
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.uid) return;

    try {
      const batch = firestore().batch();
      const unreadNotifications = notifications.filter(
        n => n.status !== NotificationStatus.READ
      );

      unreadNotifications.forEach(notification => {
        const notificationRef = firestore()
          .collection('notifications')
          .doc(notification.id);
        batch.update(notificationRef, {
          status: NotificationStatus.READ,
          readAt: firestore.Timestamp.now(),
        });
      });

      await batch.commit();

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          status: NotificationStatus.READ,
        }))
      );

      Alert.alert('Success', 'All notifications marked as read');
      
      // Refresh unread count
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await firestore()
        .collection('notifications')
        .doc(notificationId)
        .delete();

      // Update local state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  // Handle notification press
  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if not already read
    if (notification.status !== NotificationStatus.READ) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case NotificationType.COMPLAINT_FILED:
        if (notification.metadata?.complaintId) {
          navigation.navigate('ComplaintDetail', { 
            complaintId: notification.metadata.complaintId 
          });
        }
        break;
      case NotificationType.MAINTENANCE_REQUEST:
        if (notification.metadata?.maintenanceId) {
          navigation.navigate('MaintenanceDetail', { 
            maintenanceId: notification.metadata.maintenanceId 
          });
        }
        break;
      case NotificationType.PAYMENT_CONFIRMATION:
        if (notification.metadata?.paymentId) {
          navigation.navigate('PaymentDetail', { 
            paymentId: notification.metadata.paymentId 
          });
        }
        break;
      default:
        // For other types, just mark as read (already done above)
        break;
    }
  };

  // Refresh notifications
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };


  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.COMPLAINT_FILED:
      case NotificationType.COMPLAINT_UPDATE:
      case NotificationType.COMPLAINT_RESOLVED:
        return 'alert-circle-outline';
      case NotificationType.MAINTENANCE_REQUEST:
      case NotificationType.MAINTENANCE_UPDATE:
      case NotificationType.MAINTENANCE_COMPLETED:
        return 'construct-outline';
      case NotificationType.PAYMENT_CONFIRMATION:
      case NotificationType.PAYMENT_REMINDER:
        return 'card-outline';
      case NotificationType.RENT_DUE:
      case NotificationType.RENT_OVERDUE:
        return 'time-outline';
      default:
        return 'notifications-outline';
    }
  };

  // Get notification color based on priority
  const getNotificationColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return colors.error;
      case NotificationPriority.HIGH:
        return colors.warning;
      case NotificationPriority.MEDIUM:
        return colors.primary;
      case NotificationPriority.LOW:
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  // Format notification time
  const formatNotificationTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  useEffect(() => {
    if (user?.uid) {
      loadNotifications();
      // Clear the badge when notification screen is opened
      markAllAsViewed();
    }
  }, [user?.uid]);

  // Refresh unread count when notifications are updated
  useEffect(() => {
    if (user?.uid) {
      refreshUnreadCount();
    }
  }, [notifications, user?.uid]);

  const unreadCount = notifications.filter(n => n.status !== NotificationStatus.READ).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="notifications-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyMessage}>
              You'll see notifications about complaints, payments, and maintenance here.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                notification.status !== NotificationStatus.READ && styles.unreadCard,
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <View style={styles.iconContainer}>
                    <Icon
                      name={getNotificationIcon(notification.type)}
                      size={20}
                      color={getNotificationColor(notification.priority)}
                    />
                  </View>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatNotificationTime(notification.createdAt)}
                    </Text>
                  </View>
                  {notification.status !== NotificationStatus.READ && (
                    <View style={styles.unreadDot} />
                  )}
                </View>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  Alert.alert(
                    'Delete Notification',
                    'Are you sure you want to delete this notification?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete', 
                        style: 'destructive',
                        onPress: () => deleteNotification(notification.id)
                      },
                    ]
                  );
                }}
              >
                <Icon name="trash-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    padding: dimensions.spacing.sm,
    marginLeft: -dimensions.spacing.sm,
  },
  headerTitle: {
    fontSize: fonts.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  markAllButton: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
  },
  markAllText: {
    fontSize: fonts.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xl * 2,
  },
  loadingText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: fonts.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.sm,
  },
  emptyMessage: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: dimensions.spacing.xl,
  },
  notificationCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    marginVertical: dimensions.spacing.xs,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: dimensions.spacing.xs,
  },
  iconContainer: {
    marginRight: dimensions.spacing.sm,
    marginTop: 1,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 1,
  },
  notificationTime: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginLeft: dimensions.spacing.xs,
    marginTop: 4,
  },
  notificationMessage: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginLeft: 32, // Align with title (icon width + margin)
  },
  deleteButton: {
    padding: dimensions.spacing.xs,
    marginLeft: dimensions.spacing.xs,
  },
});

export default NotificationsScreen;
