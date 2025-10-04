import { getFirestore, collection, query, where, getDocs, orderBy, limit, addDoc, updateDoc, doc, Timestamp } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { 
  Notification, 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus,
  NotificationChannel,
  CreateNotificationData 
} from '../../types/notification.types';
import { firestoreService } from '../firestore';
import { LocalNotificationService } from './localNotifications';
import PushNotificationService from './pushNotifications';

export class NotificationService {
  // Create and send a notification
  static async createNotification(
    notificationData: CreateNotificationData,
    sendImmediately: boolean = true
  ): Promise<string | null> {
    try {
      // Create notification document in Firestore
      const notificationId = await this.saveNotificationToFirestore(notificationData);
      
      if (sendImmediately && notificationId) {
        // Send the notification
        await this.sendNotification(notificationId, notificationData);
      }
      
      return notificationId;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // Save notification to Firestore
  private static async saveNotificationToFirestore(
    notificationData: CreateNotificationData
  ): Promise<string | null> {
    try {
      // Check if user is authenticated
        const currentUser = getAuth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Also clean metadata if it exists
      let cleanMetadata = {
        isAutomated: true,
        source: 'system',
        createdBy: currentUser.uid,
      };
      
      if (notificationData.metadata) {
        const filteredMetadata = Object.fromEntries(
          Object.entries(notificationData.metadata).filter(([_, value]) => value !== undefined)
        );
        cleanMetadata = { ...cleanMetadata, ...filteredMetadata };
      }

      const notification: Omit<Notification, 'id'> = {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        priority: notificationData.priority,
        status: NotificationStatus.PENDING,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        delivery: {
          channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
          retryCount: 0,
          maxRetries: 3,
        },
        metadata: cleanMetadata as any,
      };

        const db = getFirestore();
        const notificationsRef = collection(db, 'notifications');
        const docRef = await addDoc(notificationsRef, notification);

      return docRef.id;
    } catch (error: any) {
      if (error?.code === 'firestore/permission-denied' || error?.code === 'permission-denied') {
        console.log('Notification creation skipped due to insufficient permissions.');
      } else {
        console.error('Error saving notification to Firestore:', error);
      }
      return null;
    }
  }

  // Send notification via appropriate channels
  private static async sendNotification(
    notificationId: string,
    notificationData: CreateNotificationData
  ): Promise<void> {
    try {
      const { type, userId, title, message, priority } = notificationData;

      // Get user details
      const user = await firestoreService.getUserProfile(userId);
      if (!user) {
        console.error('User not found for notification:', userId);
        return;
      }

      // Get tenant details if available
      const tenant = await this.getTenantByUserId(userId);
      const propertyName = tenant?.propertyId ? await this.getPropertyName(tenant.propertyId) : 'Your Property';
      const roomNumber = tenant?.roomId ? await this.getRoomNumber(tenant.roomId) : '';

      // Send based on notification type
      switch (type) {
        case NotificationType.RENT_DUE:
          await this.sendRentDueNotification(notificationId, user, tenant, propertyName, roomNumber, notificationData);
          break;
        case NotificationType.RENT_OVERDUE:
          await this.sendRentOverdueNotification(notificationId, user, tenant, propertyName, roomNumber, notificationData);
          break;
        case NotificationType.MAINTENANCE_REQUEST:
          await this.sendMaintenanceRequestNotification(notificationId, user, tenant, propertyName, roomNumber, notificationData);
          break;
        case NotificationType.MAINTENANCE_UPDATE:
          await this.sendMaintenanceUpdateNotification(notificationId, user, tenant, propertyName, roomNumber, notificationData);
          break;
        case NotificationType.PAYMENT_CONFIRMATION:
          await this.sendPaymentConfirmationNotification(notificationId, user, tenant, propertyName, roomNumber, notificationData);
          break;
        case NotificationType.COMPLAINT_FILED:
          await this.sendComplaintFiledNotification(notificationId, user, tenant, propertyName, roomNumber, notificationData);
          break;
        case NotificationType.COMPLAINT_UPDATE:
          await this.sendComplaintUpdateNotification(notificationId, user, tenant, propertyName, roomNumber, notificationData);
          break;
        case NotificationType.COMPLAINT_RESOLVED:
          await this.sendComplaintResolvedNotification(notificationId, user, tenant, propertyName, roomNumber, notificationData);
          break;
        default:
          await this.sendGenericNotification(notificationId, user, notificationData);
          break;
      }

      // Update notification status
      await this.updateNotificationStatus(notificationId, NotificationStatus.SENT);
    } catch (error) {
      console.error('Error sending notification:', error);
      await this.updateNotificationStatus(notificationId, NotificationStatus.FAILED);
    }
  }

  // Send rent due notification
  private static async sendRentDueNotification(
    notificationId: string,
    user: any,
    tenant: any,
    propertyName: string,
    roomNumber: string,
    notificationData: CreateNotificationData
  ): Promise<void> {
    const { metadata } = notificationData;
    const rentAmount = metadata?.rentAmount || tenant?.rent || 0;
    const dueDate = metadata?.dueDate ? new Date(metadata.dueDate) : new Date();
    const reminderType = metadata?.reminderType || 'due_date';

    // Send local notification
    if (LocalNotificationService && typeof LocalNotificationService.scheduleRentDueReminder === 'function') {
      LocalNotificationService.scheduleRentDueReminder(
        user.uid,
        user.name || 'Tenant',
        propertyName,
        roomNumber,
        rentAmount,
        dueDate,
        [7, 3, 1]
      );
    } else {
      console.error('LocalNotificationService.scheduleRentDueReminder is not available');
    }

    // Send push notification
    await PushNotificationService.sendRentDueReminder(
      user.uid,
      user.name || 'Tenant',
      propertyName,
      roomNumber,
      rentAmount,
      dueDate,
      reminderType
    );
  }

  // Send rent overdue notification
  private static async sendRentOverdueNotification(
    notificationId: string,
    user: any,
    tenant: any,
    propertyName: string,
    roomNumber: string,
    notificationData: CreateNotificationData
  ): Promise<void> {
    const { metadata } = notificationData;
    const rentAmount = metadata?.rentAmount || tenant?.rent || 0;
    const overdueDays = metadata?.overdueDays || 1;
    const lateFee = metadata?.lateFee || 0;

    // Send local notification
    if (LocalNotificationService && typeof LocalNotificationService.scheduleOverdueRentNotification === 'function') {
      LocalNotificationService.scheduleOverdueRentNotification(
        user.uid,
        user.name || 'Tenant',
        propertyName,
        roomNumber,
        rentAmount,
        overdueDays,
        lateFee
      );
    } else {
      console.error('LocalNotificationService.scheduleOverdueRentNotification is not available');
    }

    // Send push notification
    await PushNotificationService.sendRentDueReminder(
      user.uid,
      user.name || 'Tenant',
      propertyName,
      roomNumber,
      rentAmount,
      new Date(),
      'overdue'
    );
  }

  // Send maintenance request notification
  private static async sendMaintenanceRequestNotification(
    notificationId: string,
    user: any,
    tenant: any,
    propertyName: string,
    roomNumber: string,
    notificationData: CreateNotificationData
  ): Promise<void> {
    const { metadata } = notificationData;
    const issueTitle = metadata?.issueTitle || 'Maintenance Request';
    const priority = metadata?.priority || NotificationPriority.MEDIUM;

    // Send local notification
    if (LocalNotificationService && typeof LocalNotificationService.scheduleMaintenanceNotification === 'function') {
      LocalNotificationService.scheduleMaintenanceNotification(
        user.uid,
        user.name || 'Tenant',
        propertyName,
        roomNumber,
        issueTitle,
        priority
      );
    } else {
      console.error('LocalNotificationService.scheduleMaintenanceNotification is not available');
    }

    // Send push notification
    await PushNotificationService.sendMaintenanceRequestNotification(
      user.uid,
      user.name || 'Tenant',
      propertyName,
      roomNumber,
      issueTitle,
      priority
    );
  }

  // Send maintenance update notification
  private static async sendMaintenanceUpdateNotification(
    notificationId: string,
    user: any,
    tenant: any,
    propertyName: string,
    roomNumber: string,
    notificationData: CreateNotificationData
  ): Promise<void> {
    const { metadata } = notificationData;
    const issueTitle = metadata?.issueTitle || 'Maintenance Request';
    const status = metadata?.status || 'Updated';
    const assignedTo = metadata?.assignedTo;

    // Send local notification
    if (LocalNotificationService && typeof LocalNotificationService.scheduleMaintenanceUpdateNotification === 'function') {
      LocalNotificationService.scheduleMaintenanceUpdateNotification(
        user.uid,
        user.name || 'Tenant',
        propertyName,
        roomNumber,
        issueTitle,
        status,
        assignedTo
      );
    } else {
      console.error('LocalNotificationService.scheduleMaintenanceUpdateNotification is not available');
    }

    // Send push notification
    await PushNotificationService.sendMaintenanceUpdateNotification(
      user.uid,
      user.name || 'Tenant',
      propertyName,
      roomNumber,
      issueTitle,
      status,
      assignedTo
    );
  }

  // Send complaint filed notification
  private static async sendComplaintFiledNotification(
    notificationId: string,
    user: any,
    tenant: any,
    propertyName: string,
    roomNumber: string,
    notificationData: CreateNotificationData
  ): Promise<void> {
    const { metadata } = notificationData;
    const complaintTitle = metadata?.complaintTitle || 'New Complaint';
    const complaintCategory = metadata?.complaintCategory || 'General';
    const priority = metadata?.priority || NotificationPriority.MEDIUM;

    // Send local notification (using maintenance notification as fallback)
    if (LocalNotificationService && typeof LocalNotificationService.scheduleMaintenanceNotification === 'function') {
      LocalNotificationService.scheduleMaintenanceNotification(
        user.uid,
        user.name || 'Property Owner',
        propertyName,
        roomNumber,
        `${complaintCategory}: ${complaintTitle}`,
        priority
      );
    } else {
      console.log('LocalNotificationService not available, skipping local notification');
    }

    // Send push notification
    await PushNotificationService.sendComplaintFiledNotification(
      user.uid,
      user.name || 'Property Owner',
      propertyName,
      roomNumber,
      complaintTitle,
      complaintCategory,
      priority
    );
  }

  // Send complaint update notification
  private static async sendComplaintUpdateNotification(
    notificationId: string,
    user: any,
    tenant: any,
    propertyName: string,
    roomNumber: string,
    notificationData: CreateNotificationData
  ): Promise<void> {
    const { metadata } = notificationData;
    const complaintTitle = metadata?.complaintTitle || 'Complaint Update';
    const status = metadata?.status || 'Updated';
    const priority = metadata?.priority || NotificationPriority.MEDIUM;

    // Send local notification (using maintenance update as fallback)
    if (LocalNotificationService && typeof LocalNotificationService.scheduleMaintenanceUpdateNotification === 'function') {
      LocalNotificationService.scheduleMaintenanceUpdateNotification(
        user.uid,
        user.name || 'Tenant',
        propertyName,
        roomNumber,
        complaintTitle,
        status,
        'Property Management'
      );
    } else {
      console.log('LocalNotificationService not available, skipping local notification');
    }

    // Send push notification
    await PushNotificationService.sendComplaintUpdateNotification(
      user.uid,
      user.name || 'Tenant',
      propertyName,
      roomNumber,
      complaintTitle,
      status,
      priority
    );
  }

  // Send complaint resolved notification
  private static async sendComplaintResolvedNotification(
    notificationId: string,
    user: any,
    tenant: any,
    propertyName: string,
    roomNumber: string,
    notificationData: CreateNotificationData
  ): Promise<void> {
    const { metadata } = notificationData;
    const complaintTitle = metadata?.complaintTitle || 'Complaint Resolved';
    const resolvedBy = metadata?.resolvedBy || 'Property Management';
    const priority = metadata?.priority || NotificationPriority.LOW;

    // Send local notification (using maintenance notification as fallback)
    if (LocalNotificationService && typeof LocalNotificationService.scheduleMaintenanceNotification === 'function') {
      LocalNotificationService.scheduleMaintenanceNotification(
        user.uid,
        user.name || 'Tenant',
        propertyName,
        roomNumber,
        `Complaint Resolved: ${complaintTitle}`,
        priority
      );
    } else {
      console.log('LocalNotificationService not available, skipping local notification');
    }

    // Send push notification
    await PushNotificationService.sendComplaintResolvedNotification(
      user.uid,
      user.name || 'Tenant',
      propertyName,
      roomNumber,
      complaintTitle,
      resolvedBy,
      priority
    );
  }

  // Send payment confirmation notification
  private static async sendPaymentConfirmationNotification(
    notificationId: string,
    user: any,
    tenant: any,
    propertyName: string,
    roomNumber: string,
    notificationData: CreateNotificationData
  ): Promise<void> {
    const { metadata } = notificationData;
    const amount = metadata?.amount || 0;
    const paymentMethod = metadata?.paymentMethod || 'Online';

    // Send local notification
    if (LocalNotificationService && typeof LocalNotificationService.schedulePaymentConfirmationNotification === 'function') {
      LocalNotificationService.schedulePaymentConfirmationNotification(
        user.uid,
        user.name || 'Tenant',
        propertyName,
        roomNumber,
        amount,
        paymentMethod
      );
    } else {
      console.error('LocalNotificationService.schedulePaymentConfirmationNotification is not available');
    }

    // Send push notification
    await PushNotificationService.sendPaymentConfirmationNotification(
      user.uid,
      user.name || 'Tenant',
      propertyName,
      roomNumber,
      amount,
      paymentMethod
    );
  }

  // Send generic notification
  private static async sendGenericNotification(
    notificationId: string,
    user: any,
    notificationData: CreateNotificationData
  ): Promise<void> {
    // For generic notifications, we'll primarily use push notifications
    // Local notifications can be added if needed
    console.log('Sending generic notification:', notificationData);
  }

  // Update notification status
  private static async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus
  ): Promise<void> {
    try {
        const db = getFirestore();
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
          status,
          updatedAt: Timestamp.now(),
        });
    } catch (error: any) {
      if (error?.code === 'firestore/permission-denied' || error?.code === 'permission-denied') {
        console.log('Notification status update skipped due to insufficient permissions. This is expected when running without proper auth context.');
        console.log('NotificationId:', notificationId, 'Status:', status);
      } else {
        console.error('Error updating notification status:', error);
      }
    }
  }

  // Get tenant by user ID
  private static async getTenantByUserId(userId: string): Promise<any> {
    try {
        const db = getFirestore();
        const tenantsRef = collection(db, 'tenants');
        const q = query(
          tenantsRef,
          where('userId', '==', userId),
          where('status', '==', 'active'),
          limit(1)
        );
        const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting tenant:', error);
      return null;
    }
  }

  // Get property name
  private static async getPropertyName(propertyId: string): Promise<string> {
    try {
      const property = await firestoreService.getPropertyById(propertyId);
      return property?.name || 'Your Property';
    } catch (error) {
      console.error('Error getting property name:', error);
      return 'Your Property';
    }
  }

  // Get room number
  private static async getRoomNumber(roomId: string): Promise<string> {
    try {
      const room = await firestoreService.getRoomById(roomId);
      return room?.roomNumber || '';
    } catch (error) {
      console.error('Error getting room number:', error);
      return '';
    }
  }

  // Schedule rent due reminders for all active tenants
  static async scheduleRentDueReminders(): Promise<void> {
    try {
      const tenants = await this.getAllActiveTenants();
      
      for (const tenant of tenants) {
        const user = await firestoreService.getUserProfile(tenant.userId);
        if (!user) continue;

        const propertyName = await this.getPropertyName(tenant.propertyId);
        const roomNumber = await this.getRoomNumber(tenant.roomId);
        
        // Calculate next due date (assuming rent is due on the same day each month)
        const now = new Date();
        const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Next month's 1st
        
        // Schedule reminders
        if (LocalNotificationService && typeof LocalNotificationService.scheduleRentDueReminder === 'function') {
          LocalNotificationService.scheduleRentDueReminder(
            tenant.userId,
            user.name || 'Tenant',
            propertyName,
            roomNumber,
            tenant.rent,
            dueDate,
            [7, 3, 1]
          );
        } else {
          console.error('LocalNotificationService.scheduleRentDueReminder is not available');
        }
      }
    } catch (error) {
      console.error('Error scheduling rent due reminders:', error);
    }
  }

  // Get all active tenants
  private static async getAllActiveTenants(): Promise<any[]> {
    try {
        const db = getFirestore();
        const tenantsRef = collection(db, 'tenants');
        const q = query(tenantsRef, where('status', '==', 'active'));
        const snapshot = await getDocs(q);

      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting active tenants:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      // Check if user is authenticated
        const currentUser = getAuth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
        const db = getFirestore();
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
          status: NotificationStatus.READ,
          readAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      
      // Re-throw permission errors so they can be handled by the UI
      if (error?.code === 'firestore/permission-denied' || error?.code === 'permission-denied') {
        throw error;
      }
    }
  }

  // Get user notifications
  static async getUserNotifications(userId: string, limitCount: number = 50): Promise<Notification[]> {
    try {
      // Check if user is authenticated
        const currentUser = getAuth().currentUser;
      
      if (!currentUser) {
        console.log('No authenticated user, returning empty notifications');
        return [];
      }

      // Verify the requesting user matches the userId parameter (security check)
      if (currentUser.uid !== userId) {
        console.log('Unauthorized access attempt to notifications');
        return [];
      }

      let snapshot;
      
      try {
        // Try with orderBy first
        const db = getFirestore();
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        snapshot = await getDocs(q);
      } catch (orderByError: any) {
        // Fallback: try without orderBy (might be an indexing issue)
        const db = getFirestore();
        const notificationsRef = collection(db, 'notifications');
        const fallbackQuery = query(
          notificationsRef,
          where('userId', '==', userId),
          limit(limitCount)
        );
        snapshot = await getDocs(fallbackQuery);
      }

      let notifications = snapshot.docs.map((doc: any) => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Notification));

      // If we used the fallback query, manually sort by createdAt
      if (notifications.length > 0 && notifications[0].createdAt) {
        notifications = notifications.sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime; // Descending order (newest first)
        });
      }

      return notifications;
    } catch (error: any) {
      // Handle permission errors gracefully (user might be logged out)
      if (error?.code === 'firestore/permission-denied' || error?.code === 'permission-denied') {
        console.log('Permission denied for notifications - user likely logged out');
        return [];
      }
      
      console.error('Error getting user notifications:', error);
      return [];
    }
  }
}

export default NotificationService;
