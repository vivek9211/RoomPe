import { Timestamp } from '@react-native-firebase/firestore';

// Notification type enumeration
export enum NotificationType {
  RENT_DUE = 'rent_due',
  RENT_PAID = 'rent_paid',
  RENT_OVERDUE = 'rent_overdue',
  MAINTENANCE_REQUEST = 'maintenance_request',
  MAINTENANCE_UPDATE = 'maintenance_update',
  MAINTENANCE_COMPLETED = 'maintenance_completed',
  PAYMENT_REMINDER = 'payment_reminder',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  AGREEMENT_EXPIRY = 'agreement_expiry',
  AGREEMENT_RENEWAL = 'agreement_renewal',
  ROOM_ASSIGNMENT = 'room_assignment',
  ROOM_VACANCY = 'room_vacancy',
  SECURITY_ALERT = 'security_alert',
  GENERAL_ANNOUNCEMENT = 'general_announcement',
  SYSTEM_UPDATE = 'system_update',
  WELCOME = 'welcome',
  VERIFICATION = 'verification',
  OTHER = 'other'
}

// Notification priority enumeration
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Notification status enumeration
export enum NotificationStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Notification channel enumeration
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in_app'
}

// Base notification interface with required fields
export interface BaseNotification {
  id: string; // Document ID - REQUIRED
  userId: string; // REQUIRED - UID of the recipient
  type: NotificationType; // REQUIRED
  title: string; // REQUIRED
  message: string; // REQUIRED
  priority: NotificationPriority; // REQUIRED
  status: NotificationStatus; // REQUIRED
  createdAt: Timestamp; // REQUIRED
  updatedAt: Timestamp; // REQUIRED
}

// Required fields for notification creation
export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
}

// Optional fields for notification updates
export interface UpdateNotificationData {
  title?: string;
  message?: string;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  readAt?: Timestamp;
  actionTaken?: string;
  metadata?: Record<string, any>;
}

// Complete notification model with all fields
export interface Notification extends BaseNotification {
  // Optional notification details
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
  readAt?: Timestamp;
  actionTaken?: string;
  
  // Optional delivery details
  delivery?: {
    channels: NotificationChannel[];
    sentAt?: Timestamp;
    deliveredAt?: Timestamp;
    readAt?: Timestamp;
    failedAt?: Timestamp;
    failureReason?: string;
    retryCount: number;
    maxRetries: number;
  };
  
  // Optional scheduling details
  scheduling?: {
    scheduledFor?: Timestamp;
    sentAt?: Timestamp;
    isRecurring: boolean;
    recurrencePattern?: string; // e.g., "daily", "weekly", "monthly"
    nextScheduledAt?: Timestamp;
    expiryDate?: Timestamp;
  };
  
  // Optional template details
  template?: {
    templateId?: string;
    templateName?: string;
    variables?: Record<string, any>;
    language?: string;
  };
  
  // Optional metadata
  metadata?: {
    relatedEntityType?: 'user' | 'property' | 'room' | 'tenant' | 'payment' | 'maintenance';
    relatedEntityId?: string;
    category?: string;
    tags?: string[];
    isAutomated: boolean;
    triggerEvent?: string;
    source?: string; // 'system', 'admin', 'tenant', 'owner'
    campaignId?: string;
    batchId?: string;
  };
  
  // Optional analytics
  analytics?: {
    openRate?: number;
    clickRate?: number;
    conversionRate?: number;
    engagementScore?: number;
    timeToRead?: number; // in seconds
    timeToAction?: number; // in seconds
  };
  
  // Optional user interaction
  interaction?: {
    opened: boolean;
    openedAt?: Timestamp;
    clicked: boolean;
    clickedAt?: Timestamp;
    dismissed: boolean;
    dismissedAt?: Timestamp;
    actionTaken?: string;
    actionTakenAt?: Timestamp;
    feedback?: {
      rating?: number; // 1-5
      comment?: string;
      submittedAt?: Timestamp;
    };
  };
}

// Notification validation schema
export interface NotificationValidation {
  isValid: boolean;
  errors: {
    userId?: string;
    type?: string;
    title?: string;
    message?: string;
    priority?: string;
  };
}

// Notification search filters
export interface NotificationFilters {
  userId?: string;
  type?: NotificationType[];
  priority?: NotificationPriority[];
  status?: NotificationStatus[];
  channel?: NotificationChannel[];
  dateRange?: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  isRead?: boolean;
  isAutomated?: boolean;
  source?: string;
}

// Notification statistics
export interface NotificationStats {
  totalNotifications: number;
  sentNotifications: number;
  deliveredNotifications: number;
  readNotifications: number;
  failedNotifications: number;
  averageDeliveryTime: number;
  averageReadTime: number;
  openRate: number;
  clickRate: number;
}

// Notification template interface
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title: string;
  message: string;
  subtitle?: string;
  body?: string;
  actionText?: string;
  actionUrl?: string;
  variables: string[]; // e.g., ["userName", "amount", "dueDate"]
  channels: NotificationChannel[];
  priority: NotificationPriority;
  isActive: boolean;
  language: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Notification campaign interface
export interface NotificationCampaign {
  id: string;
  name: string;
  description?: string;
  type: NotificationType;
  templateId: string;
  targetAudience: {
    userRoles?: string[];
    properties?: string[];
    rooms?: string[];
    filters?: Record<string, any>;
  };
  scheduling: {
    startDate: Timestamp;
    endDate?: Timestamp;
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    timeOfDay?: string; // e.g., "09:00"
    timezone: string;
  };
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  metrics: {
    totalRecipients: number;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    failedCount: number;
    openRate: number;
    clickRate: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Notification preferences interface
export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    types: NotificationType[];
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  sms: {
    enabled: boolean;
    types: NotificationType[];
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  push: {
    enabled: boolean;
    types: NotificationType[];
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  whatsapp: {
    enabled: boolean;
    types: NotificationType[];
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  inApp: {
    enabled: boolean;
    types: NotificationType[];
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // e.g., "22:00"
    endTime: string; // e.g., "08:00"
    timezone: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
