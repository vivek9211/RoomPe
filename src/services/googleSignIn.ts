import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { AuthUser } from './firebase';
import { GOOGLE_SIGN_IN_CONFIG } from '../config/googleSignIn';

// Configure Google Sign-In
GoogleSignin.configure(GOOGLE_SIGN_IN_CONFIG);

export interface GoogleSignInResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

class GoogleSignInService {
  // Check if Google Sign-In is available
  async isGoogleSignInAvailable(): Promise<boolean> {
    try {
      return await GoogleSignin.hasPlayServices();
    } catch (error) {
      console.error('Google Play Services check failed:', error);
      return false;
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<GoogleSignInResult> {
    try {
      // Check if Google Play Services are available
      const isAvailable = await this.isGoogleSignInAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Google Play Services are not available',
        };
      }

      // Check if user is already signed in
      await GoogleSignin.signOut();

      // Get user info from Google
      await GoogleSignin.signIn();
      
      // Get the ID token
      const tokens = await GoogleSignin.getTokens();
      
      if (!tokens.idToken) {
        return {
          success: false,
          error: 'Failed to get ID token from Google',
        };
      }

      // Create Firebase credential
      const googleCredential = auth.GoogleAuthProvider.credential(tokens.idToken);

      // Sign in to Firebase with Google credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      const user = userCredential.user;
      
      // Note: Profile update with Google info can be implemented later
      // when we have proper type definitions

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
      };
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      
      let errorMessage = 'Google Sign-In failed';
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'Sign-In was cancelled';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'Sign-In is already in progress';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Google Play Services are not available';
      } else if (error.code === statusCodes.SIGN_IN_REQUIRED) {
        errorMessage = 'Sign-In is required';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Sign out from Google
  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google Sign-Out error:', error);
    }
  }

  // Get current Google user
  async getCurrentGoogleUser() {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();
      return userInfo;
    } catch (error) {
      console.error('Get current Google user error:', error);
      return null;
    }
  }

  // Check if user is signed in to Google
  async isSignedIn(): Promise<boolean> {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      return currentUser !== null;
    } catch (error) {
      console.error('Check Google sign-in status error:', error);
      return false;
    }
  }
}

export const googleSignInService = new GoogleSignInService();
export default googleSignInService; 