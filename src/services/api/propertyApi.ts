import firestore from '@react-native-firebase/firestore';
import { 
  Property, 
  CreatePropertyData, 
  UpdatePropertyData, 
  PropertyFilters, 
  PropertyStats,
  PropertyStatus 
} from '../../types/property.types';

const PROPERTIES_COLLECTION = 'properties';

class PropertyApiService {
  private get propertiesCollection() {
    return firestore().collection(PROPERTIES_COLLECTION);
  }

  /**
   * Create a new property
   * @param propertyData - Property data to create
   * @returns Property ID
   */
  async createProperty(propertyData: CreatePropertyData): Promise<string> {
    try {
      const now = firestore.Timestamp.now();
      
      const docRef = await this.propertiesCollection.add({
        ...propertyData,
        status: PropertyStatus.ACTIVE,
        totalRooms: 0,
        availableRooms: 0,
        createdAt: now,
        updatedAt: now,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating property:', error);
      throw new Error('Failed to create property');
    }
  }

  /**
   * Get property by ID
   * @param propertyId - Property ID
   * @returns Property data or null if not found
   */
  async getPropertyById(propertyId: string): Promise<Property | null> {
    try {
      const doc = await this.propertiesCollection.doc(propertyId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data(),
      } as Property;
    } catch (error) {
      console.error('Error fetching property by ID:', error);
      throw new Error('Failed to fetch property');
    }
  }

  /**
   * Get properties by owner ID
   * @param ownerId - Owner's user ID
   * @returns Array of properties owned by the user
   */
  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    try {
      const snapshot = await this.propertiesCollection
        .where('ownerId', '==', ownerId)
        .get();

      const properties: Property[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        properties.push({
          id: doc.id,
          ...data,
        } as Property);
      });

      // Sort by createdAt in descending order
      return properties.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error fetching properties by owner:', error);
      throw new Error('Failed to fetch properties');
    }
  }

  /**
   * Get all properties with filters
   * @param filters - Property filters
   * @returns Array of properties
   */
  async getPropertiesWithFilters(filters: PropertyFilters = {}): Promise<Property[]> {
    try {
      let query: any = this.propertiesCollection;
      let hasFilters = false;

      // Apply filters
      if (filters.type && filters.type.length > 0) {
        query = query.where('type', 'in', filters.type);
        hasFilters = true;
      }
      if (filters.status && filters.status.length > 0) {
        query = query.where('status', 'in', filters.status);
        hasFilters = true;
      }
      if (filters.city) {
        query = query.where('location.city', '==', filters.city);
        hasFilters = true;
      }
      if (filters.verified !== undefined) {
        query = query.where('metadata.verified', '==', filters.verified);
        hasFilters = true;
      }
      if (filters.featured !== undefined) {
        query = query.where('metadata.featured', '==', filters.featured);
        hasFilters = true;
      }

      // Only add orderBy if no filters are applied to avoid composite index requirement
      if (!hasFilters) {
        query = query.orderBy('createdAt', 'desc');
      }

      const snapshot = await query.get();
      let properties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Property[];

      // Apply client-side filters for complex conditions
      if (filters.minRent !== undefined) {
        properties = properties.filter(p => p.pricing?.baseRent >= filters.minRent!);
      }
      if (filters.maxRent !== undefined) {
        properties = properties.filter(p => p.pricing?.baseRent <= filters.maxRent!);
      }
      if (filters.availableRooms !== undefined) {
        properties = properties.filter(p => p.availableRooms >= filters.availableRooms!);
      }

      // Sort by createdAt if filters were applied
      if (hasFilters) {
        properties.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
      }

      return properties;
    } catch (error) {
      console.error('Error fetching properties with filters:', error);
      throw new Error('Failed to fetch properties');
    }
  }

  /**
   * Update property
   * @param propertyId - Property ID
   * @param updates - Property updates
   */
  async updateProperty(propertyId: string, updates: UpdatePropertyData): Promise<void> {
    try {
      const now = firestore.Timestamp.now();
      
      await this.propertiesCollection.doc(propertyId).update({
        ...updates,
        updatedAt: now,
      });
    } catch (error) {
      console.error('Error updating property:', error);
      throw new Error('Failed to update property');
    }
  }

  /**
   * Delete property
   * @param propertyId - Property ID
   */
  async deleteProperty(propertyId: string): Promise<void> {
    try {
      await this.propertiesCollection.doc(propertyId).delete();
    } catch (error) {
      console.error('Error deleting property:', error);
      throw new Error('Failed to delete property');
    }
  }

  /**
   * Get property statistics
   * @param propertyId - Property ID (optional)
   * @returns Property statistics
   */
  async getPropertyStats(propertyId?: string): Promise<PropertyStats> {
    try {
      let query = this.propertiesCollection;
      
      if (propertyId) {
        // Get stats for a specific property
        const property = await this.getPropertyById(propertyId);
        if (!property) {
          throw new Error('Property not found');
        }

        return {
          totalRooms: property.totalRooms,
          occupiedRooms: property.totalRooms - property.availableRooms,
          availableRooms: property.availableRooms,
          occupancyRate: property.totalRooms > 0 ? ((property.totalRooms - property.availableRooms) / property.totalRooms) * 100 : 0,
          totalRevenue: property.analytics?.totalRevenue || 0,
          averageRent: property.pricing?.baseRent || 0,
          totalTenants: property.totalRooms - property.availableRooms,
          maintenanceRequests: 0, // This would need to be calculated from maintenance collection
        };
      }

      // Get stats for all properties (this would need owner filtering in real implementation)
      const snapshot = await query.get();
      
      let totalRooms = 0;
      let availableRooms = 0;
      let totalRevenue = 0;
      let totalRent = 0;
      let propertyCount = 0;

      snapshot.forEach(doc => {
        const data = doc.data() as Property;
        totalRooms += data.totalRooms || 0;
        availableRooms += data.availableRooms || 0;
        totalRevenue += data.analytics?.totalRevenue || 0;
        totalRent += data.pricing?.baseRent || 0;
        propertyCount++;
      });

      const occupiedRooms = totalRooms - availableRooms;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
      const averageRent = propertyCount > 0 ? totalRent / propertyCount : 0;

      return {
        totalRooms,
        occupiedRooms,
        availableRooms,
        occupancyRate,
        totalRevenue,
        averageRent,
        totalTenants: occupiedRooms,
        maintenanceRequests: 0, // This would need to be calculated from maintenance collection
      };
    } catch (error) {
      console.error('Error fetching property statistics:', error);
      throw new Error('Failed to fetch property statistics');
    }
  }

  /**
   * Search properties
   * @param searchTerm - Search term
   * @param filters - Additional filters
   * @returns Array of properties matching the search
   */
  async searchProperties(searchTerm: string, filters: PropertyFilters = {}): Promise<Property[]> {
    try {
      // Get all properties with filters first
      const properties = await this.getPropertiesWithFilters(filters);
      
      // Filter by search term (client-side search)
      const searchLower = searchTerm.toLowerCase();
      return properties.filter(property => 
        property.name.toLowerCase().includes(searchLower) ||
        property.location.address.toLowerCase().includes(searchLower) ||
        property.location.city.toLowerCase().includes(searchLower) ||
        property.location.area?.toLowerCase().includes(searchLower) ||
        property.ownerName?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching properties:', error);
      throw new Error('Failed to search properties');
    }
  }
}

export const propertyApiService = new PropertyApiService();
export default propertyApiService;
