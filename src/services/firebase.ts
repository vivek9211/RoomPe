import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { User, UserRole, UserStatus, CreateUserData } from '../types/user.types';

// Initialize Firebase (this happens automatically when the app starts)
// The google-services.json file in android/app/ will be used for configuration

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Use the existing User type from user.types.ts
export type UserProfile = User;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  displayName?: string;
  name: string;
  phone: string;
  role: UserRole;
}

class FirebaseService {
  private get usersCollection() {
    return firestore().collection('users');
  }

  // Check if Firebase is properly initialized
  isFirebaseInitialized(): boolean {
    try {
      return !!firestore && !!auth;
    } catch (error) {
      console.error('Firebase initialization check failed:', error);
      return false;
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    const user = auth().currentUser;
    if (!user) return null;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  }

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const doc = await this.usersCollection.doc(uid).get();
      if (doc.exists()) {
        const data = doc.data();
        return {
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
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  // Create user profile in Firestore
  async createUserProfile(userData: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      // Ensure Firebase is properly initialized
      if (!this.isFirebaseInitialized()) {
        throw new Error('Firebase is not properly initialized');
      }

      const userDoc = {
        ...userData,
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

  // Update user profile in Firestore
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      
      await this.usersCollection.doc(uid).update(updateData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  // Sign in with email and password
  async signInWithEmailAndPassword(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        credentials.email,
        credentials.password
      );
      
      const user = userCredential.user;
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Create user with email and password
  async createUserWithEmailAndPassword(credentials: RegisterCredentials): Promise<AuthUser> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        credentials.email,
        credentials.password
      );
      
      const user = userCredential.user;
      
      // Update display name if provided
      if (credentials.displayName) {
        await user.updateProfile({
          displayName: credentials.displayName,
        });
      }

      // Create user profile in Firestore
      await this.createUserProfile({
        uid: user.uid,
        email: credentials.email,
        name: credentials.name,
        phone: credentials.phone,
        role: credentials.role,
        status: UserStatus.ACTIVE,
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
      });
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await auth().signOut();
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return auth().onAuthStateChanged((user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        callback(null);
      }
    });
  }

  // Handle Firebase auth errors
  private handleAuthError(error: any): Error {
    let message = 'An error occurred during authentication.';
    
    switch (error.code) {
      case 'auth/invalid-email':
        message = 'Invalid email address.';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled.';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email address.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password.';
        break;
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists.';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection.';
        break;
      default:
        message = error.message || message;
    }
    
    return new Error(message);
  }
}

export const firebaseService = new FirebaseService();

// Debug function to test Firebase initialization
export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    if (!firebaseService.isFirebaseInitialized()) {
      console.error('Firebase is not initialized');
      return false;
    }
    
    console.log('Firebase is initialized');
    
    // Test Firestore connection by trying to access a collection
    const testCollection = firestore().collection('test');
    console.log('Firestore collection access successful');
    
    return true;
  } catch (error: any) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

export default firebaseService;
