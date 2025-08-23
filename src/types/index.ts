import { Timestamp } from '@react-native-firebase/firestore';

// Export all enterprise-level models for RoomPe application

// Common types first
export * from './common.types';

// User models
export * from './user.types';

// Property models
export * from './property.types';

// Room models
export * from './room.types';

// Tenant models
export * from './tenant.types';

// Payment models
export * from './payment.types';

// Maintenance models
export * from './maintenance.types';

// Notification models
export * from './notification.types';

// Common types that can be shared across models
export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
