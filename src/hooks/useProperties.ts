import { useState, useEffect, useCallback } from 'react';
import { Property, CreatePropertyData, UpdatePropertyData, PropertyFilters, PropertyStats } from '../types/property.types';
import { propertyApiService } from '../services/api/propertyApi';
import { useAuth } from '../contexts/AuthContext';

interface UsePropertiesReturn {
  // State
  properties: Property[];
  property: Property | null;
  loading: boolean;
  error: string | null;
  stats: PropertyStats | null;
  
  // Actions
  createProperty: (propertyData: CreatePropertyData) => Promise<string>;
  updateProperty: (propertyId: string, updates: UpdatePropertyData) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
  getPropertyById: (propertyId: string) => Promise<void>;
  getPropertiesByOwner: (ownerId: string) => Promise<void>;
  getAllProperties: () => Promise<void>;
  getPropertiesWithFilters: (filters: PropertyFilters) => Promise<void>;
  getPropertyStats: (propertyId?: string) => Promise<void>;
  searchProperties: (searchTerm: string, filters?: PropertyFilters) => Promise<void>;
  
  // Utilities
  clearError: () => void;
  clearProperty: () => void;
}

export const useProperties = (): UsePropertiesReturn => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PropertyStats | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearProperty = useCallback(() => {
    setProperty(null);
  }, []);

  const createProperty = useCallback(async (propertyData: CreatePropertyData): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      
      const propertyId = await propertyApiService.createProperty(propertyData);
      
      // Refresh the properties list
      if (user?.uid) {
        await getPropertiesByOwner(user.uid);
      }
      
      return propertyId;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create property';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const updateProperty = useCallback(async (propertyId: string, updates: UpdatePropertyData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await propertyApiService.updateProperty(propertyId, updates);
      
      // Update the property in the list
      setProperties(prevProperties => 
        prevProperties.map(p => 
          p.id === propertyId ? { ...p, ...updates } : p
        )
      );
      
      // Update the current property if it's the one being updated
      if (property?.id === propertyId) {
        setProperty(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update property';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [property]);

  const deleteProperty = useCallback(async (propertyId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await propertyApiService.deleteProperty(propertyId);
      
      // Remove the property from the list
      setProperties(prevProperties => prevProperties.filter(p => p.id !== propertyId));
      
      // Clear the current property if it's the one being deleted
      if (property?.id === propertyId) {
        setProperty(null);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete property';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [property]);

  const getPropertyById = useCallback(async (propertyId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const propertyData = await propertyApiService.getPropertyById(propertyId);
      setProperty(propertyData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch property';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPropertiesByOwner = useCallback(async (ownerId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const propertiesData = await propertyApiService.getPropertiesByOwner(ownerId);
      setProperties(propertiesData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch properties';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllProperties = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const propertiesData = await propertyApiService.getPropertiesWithFilters();
      setProperties(propertiesData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch properties';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPropertiesWithFilters = useCallback(async (filters: PropertyFilters): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const propertiesData = await propertyApiService.getPropertiesWithFilters(filters);
      setProperties(propertiesData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch properties';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPropertyStats = useCallback(async (propertyId?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const statsData = await propertyApiService.getPropertyStats(propertyId);
      setStats(statsData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch property statistics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProperties = useCallback(async (searchTerm: string, filters: PropertyFilters = {}): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const propertiesData = await propertyApiService.searchProperties(searchTerm, filters);
      setProperties(propertiesData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to search properties';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up real-time listeners for properties when user is authenticated
  useEffect(() => {
    if (!user) {
      setProperties([]);
      setProperty(null);
      return;
    }

    // Load all properties so tenants can find their property
    // In a real app, you might want to be more selective based on user role
    getAllProperties();
  }, [user, getAllProperties]);

  return {
    // State
    properties,
    property,
    loading,
    error,
    stats,
    
    // Actions
    createProperty,
    updateProperty,
    deleteProperty,
    getPropertyById,
    getPropertiesByOwner,
    getAllProperties,
    getPropertiesWithFilters,
    getPropertyStats,
    searchProperties,
    
    // Utilities
    clearError,
    clearProperty,
  };
};

export default useProperties;
