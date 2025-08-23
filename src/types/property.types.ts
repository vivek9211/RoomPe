import { Timestamp } from '@react-native-firebase/firestore';

// Property types enumeration
export enum PropertyType {
  PG = 'pg',
  FLAT = 'flat',
  APARTMENT = 'apartment',
  HOUSE = 'house',
  VILLA = 'villa',
  STUDIO = 'studio'
}

// Property status enumeration
export enum PropertyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  RENOVATION = 'renovation',
  SOLD = 'sold',
  RENTED_OUT = 'rented_out'
}

// Property location interface
export interface PropertyLocation {
  address: string; // REQUIRED
  city: string; // REQUIRED
  state: string; // REQUIRED
  postalCode: string; // REQUIRED
  country: string; // REQUIRED
  coordinates?: {
    lat: number;
    lng: number;
  };
  landmark?: string;
  area?: string; // e.g., "MG Road", "Koramangala"
}

// Property amenities interface
export interface PropertyAmenities {
  // Basic amenities (required for most properties)
  wifi: boolean;
  ac: boolean;
  food: boolean;
  laundry: boolean;
  parking: boolean;
  security: boolean;
  
  // Additional amenities (optional)
  gym?: boolean;
  pool?: boolean;
  garden?: boolean;
  kitchen?: boolean;
  tv?: boolean;
  refrigerator?: boolean;
  washingMachine?: boolean;
  geyser?: boolean;
  balcony?: boolean;
  lift?: boolean;
  powerBackup?: boolean;
  cctv?: boolean;
  housekeeping?: boolean;
  medicalSupport?: boolean;
}

// Property rules interface
export interface PropertyRules {
  smokingAllowed: boolean;
  petsAllowed: boolean;
  visitorsAllowed: boolean;
  cookingAllowed: boolean;
  curfewTime?: string; // e.g., "11:00 PM"
  additionalRules?: string[];
}

// Property pricing interface
export interface PropertyPricing {
  baseRent: number; // REQUIRED
  deposit: number; // REQUIRED
  maintenanceCharges?: number;
  electricityCharges?: number;
  waterCharges?: number;
  internetCharges?: number;
  foodCharges?: number;
  latePaymentPenalty?: number;
  currency: string; // Default: "INR"
}

// Property images interface
export interface PropertyImage {
  url: string;
  caption?: string;
  isPrimary: boolean;
  uploadedAt: Timestamp;
}

// Base property interface with required fields
export interface BaseProperty {
  id: string; // Document ID - REQUIRED
  name: string; // REQUIRED
  ownerId: string; // REQUIRED - UID of the owner
  type: PropertyType; // REQUIRED
  status: PropertyStatus; // REQUIRED
  location: PropertyLocation; // REQUIRED
  totalRooms: number; // REQUIRED
  availableRooms: number; // REQUIRED
  createdAt: Timestamp; // REQUIRED
  updatedAt: Timestamp; // REQUIRED
}

// Required fields for property creation
export interface CreatePropertyData {
  name: string;
  ownerId: string;
  type: PropertyType;
  location: PropertyLocation;
  totalRooms: number;
  pricing: PropertyPricing;
}

// Optional fields for property updates
export interface UpdatePropertyData {
  name?: string;
  status?: PropertyStatus;
  location?: PropertyLocation;
  totalRooms?: number;
  availableRooms?: number;
  amenities?: PropertyAmenities;
  rules?: PropertyRules;
  pricing?: PropertyPricing;
  description?: string;
  images?: PropertyImage[];
}

// Complete property model with all fields
export interface Property extends BaseProperty {
  // Optional property details
  description?: string;
  amenities?: PropertyAmenities;
  rules?: PropertyRules;
  pricing: PropertyPricing;
  
  // Optional images
  images?: PropertyImage[];
  coverImage?: string;
  
  // Optional specifications
  specifications?: {
    builtUpArea?: number; // in sq ft
    carpetArea?: number; // in sq ft
    floorNumber?: number;
    totalFloors?: number;
    yearBuilt?: number;
    age?: number;
  };
  
  // Optional contact information
  contactInfo?: {
    managerName?: string;
    managerPhone?: string;
    managerEmail?: string;
    emergencyContact?: string;
  };
  
  // Optional metadata
  metadata?: {
    verified: boolean;
    featured: boolean;
    rating?: number;
    totalReviews?: number;
    lastInspectionDate?: Timestamp;
    insuranceInfo?: {
      provider?: string;
      policyNumber?: string;
      expiryDate?: Timestamp;
    };
  };
  
  // Optional analytics
  analytics?: {
    totalViews: number;
    totalInquiries: number;
    averageOccupancyRate: number;
    totalRevenue: number;
    lastOccupiedAt?: Timestamp;
  };
}

// Property validation schema
export interface PropertyValidation {
  isValid: boolean;
  errors: {
    name?: string;
    ownerId?: string;
    type?: string;
    location?: string;
    totalRooms?: string;
    pricing?: string;
  };
}

// Property search filters
export interface PropertyFilters {
  type?: PropertyType[];
  status?: PropertyStatus[];
  city?: string;
  minRent?: number;
  maxRent?: number;
  amenities?: string[];
  availableRooms?: number;
  verified?: boolean;
  featured?: boolean;
}

// Property statistics
export interface PropertyStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  totalRevenue: number;
  averageRent: number;
  totalTenants: number;
  maintenanceRequests: number;
}
