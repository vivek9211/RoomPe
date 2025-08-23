import { Timestamp } from '@react-native-firebase/firestore';

// Common PaymentStatus enumeration shared across tenant and payment types
export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
  WAIVED = 'waived',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// Common EmergencyContact interface shared across user and tenant types
export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  email?: string;
  address?: string;
}

// Common NotificationPreferences interface shared across user and notification types
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  rentReminders: boolean;
  maintenanceUpdates: boolean;
  paymentConfirmations: boolean;
}

// Common Location interface
export interface Location {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
