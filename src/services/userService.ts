import firebaseAuthService, { AuthUser } from './firebase';
import firestoreService from './firestore';
import { User, UserRole, UpdateUserData } from '../types/user.types';

/**
 * User Service - Combines Firebase Auth and Firestore operations
 * This service provides a unified interface for user management
 */
class UserService {
  /**
   * Get current authenticated user
   * @returns AuthUser or null
   */
  getCurrentAuthUser(): AuthUser | null {
    return firebaseAuthService.getCurrentUser();
  }

  /**
   * Get current user's full profile from Firestore
   * @returns User profile or null
   */
  async getCurrentUserProfile(): Promise<User | null> {
    const authUser = this.getCurrentAuthUser();
    if (!authUser) return null;

    return await firestoreService.getUserProfile(authUser.uid);
  }

  /**
   * Sign in user
   * @param email - User email
   * @param password - User password
   * @returns AuthUser
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    const authUser = await firebaseAuthService.signInWithEmailAndPassword({ email, password });
    
    // Update last login timestamp in Firestore
    await firestoreService.updateLastLogin(authUser.uid);
    
    return authUser;
  }

  /**
   * Sign up new user
   * @param email - User email
   * @param password - User password
   * @param name - User name
   * @param phone - User phone
   * @param role - User role
   * @returns AuthUser
   */
  async signUp(
    email: string, 
    password: string, 
    name: string, 
    phone: string, 
    role: UserRole
  ): Promise<AuthUser> {
    // Create user in Firebase Auth
    const authUser = await firebaseAuthService.createUserWithEmailAndPassword({
      email,
      password,
      name,
      phone,
      role,
      displayName: name,
    });

    // Create user profile in Firestore
    await firestoreService.createUserProfile({
      uid: authUser.uid,
      email,
      name,
      phone,
      role,
    });

    return authUser;
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    await firebaseAuthService.signOut();
  }

  /**
   * Reset password
   * @param email - User email
   */
  async resetPassword(email: string): Promise<void> {
    await firebaseAuthService.resetPassword(email);
  }

  /**
   * Update user profile in Firestore
   * @param updates - User data to update
   */
  async updateProfile(updates: UpdateUserData): Promise<void> {
    const authUser = this.getCurrentAuthUser();
    if (!authUser) {
      throw new Error('No authenticated user');
    }

    await firestoreService.updateUserProfile(authUser.uid, updates);
  }

  /**
   * Update user's display name in Firebase Auth
   * @param displayName - New display name
   */
  async updateDisplayName(displayName: string): Promise<void> {
    await firebaseAuthService.updateAuthProfile({ displayName });
  }

  /**
   * Update user's profile photo in Firebase Auth
   * @param photoURL - New photo URL
   */
  async updateProfilePhoto(photoURL: string): Promise<void> {
    await firebaseAuthService.updateAuthProfile({ photoURL });
  }

  /**
   * Update user's email
   * @param newEmail - New email address
   */
  async updateEmail(newEmail: string): Promise<void> {
    await firebaseAuthService.updateEmail(newEmail);
    
    // Also update email in Firestore
    const authUser = this.getCurrentAuthUser();
    if (authUser) {
      await firestoreService.updateUserProfile(authUser.uid, { email: newEmail });
    }
  }

  /**
   * Update user's password
   * @param newPassword - New password
   */
  async updatePassword(newPassword: string): Promise<void> {
    await firebaseAuthService.updatePassword(newPassword);
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(): Promise<void> {
    await firebaseAuthService.sendEmailVerification();
  }

  /**
   * Update email verification status in Firestore
   * @param verified - Verification status
   */
  async updateEmailVerificationStatus(verified: boolean): Promise<void> {
    const authUser = this.getCurrentAuthUser();
    if (!authUser) {
      throw new Error('No authenticated user');
    }

    await firestoreService.updateEmailVerification(authUser.uid, verified);
  }

  /**
   * Update phone verification status in Firestore
   * @param verified - Verification status
   */
  async updatePhoneVerificationStatus(verified: boolean): Promise<void> {
    const authUser = this.getCurrentAuthUser();
    if (!authUser) {
      throw new Error('No authenticated user');
    }

    await firestoreService.updatePhoneVerification(authUser.uid, verified);
  }

  /**
   * Delete user account
   * This will delete both the Firebase Auth user and Firestore profile
   */
  async deleteAccount(): Promise<void> {
    const authUser = this.getCurrentAuthUser();
    if (!authUser) {
      throw new Error('No authenticated user');
    }

    // Delete Firestore profile first
    await firestoreService.deleteUserProfile(authUser.uid);
    
    // Then delete Firebase Auth user
    await firebaseAuthService.deleteUser();
  }

  /**
   * Get user by UID
   * @param uid - User ID
   * @returns User profile or null
   */
  async getUserById(uid: string): Promise<User | null> {
    return await firestoreService.getUserProfile(uid);
  }

  /**
   * Get multiple users by UIDs
   * @param uids - Array of user IDs
   * @returns Array of user profiles
   */
  async getUsersByIds(uids: string[]): Promise<User[]> {
    return await firestoreService.getUsersByUids(uids);
  }

  /**
   * Search users by name or email
   * @param searchTerm - Search term
   * @param limit - Maximum number of results
   * @returns Array of matching users
   */
  async searchUsers(searchTerm: string, limit: number = 10): Promise<User[]> {
    return await firestoreService.searchUsers(searchTerm, limit);
  }

  /**
   * Get users by role
   * @param role - User role to filter by
   * @param limit - Maximum number of results
   * @returns Array of users with the specified role
   */
  async getUsersByRole(role: UserRole, limit: number = 50): Promise<User[]> {
    return await firestoreService.getUsersByRole(role, limit);
  }

  /**
   * Check if user exists
   * @param uid - User ID
   * @returns True if user exists, false otherwise
   */
  async userExists(uid: string): Promise<boolean> {
    return await firestoreService.userExists(uid);
  }

  /**
   * Get user count by role
   * @param role - User role to count
   * @returns Number of users with the specified role
   */
  async getUserCountByRole(role: UserRole): Promise<number> {
    return await firestoreService.getUserCountByRole(role);
  }

  /**
   * Listen to current user's profile changes in real-time
   * @param callback - Callback function to handle changes
   * @returns Unsubscribe function
   */
  onCurrentUserProfileChange(callback: (user: User | null) => void): () => void {
    const authUser = this.getCurrentAuthUser();
    if (!authUser) {
      callback(null);
      return () => {};
    }

    return firestoreService.onUserProfileChange(authUser.uid, callback);
  }

  /**
   * Listen to authentication state changes
   * @param callback - Callback function to handle changes
   * @returns Unsubscribe function
   */
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return firebaseAuthService.onAuthStateChanged(callback);
  }
}

// Export singleton instance
export const userService = new UserService();

export default userService;
