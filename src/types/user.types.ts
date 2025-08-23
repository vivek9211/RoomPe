import { Timestamp } from '@react-native-firebase/firestore';

// User roles enumeration
export enum UserRole {
  TENANT = 'tenant',
  OWNER = 'owner',
  ADMIN = 'admin'
}

// User status enumeration
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

// Location interface
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

// Emergency contact interface
export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  email?: string;
}

// Notification preferences interface
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  rentReminders: boolean;
  maintenanceUpdates: boolean;
  paymentConfirmations: boolean;
}

// User preferences interface
export interface UserPreferences {
  notifications: NotificationPreferences;
  language: string;
  timezone: string;
  currency: string;
}

// Base user interface with required fields
export interface BaseUser {
  uid: string; // Firebase Auth UID (Document ID) - REQUIRED
  email: string; // REQUIRED
  name: string; // REQUIRED
  phone: string; // REQUIRED
  role: UserRole; // REQUIRED
  status: UserStatus; // REQUIRED
  createdAt: Timestamp; // REQUIRED
  updatedAt: Timestamp; // REQUIRED
}

// Required fields for user creation
export interface CreateUserData {
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
}

// Optional fields for user updates
export interface UpdateUserData {
  name?: string;
  phone?: string;
  profilePhoto?: string;
  status?: UserStatus;
  isActive?: boolean;
  address?: Location;
  dateOfBirth?: Timestamp;
  emergencyContact?: EmergencyContact;
  preferences?: UserPreferences;
}

// Complete user model with all fields
export interface User extends BaseUser {
  // Optional profile fields
  profilePhoto?: string;
  isActive: boolean;
  lastLoginAt?: Timestamp;
  emailVerified: boolean;
  phoneVerified: boolean;
  
  // Optional address information
  address?: Location;
  
  // Optional personal information
  dateOfBirth?: Timestamp;
  emergencyContact?: EmergencyContact;
  
  // Optional preferences
  preferences?: UserPreferences;
  
  // Optional metadata
  metadata?: {
    registrationSource?: string; // 'app', 'web', 'admin'
    referralCode?: string;
    lastActivityAt?: Timestamp;
  };
}

// User validation schema
export interface UserValidation {
  isValid: boolean;
  errors: {
    email?: string;
    name?: string;
    phone?: string;
    role?: string;
    status?: string;
  };
}

// User statistics (for analytics)
export interface UserStats {
  totalProperties?: number; // For owners
  totalRentals?: number; // For tenants
  totalPayments?: number;
  totalMaintenanceRequests?: number;
  averageRating?: number;
  memberSince: Timestamp;
}

// Extended user with stats
export interface UserWithStats extends User {
  stats?: UserStats;
}
