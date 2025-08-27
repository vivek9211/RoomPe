import { Timestamp } from '@react-native-firebase/firestore';
import { UserRole, Location, EmergencyContact, NotificationPreferences } from './user.types';
import { PropertyType, PropertyLocation, PropertyAmenities, PropertyRules, PropertyPricing } from './property.types';

// Onboarding step enumeration
export enum OnboardingStep {
  PERSONAL_INFO = 'personal_info',
  CONTACT_INFO = 'contact_info',
  ADDRESS = 'address',
  PREFERENCES = 'preferences',
  ROLE_SPECIFIC = 'role_specific',
  VERIFICATION = 'verification',
  COMPLETE = 'complete'
}

// Base onboarding data interface
export interface BaseOnboardingData {
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  currentStep: OnboardingStep;
  isCompleted: boolean;
  startedAt: Timestamp;
  completedAt?: Timestamp;
}

// Personal information for onboarding
export interface PersonalInfoData {
  name: string;
  dateOfBirth?: Timestamp;
  profilePhoto?: string;
  aadhaarImage?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  occupation?: string;
  company?: string;
  annualIncome?: number;
}

// Contact information for onboarding
export interface ContactInfoData {
  phone: string;
  alternatePhone?: string;
  emergencyContact?: EmergencyContact;
  preferredContactMethod: 'email' | 'sms' | 'push' | 'whatsapp';
}

// Address information for onboarding
export interface AddressData {
  currentAddress?: Location;
  permanentAddress?: Location;
  isCurrentAddressPermanent: boolean;
}

// User preferences for onboarding
export interface PreferencesData {
  language: string;
  timezone: string;
  currency: string;
  notifications: NotificationPreferences;
}

// Tenant-specific onboarding data
export interface TenantOnboardingData {
  // Rental preferences
  preferredPropertyTypes: PropertyType[];
  preferredLocations: string[]; // city names
  budgetRange: {
    min: number;
    max: number;
    currency: string;
  };
  moveInDate?: Timestamp;
  leaseDuration?: number; // in months
  
  // Lifestyle preferences
  smoking: boolean;
  pets: boolean;
  cooking: boolean;
  visitors: boolean;
  
  // Additional requirements
  specialRequirements?: string[];
  documents: {
    aadhar?: string;
    pan?: string;
    passport?: string;
    drivingLicense?: string;
    rentalAgreement?: string;
  };
}

// Owner-specific onboarding data
export interface OwnerOnboardingData {
  // Property management preferences
  propertyTypes: PropertyType[];
  targetLocations: string[]; // city names
  investmentBudget: {
    min: number;
    max: number;
    currency: string;
  };
  
  // Management preferences
  selfManage: boolean;
  usePropertyManager: boolean;
  propertyManagerDetails?: {
    name: string;
    phone: string;
    email: string;
    company?: string;
  };
  
  // Business preferences
  businessType: 'individual' | 'company' | 'partnership';
  gstNumber?: string;
  panNumber?: string;
  
  // Additional requirements
  specialRequirements?: string[];
}

// Complete onboarding data interface
export interface OnboardingData extends BaseOnboardingData {
  personalInfo: PersonalInfoData;
  contactInfo: ContactInfoData;
  address: AddressData;
  preferences: PreferencesData;
  roleSpecific: TenantOnboardingData | OwnerOnboardingData;
}

// Onboarding progress tracking
export interface OnboardingProgress {
  step: OnboardingStep;
  isCompleted: boolean;
  completedAt?: Timestamp;
  data?: any;
}

// Onboarding validation result
export interface OnboardingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Onboarding step configuration
export interface OnboardingStepConfig {
  step: OnboardingStep;
  title: string;
  subtitle: string;
  isRequired: boolean;
  dependsOn?: OnboardingStep[];
  fields: string[];
}

// Role-based onboarding configuration
export interface RoleOnboardingConfig {
  role: UserRole;
  steps: OnboardingStepConfig[];
  requiredFields: string[];
  optionalFields: string[];
} 