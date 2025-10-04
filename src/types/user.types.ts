import { Timestamp } from '@react-native-firebase/firestore';
import { EmergencyContact, NotificationPreferences, Location } from './common.types';

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

// Re-export common types
export type { EmergencyContact, NotificationPreferences, Location };

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
  onboardingCompleted?: boolean;
}

// Optional fields for user updates
export interface UpdateUserData {
  email?: string;
  name?: string;
  phone?: string;
  profilePhoto?: string;
  status?: UserStatus;
  isActive?: boolean;
  address?: Location;
  dateOfBirth?: Timestamp;
  emergencyContact?: EmergencyContact;
  preferences?: UserPreferences;
  role?: UserRole;
  onboardingCompleted?: boolean;
}

// Complete user model with all fields
export interface User extends BaseUser {
  // Optional profile fields
  profilePhoto?: string;
  isActive: boolean;
  lastLoginAt?: Timestamp;
  emailVerified: boolean;
  phoneVerified: boolean;
  
  // Onboarding status
  onboardingCompleted?: boolean;
  
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

  // Razorpay Route linked account details (for owners/vendors)
  razorpay?: {
    linkedAccountId?: string; // e.g., acc_XXXX
    routeProductStatus?: 'under_review' | 'needs_clarification' | 'activated' | 'disabled';
    needsClarificationFields?: string[]; // field references when status = needs_clarification
    kyc?: {
      status?: 'pending' | 'in_progress' | 'verified' | 'rejected';
      updatedAt?: Timestamp;
      reason?: string; // if rejected/needs clarification
    };
    settlements?: {
      enabled: boolean;
      beneficiaryName?: string;
      accountNumberMasked?: string;
      ifsc?: string;
    };
    taxInfo?: {
      gstin?: string;
      pan?: string;
    };
    payout?: {
      defaultCommissionPercent?: number; // platform fee percentage
      onHold?: boolean;
    };
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
