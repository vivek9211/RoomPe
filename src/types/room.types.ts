import { Timestamp } from '@react-native-firebase/firestore';

// Room status enumeration
export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
  RENOVATION = 'renovation'
}

// Room type enumeration
export enum RoomType {
  SINGLE = 'single',
  DOUBLE = 'double',
  TRIPLE = 'triple',
  QUAD = 'quad',
  DELUXE = 'deluxe',
  AC = 'ac',
  NON_AC = 'non_ac'
}

// Room amenities interface
export interface RoomAmenities {
  // Basic amenities
  bed: boolean;
  wardrobe: boolean;
  table: boolean;
  chair: boolean;
  fan: boolean;
  light: boolean;
  
  // Additional amenities
  ac?: boolean;
  tv?: boolean;
  refrigerator?: boolean;
  geyser?: boolean;
  balcony?: boolean;
  attachedBathroom?: boolean;
  wifi?: boolean;
  powerBackup?: boolean;
}

// Room pricing interface
export interface RoomPricing {
  rent: number; // REQUIRED
  deposit: number; // REQUIRED
  maintenanceCharges?: number;
  electricityCharges?: number;
  waterCharges?: number;
  internetCharges?: number;
  foodCharges?: number;
  latePaymentPenalty?: number;
  currency: string; // Default: "INR"
}

// Room images interface
export interface RoomImage {
  url: string;
  caption?: string;
  isPrimary: boolean;
  uploadedAt: Timestamp;
}

// Base room interface with required fields
export interface BaseRoom {
  id: string; // Document ID - REQUIRED
  propertyId: string; // REQUIRED - Reference to property
  roomNumber: string; // REQUIRED
  type: RoomType; // REQUIRED
  status: RoomStatus; // REQUIRED
  capacity: number; // REQUIRED - Maximum number of tenants
  occupied: number; // REQUIRED - Current number of tenants
  pricing: RoomPricing; // REQUIRED
  createdAt: Timestamp; // REQUIRED
  updatedAt: Timestamp; // REQUIRED
}

// Required fields for room creation
export interface CreateRoomData {
  propertyId: string;
  roomNumber: string;
  type: RoomType;
  capacity: number;
  pricing: RoomPricing;
}

// Optional fields for room updates
export interface UpdateRoomData {
  roomNumber?: string;
  type?: RoomType;
  status?: RoomStatus;
  capacity?: number;
  occupied?: number;
  pricing?: RoomPricing;
  amenities?: RoomAmenities;
  description?: string;
  images?: RoomImage[];
}

// Complete room model with all fields
export interface Room extends BaseRoom {
  // Optional room details
  description?: string;
  amenities?: RoomAmenities;
  images?: RoomImage[];
  coverImage?: string;
  
  // Tenant information
  tenantIds: string[]; // Array of tenant UIDs currently in this room
  
  // Optional specifications
  specifications?: {
    area?: number; // in sq ft
    floorNumber?: number;
    roomSize?: string; // e.g., "10x12"
    windowCount?: number;
    bathroomType?: 'attached' | 'shared' | 'none';
  };
  
  // Optional rules specific to this room
  rules?: {
    smokingAllowed: boolean;
    petsAllowed: boolean;
    visitorsAllowed: boolean;
    cookingAllowed: boolean;
    additionalRules?: string[];
  };
  
  // Optional metadata
  metadata?: {
    isAvailable: boolean;
    lastCleanedAt?: Timestamp;
    lastMaintenanceAt?: Timestamp;
    nextMaintenanceDate?: Timestamp;
    roomCondition?: 'excellent' | 'good' | 'fair' | 'poor';
    notes?: string;
  };
  
  // Optional analytics
  analytics?: {
    totalTenants: number;
    averageOccupancyRate: number;
    totalRevenue: number;
    averageRent: number;
    lastOccupiedAt?: Timestamp;
    maintenanceRequests: number;
  };
}

// Room validation schema
export interface RoomValidation {
  isValid: boolean;
  errors: {
    propertyId?: string;
    roomNumber?: string;
    type?: string;
    capacity?: string;
    pricing?: string;
  };
}

// Room search filters
export interface RoomFilters {
  propertyId?: string;
  type?: RoomType[];
  status?: RoomStatus[];
  minRent?: number;
  maxRent?: number;
  capacity?: number;
  amenities?: string[];
  available?: boolean;
}

// Room statistics
export interface RoomStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  totalRevenue: number;
  averageRent: number;
  totalTenants: number;
  maintenanceRequests: number;
}

// Room assignment interface
export interface RoomAssignment {
  roomId: string;
  tenantId: string;
  assignedAt: Timestamp;
  assignedBy: string; // UID of person who made the assignment
  notes?: string;
}

// Room availability interface
export interface RoomAvailability {
  roomId: string;
  isAvailable: boolean;
  availableFrom?: Timestamp;
  availableUntil?: Timestamp;
  reason?: string; // Why room is unavailable
}

// Room sharing types
export enum RoomSharingType {
  SINGLE = 'single',
  DOUBLE = 'double',
  TRIPLE = 'triple',
  FOUR_SHARING = 'four_sharing',
  FIVE_SHARING = 'five_sharing',
  SIX_SHARING = 'six_sharing',
  SEVEN_SHARING = 'seven_sharing',
  EIGHT_SHARING = 'eight_sharing',
  NINE_SHARING = 'nine_sharing',
}

// Unit types
export enum UnitType {
  ROOM = 'room',
  RK = 'rk',
  BHK_1 = 'bhk_1',
  BHK_2 = 'bhk_2',
  BHK_3 = 'bhk_3',
  BHK_4 = 'bhk_4',
  BHK_5 = 'bhk_5',
  BHK_6 = 'bhk_6',
  STUDIO_APARTMENT = 'studio_apartment',
}

// Floor interface
export interface Floor {
  id: string;
  floorNumber: number;
  floorName: string; // e.g., "Ground Floor", "1st Floor"
  totalUnits: number;
  filledUnits: number;
  vacantUnits: number;
  units: Unit[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Unit interface
export interface Unit {
  id: string;
  floorId: string;
  unitNumber: string; // e.g., "101", "A1"
  unitType: UnitType;
  sharingType?: RoomSharingType; // Only for rooms
  capacity: number; // Number of people it can accommodate
  isOccupied: boolean;
  tenantIds: string[];
  rent: number;
  deposit: number;
  amenities: string[];
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Room configuration for a floor
export interface FloorRoomConfig {
  floorId: string;
  floorName: string;
  roomConfigs: {
    [key in RoomSharingType]: number; // Count of rooms for each sharing type
  };
  unitConfigs: {
    [key in UnitType]: number; // Count of units for each unit type
  };
}

// Property room mapping
export interface PropertyRoomMapping {
  propertyId: string;
  totalFloors: number;
  floors: Floor[];
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Room mapping creation data
export interface CreateRoomMappingData {
  propertyId: string;
  totalFloors: number;
  floorConfigs: FloorRoomConfig[];
}

// Floor creation data
export interface CreateFloorData {
  propertyId: string;
  floorNumber: number;
  floorName: string;
  roomConfigs: Partial<Record<RoomSharingType, number>>;
  unitConfigs: Partial<Record<UnitType, number>>;
}

// Unit creation data
export interface CreateUnitData {
  floorId: string;
  unitNumber: string;
  unitType: UnitType;
  sharingType?: RoomSharingType;
  capacity: number;
  rent: number;
  deposit: number;
  amenities?: string[];
}

// Room mapping statistics
export interface RoomMappingStats {
  totalFloors: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  revenue: number;
  averageRent: number;
  floorBreakdown: {
    floorName: string;
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
  }[];
}
