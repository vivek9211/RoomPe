import { useState, useEffect, useCallback } from 'react';
import { Tenant, CreateTenantData, UpdateTenantData, TenantFilters, TenantStats } from '../types/tenant.types';
import { tenantApiService } from '../services/api/tenantApi';
import { useAuth } from '../contexts/AuthContext';

interface UseTenantsReturn {
  // State
  tenants: Tenant[];
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  stats: TenantStats | null;
  
  // Actions
  createTenant: (tenantData: CreateTenantData) => Promise<string>;
  updateTenant: (tenantId: string, updates: UpdateTenantData) => Promise<void>;
  deleteTenant: (tenantId: string) => Promise<void>;
  getTenantById: (tenantId: string) => Promise<void>;
  getTenantsByProperty: (propertyId: string) => Promise<void>;
  getTenantsWithFilters: (filters: TenantFilters) => Promise<void>;
  getTenantStats: (propertyId?: string) => Promise<void>;
  searchTenants: (searchTerm: string, propertyId?: string) => Promise<void>;
  
  // Utilities
  clearError: () => void;
  clearTenant: () => void;
}

export const useTenants = (): UseTenantsReturn => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TenantStats | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearTenant = useCallback(() => {
    setTenant(null);
  }, []);

  const createTenant = useCallback(async (tenantData: CreateTenantData): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      
      const tenantId = await tenantApiService.createTenant(tenantData);
      
      // Refresh the tenants list
      if (tenantData.propertyId) {
        await getTenantsByProperty(tenantData.propertyId);
      }
      
      return tenantId;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create tenant';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTenant = useCallback(async (tenantId: string, updates: UpdateTenantData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await tenantApiService.updateTenant(tenantId, updates);
      
      // Update the tenant in the list
      setTenants(prevTenants => 
        prevTenants.map(t => 
          t.id === tenantId ? { ...t, ...updates } : t
        )
      );
      
      // Update the current tenant if it's the one being updated
      if (tenant?.id === tenantId) {
        setTenant(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update tenant';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  const deleteTenant = useCallback(async (tenantId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await tenantApiService.deleteTenant(tenantId);
      
      // Remove the tenant from the list
      setTenants(prevTenants => prevTenants.filter(t => t.id !== tenantId));
      
      // Clear the current tenant if it's the one being deleted
      if (tenant?.id === tenantId) {
        setTenant(null);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete tenant';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  const getTenantById = useCallback(async (tenantId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const tenantData = await tenantApiService.getTenantById(tenantId);
      setTenant(tenantData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch tenant';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTenantsByProperty = useCallback(async (propertyId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const tenantsData = await tenantApiService.getTenantsByProperty(propertyId);
      setTenants(tenantsData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch tenants';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTenantsWithFilters = useCallback(async (filters: TenantFilters): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const tenantsData = await tenantApiService.getTenantsWithFilters(filters);
      setTenants(tenantsData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch tenants';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTenantStats = useCallback(async (propertyId?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const statsData = await tenantApiService.getTenantStats(propertyId);
      setStats(statsData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch tenant statistics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchTenants = useCallback(async (searchTerm: string, propertyId?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const tenantsData = await tenantApiService.searchTenants(searchTerm, propertyId);
      setTenants(tenantsData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to search tenants';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up real-time listeners for tenants when user is authenticated
  useEffect(() => {
    if (!user) {
      setTenants([]);
      setTenant(null);
      return;
    }

    // If user is an owner, we can set up listeners for their properties
    // For now, we'll just clear the state when user changes
    setTenants([]);
    setTenant(null);
  }, [user]);

  return {
    // State
    tenants,
    tenant,
    loading,
    error,
    stats,
    
    // Actions
    createTenant,
    updateTenant,
    deleteTenant,
    getTenantById,
    getTenantsByProperty,
    getTenantsWithFilters,
    getTenantStats,
    searchTenants,
    
    // Utilities
    clearError,
    clearTenant,
  };
};

export default useTenants;
