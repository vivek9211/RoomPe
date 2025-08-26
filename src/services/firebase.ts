import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { UserRole } from '../types/user.types';
import firestoreService from './firestore';
import { emailVerificationActionCodeSettings, passwordResetActionCodeSettings } from '../config/firebaseAuth';

// Prefer device language for system emails
try {
  auth().useDeviceLanguage();
} catch {}

// Initialize Firebase (this happens automatically when the app starts)
// The google-services.json file in android/app/ will be used for configuration

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

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

class FirebaseAuthService {
  // Check if Firebase Auth is properly initialized
  isFirebaseInitialized(): boolean {
    try {
      return !!auth;
    } catch (error) {
      console.error('Firebase Auth initialization check failed:', error);
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
      if (passwordResetActionCodeSettings) {
        await auth().sendPasswordResetEmail(email, passwordResetActionCodeSettings);
      } else {
        await auth().sendPasswordResetEmail(email);
      }
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Update user profile in Firebase Auth
  async updateAuthProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      await user.updateProfile(updates);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Update user email
  async updateEmail(newEmail: string): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      await user.updateEmail(newEmail);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Update user password
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      await user.updatePassword(newPassword);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Delete user account
  async deleteUser(): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      await user.delete();
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Send email verification
  async sendEmailVerification(): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      if (emailVerificationActionCodeSettings) {
        await user.sendEmailVerification(emailVerificationActionCodeSettings);
      } else {
        await user.sendEmailVerification();
      }
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Reload current user to refresh properties like emailVerified
  async reloadCurrentUser(): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      await user.reload();
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Check if the current user's email is verified (forces a reload if specified)
  async isEmailVerified(options?: { reload?: boolean }): Promise<boolean> {
    if (options?.reload) {
      await this.reloadCurrentUser();
    }
    const user = auth().currentUser;
    return !!user?.emailVerified;
  }

  // Initiate phone verification: returns a verificationId
  async initiatePhoneVerification(phoneNumber: string): Promise<string> {
    try {
      // verifyPhoneNumber provides a verificationId without changing auth state
      const verificationId = await auth().verifyPhoneNumber(phoneNumber);
      return verificationId;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Confirm phone verification code and link to current user account
  async confirmPhoneVerification(verificationId: string, code: string): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const credential = auth.PhoneAuthProvider.credential(verificationId, code);
      await user.linkWithCredential(credential);

      // Update phoneVerified flag in Firestore if we have a profile
      try {
        await firestoreService.updatePhoneVerification(user.uid, true);
      } catch (e) {
        // Non-fatal: log and continue
        console.warn('Failed to update phoneVerified in Firestore:', e);
      }
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
      case 'auth/requires-recent-login':
        message = 'This operation requires recent authentication. Please sign in again.';
        break;
      case 'auth/invalid-credential':
        message = 'Invalid credentials.';
        break;
      default:
        message = error.message || message;
    }
    
    return new Error(message);
  }
}

export const firebaseAuthService = new FirebaseAuthService();

// Debug function to test Firebase Auth connection
export const testFirebaseAuthConnection = async () => {
  try {
    console.log('Testing Firebase Auth connection...');
    
    if (!firebaseAuthService.isFirebaseInitialized()) {
      console.error('Firebase Auth is not initialized');
      return false;
    }
    
    console.log('Firebase Auth is initialized');
    
    // Test Firebase Auth connection by trying to access current user
    const currentUser = auth().currentUser;
    console.log('Firebase Auth access successful');
    
    return true;
  } catch (error: any) {
    console.error('Firebase Auth connection test failed:', error);
    return false;
  }
};

export default firebaseAuthService;
