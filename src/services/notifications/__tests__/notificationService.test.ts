import { NotificationService } from '../notificationService';
import { NotificationType, NotificationPriority } from '../../types/notification.types';

// Mock Firebase services
jest.mock('../../firestore', () => ({
  firestoreService: {
    db: {
      collection: jest.fn(() => ({
        add: jest.fn(() => Promise.resolve({ id: 'test-notification-id' })),
        doc: jest.fn(() => ({
          update: jest.fn(() => Promise.resolve()),
        })),
      })),
    },
    getUserProfile: jest.fn(() => Promise.resolve({
      uid: 'test-user-id',
      name: 'Test User',
    })),
    getPropertyById: jest.fn(() => Promise.resolve({
      name: 'Test Property',
      ownerId: 'test-owner-id',
    })),
    getRoomById: jest.fn(() => Promise.resolve({
      roomNumber: '101',
    })),
  },
}));

// Mock local notifications
jest.mock('../localNotifications', () => ({
  LocalNotificationService: {
    scheduleRentDueReminder: jest.fn(),
    scheduleOverdueRentNotification: jest.fn(),
    scheduleMaintenanceNotification: jest.fn(),
    scheduleMaintenanceUpdateNotification: jest.fn(),
    schedulePaymentConfirmationNotification: jest.fn(),
  },
}));

// Mock push notifications
jest.mock('../pushNotifications', () => ({
  PushNotificationService: {
    sendRentDueReminder: jest.fn(() => Promise.resolve(true)),
    sendMaintenanceRequestNotification: jest.fn(() => Promise.resolve(true)),
    sendMaintenanceUpdateNotification: jest.fn(() => Promise.resolve(true)),
    sendPaymentConfirmationNotification: jest.fn(() => Promise.resolve(true)),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a rent due notification successfully', async () => {
      const notificationData = {
        userId: 'test-user-id',
        type: NotificationType.RENT_DUE,
        title: 'Rent Due Reminder',
        message: 'Your rent is due in 7 days',
        priority: NotificationPriority.MEDIUM,
        metadata: {
          tenantId: 'test-tenant-id',
          propertyId: 'test-property-id',
          roomId: 'test-room-id',
          rentAmount: 10000,
          dueDate: new Date().toISOString(),
          reminderType: 'due_date',
        },
      };

      const result = await NotificationService.createNotification(notificationData);

      expect(result).toBe('test-notification-id');
    });

    it('should create a maintenance request notification successfully', async () => {
      const notificationData = {
        userId: 'test-user-id',
        type: NotificationType.MAINTENANCE_REQUEST,
        title: 'Maintenance Request Received',
        message: 'Your maintenance request has been received',
        priority: NotificationPriority.HIGH,
        metadata: {
          tenantId: 'test-tenant-id',
          propertyId: 'test-property-id',
          roomId: 'test-room-id',
          issueTitle: 'Broken Tap',
          priority: NotificationPriority.HIGH,
        },
      };

      const result = await NotificationService.createNotification(notificationData);

      expect(result).toBe('test-notification-id');
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      // Mock the collection query
      const mockSnapshot = {
        docs: [
          {
            id: 'notification-1',
            data: () => ({
              userId: 'test-user-id',
              type: NotificationType.RENT_DUE,
              title: 'Rent Due',
              message: 'Your rent is due',
              priority: NotificationPriority.MEDIUM,
              status: 'sent',
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        ],
      };

      const mockCollection = jest.fn(() => ({
        where: jest.fn(() => ({
          orderBy: jest.fn(() => ({
            limit: jest.fn(() => mockSnapshot),
          })),
        })),
      }));

      // Mock the db.collection method
      const { firestoreService } = require('../../firestore');
      firestoreService.db.collection = mockCollection;

      const notifications = await NotificationService.getUserNotifications('test-user-id');

      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe('notification-1');
      expect(notifications[0].type).toBe(NotificationType.RENT_DUE);
    });
  });
});

