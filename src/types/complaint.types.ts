import { Timestamp } from '@react-native-firebase/firestore';

// Complaint status enumeration
export enum ComplaintStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  ESCALATED = 'escalated'
}

// Complaint priority enumeration
export enum ComplaintPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

// Complaint category enumeration
export enum ComplaintCategory {
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  WATER = 'water',
  CLEANING = 'cleaning',
  SECURITY = 'security',
  INTERNET = 'internet',
  HVAC = 'hvac',
  FURNITURE = 'furniture',
  STRUCTURAL = 'structural',
  NOISE = 'noise',
  OTHER = 'other'
}

// Complaint type enumeration
export enum ComplaintType {
  MAINTENANCE = 'maintenance',
  BEHAVIOR = 'behavior',
  FACILITY = 'facility',
  SECURITY = 'security',
  PAYMENT = 'payment',
  OTHER = 'other'
}

// Base complaint interface with required fields
export interface BaseComplaint {
  id: string; // Document ID - REQUIRED
  tenantId: string; // REQUIRED - UID of the tenant
  propertyId: string; // REQUIRED - Reference to property
  roomId: string; // REQUIRED - Reference to room
  title: string; // REQUIRED
  description: string; // REQUIRED
  category: ComplaintCategory; // REQUIRED
  type: ComplaintType; // REQUIRED
  priority: ComplaintPriority; // REQUIRED
  status: ComplaintStatus; // REQUIRED
  createdAt: Timestamp; // REQUIRED
  updatedAt: Timestamp; // REQUIRED
}

// Required fields for complaint creation
export interface CreateComplaintData {
  tenantId: string;
  propertyId: string;
  roomId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  type: ComplaintType;
  priority: ComplaintPriority;
}

// Optional fields for complaint updates
export interface UpdateComplaintData {
  title?: string;
  description?: string;
  category?: ComplaintCategory;
  type?: ComplaintType;
  priority?: ComplaintPriority;
  status?: ComplaintStatus;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: Timestamp;
  closedAt?: Timestamp;
  notes?: string;
  images?: ComplaintImage[];
}

// Complaint image interface
export interface ComplaintImage {
  url: string;
  caption?: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  type: 'before' | 'after' | 'during' | 'other';
}

// Complete complaint model with all fields
export interface Complaint extends BaseComplaint {
  // Optional complaint details
  assignedTo?: string; // UID of assigned staff/manager
  resolution?: string;
  resolvedAt?: Timestamp;
  closedAt?: Timestamp;
  notes?: string;
  images?: ComplaintImage[];
  
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
  
  // Optional staff details
  staff?: {
    staffId?: string;
    staffName?: string;
    staffPhone?: string;
    staffEmail?: string;
    estimatedDuration?: number; // in hours
    actualDuration?: number; // in hours
    staffNotes?: string;
    staffRating?: number;
  };
  
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
    relatedComplaintId?: string;
    escalatedFrom?: string;
    escalatedTo?: string;
    escalationReason?: string;
    verified: boolean;
    verifiedAt?: Timestamp;
    verifiedBy?: string;
    tenantSatisfaction?: number; // 1-5 rating
    tenantFeedback?: string;
  };
  
  // Optional analytics
  analytics?: {
    responseTime?: number; // in hours
    resolutionTime?: number; // in hours
    customerSatisfaction?: number; // 1-5 rating
    recurrenceCount?: number;
    escalationCount?: number;
  };
}

// Complaint validation schema
export interface ComplaintValidation {
  isValid: boolean;
  errors: {
    tenantId?: string;
    propertyId?: string;
    roomId?: string;
    title?: string;
    description?: string;
    category?: string;
    type?: string;
    priority?: string;
  };
}

// Complaint search filters
export interface ComplaintFilters {
  propertyId?: string;
  roomId?: string;
  tenantId?: string;
  status?: ComplaintStatus[];
  priority?: ComplaintPriority[];
  category?: ComplaintCategory[];
  type?: ComplaintType[];
  assignedTo?: string;
  dateRange?: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  isEmergency?: boolean;
  verified?: boolean;
}

// Complaint statistics
export interface ComplaintStats {
  totalComplaints: number;
  openComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  closedComplaints: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  customerSatisfaction: number;
  categoryBreakdown: {
    category: ComplaintCategory;
    count: number;
    percentage: number;
  }[];
  priorityBreakdown: {
    priority: ComplaintPriority;
    count: number;
    percentage: number;
  }[];
}

// Complaint report interface
export interface ComplaintReport {
  propertyId: string;
  period: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  categoryBreakdown: {
    category: ComplaintCategory;
    count: number;
    totalCost: number;
  }[];
  priorityBreakdown: {
    priority: ComplaintPriority;
    count: number;
  }[];
  staffPerformance: {
    staffId: string;
    staffName: string;
    totalAssigned: number;
    completed: number;
    averageRating: number;
    averageCompletionTime: number;
  }[];
}

// Predefined complaint templates
export interface ComplaintTemplate {
  id: string;
  category: ComplaintCategory;
  type: ComplaintType;
  title: string;
  description: string;
  priority: ComplaintPriority;
  suggestedActions?: string[];
  estimatedResolutionTime?: number; // in hours
}

// Common complaint templates
export const COMPLAINT_TEMPLATES: ComplaintTemplate[] = [
  {
    id: 'electrical_power_outage',
    category: ComplaintCategory.ELECTRICAL,
    type: ComplaintType.MAINTENANCE,
    title: 'Power Outage',
    description: 'No electricity in the room/building',
    priority: ComplaintPriority.URGENT,
    suggestedActions: ['Check main switch', 'Contact electrician', 'Report to building management'],
    estimatedResolutionTime: 2,
  },
  {
    id: 'electrical_socket_not_working',
    category: ComplaintCategory.ELECTRICAL,
    type: ComplaintType.MAINTENANCE,
    title: 'Socket Not Working',
    description: 'Electrical socket is not functioning properly',
    priority: ComplaintPriority.MEDIUM,
    suggestedActions: ['Check circuit breaker', 'Test with different device', 'Contact electrician'],
    estimatedResolutionTime: 4,
  },
  {
    id: 'plumbing_water_leak',
    category: ComplaintCategory.PLUMBING,
    type: ComplaintType.MAINTENANCE,
    title: 'Water Leak',
    description: 'Water is leaking from pipes or fixtures',
    priority: ComplaintPriority.HIGH,
    suggestedActions: ['Turn off main water supply', 'Place bucket to collect water', 'Contact plumber'],
    estimatedResolutionTime: 2,
  },
  {
    id: 'plumbing_clogged_drain',
    category: ComplaintCategory.PLUMBING,
    type: ComplaintType.MAINTENANCE,
    title: 'Clogged Drain',
    description: 'Drain is blocked and water is not flowing',
    priority: ComplaintPriority.MEDIUM,
    suggestedActions: ['Try plunger', 'Use drain cleaner', 'Contact plumber'],
    estimatedResolutionTime: 3,
  },
  {
    id: 'water_no_water',
    category: ComplaintCategory.WATER,
    type: ComplaintType.MAINTENANCE,
    title: 'No Water Supply',
    description: 'No water coming from taps',
    priority: ComplaintPriority.HIGH,
    suggestedActions: ['Check building water supply', 'Contact building management', 'Check for maintenance work'],
    estimatedResolutionTime: 4,
  },
  {
    id: 'water_poor_quality',
    category: ComplaintCategory.WATER,
    type: ComplaintType.MAINTENANCE,
    title: 'Poor Water Quality',
    description: 'Water quality is poor (color, taste, smell)',
    priority: ComplaintPriority.MEDIUM,
    suggestedActions: ['Report to building management', 'Contact water department', 'Use water purifier'],
    estimatedResolutionTime: 24,
  },
  {
    id: 'cleaning_room_dirty',
    category: ComplaintCategory.CLEANING,
    type: ComplaintType.FACILITY,
    title: 'Room Not Cleaned',
    description: 'Room cleaning service was not provided or inadequate',
    priority: ComplaintPriority.LOW,
    suggestedActions: ['Contact housekeeping', 'Request re-cleaning', 'Report to management'],
    estimatedResolutionTime: 2,
  },
  {
    id: 'cleaning_common_area_dirty',
    category: ComplaintCategory.CLEANING,
    type: ComplaintType.FACILITY,
    title: 'Common Area Dirty',
    description: 'Common areas (lobby, stairs, etc.) are not clean',
    priority: ComplaintPriority.LOW,
    suggestedActions: ['Report to building management', 'Contact housekeeping', 'Request cleaning'],
    estimatedResolutionTime: 4,
  },
  {
    id: 'security_unauthorized_person',
    category: ComplaintCategory.SECURITY,
    type: ComplaintType.SECURITY,
    title: 'Unauthorized Person',
    description: 'Suspicious or unauthorized person in the building',
    priority: ComplaintPriority.URGENT,
    suggestedActions: ['Contact security immediately', 'Report to building management', 'Call police if necessary'],
    estimatedResolutionTime: 0.5,
  },
  {
    id: 'security_broken_lock',
    category: ComplaintCategory.SECURITY,
    type: ComplaintType.SECURITY,
    title: 'Broken Lock',
    description: 'Door lock is broken or not working properly',
    priority: ComplaintPriority.HIGH,
    suggestedActions: ['Contact security', 'Report to building management', 'Request lock replacement'],
    estimatedResolutionTime: 2,
  },
  {
    id: 'internet_no_connection',
    category: ComplaintCategory.INTERNET,
    type: ComplaintType.FACILITY,
    title: 'No Internet Connection',
    description: 'Internet is not working or very slow',
    priority: ComplaintPriority.MEDIUM,
    suggestedActions: ['Check router', 'Restart modem', 'Contact internet provider'],
    estimatedResolutionTime: 4,
  },
  {
    id: 'noise_loud_music',
    category: ComplaintCategory.NOISE,
    type: ComplaintType.BEHAVIOR,
    title: 'Loud Music/Noise',
    description: 'Excessive noise from neighbors or common areas',
    priority: ComplaintPriority.MEDIUM,
    suggestedActions: ['Politely ask to reduce volume', 'Report to building management', 'Contact security'],
    estimatedResolutionTime: 1,
  },
  {
    id: 'furniture_broken',
    category: ComplaintCategory.FURNITURE,
    type: ComplaintType.MAINTENANCE,
    title: 'Broken Furniture',
    description: 'Furniture in the room is broken or damaged',
    priority: ComplaintPriority.LOW,
    suggestedActions: ['Report to building management', 'Request repair/replacement', 'Take photos for evidence'],
    estimatedResolutionTime: 24,
  },
  {
    id: 'other_general',
    category: ComplaintCategory.OTHER,
    type: ComplaintType.OTHER,
    title: 'Other Issue',
    description: 'Please describe your issue in detail',
    priority: ComplaintPriority.MEDIUM,
    suggestedActions: ['Provide detailed description', 'Include photos if possible', 'Specify urgency level'],
    estimatedResolutionTime: 24,
  },
];

