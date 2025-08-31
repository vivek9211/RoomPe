import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { User, UserRole, UserStatus, CreateUserData, UpdateUserData } from '../types/user.types';

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  PROPERTIES: 'properties',
  RENTALS: 'rentals',
  PAYMENTS: 'payments',
  MAINTENANCE_REQUESTS: 'maintenance_requests',
  NOTIFICATIONS: 'notifications',
  ROOM_MAPPINGS: 'room_mappings',
  TENANT_APPLICATIONS: 'tenant_applications',
} as const;

// Firestore service class for all Firestore operations
class FirestoreService {
  // Users collection
  private get usersCollection() {
    return firestore().collection(COLLECTIONS.USERS);
  }

  // Properties collection
  private get propertiesCollection() {
    return firestore().collection(COLLECTIONS.PROPERTIES);
  }

  // Room Mappings collection
  private get roomMappingsCollection() {
    return firestore().collection(COLLECTIONS.ROOM_MAPPINGS);
  }

  // Tenant Applications collection
  private get tenantApplicationsCollection() {
    return firestore().collection(COLLECTIONS.TENANT_APPLICATIONS);
  }

  // ==================== USER OPERATIONS ====================

  /**
   * Get user profile from Firestore
   * @param uid - User ID
   * @returns User profile or null if not found
   */
  async getUserProfile(uid: string): Promise<User | null> {
    try {
      const doc = await this.usersCollection.doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data?.email || '',
          name: data?.name || '',
          phone: data?.phone || '',
          role: data?.role as UserRole,
          status: data?.status || UserStatus.ACTIVE,
          createdAt: data?.createdAt || firestore.Timestamp.now(),
          updatedAt: data?.updatedAt || firestore.Timestamp.now(),
          isActive: data?.isActive ?? true,
          emailVerified: data?.emailVerified ?? false,
          phoneVerified: data?.phoneVerified ?? false,
          profilePhoto: data?.profilePhoto,
          lastLoginAt: data?.lastLoginAt,
          address: data?.address,
          dateOfBirth: data?.dateOfBirth,
          emergencyContact: data?.emergencyContact,
          preferences: data?.preferences,
          metadata: data?.metadata,
        } as User;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      if (error?.code === 'firestore/permission-denied' || error?.code === 'permission-denied') {
        // Treat as no accessible profile; caller can proceed to onboarding
        return null;
      }
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Create user profile in Firestore
   * @param userData - User data to create
   */
  async createUserProfile(userData: CreateUserData): Promise<void> {
    try {
      const userDoc = {
        ...userData,
        status: UserStatus.ACTIVE,
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      
      console.log('Creating user profile with data:', userDoc);
      
      const docRef = this.usersCollection.doc(userData.uid);
      await docRef.set(userDoc);
      
      console.log('User profile created successfully');
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
  }

  /**
   * Update user profile in Firestore
   * @param uid - User ID
   * @param updates - Partial user data to update
   */
  async updateUserProfile(uid: string, updates: UpdateUserData): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      
      await this.usersCollection.doc(uid).set(updateData as any, { merge: true });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Delete user profile from Firestore
   * @param uid - User ID
   */
  async deleteUserProfile(uid: string): Promise<void> {
    try {
      await this.usersCollection.doc(uid).delete();
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw new Error('Failed to delete user profile');
    }
  }

  /**
   * Get multiple users by their UIDs
   * @param uids - Array of user IDs
   * @returns Array of user profiles
   */
  async getUsersByUids(uids: string[]): Promise<User[]> {
    try {
      if (uids.length === 0) return [];

      // Firestore has a limit of 10 items per 'in' query
      const batchSize = 10;
      const users: User[] = [];

      for (let i = 0; i < uids.length; i += batchSize) {
        const batch = uids.slice(i, i + batchSize);
        const snapshot = await this.usersCollection
          .where(firestore.FieldPath.documentId(), 'in', batch)
          .get();

        snapshot.forEach(doc => {
          const data = doc.data();
          users.push({
            uid: doc.id,
            email: data?.email || '',
            name: data?.name || '',
            phone: data?.phone || '',
            role: data?.role || UserRole.TENANT,
            status: data?.status || UserStatus.ACTIVE,
            createdAt: data?.createdAt || firestore.Timestamp.now(),
            updatedAt: data?.updatedAt || firestore.Timestamp.now(),
            isActive: data?.isActive ?? true,
            emailVerified: data?.emailVerified ?? false,
            phoneVerified: data?.phoneVerified ?? false,
            profilePhoto: data?.profilePhoto,
            lastLoginAt: data?.lastLoginAt,
            address: data?.address,
            dateOfBirth: data?.dateOfBirth,
            emergencyContact: data?.emergencyContact,
            preferences: data?.preferences,
            metadata: data?.metadata,
          } as User);
        });
      }

      return users;
    } catch (error) {
      console.error('Error fetching users by UIDs:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Search users by name or email
   * @param searchTerm - Search term
   * @param limit - Maximum number of results
   * @returns Array of matching users
   */
  async searchUsers(searchTerm: string, limit: number = 10): Promise<User[]> {
    try {
      const searchLower = searchTerm.toLowerCase();
      
      // Search by name (case-insensitive)
      const nameQuery = await this.usersCollection
        .where('name', '>=', searchLower)
        .where('name', '<=', searchLower + '\uf8ff')
        .limit(limit)
        .get();

      const users: User[] = [];
      nameQuery.forEach(doc => {
        const data = doc.data();
        users.push({
          uid: doc.id,
          email: data?.email || '',
          name: data?.name || '',
          phone: data?.phone || '',
          role: data?.role || UserRole.TENANT,
          status: data?.status || UserStatus.ACTIVE,
          createdAt: data?.createdAt || firestore.Timestamp.now(),
          updatedAt: data?.updatedAt || firestore.Timestamp.now(),
          isActive: data?.isActive ?? true,
          emailVerified: data?.emailVerified ?? false,
          phoneVerified: data?.phoneVerified ?? false,
          profilePhoto: data?.profilePhoto,
          lastLoginAt: data?.lastLoginAt,
          address: data?.address,
          dateOfBirth: data?.dateOfBirth,
          emergencyContact: data?.emergencyContact,
          preferences: data?.preferences,
          metadata: data?.metadata,
        } as User);
      });

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Get users by role
   * @param role - User role to filter by
   * @param limit - Maximum number of results
   * @returns Array of users with the specified role
   */
  async getUsersByRole(role: UserRole, limit: number = 50): Promise<User[]> {
    try {
      const snapshot = await this.usersCollection
        .where('role', '==', role)
        .where('isActive', '==', true)
        .limit(limit)
        .get();

      const users: User[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        users.push({
          uid: doc.id,
          email: data?.email || '',
          name: data?.name || '',
          phone: data?.phone || '',
          role: data?.role || UserRole.TENANT,
          status: data?.status || UserStatus.ACTIVE,
          createdAt: data?.createdAt || firestore.Timestamp.now(),
          updatedAt: data?.updatedAt || firestore.Timestamp.now(),
          isActive: data?.isActive ?? true,
          emailVerified: data?.emailVerified ?? false,
          phoneVerified: data?.phoneVerified ?? false,
          profilePhoto: data?.profilePhoto,
          lastLoginAt: data?.lastLoginAt,
          address: data?.address,
          dateOfBirth: data?.dateOfBirth,
          emergencyContact: data?.emergencyContact,
          preferences: data?.preferences,
          metadata: data?.metadata,
        } as User);
      });

      return users;
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw new Error('Failed to fetch users by role');
    }
  }

  /**
   * Update user's last login timestamp
   * @param uid - User ID
   */
  async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.usersCollection.doc(uid).update({
        lastLoginAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      throw new Error('Failed to update last login');
    }
  }

  /**
   * Update user's email verification status
   * @param uid - User ID
   * @param verified - Verification status
   */
  async updateEmailVerification(uid: string, verified: boolean): Promise<void> {
    try {
      await this.usersCollection.doc(uid).update({
        emailVerified: verified,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating email verification:', error);
      throw new Error('Failed to update email verification status');
    }
  }

  /**
   * Update user's phone verification status
   * @param uid - User ID
   * @param verified - Verification status
   */
  async updatePhoneVerification(uid: string, verified: boolean): Promise<void> {
    try {
      await this.usersCollection.doc(uid).update({
        phoneVerified: verified,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating phone verification:', error);
      throw new Error('Failed to update phone verification status');
    }
  }

  // ==================== PROPERTY OPERATIONS ====================

  /**
   * Create a new property in Firestore
   * @param propertyData - Property data to create
   * @returns Created property ID
   */
  async createProperty(propertyData: any): Promise<string> {
    try {
      const propertyDoc = {
        ...propertyData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      
      console.log('Creating property with data:', propertyDoc);
      
      const docRef = await this.propertiesCollection.add(propertyDoc);
      
      console.log('Property created successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating property:', error);
      throw new Error(`Failed to create property: ${error.message}`);
    }
  }

  /**
   * Get properties by owner ID
   * @param ownerId - Owner's user ID
   * @returns Array of properties owned by the user
   */
  async getPropertiesByOwner(ownerId: string): Promise<any[]> {
    try {
      const snapshot = await this.propertiesCollection
        .where('ownerId', '==', ownerId)
        .get();

      const properties: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        properties.push({
          id: doc.id,
          ...data,
        });
      });

      // Sort by createdAt in descending order in JavaScript to avoid index requirement
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
   * Get a single property by ID
   * @param propertyId - Property ID
   * @returns Property data or null if not found
   */
  async getPropertyById(propertyId: string): Promise<any | null> {
    try {
      const doc = await this.propertiesCollection.doc(propertyId).get();
      if (doc.exists) {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching property by ID:', error);
      throw new Error('Failed to fetch property');
    }
  }

  /**
   * Update property in Firestore
   * @param propertyId - Property ID
   * @param updates - Partial property data to update
   */
  async updateProperty(propertyId: string, updates: any): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      
      await this.propertiesCollection.doc(propertyId).update(updateData);
    } catch (error) {
      console.error('Error updating property:', error);
      throw new Error('Failed to update property');
    }
  }

  /**
   * Delete property from Firestore
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
   * Listen to properties owned by a specific user in real-time
   * @param ownerId - Owner's user ID
   * @param callback - Callback function to handle changes
   * @returns Unsubscribe function
   */
  onPropertiesByOwnerChange(ownerId: string, callback: (properties: any[]) => void): () => void {
    return this.propertiesCollection
      .where('ownerId', '==', ownerId)
      .onSnapshot(
        (snapshot) => {
          const properties: any[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            properties.push({
              id: doc.id,
              ...data,
            });
          });
          
          // Sort by createdAt in descending order in JavaScript to avoid index requirement
          const sortedProperties = properties.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
            return bTime - aTime;
          });
          
          callback(sortedProperties);
        },
        (error) => {
          console.error('Error listening to properties changes:', error);
          callback([]);
        }
      );
  }

  /**
   * Get all active properties with optional filters for tenant assignment
   * @param filters - Optional filters for property search
   * @returns Array of active properties matching the filters
   */
  async getActivePropertiesForTenants(filters?: {
    city?: string;
    postalCode?: string;
    minRent?: number;
    maxRent?: number;
    propertyType?: string[];
    amenities?: string[];
  }): Promise<any[]> {
    try {
      // Start with active properties only
      let query = this.propertiesCollection.where('status', '==', 'active');

      // Apply filters if provided
      if (filters?.city) {
        query = query.where('location.city', '==', filters.city);
      }

      if (filters?.postalCode) {
        query = query.where('location.postalCode', '==', filters.postalCode);
      }

      const snapshot = await query.get();
      const properties: any[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const property = {
          id: doc.id,
          ...data,
        };

        // Apply additional filters in JavaScript to avoid complex Firestore queries
        let shouldInclude = true;

        // Filter by rent range
        if (filters?.minRent && property.pricing?.baseRent < filters.minRent) {
          shouldInclude = false;
        }
        if (filters?.maxRent && property.pricing?.baseRent > filters.maxRent) {
          shouldInclude = false;
        }

        // Filter by property type
        if (filters?.propertyType && filters.propertyType.length > 0) {
          if (!filters.propertyType.includes(property.type)) {
            shouldInclude = false;
          }
        }

        // Filter by amenities (if any amenities are required)
        if (filters?.amenities && filters.amenities.length > 0) {
          const propertyAmenities = property.amenities || {};
          const hasRequiredAmenities = filters.amenities.every(amenity => 
            propertyAmenities[amenity] === true
          );
          if (!hasRequiredAmenities) {
            shouldInclude = false;
          }
        }

        // Only include properties with available rooms
        if (property.availableRooms <= 0) {
          shouldInclude = false;
        }

        if (shouldInclude) {
          properties.push(property);
        }
      });

      // Sort by createdAt in descending order
      return properties.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error fetching active properties for tenants:', error);
      throw new Error('Failed to fetch properties');
    }
  }

  // ==================== REAL-TIME LISTENERS ====================

  /**
   * Listen to user profile changes in real-time
   * @param uid - User ID
   * @param callback - Callback function to handle changes
   * @returns Unsubscribe function
   */
  onUserProfileChange(uid: string, callback: (user: User | null) => void): () => void {
    return this.usersCollection.doc(uid).onSnapshot(
      (doc) => {
        if (doc.exists) {
          const data = doc.data();
          const user: User = {
            uid: doc.id,
            email: data?.email || '',
            name: data?.name || '',
            phone: data?.phone || '',
            role: data?.role || UserRole.TENANT,
            status: data?.status || UserStatus.ACTIVE,
            createdAt: data?.createdAt || firestore.Timestamp.now(),
            updatedAt: data?.updatedAt || firestore.Timestamp.now(),
            isActive: data?.isActive ?? true,
            emailVerified: data?.emailVerified ?? false,
            phoneVerified: data?.phoneVerified ?? false,
            profilePhoto: data?.profilePhoto,
            lastLoginAt: data?.lastLoginAt,
            address: data?.address,
            dateOfBirth: data?.dateOfBirth,
            emergencyContact: data?.emergencyContact,
            preferences: data?.preferences,
            metadata: data?.metadata,
          };
          callback(user);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to user profile changes:', error);
        callback(null);
      }
    );
  }

  // ==================== ROOM MAPPING OPERATIONS ====================

  /**
   * Create or update room mapping for a property
   * @param propertyId - Property ID
   * @param roomMappingData - Room mapping data
   */
  async createOrUpdateRoomMapping(
    propertyId: string, 
    roomMappingData: {
      totalFloors: number;
      floorConfigs: any[];
    }
  ): Promise<void> {
    try {
      const roomMappingDoc = {
        propertyId,
        totalFloors: roomMappingData.totalFloors,
        floorConfigs: roomMappingData.floorConfigs,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      // Use propertyId as the document ID for easy querying
      await this.roomMappingsCollection.doc(propertyId).set(roomMappingDoc);
      
      console.log('Room mapping created/updated successfully for property:', propertyId);
    } catch (error) {
      console.error('Error creating/updating room mapping:', error);
      throw new Error('Failed to create/update room mapping');
    }
  }

  /**
   * Get room mapping for a property
   * @param propertyId - Property ID
   * @returns Room mapping data or null if not found
   */
  async getRoomMapping(propertyId: string): Promise<any | null> {
    try {
      const doc = await this.roomMappingsCollection.doc(propertyId).get();
      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching room mapping:', error);
      throw new Error('Failed to fetch room mapping');
    }
  }

  /**
   * Delete room mapping for a property
   * @param propertyId - Property ID
   */
  async deleteRoomMapping(propertyId: string): Promise<void> {
    try {
      await this.roomMappingsCollection.doc(propertyId).delete();
      console.log('Room mapping deleted successfully for property:', propertyId);
    } catch (error) {
      console.error('Error deleting room mapping:', error);
      throw new Error('Failed to delete room mapping');
    }
  }

  /**
   * Listen to room mapping changes in real-time
   * @param propertyId - Property ID
   * @param callback - Callback function to handle changes
   * @returns Unsubscribe function
   */
  onRoomMappingChange(
    propertyId: string, 
    callback: (roomMapping: any | null) => void
  ): () => void {
    return this.roomMappingsCollection.doc(propertyId).onSnapshot(
      (doc) => {
        if (doc.exists) {
          callback({
            id: doc.id,
            ...doc.data()
          });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to room mapping changes:', error);
        callback(null);
      }
    );
  }

  // ==================== TENANT APPLICATION OPERATIONS ====================

  /**
   * Create a tenant application
   * @param applicationData - Tenant application data
   * @returns Created application ID
   */
  async createTenantApplication(applicationData: any): Promise<string> {
    try {
      const applicationDoc = {
        ...applicationData,
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      
      const docRef = await this.tenantApplicationsCollection.add(applicationDoc);
      console.log('Tenant application created successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating tenant application:', error);
      throw new Error('Failed to create tenant application');
    }
  }

  /**
   * Get tenant applications for a property owner
   * @param ownerId - Owner ID
   * @returns Array of tenant applications
   */
  async getTenantApplicationsByOwner(ownerId: string): Promise<any[]> {
    try {
      const snapshot = await this.tenantApplicationsCollection
        .where('ownerId', '==', ownerId)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();

      const applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return applications;
    } catch (error) {
      console.error('Error fetching tenant applications:', error);
      throw new Error('Failed to fetch tenant applications');
    }
  }

  /**
   * Get tenant applications by tenant ID
   * @param tenantId - Tenant ID
   * @returns Array of tenant applications
   */
  async getTenantApplicationsByTenant(tenantId: string): Promise<any[]> {
    try {
      const snapshot = await this.tenantApplicationsCollection
        .where('tenantId', '==', tenantId)
        .orderBy('createdAt', 'desc')
        .get();

      const applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return applications;
    } catch (error) {
      console.error('Error fetching tenant applications:', error);
      throw new Error('Failed to fetch tenant applications');
    }
  }

  /**
   * Update tenant application status
   * @param applicationId - Application ID
   * @param updateData - Update data
   */
  async updateTenantApplication(applicationId: string, updateData: any): Promise<void> {
    try {
      const updateDoc = {
        ...updateData,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        reviewedAt: firestore.FieldValue.serverTimestamp(),
      };

      await this.tenantApplicationsCollection.doc(applicationId).update(updateDoc);
      console.log('Tenant application updated successfully');
    } catch (error) {
      console.error('Error updating tenant application:', error);
      throw new Error('Failed to update tenant application');
    }
  }

  /**
   * Listen to tenant applications changes for an owner
   * @param ownerId - Owner ID
   * @param callback - Callback function to handle changes
   * @returns Unsubscribe function
   */
  onTenantApplicationsChange(
    ownerId: string,
    callback: (applications: any[]) => void
  ): () => void {
    return this.tenantApplicationsCollection
      .where('ownerId', '==', ownerId)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const applications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(applications);
        },
        (error) => {
          console.error('Error listening to tenant applications changes:', error);
          callback([]);
        }
      );
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if a user exists in Firestore
   * @param uid - User ID
   * @returns True if user exists, false otherwise
   */
  async userExists(uid: string): Promise<boolean> {
    try {
      const doc = await this.usersCollection.doc(uid).get();
      return doc.exists;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  }

  /**
   * Get user count by role
   * @param role - User role to count
   * @returns Number of users with the specified role
   */
  async getUserCountByRole(role: UserRole): Promise<number> {
    try {
      const snapshot = await this.usersCollection
        .where('role', '==', role)
        .where('isActive', '==', true)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('Error getting user count by role:', error);
      throw new Error('Failed to get user count');
    }
  }
}

// Export singleton instance
export const firestoreService = new FirestoreService();

// Debug function to test Firestore connection
export const testFirestoreConnection = async () => {
  try {
    console.log('Testing Firestore connection...');
    
    // Test Firestore connection by trying to access a collection
    const testCollection = firestore().collection('test');
    console.log('Firestore collection access successful');
    
    return true;
  } catch (error: any) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
};

export default firestoreService;
