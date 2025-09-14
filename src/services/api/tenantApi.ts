import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { 
  Tenant, 
  CreateTenantData, 
  UpdateTenantData, 
  TenantStatus, 
  TenantFilters,
  TenantStats 
} from '../../types/tenant.types';

// Tenant collection name
const TENANTS_COLLECTION = 'tenants';

class TenantApiService {
  private get tenantsCollection() {
    return firestore().collection(TENANTS_COLLECTION);
  }

  /**
   * Create a new tenant
   * @param tenantData - Tenant data to create
   * @returns Created tenant ID
   */
  async createTenant(tenantData: CreateTenantData): Promise<string> {
    try {
      const tenantDoc = {
        ...tenantData,
        status: TenantStatus.ACTIVE, // Set to ACTIVE when tenant is assigned to a room
        depositPaid: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.tenantsCollection.add(tenantDoc);
      console.log('Tenant created successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      throw new Error(`Failed to create tenant: ${error.message}`);
    }
  }

  /**
   * Get tenant by ID
   * @param tenantId - Tenant ID
   * @returns Tenant data or null if not found
   */
  async getTenantById(tenantId: string): Promise<Tenant | null> {
    try {
      const doc = await this.tenantsCollection.doc(tenantId).get();
      if (doc.exists) {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as Tenant;
      }
      return null;
    } catch (error) {
      console.error('Error fetching tenant by ID:', error);
      throw new Error('Failed to fetch tenant');
    }
  }

  /**
   * Get tenants by property ID
   * @param propertyId - Property ID
   * @returns Array of tenants for the property
   */
  async getTenantsByProperty(propertyId: string): Promise<Tenant[]> {
    try {
      const snapshot = await this.tenantsCollection
        .where('propertyId', '==', propertyId)
        .get();

      const tenants: Tenant[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        tenants.push({
          id: doc.id,
          ...data,
        } as Tenant);
      });

      return tenants.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error fetching tenants by property:', error);
      throw new Error('Failed to fetch tenants');
    }
  }

  /**
   * Get tenant by user ID
   * @param userId - User ID
   * @returns Tenant data or null if not found
   */
  async getTenantByUserId(userId: string): Promise<Tenant | null> {
    try {
      const snapshot = await this.tenantsCollection
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Tenant;
    } catch (error) {
      console.error('Error fetching tenant by user ID:', error);
      throw new Error('Failed to fetch tenant');
    }
  }

  /**
   * Get tenants by room ID
   * @param roomId - Room ID
   * @returns Array of tenants for the room
   */
  async getTenantsByRoom(roomId: string): Promise<Tenant[]> {
    try {
      const snapshot = await this.tenantsCollection
        .where('roomId', '==', roomId)
        .get();

      const tenants: Tenant[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        tenants.push({
          id: doc.id,
          ...data,
        } as Tenant);
      });

      return tenants;
    } catch (error) {
      console.error('Error fetching tenants by room:', error);
      throw new Error('Failed to fetch tenants');
    }
  }

  /**
   * Get all tenants for an owner across all their properties
   * @param propertyIds - Array of property IDs owned by the user
   * @returns Array of tenants for all properties
   */
  async getAllTenantsForOwner(propertyIds: string[]): Promise<Tenant[]> {
    try {
      if (propertyIds.length === 0) {
        return [];
      }

      const tenants: Tenant[] = [];
      
      // Get tenants for each property
      for (const propertyId of propertyIds) {
        const propertyTenants = await this.getTenantsByProperty(propertyId);
        tenants.push(...propertyTenants);
      }

      // Sort by creation date (newest first)
      return tenants.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error fetching all tenants for owner:', error);
      throw new Error('Failed to fetch tenants');
    }
  }

  /**
   * Get tenants with filters
   * @param filters - Filter criteria
   * @returns Array of filtered tenants
   */
  async getTenantsWithFilters(filters: TenantFilters): Promise<Tenant[]> {
    try {
      let query = this.tenantsCollection;

      if (filters.propertyId) {
        query = query.where('propertyId', '==', filters.propertyId);
      }

      if (filters.roomId) {
        query = query.where('roomId', '==', filters.roomId);
      }

      if (filters.status && filters.status.length > 0) {
        query = query.where('status', 'in', filters.status);
      }

      if (filters.verified !== undefined) {
        query = query.where('metadata.verified', '==', filters.verified);
      }

      if (filters.depositPaid !== undefined) {
        query = query.where('depositPaid', '==', filters.depositPaid);
      }

      const snapshot = await query.get();

      const tenants: Tenant[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        tenants.push({
          id: doc.id,
          ...data,
        } as Tenant);
      });

      return tenants.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error fetching tenants with filters:', error);
      throw new Error('Failed to fetch tenants');
    }
  }

  /**
   * Update tenant
   * @param tenantId - Tenant ID
   * @param updates - Partial tenant data to update
   */
  async updateTenant(tenantId: string, updates: UpdateTenantData): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      await this.tenantsCollection.doc(tenantId).update(updateData);
      console.log('Tenant updated successfully:', tenantId);
    } catch (error) {
      console.error('Error updating tenant:', error);
      throw new Error('Failed to update tenant');
    }
  }

  /**
   * Update tenant status from pending to active
   * @param tenantId - Tenant ID
   */
  async activateTenant(tenantId: string): Promise<void> {
    try {
      await this.updateTenant(tenantId, { status: TenantStatus.ACTIVE });
      console.log('Tenant activated successfully:', tenantId);
    } catch (error) {
      console.error('Error activating tenant:', error);
      throw new Error('Failed to activate tenant');
    }
  }

  /**
   * Delete tenant
   * @param tenantId - Tenant ID
   */
  async deleteTenant(tenantId: string): Promise<void> {
    try {
      await this.tenantsCollection.doc(tenantId).delete();
      console.log('Tenant deleted successfully:', tenantId);
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw new Error('Failed to delete tenant');
    }
  }

  /**
   * Get tenant statistics
   * @param propertyId - Property ID (optional)
   * @returns Tenant statistics
   */
  async getTenantStats(propertyId?: string): Promise<TenantStats> {
    try {
      let query = this.tenantsCollection;
      
      if (propertyId) {
        // If propertyId is provided, filter by that property
        query = query.where('propertyId', '==', propertyId);
      } else {
        // If no propertyId is provided, we need to get all properties owned by the user
        // and then query tenants for those properties
        // For now, we'll return empty stats if no propertyId is provided
        // TODO: Implement getting all user properties and querying tenants for each
        return {
          totalTenants: 0,
          activeTenants: 0,
          pendingTenants: 0,
          leftTenants: 0,
          totalRent: 0,
          totalDeposits: 0,
          averageRent: 0,
          occupancyRate: 0,
        };
      }

      const snapshot = await query.get();

      let totalTenants = 0;
      let activeTenants = 0;
      let pendingTenants = 0;
      let leftTenants = 0;
      let totalRent = 0;
      let totalDeposits = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        totalTenants++;

        switch (data.status) {
          case TenantStatus.ACTIVE:
            activeTenants++;
            break;
          case TenantStatus.PENDING:
            pendingTenants++;
            break;
          case TenantStatus.LEFT:
            leftTenants++;
            break;
        }

        totalRent += data.rent || 0;
        totalDeposits += data.deposit || 0;
      });

      const averageRent = totalTenants > 0 ? totalRent / totalTenants : 0;
      const occupancyRate = totalTenants > 0 ? (activeTenants / totalTenants) * 100 : 0;

      return {
        totalTenants,
        activeTenants,
        pendingTenants,
        leftTenants,
        totalRent,
        totalDeposits,
        averageRent,
        occupancyRate,
      };
    } catch (error) {
      console.error('Error fetching tenant stats:', error);
      throw new Error('Failed to fetch tenant statistics');
    }
  }

  /**
   * Search tenants by name or email
   * @param searchTerm - Search term
   * @param propertyId - Property ID (optional)
   * @returns Array of matching tenants
   */
  async searchTenants(searchTerm: string, propertyId?: string): Promise<Tenant[]> {
    try {
      // First, get all tenants for the property (if specified)
      let tenants: Tenant[] = [];
      
      if (propertyId) {
        tenants = await this.getTenantsByProperty(propertyId);
      } else {
        const snapshot = await this.tenantsCollection.get();
        snapshot.forEach(doc => {
          const data = doc.data();
          tenants.push({
            id: doc.id,
            ...data,
          } as Tenant);
        });
      }

      // Filter by search term
      const searchLower = searchTerm.toLowerCase();
      return tenants.filter(tenant => {
        // We'll need to fetch user details to search by name/email
        // For now, return all tenants and let the UI handle filtering
        return true;
      });
    } catch (error) {
      console.error('Error searching tenants:', error);
      throw new Error('Failed to search tenants');
    }
  }

  /**
   * Listen to tenants by property in real-time
   * @param propertyId - Property ID
   * @param callback - Callback function to handle changes
   * @returns Unsubscribe function
   */
  onTenantsByPropertyChange(
    propertyId: string, 
    callback: (tenants: Tenant[]) => void
  ): () => void {
    return this.tenantsCollection
      .where('propertyId', '==', propertyId)
      .onSnapshot(
        (snapshot) => {
          const tenants: Tenant[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            tenants.push({
              id: doc.id,
              ...data,
            } as Tenant);
          });

          const sortedTenants = tenants.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
            return bTime - aTime;
          });

          callback(sortedTenants);
        },
        (error) => {
          console.error('Error listening to tenants changes:', error);
          callback([]);
        }
      );
  }

  /**
   * Listen to tenant changes in real-time
   * @param tenantId - Tenant ID
   * @param callback - Callback function to handle changes
   * @returns Unsubscribe function
   */
  onTenantChange(
    tenantId: string, 
    callback: (tenant: Tenant | null) => void
  ): () => void {
    return this.tenantsCollection.doc(tenantId).onSnapshot(
      (doc) => {
        if (doc.exists) {
          const data = doc.data();
          callback({
            id: doc.id,
            ...data,
          } as Tenant);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to tenant changes:', error);
        callback(null);
      }
    );
  }
}

// Export singleton instance
export const tenantApiService = new TenantApiService();
export default tenantApiService;
