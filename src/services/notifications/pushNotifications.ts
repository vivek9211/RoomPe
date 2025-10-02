import { Platform } from 'react-native';
import { NotificationType, NotificationPriority } from '../../types/notification.types';
import { firestoreService } from '../firestore';

// Conditional import for Firebase messaging
let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.log('Firebase messaging not installed, push notifications will be disabled');
}

export class PushNotificationService {
  private static fcmToken: string | null = null;

  // Initialize push notifications
  static async initialize(): Promise<void> {
    try {
      if (!messaging) {
        console.log('Firebase messaging not available, skipping push notification initialization');
        return;
      }

      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Push notification permission granted');
        
        // Get FCM token
        const token = await messaging().getToken();
        this.fcmToken = token;
        console.log('FCM Token:', token);

        // Save token to user profile
        await this.saveTokenToUserProfile(token);

        // Set up message handlers
        this.setupMessageHandlers();
      } else {
        console.log('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  // Save FCM token to user profile
  private static async saveTokenToUserProfile(token: string): Promise<void> {
    try {
      // Get current user from auth context
      // For now, we'll skip saving the token since we don't have access to auth context here
      // This should be handled by the calling component with proper auth context
      console.log('FCM token received:', token);
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  // Set up message handlers
  private static setupMessageHandlers(): void {
    if (!messaging) {
      console.log('Firebase messaging not available, skipping message handlers setup');
      return;
    }

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('Background message received:', remoteMessage);
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage: any) => {
      console.log('Foreground message received:', remoteMessage);
    });

    // Handle notification tap when app is in background/quit
    messaging().onNotificationOpenedApp((remoteMessage: any) => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationTap(remoteMessage);
    });

    // Handle notification tap when app is quit
    messaging()
      .getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          console.log('Notification opened app from quit state:', remoteMessage);
          this.handleNotificationTap(remoteMessage);
        }
      });
  }

  // Handle notification tap
  private static handleNotificationTap(remoteMessage: any): void {
    const { data } = remoteMessage;
    if (data?.type) {
      // Navigate based on notification type
      switch (data.type) {
        case NotificationType.RENT_DUE:
        case NotificationType.RENT_OVERDUE:
          // Navigate to payments screen
          break;
        case NotificationType.MAINTENANCE_REQUEST:
        case NotificationType.MAINTENANCE_UPDATE:
          // Navigate to maintenance screen
          break;
        case NotificationType.PAYMENT_CONFIRMATION:
          // Navigate to payment history
          break;
        default:
          break;
      }
    }
  }

  // Get FCM token
  static getFCMToken(): string | null {
    return this.fcmToken;
  }

  // Check if notifications are enabled
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      if (!messaging) {
        console.log('Firebase messaging not available');
        return false;
      }

      const authStatus = await messaging().hasPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  // Send rent due reminder push notification
  static async sendRentDueReminder(
    userId: string,
    tenantName: string,
    propertyName: string,
    roomNumber: string,
    rentAmount: number,
    dueDate: Date,
    reminderType: string
  ): Promise<void> {
    try {
      console.log('Sending rent due reminder push notification:', {
        userId,
        tenantName,
        propertyName,
        roomNumber,
        rentAmount,
        dueDate,
        reminderType,
      });

      // In a full implementation, you would send push notification via FCM here
      // For now, we'll just log the notification details
      const message = reminderType === 'overdue' 
        ? `Your rent of ₹${rentAmount.toLocaleString('en-IN')} for ${propertyName} - Room ${roomNumber} is overdue.`
        : `Your rent of ₹${rentAmount.toLocaleString('en-IN')} for ${propertyName} - Room ${roomNumber} is due soon.`;

      console.log('Push notification message:', message);
    } catch (error) {
      console.error('Error sending rent due reminder push notification:', error);
    }
  }

  // Send maintenance request notification
  static async sendMaintenanceRequestNotification(
    userId: string,
    tenantName: string,
    propertyName: string,
    roomNumber: string,
    issueTitle: string,
    priority: NotificationPriority
  ): Promise<void> {
    try {
      console.log('Sending maintenance request push notification:', {
        userId,
        tenantName,
        propertyName,
        roomNumber,
        issueTitle,
        priority,
      });

      const message = `New maintenance request: "${issueTitle}" for ${propertyName} - Room ${roomNumber}`;
      console.log('Push notification message:', message);
    } catch (error) {
      console.error('Error sending maintenance request push notification:', error);
    }
  }

  // Send maintenance update notification
  static async sendMaintenanceUpdateNotification(
    userId: string,
    tenantName: string,
    propertyName: string,
    roomNumber: string,
    issueTitle: string,
    status: string,
    assignedTo?: string
  ): Promise<void> {
    try {
      console.log('Sending maintenance update push notification:', {
        userId,
        tenantName,
        propertyName,
        roomNumber,
        issueTitle,
        status,
        assignedTo,
      });

      const message = `Maintenance update: "${issueTitle}" for ${propertyName} - Room ${roomNumber} has been ${status.toLowerCase()}.`;
      console.log('Push notification message:', message);
    } catch (error) {
      console.error('Error sending maintenance update push notification:', error);
    }
  }

  // Send payment confirmation notification
  static async sendPaymentConfirmationNotification(
    userId: string,
    tenantName: string,
    propertyName: string,
    roomNumber: string,
    amount: number,
    paymentMethod: string
  ): Promise<void> {
    try {
      console.log('Sending payment confirmation push notification:', {
        userId,
        tenantName,
        propertyName,
        roomNumber,
        amount,
        paymentMethod,
      });

      const message = `Payment confirmed: ₹${amount.toLocaleString('en-IN')} for ${propertyName} - Room ${roomNumber}`;
      console.log('Push notification message:', message);
    } catch (error) {
      console.error('Error sending payment confirmation push notification:', error);
    }
  }
}

export default PushNotificationService;
