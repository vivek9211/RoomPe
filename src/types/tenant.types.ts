import { Timestamp } from '@react-native-firebase/firestore';
import { EmergencyContact, PaymentStatus } from './common.types';

// Tenant status enumeration
export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  LEFT = 'left',
  SUSPENDED = 'suspended',
  EVICTED = 'evicted'
}

// Agreement status enumeration
export enum AgreementStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURE = 'pending_signature',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  RENEWED = 'renewed'
}

// Re-export common PaymentStatus
export { PaymentStatus };

// Base tenant interface with required fields
export interface BaseTenant {
  id: string; // Document ID - REQUIRED
  userId: string; // REQUIRED - UID of the user
  roomId: string; // REQUIRED - Reference to room
  propertyId: string; // REQUIRED - Reference to property
  status: TenantStatus; // REQUIRED
  agreementStart: Timestamp; // REQUIRED
  agreementEnd: Timestamp; // REQUIRED
  rent: number; // REQUIRED
  deposit: number; // REQUIRED
  createdAt: Timestamp; // REQUIRED
  updatedAt: Timestamp; // REQUIRED
}

// Required fields for tenant creation
export interface CreateTenantData {
  userId: string;
  roomId: string;
  propertyId: string;
  agreementStart: Timestamp;
  agreementEnd: Timestamp;
  rent: number;
  deposit: number;
}

// Optional fields for tenant updates
export interface UpdateTenantData {
  status?: TenantStatus;
  agreementStart?: Timestamp;
  agreementEnd?: Timestamp;
  rent?: number;
  deposit?: number;
  depositPaid?: boolean;
  emergencyContact?: EmergencyContact;
  documents?: TenantDocument[];
  notes?: string;
}

// Re-export common EmergencyContact
export type { EmergencyContact };

// Tenant document interface
export interface TenantDocument {
  type: 'aadhar' | 'pan' | 'passport' | 'driving_license' | 'rental_agreement' | 'other';
  number?: string;
  url: string;
  uploadedAt: Timestamp;
  verified: boolean;
  verifiedAt?: Timestamp;
  verifiedBy?: string;
}

// Complete tenant model with all fields
export interface Tenant extends BaseTenant {
  // Optional tenant details
  depositPaid: boolean;
  depositPaidAt?: Timestamp;
  depositRefunded?: boolean;
  depositRefundedAt?: Timestamp;
  
  // Optional emergency contact
  emergencyContact?: EmergencyContact;
  
  // Optional documents
  documents?: TenantDocument[];
  
  // Optional agreement details
  agreementDetails?: {
    agreementNumber?: string;
    agreementStatus: AgreementStatus;
    signedAt?: Timestamp;
    signedBy?: string;
    renewalDate?: Timestamp;
    terminationDate?: Timestamp;
    terminationReason?: string;
    noticePeriod?: number; // in days
  };
  
  // Optional payment information
  paymentInfo?: {
    paymentMethod?: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'online';
    bankDetails?: {
      accountNumber?: string;
      ifscCode?: string;
      bankName?: string;
    };
    upiId?: string;
    autoDebitEnabled?: boolean;
    lastPaymentDate?: Timestamp;
    nextPaymentDate?: Timestamp;
    outstandingAmount?: number;
    latePaymentCount?: number;
  };
  
  // Optional preferences
  preferences?: {
    paymentReminders: boolean;
    maintenanceUpdates: boolean;
    generalNotifications: boolean;
    preferredContactMethod: 'email' | 'sms' | 'push' | 'whatsapp';
  };
  
  // Optional metadata
  metadata?: {
    verified: boolean;
    verifiedAt?: Timestamp;
    verifiedBy?: string;
    rating?: number;
    totalReviews?: number;
    complaints?: number;
    maintenanceRequests?: number;
    notes?: string;
  };
  
  // Optional analytics
  analytics?: {
    totalRentPaid: number;
    totalLatePayments: number;
    averagePaymentDelay: number; // in days
    totalMaintenanceRequests: number;
    averageResponseTime: number; // in hours
    occupancyDuration: number; // in days
  };
}

// Tenant validation schema
export interface TenantValidation {
  isValid: boolean;
  errors: {
    userId?: string;
    roomId?: string;
    propertyId?: string;
    agreementStart?: string;
    agreementEnd?: string;
    rent?: string;
    deposit?: string;
  };
}

// Tenant search filters
export interface TenantFilters {
  propertyId?: string;
  roomId?: string;
  status?: TenantStatus[];
  agreementStatus?: AgreementStatus[];
  paymentStatus?: PaymentStatus[];
  verified?: boolean;
  depositPaid?: boolean;
}

// Tenant statistics
export interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  pendingTenants: number;
  leftTenants: number;
  totalRent: number;
  totalDeposits: number;
  averageRent: number;
  occupancyRate: number;
}

// Tenant agreement interface
export interface TenantAgreement {
  tenantId: string;
  agreementNumber: string;
  agreementStatus: AgreementStatus;
  startDate: Timestamp;
  endDate: Timestamp;
  rent: number;
  deposit: number;
  terms: string[];
  signedAt?: Timestamp;
  signedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Tenant payment history interface
export interface TenantPaymentHistory {
  tenantId: string;
  month: string; // Format: "YYYY-MM"
  amount: number;
  status: PaymentStatus;
  paidAt?: Timestamp;
  dueDate: Timestamp;
  lateFee?: number;
  notes?: string;
}

// Tenant maintenance history interface
export interface TenantMaintenanceHistory {
  tenantId: string;
  requestId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}
