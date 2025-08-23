import { Timestamp } from '@react-native-firebase/firestore';

// Maintenance status enumeration
export enum MaintenanceStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  ESCALATED = 'escalated'
}

// Maintenance priority enumeration
export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

// Maintenance category enumeration
export enum MaintenanceCategory {
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  HVAC = 'hvac',
  APPLIANCE = 'appliance',
  STRUCTURAL = 'structural',
  CLEANING = 'cleaning',
  SECURITY = 'security',
  INTERNET = 'internet',
  FURNITURE = 'furniture',
  OTHER = 'other'
}

// Maintenance type enumeration
export enum MaintenanceType {
  REPAIR = 'repair',
  REPLACEMENT = 'replacement',
  INSTALLATION = 'installation',
  INSPECTION = 'inspection',
  CLEANING = 'cleaning',
  UPGRADE = 'upgrade',
  PREVENTIVE = 'preventive',
  EMERGENCY = 'emergency'
}

// Base maintenance interface with required fields
export interface BaseMaintenance {
  id: string; // Document ID - REQUIRED
  roomId: string; // REQUIRED - Reference to room
  tenantId: string; // REQUIRED - UID of the tenant
  propertyId: string; // REQUIRED - Reference to property
  title: string; // REQUIRED
  description: string; // REQUIRED
  category: MaintenanceCategory; // REQUIRED
  priority: MaintenancePriority; // REQUIRED
  status: MaintenanceStatus; // REQUIRED
  createdAt: Timestamp; // REQUIRED
  updatedAt: Timestamp; // REQUIRED
}

// Required fields for maintenance creation
export interface CreateMaintenanceData {
  roomId: string;
  tenantId: string;
  propertyId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
}

// Optional fields for maintenance updates
export interface UpdateMaintenanceData {
  title?: string;
  description?: string;
  category?: MaintenanceCategory;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: Timestamp;
  completedDate?: Timestamp;
  notes?: string;
  images?: MaintenanceImage[];
}

// Maintenance image interface
export interface MaintenanceImage {
  url: string;
  caption?: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  type: 'before' | 'after' | 'during' | 'other';
}

// Complete maintenance model with all fields
export interface Maintenance extends BaseMaintenance {
  // Optional maintenance details
  type?: MaintenanceType;
  assignedTo?: string; // UID of assigned staff/contractor
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  resolvedAt?: Timestamp;
  notes?: string;
  images?: MaintenanceImage[];
  
  // Optional location details
  location?: {
    roomNumber?: string;
    floorNumber?: number;
    specificArea?: string; // e.g., "bathroom", "kitchen", "bedroom"
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Optional scheduling details
  scheduling?: {
    preferredDate?: Timestamp;
    preferredTimeSlot?: string; // e.g., "morning", "afternoon", "evening"
    accessInstructions?: string;
    tenantAvailability?: {
      availableDates?: Timestamp[];
      unavailableDates?: Timestamp[];
      preferredContactTime?: string;
    };
  };
  
  // Optional contractor details
  contractor?: {
    contractorId?: string;
    contractorName?: string;
    contractorPhone?: string;
    contractorEmail?: string;
    estimatedDuration?: number; // in hours
    actualDuration?: number; // in hours
    contractorNotes?: string;
    contractorRating?: number;
  };
  
  // Optional parts/materials
  parts?: {
    partName: string;
    partNumber?: string;
    quantity: number;
    cost: number;
    supplier?: string;
    warranty?: {
      duration: number; // in months
      expiryDate?: Timestamp;
    };
  }[];
  
  // Optional follow-up details
  followUp?: {
    required: boolean;
    scheduledDate?: Timestamp;
    completedDate?: Timestamp;
    notes?: string;
    nextInspectionDate?: Timestamp;
  };
  
  // Optional metadata
  metadata?: {
    isEmergency: boolean;
    isRecurring: boolean;
    recurrencePattern?: string; // e.g., "monthly", "quarterly"
    relatedMaintenanceId?: string;
    escalatedFrom?: string;
    escalatedTo?: string;
    escalationReason?: string;
    verified: boolean;
    verifiedAt?: Timestamp;
    verifiedBy?: string;
  };
  
  // Optional analytics
  analytics?: {
    responseTime?: number; // in hours
    resolutionTime?: number; // in hours
    customerSatisfaction?: number; // 1-5 rating
    costVariance?: number; // difference between estimated and actual
    recurrenceCount?: number;
  };
}

// Maintenance validation schema
export interface MaintenanceValidation {
  isValid: boolean;
  errors: {
    roomId?: string;
    tenantId?: string;
    propertyId?: string;
    title?: string;
    description?: string;
    category?: string;
    priority?: string;
  };
}

// Maintenance search filters
export interface MaintenanceFilters {
  propertyId?: string;
  roomId?: string;
  tenantId?: string;
  status?: MaintenanceStatus[];
  priority?: MaintenancePriority[];
  category?: MaintenanceCategory[];
  assignedTo?: string;
  dateRange?: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  isEmergency?: boolean;
  verified?: boolean;
}

// Maintenance statistics
export interface MaintenanceStats {
  totalRequests: number;
  openRequests: number;
  inProgressRequests: number;
  resolvedRequests: number;
  closedRequests: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  totalCost: number;
  averageCost: number;
  customerSatisfaction: number;
}

// Maintenance schedule interface
export interface MaintenanceSchedule {
  id: string;
  propertyId: string;
  roomId?: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  type: MaintenanceType;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextDueDate: Timestamp;
  lastCompletedDate?: Timestamp;
  assignedTo?: string;
  estimatedCost?: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Maintenance report interface
export interface MaintenanceReport {
  propertyId: string;
  period: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  totalRequests: number;
  resolvedRequests: number;
  pendingRequests: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  totalCost: number;
  costBreakdown: {
    category: MaintenanceCategory;
    count: number;
    totalCost: number;
  }[];
  priorityBreakdown: {
    priority: MaintenancePriority;
    count: number;
  }[];
  contractorPerformance: {
    contractorId: string;
    contractorName: string;
    totalAssigned: number;
    completed: number;
    averageRating: number;
    averageCompletionTime: number;
  }[];
}
