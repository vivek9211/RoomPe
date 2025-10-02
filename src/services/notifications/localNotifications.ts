import { Platform, Alert } from 'react-native';
import { NotificationPriority } from '../../types/notification.types';

export class LocalNotificationService {
  // Initialize local notifications
  static async initialize(): Promise<void> {
    try {
      console.log('Local notification service initialized');
      // Note: For full functionality, install react-native-push-notification
      // This is a basic implementation that uses Alert as fallback
    } catch (error) {
      console.error('Error initializing local notifications:', error);
    }
  }

  // Schedule rent due reminder
  static scheduleRentDueReminder(
    userId: string,
    tenantName: string,
    propertyName: string,
    roomNumber: string,
    rentAmount: number,
    dueDate: Date,
    reminderDays: number[]
  ): void {
    try {
      console.log('Scheduling rent due reminder for:', {
        userId,
        tenantName,
        propertyName,
        roomNumber,
        rentAmount,
        dueDate,
        reminderDays,
      });

      // For now, we'll log the reminder details
      // In a full implementation with react-native-push-notification, 
      // you would schedule actual local notifications here
      
      reminderDays.forEach(days => {
        const reminderDate = new Date(dueDate.getTime() - (days * 24 * 60 * 60 * 1000));
        
        if (reminderDate.getTime() > Date.now()) {
          console.log(`Rent reminder scheduled for ${reminderDate.toDateString()} (${days} days before due date)`);
          
          // Note: In a full implementation with react-native-push-notification,
          // you would schedule actual local notifications here that would only
          // show to the specific user when the scheduled time arrives
        }
      });
    } catch (error) {
      console.error('Error scheduling rent due reminder:', error);
    }
  }

  // Schedule overdue rent notification
  static scheduleOverdueRentNotification(
    userId: string,
    tenantName: string,
    propertyName: string,
    roomNumber: string,
    rentAmount: number,
    overdueDays: number,
    lateFee: number
  ): void {
    try {
      console.log('Scheduling overdue rent notification for:', {
        userId,
        tenantName,
        propertyName,
        roomNumber,
        rentAmount,
        overdueDays,
        lateFee,
      });

      const message = `Hi ${tenantName}, your rent of ₹${rentAmount.toLocaleString('en-IN')} for ${propertyName} - Room ${roomNumber} is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue.${lateFee > 0 ? ` Late fee: ₹${lateFee.toLocaleString('en-IN')}` : ''}`;
      
      console.log('Overdue notification message:', message);

      // Note: In a full implementation, this would schedule a local notification
      // that would only show to the specific user
    } catch (error) {
      console.error('Error scheduling overdue rent notification:', error);
    }
  }

  // Schedule maintenance notification
  static scheduleMaintenanceNotification(
    userId: string,
    tenantName: string,
    propertyName: string,
    roomNumber: string,
    issueTitle: string,
    priority: NotificationPriority
  ): void {
    try {
      console.log('Scheduling maintenance notification for:', {
        userId,
        tenantName,
        propertyName,
        roomNumber,
        issueTitle,
        priority,
      });

      const message = `Hi ${tenantName}, your maintenance request "${issueTitle}" for ${propertyName} - Room ${roomNumber} has been received.`;
      
      console.log('Maintenance notification message:', message);

      // Note: In a full implementation, this would schedule a local notification
      // that would only show to the specific user
    } catch (error) {
      console.error('Error scheduling maintenance notification:', error);
    }
  }

  // Schedule maintenance update notification
  static scheduleMaintenanceUpdateNotification(
    userId: string,
    tenantName: string,
    propertyName: string,
    roomNumber: string,
    issueTitle: string,
    status: string,
    assignedTo?: string
  ): void {
    try {
      console.log('Scheduling maintenance update notification for:', {
        userId,
        tenantName,
        propertyName,
        roomNumber,
        issueTitle,
        status,
        assignedTo,
      });

      const message = `Hi ${tenantName}, your maintenance request "${issueTitle}" for ${propertyName} - Room ${roomNumber} has been ${status.toLowerCase()}.${assignedTo ? ` Assigned to: ${assignedTo}` : ''}`;
      
      console.log('Maintenance update notification message:', message);

      // Note: In a full implementation, this would schedule a local notification
      // that would only show to the specific user
    } catch (error) {
      console.error('Error scheduling maintenance update notification:', error);
    }
  }

  // Schedule payment confirmation notification
  static schedulePaymentConfirmationNotification(
    userId: string,
    tenantName: string,
    propertyName: string,
    roomNumber: string,
    amount: number,
    paymentMethod: string
  ): void {
    try {
      console.log('Scheduling payment confirmation notification for:', {
        userId,
        tenantName,
        propertyName,
        roomNumber,
        amount,
        paymentMethod,
      });

      const message = `Hi ${tenantName}, your payment of ₹${amount.toLocaleString('en-IN')} for ${propertyName} - Room ${roomNumber} has been confirmed. Payment method: ${paymentMethod}`;
      
      console.log('Payment confirmation notification message:', message);

      // Note: In a full implementation, this would schedule a local notification
      // that would only show to the specific user
    } catch (error) {
      console.error('Error scheduling payment confirmation notification:', error);
    }
  }

  // Cancel all notifications for a user
  static cancelAllNotifications(userId: string): void {
    try {
      console.log('Cancelling all notifications for user:', userId);
      // In a full implementation, you would cancel scheduled notifications here
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  // Cancel specific notification
  static cancelNotification(notificationId: string): void {
    try {
      console.log('Cancelling notification:', notificationId);
      // In a full implementation, you would cancel the specific notification here
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }
}

export default LocalNotificationService;