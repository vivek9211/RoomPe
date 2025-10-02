import firestore, { Timestamp } from '@react-native-firebase/firestore';
import { firestoreService } from '../firestore';
import { NotificationService } from './notificationService';
import { NotificationType, NotificationPriority } from '../../types/notification.types';
import { PaymentStatus } from '../../types/payment.types';
import { LocalNotificationService } from './localNotifications';

export class NotificationScheduler {
  // Schedule rent due reminders for all active tenants (admin/system use only)
  static async scheduleRentDueReminders(): Promise<void> {
    try {
      console.log('Starting rent due reminder scheduling...');
      
      // Get all active tenants
      const tenants = await this.getAllActiveTenants();
      console.log(`Found ${tenants.length} active tenants`);

      for (const tenant of tenants) {
        try {
          await this.scheduleTenantRentReminders(tenant);
        } catch (error) {
          console.error(`Error scheduling reminders for tenant ${tenant.id}:`, error);
        }
      }

      console.log('Rent due reminder scheduling completed');
    } catch (error) {
      console.error('Error in rent due reminder scheduling:', error);
    }
  }

  // Schedule reminders for a specific tenant
  private static async scheduleTenantRentReminders(tenant: any): Promise<void> {
    try {
      // Get user details
      const user = await firestoreService.getUserProfile(tenant.userId);
      if (!user) {
        console.log(`User not found for tenant ${tenant.id}`);
        return;
      }

      // Get property details
      const property = await firestoreService.getPropertyById(tenant.propertyId);
      if (!property) {
        console.log(`Property not found for tenant ${tenant.id}`);
        return;
      }

      // Get room details
      const room = await firestoreService.getRoomById(tenant.roomId);
      const roomNumber = room?.roomNumber || 'Unknown';

      // Calculate next due date (assuming rent is due on the 1st of each month)
      const now = new Date();
      const nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      // Check if tenant has already paid for next month
      const nextMonth = nextDueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      const hasPaidNextMonth = await this.hasTenantPaidForMonth(tenant.id, nextMonth);
      
      if (hasPaidNextMonth) {
        console.log(`Tenant ${tenant.id} has already paid for ${nextMonth}`);
        return;
      }

      // Schedule local notifications
      try {
        console.log('Attempting to schedule rent due reminder...');
        console.log('LocalNotificationService available:', !!LocalNotificationService);
        console.log('scheduleRentDueReminder method:', typeof LocalNotificationService?.scheduleRentDueReminder);
        
        if (LocalNotificationService && typeof LocalNotificationService.scheduleRentDueReminder === 'function') {
          LocalNotificationService.scheduleRentDueReminder(
            tenant.userId,
            user.name || 'Tenant',
            property.name,
            roomNumber,
            tenant.rent,
            nextDueDate,
            [7, 3, 1] // 7 days, 3 days, and 1 day before due date
          );
          console.log('Successfully called LocalNotificationService.scheduleRentDueReminder');
        } else {
          console.error('LocalNotificationService.scheduleRentDueReminder is not available');
          console.log('LocalNotificationService:', LocalNotificationService);
          
          // Fallback: Log the notification details directly
          console.log('FALLBACK: Scheduling rent due reminder for:', {
            userId: tenant.userId,
            tenantName: user.name || 'Tenant',
            propertyName: property.name,
            roomNumber,
            rentAmount: tenant.rent,
            dueDate: nextDueDate,
            reminderDays: [7, 3, 1]
          });
        }
      } catch (localNotificationError) {
        console.error('Error calling LocalNotificationService:', localNotificationError);
        // Fallback: Log the notification details
        console.log('FALLBACK: Would schedule rent due reminder for:', {
          userId: tenant.userId,
          tenantName: user.name || 'Tenant',
          propertyName: property.name,
          roomNumber,
          rentAmount: tenant.rent,
          dueDate: nextDueDate
        });
      }

      // Create notification records in Firestore
      await this.createRentDueNotifications(tenant, user, property, roomNumber, nextDueDate);

      console.log(`Scheduled rent reminders for tenant ${tenant.id}`);
    } catch (error) {
      console.error(`Error scheduling reminders for tenant ${tenant.id}:`, error);
    }
  }

  // Check if tenant has paid for a specific month
  private static async hasTenantPaidForMonth(tenantId: string, month: string): Promise<boolean> {
    try {
      const payments = await firestore()
        .collection('payments')
        .where('tenantId', '==', tenantId)
        .where('month', '==', month)
        .where('status', '==', PaymentStatus.PAID)
        .get();

      return !payments.empty;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  }

  // Create rent due notification records
  private static async createRentDueNotifications(
    tenant: any,
    user: any,
    property: any,
    roomNumber: string,
    dueDate: Date
  ): Promise<void> {
    try {
      const reminders = [
        {
          days: 7,
          title: 'Rent Due in 7 Days',
          message: `Hi ${user.name || 'Tenant'}, your rent of ₹${tenant.rent.toLocaleString('en-IN')} for ${property.name} - Room ${roomNumber} is due in 7 days.`,
          priority: NotificationPriority.MEDIUM,
        },
        {
          days: 3,
          title: 'Rent Due in 3 Days',
          message: `Hi ${user.name || 'Tenant'}, your rent of ₹${tenant.rent.toLocaleString('en-IN')} for ${property.name} - Room ${roomNumber} is due in 3 days.`,
          priority: NotificationPriority.HIGH,
        },
        {
          days: 1,
          title: 'Rent Due Tomorrow',
          message: `Hi ${user.name || 'Tenant'}, your rent of ₹${tenant.rent.toLocaleString('en-IN')} for ${property.name} - Room ${roomNumber} is due tomorrow.`,
          priority: NotificationPriority.HIGH,
        },
      ];

      for (const reminder of reminders) {
        const reminderDate = new Date(dueDate.getTime() - (reminder.days * 24 * 60 * 60 * 1000));
        
        // Only create notification if reminder date is in the future
        if (reminderDate.getTime() > Date.now()) {
          await NotificationService.createNotification({
            userId: tenant.userId,
            type: NotificationType.RENT_DUE,
            title: reminder.title,
            message: reminder.message,
            priority: reminder.priority,
            metadata: {
              tenantId: tenant.id,
              propertyId: tenant.propertyId,
              roomId: tenant.roomId,
              rentAmount: tenant.rent,
              dueDate: dueDate.toISOString(),
              reminderType: 'due_date',
              reminderDays: reminder.days,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error creating rent due notifications:', error);
    }
  }

  // Check for overdue payments and send notifications
  static async checkOverduePayments(): Promise<void> {
    try {
      console.log('Checking for overdue payments...');
      
      const tenants = await this.getAllActiveTenants();
      
      for (const tenant of tenants) {
        try {
          await this.checkTenantOverduePayments(tenant);
        } catch (error) {
          console.error(`Error checking overdue payments for tenant ${tenant.id}:`, error);
        }
      }

      console.log('Overdue payment check completed');
    } catch (error) {
      console.error('Error in overdue payment check:', error);
    }
  }

  // Check overdue payments for a specific tenant
  private static async checkTenantOverduePayments(tenant: any): Promise<void> {
    try {
      // Get current month
      const now = new Date();
      const currentMonth = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      // Check if tenant has paid for current month
      const hasPaidCurrentMonth = await this.hasTenantPaidForMonth(tenant.id, currentMonth);
      
      if (hasPaidCurrentMonth) {
        return; // Tenant has paid, no overdue
      }

      // Calculate overdue days
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of current month
      const overdueDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (overdueDays > 0) {
        // Get user and property details
        const user = await firestoreService.getUserProfile(tenant.userId);
        const property = await firestoreService.getPropertyById(tenant.propertyId);
        const room = await firestoreService.getRoomById(tenant.roomId);
        const roomNumber = room?.roomNumber || 'Unknown';

        if (user && property) {
          // Calculate late fee (example: ₹100 per day after 5 days)
          const lateFee = Math.max(0, overdueDays - 5) * 100;

          // Send overdue notification
          try {
            console.log('Attempting to schedule overdue rent notification...');
            
            if (LocalNotificationService && typeof LocalNotificationService.scheduleOverdueRentNotification === 'function') {
              LocalNotificationService.scheduleOverdueRentNotification(
                tenant.userId,
                user.name || 'Tenant',
                property.name,
                roomNumber,
                tenant.rent,
                overdueDays,
                lateFee
              );
              console.log('Successfully called LocalNotificationService.scheduleOverdueRentNotification');
            } else {
              console.error('LocalNotificationService.scheduleOverdueRentNotification is not available');
              console.log('LocalNotificationService:', LocalNotificationService);
              
              // Fallback: Log the notification details directly
              console.log('FALLBACK: Scheduling overdue rent notification for:', {
                userId: tenant.userId,
                tenantName: user.name || 'Tenant',
                propertyName: property.name,
                roomNumber,
                rentAmount: tenant.rent,
                overdueDays,
                lateFee
              });
            }
          } catch (localNotificationError) {
            console.error('Error calling LocalNotificationService.scheduleOverdueRentNotification:', localNotificationError);
            // Fallback: Log the notification details
            console.log('FALLBACK: Would schedule overdue rent notification for:', {
              userId: tenant.userId,
              tenantName: user.name || 'Tenant',
              propertyName: property.name,
              roomNumber,
              rentAmount: tenant.rent,
              overdueDays,
              lateFee
            });
          }

          // Create overdue notification record
          await NotificationService.createNotification({
            userId: tenant.userId,
            type: NotificationType.RENT_OVERDUE,
            title: 'Rent Overdue',
            message: `Hi ${user.name || 'Tenant'}, your rent of ₹${tenant.rent.toLocaleString('en-IN')} for ${property.name} - Room ${roomNumber} is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue.${lateFee > 0 ? ` Late fee: ₹${lateFee.toLocaleString('en-IN')}` : ''}`,
            priority: overdueDays > 10 ? NotificationPriority.URGENT : NotificationPriority.HIGH,
            metadata: {
              tenantId: tenant.id,
              propertyId: tenant.propertyId,
              roomId: tenant.roomId,
              rentAmount: tenant.rent,
              overdueDays,
              lateFee,
              reminderType: 'overdue',
            },
          });

          console.log(`Sent overdue notification for tenant ${tenant.id} (${overdueDays} days overdue)`);
        }
      }
    } catch (error) {
      console.error(`Error checking overdue payments for tenant ${tenant.id}:`, error);
    }
  }

  // Get all active tenants
  private static async getAllActiveTenants(): Promise<any[]> {
    try {
      const snapshot = await firestore()
        .collection('tenants')
        .where('status', '==', 'active')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error: any) {
      if (error?.code === 'firestore/permission-denied' || error?.code === 'permission-denied') {
        console.log('Getting active tenants skipped due to insufficient permissions. This is expected when running without admin context.');
        return [];
      }
      console.error('Error getting active tenants:', error);
      return [];
    }
  }

  // Schedule maintenance reminders
  static async scheduleMaintenanceReminders(): Promise<void> {
    try {
      console.log('Scheduling maintenance reminders...');
      
      // Get all open maintenance requests
      // Note: This may fail due to Firestore security rules if no user is authenticated
      // In a production environment, this should run with admin privileges or be triggered by Cloud Functions
      try {
        const maintenanceRequests = await firestore()
          .collection('maintenance_requests')
          .where('status', '==', 'open')
          .get();

        for (const doc of maintenanceRequests.docs) {
          const requestData = doc.data();
          const request = { id: doc.id, ...requestData };
          
          // Check if request is older than 24 hours and still open
          const createdAt = requestData.createdAt?.toDate();
          if (!createdAt) continue;
          
          const hoursSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceCreated > 24) {
            // Send reminder to property owner
            const property = await firestoreService.getPropertyById(requestData.propertyId);
            if (property?.ownerId) {
              await NotificationService.createNotification({
                userId: property.ownerId,
                type: NotificationType.MAINTENANCE_REQUEST,
                title: 'Maintenance Request Reminder',
                message: `Maintenance request "${requestData.title}" from ${requestData.tenantId} is still open and needs attention.`,
                priority: NotificationPriority.MEDIUM,
                metadata: {
                  maintenanceRequestId: request.id,
                  tenantId: requestData.tenantId,
                  propertyId: requestData.propertyId,
                  roomId: requestData.roomId,
                  issueTitle: requestData.title,
                  priority: requestData.priority,
                },
              });
            }
          }
        }

        console.log('Maintenance reminders scheduled');
      } catch (permissionError: any) {
        if (permissionError?.code === 'firestore/permission-denied' || permissionError?.code === 'permission-denied') {
          console.log('Maintenance reminders skipped due to insufficient permissions. This is expected when running without admin context.');
          console.log('In production, consider using Firebase Cloud Functions with admin privileges for scheduled tasks.');
        } else {
          throw permissionError;
        }
      }
    } catch (error) {
      console.error('Error scheduling maintenance reminders:', error);
    }
  }

  // Schedule rent due reminders for a specific property owner's tenants
  static async scheduleRentDueRemindersForOwner(ownerId: string): Promise<void> {
    try {
      console.log(`Starting rent due reminder scheduling for owner: ${ownerId}`);
      
      // Get tenants for properties owned by this user
      const tenants = await this.getActiveTenantsForOwner(ownerId);
      console.log(`Found ${tenants.length} active tenants for owner ${ownerId}`);

      for (const tenant of tenants) {
        try {
          await this.scheduleTenantRentReminders(tenant);
        } catch (error) {
          console.error(`Error scheduling reminders for tenant ${tenant.id}:`, error);
        }
      }

      console.log(`Rent due reminder scheduling completed for owner: ${ownerId}`);
    } catch (error) {
      console.error(`Error in rent due reminder scheduling for owner ${ownerId}:`, error);
    }
  }

  // Schedule notifications for a specific tenant (tenant use only)
  static async scheduleNotificationsForTenant(tenantUserId: string): Promise<void> {
    try {
      console.log(`Starting notification scheduling for tenant user: ${tenantUserId}`);
      
      // Get tenant record for this user
      const tenant = await this.getTenantByUserId(tenantUserId);
      if (!tenant) {
        console.log(`No tenant record found for user ${tenantUserId}`);
        return;
      }

      await this.scheduleTenantRentReminders(tenant);
      console.log(`Notification scheduling completed for tenant user: ${tenantUserId}`);
    } catch (error) {
      console.error(`Error in notification scheduling for tenant ${tenantUserId}:`, error);
    }
  }

  // Get active tenants for a specific property owner
  private static async getActiveTenantsForOwner(ownerId: string): Promise<any[]> {
    try {
      // First get properties owned by this user
      const properties = await firestoreService.getPropertiesByOwner(ownerId);
      const propertyIds = properties.map(p => p.id);

      if (propertyIds.length === 0) {
        return [];
      }

      // Get tenants for these properties
      const tenants: any[] = [];
      for (const propertyId of propertyIds) {
        try {
          const snapshot = await firestore()
            .collection('tenants')
            .where('propertyId', '==', propertyId)
            .where('status', '==', 'active')
            .get();

          snapshot.docs.forEach(doc => {
            tenants.push({ id: doc.id, ...doc.data() });
          });
        } catch (error: any) {
          if (error?.code === 'firestore/permission-denied' || error?.code === 'permission-denied') {
            console.log(`Getting tenants for property ${propertyId} skipped due to insufficient permissions.`);
          } else {
            console.error(`Error getting tenants for property ${propertyId}:`, error);
          }
        }
      }

      return tenants;
    } catch (error) {
      console.error('Error getting active tenants for owner:', error);
      return [];
    }
  }

  // Get tenant record by user ID
  private static async getTenantByUserId(userId: string): Promise<any | null> {
    try {
      const snapshot = await firestore()
        .collection('tenants')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error: any) {
      if (error?.code === 'firestore/permission-denied' || error?.code === 'permission-denied') {
        console.log('Getting tenant by user ID skipped due to insufficient permissions.');
        return null;
      }
      console.error('Error getting tenant by user ID:', error);
      return null;
    }
  }

  // Run all scheduled tasks
  static async runScheduledTasks(): Promise<void> {
    try {
      console.log('Running scheduled notification tasks...');
      
      // Run tasks in parallel
      await Promise.all([
        this.scheduleRentDueReminders(),
        this.checkOverduePayments(),
        this.scheduleMaintenanceReminders(),
      ]);

      console.log('All scheduled tasks completed');
    } catch (error) {
      console.error('Error running scheduled tasks:', error);
    }
  }

  // Schedule recurring tasks (ADMIN/SYSTEM USE ONLY - not for individual users)
  static startScheduler(): void {
    console.warn('⚠️  NotificationScheduler.startScheduler() should only be used by admin/system services, not individual users!');
    console.warn('⚠️  Use scheduleRentDueRemindersForOwner() or scheduleNotificationsForTenant() instead.');
    
    // Run immediately
    this.runScheduledTasks();

    // Then run every hour
    setInterval(() => {
      this.runScheduledTasks();
    }, 60 * 60 * 1000); // 1 hour

    console.log('Global notification scheduler started (admin/system mode)');
  }

  // Start scheduler for a specific property owner (recommended approach)
  static startSchedulerForOwner(ownerId: string): void {
    console.log(`Starting notification scheduler for property owner: ${ownerId}`);
    
    // Run immediately
    this.scheduleRentDueRemindersForOwner(ownerId);

    // Then run periodically (less frequent for individual owners)
    setInterval(() => {
      this.scheduleRentDueRemindersForOwner(ownerId);
    }, 24 * 60 * 60 * 1000); // Once per day

    console.log(`Notification scheduler started for owner: ${ownerId}`);
  }

  // Start scheduler for a specific tenant (recommended approach)
  static startSchedulerForTenant(tenantUserId: string): void {
    console.log(`Starting notification scheduler for tenant: ${tenantUserId}`);
    
    // Run immediately
    this.scheduleNotificationsForTenant(tenantUserId);

    // Then run periodically
    setInterval(() => {
      this.scheduleNotificationsForTenant(tenantUserId);
    }, 24 * 60 * 60 * 1000); // Once per day

    console.log(`Notification scheduler started for tenant: ${tenantUserId}`);
  }
}

export default NotificationScheduler;
