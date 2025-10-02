import firestore, { Timestamp } from '@react-native-firebase/firestore';
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
} from '../../types/complaint.types';
import { firestoreService } from '../firestore';
import { NotificationService } from '../notifications/notificationService';
import { NotificationType, NotificationPriority } from '../../types/notification.types';

export class ComplaintApiService {
  // Create a new complaint
  async createComplaint(complaintData: CreateComplaintData): Promise<string | null> {
    try {
      const complaint: Omit<Complaint, 'id'> = {
        ...complaintData,
        status: ComplaintStatus.OPEN,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        metadata: {
          isEmergency: complaintData.priority === ComplaintPriority.CRITICAL || 
                      complaintData.priority === ComplaintPriority.URGENT,
          isRecurring: false,
          verified: false,
        },
      };

      const docRef = await firestore()
        .collection('complaints')
        .add(complaint);

      // Send notification to property owner
      await this.sendComplaintNotification(docRef.id, complaint);

      return docRef.id;
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error;
    }
  }

  // Get complaint by ID
  async getComplaintById(complaintId: string): Promise<Complaint | null> {
    try {
      const doc = await firestore()
        .collection('complaints')
        .doc(complaintId)
        .get();

      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as Complaint;
      }
      return null;
    } catch (error) {
      console.error('Error getting complaint:', error);
      throw error;
    }
  }

  // Get complaints with filters
  async getComplaints(filters: ComplaintFilters = {}): Promise<Complaint[]> {
    try {
      let query: any = firestore().collection('complaints');
      let hasFilters = false;

      // Apply filters
      if (filters.propertyId) {
        query = query.where('propertyId', '==', filters.propertyId);
        hasFilters = true;
      }
      if (filters.roomId) {
        query = query.where('roomId', '==', filters.roomId);
        hasFilters = true;
      }
      if (filters.tenantId) {
        query = query.where('tenantId', '==', filters.tenantId);
        hasFilters = true;
      }
      if (filters.status && filters.status.length > 0) {
        query = query.where('status', 'in', filters.status);
        hasFilters = true;
      }
      if (filters.priority && filters.priority.length > 0) {
        query = query.where('priority', 'in', filters.priority);
        hasFilters = true;
      }
      if (filters.category && filters.category.length > 0) {
        query = query.where('category', 'in', filters.category);
        hasFilters = true;
      }
      if (filters.type && filters.type.length > 0) {
        query = query.where('type', 'in', filters.type);
        hasFilters = true;
      }
      if (filters.assignedTo) {
        query = query.where('assignedTo', '==', filters.assignedTo);
        hasFilters = true;
      }
      if (filters.isEmergency !== undefined) {
        query = query.where('metadata.isEmergency', '==', filters.isEmergency);
        hasFilters = true;
      }
      if (filters.verified !== undefined) {
        query = query.where('metadata.verified', '==', filters.verified);
        hasFilters = true;
      }

      // Only add orderBy if no filters are applied to avoid composite index requirement
      if (!hasFilters) {
        query = query.orderBy('createdAt', 'desc');
      }

      const snapshot = await query.get();
      let complaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint));

      // If filters were applied, sort in memory to avoid index requirement
      if (hasFilters) {
        complaints.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime; // Descending order (newest first)
        });
      }

      return complaints;
    } catch (error) {
      console.error('Error getting complaints:', error);
      throw error;
    }
  }

  // Update complaint
  async updateComplaint(complaintId: string, updateData: UpdateComplaintData): Promise<void> {
    try {
      const updateFields = {
        ...updateData,
        updatedAt: Timestamp.now(),
      };

      // If status is being changed to resolved, set resolvedAt
      if (updateData.status === ComplaintStatus.RESOLVED && !updateData.resolvedAt) {
        updateFields.resolvedAt = Timestamp.now();
      }

      // If status is being changed to closed, set closedAt
      if (updateData.status === ComplaintStatus.CLOSED && !updateData.closedAt) {
        updateFields.closedAt = Timestamp.now();
      }

      await firestore()
        .collection('complaints')
        .doc(complaintId)
        .update(updateFields);

      // Send notification if status changed
      if (updateData.status) {
        await this.sendComplaintUpdateNotification(complaintId, updateData.status);
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }
  }

  // Delete complaint
  async deleteComplaint(complaintId: string): Promise<void> {
    try {
      await firestore()
        .collection('complaints')
        .doc(complaintId)
        .delete();
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }
  }

  // Get complaints by tenant
  async getComplaintsByTenant(tenantId: string): Promise<Complaint[]> {
    try {
      return await this.getComplaints({ tenantId });
    } catch (error) {
      console.error('Error getting tenant complaints:', error);
      throw error;
    }
  }

  // Get complaints by property
  async getComplaintsByProperty(propertyId: string): Promise<Complaint[]> {
    try {
      return await this.getComplaints({ propertyId });
    } catch (error) {
      console.error('Error getting property complaints:', error);
      throw error;
    }
  }

  // Get complaint statistics
  async getComplaintStats(propertyId?: string): Promise<ComplaintStats> {
    try {
      const filters: ComplaintFilters = propertyId ? { propertyId } : {};
      const complaints = await this.getComplaints(filters);

      const totalComplaints = complaints.length;
      const openComplaints = complaints.filter(c => c.status === ComplaintStatus.OPEN).length;
      const inProgressComplaints = complaints.filter(c => c.status === ComplaintStatus.IN_PROGRESS).length;
      const resolvedComplaints = complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length;
      const closedComplaints = complaints.filter(c => c.status === ComplaintStatus.CLOSED).length;

      // Calculate average response time
      const complaintsWithResponseTime = complaints.filter(c => c.analytics?.responseTime);
      const averageResponseTime = complaintsWithResponseTime.length > 0
        ? complaintsWithResponseTime.reduce((sum, c) => sum + (c.analytics?.responseTime || 0), 0) / complaintsWithResponseTime.length
        : 0;

      // Calculate average resolution time
      const complaintsWithResolutionTime = complaints.filter(c => c.analytics?.resolutionTime);
      const averageResolutionTime = complaintsWithResolutionTime.length > 0
        ? complaintsWithResolutionTime.reduce((sum, c) => sum + (c.analytics?.resolutionTime || 0), 0) / complaintsWithResolutionTime.length
        : 0;

      // Calculate customer satisfaction
      const complaintsWithSatisfaction = complaints.filter(c => c.metadata?.tenantSatisfaction);
      const customerSatisfaction = complaintsWithSatisfaction.length > 0
        ? complaintsWithSatisfaction.reduce((sum, c) => sum + (c.metadata?.tenantSatisfaction || 0), 0) / complaintsWithSatisfaction.length
        : 0;

      // Category breakdown
      const categoryCount = complaints.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const categoryBreakdown = Object.entries(categoryCount).map(([category, count]) => ({
        category: category as ComplaintCategory,
        count,
        percentage: (count / totalComplaints) * 100,
      }));

      // Priority breakdown
      const priorityCount = complaints.reduce((acc, c) => {
        acc[c.priority] = (acc[c.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const priorityBreakdown = Object.entries(priorityCount).map(([priority, count]) => ({
        priority: priority as ComplaintPriority,
        count,
        percentage: (count / totalComplaints) * 100,
      }));

      return {
        totalComplaints,
        openComplaints,
        inProgressComplaints,
        resolvedComplaints,
        closedComplaints,
        averageResponseTime,
        averageResolutionTime,
        customerSatisfaction,
        categoryBreakdown,
        priorityBreakdown,
      };
    } catch (error) {
      console.error('Error getting complaint stats:', error);
      throw error;
    }
  }

  // Send complaint notification to property owner
  private async sendComplaintNotification(complaintId: string, complaint: Omit<Complaint, 'id'>): Promise<void> {
    try {
      // Get property owner
      const property = await firestoreService.getPropertyById(complaint.propertyId);
      if (!property?.ownerId) return;

      // Get tenant details
      const tenant = await firestoreService.getUserProfile(complaint.tenantId);
      if (!tenant) return;

      // Get room details
      const room = await firestoreService.getRoomById(complaint.roomId);
      const roomNumber = room?.roomNumber || 'Unknown';

      // Send notification
      await NotificationService.createNotification({
        userId: property.ownerId,
        type: NotificationType.COMPLAINT_FILED,
        title: 'New Complaint Received',
        message: `${tenant.name || 'Tenant'} has submitted a ${complaint.category} complaint for Room ${roomNumber}: ${complaint.title}`,
        priority: complaint.priority === ComplaintPriority.CRITICAL || complaint.priority === ComplaintPriority.URGENT
          ? NotificationPriority.URGENT
          : NotificationPriority.MEDIUM,
        metadata: {
          complaintId,
          tenantId: complaint.tenantId,
          propertyId: complaint.propertyId,
          roomId: complaint.roomId,
          complaintTitle: complaint.title,
          complaintCategory: complaint.category,
          priority: complaint.priority === ComplaintPriority.CRITICAL || complaint.priority === ComplaintPriority.URGENT
            ? NotificationPriority.URGENT
            : NotificationPriority.MEDIUM,
        },
      });
    } catch (error) {
      console.error('Error sending complaint notification:', error);
    }
  }

  // Send complaint update notification to tenant
  private async sendComplaintUpdateNotification(complaintId: string, status: ComplaintStatus): Promise<void> {
    try {
      const complaint = await this.getComplaintById(complaintId);
      if (!complaint) return;

      // Get property details
      const property = await firestoreService.getPropertyById(complaint.propertyId);
      if (!property) return;

      // Get room details
      const room = await firestoreService.getRoomById(complaint.roomId);
      const roomNumber = room?.roomNumber || 'Unknown';

      // Send notification to tenant
      await NotificationService.createNotification({
        userId: complaint.tenantId,
        type: NotificationType.MAINTENANCE_UPDATE,
        title: 'Complaint Update',
        message: `Your ${complaint.category} complaint for ${property.name} - Room ${roomNumber} has been updated to: ${status}`,
        priority: NotificationPriority.MEDIUM,
        metadata: {
          complaintId,
          propertyId: complaint.propertyId,
          roomId: complaint.roomId,
          category: complaint.category,
          status,
          issueTitle: complaint.title,
        },
      });
    } catch (error) {
      console.error('Error sending complaint update notification:', error);
    }
  }

  // Search complaints
  async searchComplaints(searchTerm: string, filters: ComplaintFilters = {}): Promise<Complaint[]> {
    try {
      // For now, we'll get all complaints and filter by search term
      // In a production app, you might want to use Algolia or similar for better search
      const complaints = await this.getComplaints(filters);
      
      const searchLower = searchTerm.toLowerCase();
      return complaints.filter(complaint => 
        complaint.title.toLowerCase().includes(searchLower) ||
        complaint.description.toLowerCase().includes(searchLower) ||
        complaint.category.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching complaints:', error);
      throw error;
    }
  }

  // Get emergency complaints
  async getEmergencyComplaints(propertyId?: string): Promise<Complaint[]> {
    try {
      const filters: ComplaintFilters = {
        ...(propertyId && { propertyId }),
        isEmergency: true,
      };
      return await this.getComplaints(filters);
    } catch (error) {
      console.error('Error getting emergency complaints:', error);
      throw error;
    }
  }

  // Assign complaint to staff
  async assignComplaint(complaintId: string, staffId: string, staffName: string): Promise<void> {
    try {
      await this.updateComplaint(complaintId, {
        assignedTo: staffId,
        status: ComplaintStatus.IN_PROGRESS,
        staff: {
          staffId,
          staffName,
        },
      });
    } catch (error) {
      console.error('Error assigning complaint:', error);
      throw error;
    }
  }

  // Resolve complaint
  async resolveComplaint(complaintId: string, resolution: string, staffId?: string): Promise<void> {
    try {
      const updateData: UpdateComplaintData = {
        status: ComplaintStatus.RESOLVED,
        resolution,
        resolvedAt: Timestamp.now(),
      };

      if (staffId) {
        updateData.staff = {
          staffId,
        };
      }

      await this.updateComplaint(complaintId, updateData);
    } catch (error) {
      console.error('Error resolving complaint:', error);
      throw error;
    }
  }

  // Close complaint
  async closeComplaint(complaintId: string, notes?: string): Promise<void> {
    try {
      await this.updateComplaint(complaintId, {
        status: ComplaintStatus.CLOSED,
        closedAt: Timestamp.now(),
        notes,
      });
    } catch (error) {
      console.error('Error closing complaint:', error);
      throw error;
    }
  }
}

export const complaintApiService = new ComplaintApiService();
