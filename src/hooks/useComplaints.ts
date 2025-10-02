import { useState, useEffect, useCallback } from 'react';
import { 
  Complaint, 
  CreateComplaintData, 
  UpdateComplaintData, 
  ComplaintFilters,
  ComplaintStats,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintCategory,
  ComplaintType
} from '../types/complaint.types';
import { complaintApiService } from '../services/api/complaintApi';

interface UseComplaintsReturn {
  // State
  complaints: Complaint[];
  complaint: Complaint | null;
  stats: ComplaintStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  createComplaint: (data: CreateComplaintData) => Promise<string | null>;
  updateComplaint: (id: string, data: UpdateComplaintData) => Promise<void>;
  deleteComplaint: (id: string) => Promise<void>;
  getComplaintById: (id: string) => Promise<Complaint | null>;
  getComplaints: (filters?: ComplaintFilters) => Promise<Complaint[]>;
  getComplaintsByTenant: (tenantId: string) => Promise<Complaint[]>;
  getComplaintsByProperty: (propertyId: string) => Promise<Complaint[]>;
  searchComplaints: (searchTerm: string, filters?: ComplaintFilters) => Promise<Complaint[]>;
  getEmergencyComplaints: (propertyId?: string) => Promise<Complaint[]>;
  assignComplaint: (id: string, staffId: string, staffName: string) => Promise<void>;
  resolveComplaint: (id: string, resolution: string, staffId?: string) => Promise<void>;
  closeComplaint: (id: string, notes?: string) => Promise<void>;
  getComplaintStats: (propertyId?: string) => Promise<ComplaintStats | null>;
  refreshComplaints: () => Promise<void>;
  clearError: () => void;
  clearComplaint: () => void;
}

export const useComplaints = (): UseComplaintsReturn => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear current complaint
  const clearComplaint = useCallback(() => {
    setComplaint(null);
  }, []);

  // Create complaint
  const createComplaint = useCallback(async (data: CreateComplaintData): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const complaintId = await complaintApiService.createComplaint(data);
      
      if (complaintId) {
        // Refresh complaints list
        await refreshComplaints();
      }
      
      return complaintId;
    } catch (err: any) {
      setError(err.message || 'Failed to create complaint');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update complaint
  const updateComplaint = useCallback(async (id: string, data: UpdateComplaintData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await complaintApiService.updateComplaint(id, data);
      
      // Update local state
      setComplaints(prev => 
        prev.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date() as any } : c)
      );
      
      if (complaint?.id === id) {
        setComplaint(prev => prev ? { ...prev, ...data, updatedAt: new Date() as any } : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update complaint');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [complaint]);

  // Delete complaint
  const deleteComplaint = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await complaintApiService.deleteComplaint(id);
      
      // Update local state
      setComplaints(prev => prev.filter(c => c.id !== id));
      
      if (complaint?.id === id) {
        setComplaint(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete complaint');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [complaint]);

  // Get complaint by ID
  const getComplaintById = useCallback(async (id: string): Promise<Complaint | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const complaintData = await complaintApiService.getComplaintById(id);
      setComplaint(complaintData);
      
      return complaintData;
    } catch (err: any) {
      setError(err.message || 'Failed to get complaint');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get complaints with filters
  const getComplaints = useCallback(async (filters: ComplaintFilters = {}): Promise<Complaint[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const complaintsData = await complaintApiService.getComplaints(filters);
      setComplaints(complaintsData);
      
      return complaintsData;
    } catch (err: any) {
      setError(err.message || 'Failed to get complaints');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get complaints by tenant
  const getComplaintsByTenant = useCallback(async (tenantId: string): Promise<Complaint[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const complaintsData = await complaintApiService.getComplaintsByTenant(tenantId);
      setComplaints(complaintsData);
      
      return complaintsData;
    } catch (err: any) {
      setError(err.message || 'Failed to get tenant complaints');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get complaints by property
  const getComplaintsByProperty = useCallback(async (propertyId: string): Promise<Complaint[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const complaintsData = await complaintApiService.getComplaintsByProperty(propertyId);
      setComplaints(complaintsData);
      
      return complaintsData;
    } catch (err: any) {
      setError(err.message || 'Failed to get property complaints');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Search complaints
  const searchComplaints = useCallback(async (searchTerm: string, filters: ComplaintFilters = {}): Promise<Complaint[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const complaintsData = await complaintApiService.searchComplaints(searchTerm, filters);
      setComplaints(complaintsData);
      
      return complaintsData;
    } catch (err: any) {
      setError(err.message || 'Failed to search complaints');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get emergency complaints
  const getEmergencyComplaints = useCallback(async (propertyId?: string): Promise<Complaint[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const complaintsData = await complaintApiService.getEmergencyComplaints(propertyId);
      setComplaints(complaintsData);
      
      return complaintsData;
    } catch (err: any) {
      setError(err.message || 'Failed to get emergency complaints');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Assign complaint
  const assignComplaint = useCallback(async (id: string, staffId: string, staffName: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await complaintApiService.assignComplaint(id, staffId, staffName);
      
      // Update local state
      setComplaints(prev => 
        prev.map(c => c.id === id ? { 
          ...c, 
          assignedTo: staffId,
          status: ComplaintStatus.IN_PROGRESS,
          staff: { staffId, staffName },
          updatedAt: new Date() as any
        } : c)
      );
      
      if (complaint?.id === id) {
        setComplaint(prev => prev ? { 
          ...prev, 
          assignedTo: staffId,
          status: ComplaintStatus.IN_PROGRESS,
          staff: { staffId, staffName },
          updatedAt: new Date() as any
        } : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign complaint');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [complaint]);

  // Resolve complaint
  const resolveComplaint = useCallback(async (id: string, resolution: string, staffId?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await complaintApiService.resolveComplaint(id, resolution, staffId);
      
      // Update local state
      setComplaints(prev => 
        prev.map(c => c.id === id ? { 
          ...c, 
          status: ComplaintStatus.RESOLVED,
          resolution,
          resolvedAt: new Date() as any,
          updatedAt: new Date() as any
        } : c)
      );
      
      if (complaint?.id === id) {
        setComplaint(prev => prev ? { 
          ...prev, 
          status: ComplaintStatus.RESOLVED,
          resolution,
          resolvedAt: new Date() as any,
          updatedAt: new Date() as any
        } : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resolve complaint');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [complaint]);

  // Close complaint
  const closeComplaint = useCallback(async (id: string, notes?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await complaintApiService.closeComplaint(id, notes);
      
      // Update local state
      setComplaints(prev => 
        prev.map(c => c.id === id ? { 
          ...c, 
          status: ComplaintStatus.CLOSED,
          closedAt: new Date() as any,
          notes,
          updatedAt: new Date() as any
        } : c)
      );
      
      if (complaint?.id === id) {
        setComplaint(prev => prev ? { 
          ...prev, 
          status: ComplaintStatus.CLOSED,
          closedAt: new Date() as any,
          notes,
          updatedAt: new Date() as any
        } : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to close complaint');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [complaint]);

  // Get complaint statistics
  const getComplaintStats = useCallback(async (propertyId?: string): Promise<ComplaintStats | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const statsData = await complaintApiService.getComplaintStats(propertyId);
      setStats(statsData);
      
      return statsData;
    } catch (err: any) {
      setError(err.message || 'Failed to get complaint statistics');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh complaints
  const refreshComplaints = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const complaintsData = await complaintApiService.getComplaints();
      setComplaints(complaintsData);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh complaints');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    complaints,
    complaint,
    stats,
    loading,
    error,

    // Actions
    createComplaint,
    updateComplaint,
    deleteComplaint,
    getComplaintById,
    getComplaints,
    getComplaintsByTenant,
    getComplaintsByProperty,
    searchComplaints,
    getEmergencyComplaints,
    assignComplaint,
    resolveComplaint,
    closeComplaint,
    getComplaintStats,
    refreshComplaints,
    clearError,
    clearComplaint,
  };
};

