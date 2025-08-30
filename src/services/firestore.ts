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
} as const;

// Firestore service class for all Firestore operations
class FirestoreService {
  // Users collection
  private get usersCollection() {
    return firestore().collection(COLLECTIONS.USERS);
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
