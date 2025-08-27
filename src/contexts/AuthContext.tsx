import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import firebaseAuthService, { AuthUser } from '../services/firebase';
import firestoreService from '../services/firestore';
import googleSignInService from '../services/googleSignIn';
import { User } from '../types/user.types';

interface AuthContextType {
  user: AuthUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string, phone: string, role: 'tenant' | 'owner') => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  isEmailVerified: (reload?: boolean) => Promise<boolean>;
  initiatePhoneVerification: (phoneNumber: string) => Promise<string>;
  confirmPhoneVerification: (verificationId: string, code: string) => Promise<void>;
  completeGoogleOnboarding: (role: 'tenant' | 'owner', opts?: { phone?: string; nameOverride?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string) => {
    try {
      const profile = await firestoreService.getUserProfile(uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  // Refresh user profile
  const refreshUserProfile = async () => {
    if (user?.uid) {
      await fetchUserProfile(user.uid);
    }
  };

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = firebaseAuthService.onAuthStateChanged(async (user: AuthUser | null) => {
      setUser(user);
      
      if (user) {
        // Fetch user profile when user is authenticated
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await firebaseAuthService.signInWithEmailAndPassword({ email, password });
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await googleSignInService.signInWithGoogle();
      if (!result.success) {
        throw new Error(result.error || 'Google Sign-In failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, phone: string, role: 'tenant' | 'owner') => {
    try {
      // Create user in Firebase Auth
      const authUser = await firebaseAuthService.createUserWithEmailAndPassword({ 
        email, 
        password, 
        name,
        phone,
        role: role as any,
        displayName: name
      });

      // Create user profile in Firestore
      await firestoreService.createUserProfile({
        uid: authUser.uid,
        email,
        name,
        phone,
        role: role as any,
      });

      // Send email verification after successful signup
      try {
        await firebaseAuthService.sendEmailVerification();
      } catch (e) {
        console.warn('Failed to send email verification:', e);
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseAuthService.signOut();
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await firebaseAuthService.resetPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const sendEmailVerification = async () => {
    await firebaseAuthService.sendEmailVerification();
  };

  const isEmailVerified = async (reload: boolean = true) => {
    const verified = await firebaseAuthService.isEmailVerified({ reload });
    if (user?.uid) {
      try {
        await firestoreService.updateEmailVerification(user.uid, verified);
      } catch (e) {
        console.warn('Failed updating emailVerified in Firestore:', e);
      }
    }
    return verified;
  };

  const initiatePhoneVerification = async (phoneNumber: string) => {
    return await firebaseAuthService.initiatePhoneVerification(phoneNumber);
  };

  const confirmPhoneVerification = async (verificationId: string, code: string) => {
    await firebaseAuthService.confirmPhoneVerification(verificationId, code);
    if (user?.uid) {
      try {
        await firestoreService.updateUserProfile(user.uid, { phone: userProfile?.phone || '' });
      } catch (e) {
        console.warn('Failed to touch user profile after phone verification:', e);
      }
    }
  };

  const completeGoogleOnboarding = async (role: 'tenant' | 'owner', opts?: { phone?: string; nameOverride?: string }) => {
    if (!user?.uid) throw new Error('Not authenticated');
    const email = user.email || '';
    const name = opts?.nameOverride || user.displayName || email.split('@')[0] || 'User';
    const phone = opts?.phone || '';

    try {
      // If profile exists, just update role/phone/name; else create
      const existing = await firestoreService.getUserProfile(user.uid);
      if (existing) {
        await firestoreService.updateUserProfile(user.uid, { 
          role: role as any, 
          phone, 
          name,
          onboardingCompleted: true 
        });
      } else {
        await firestoreService.createUserProfile({
          uid: user.uid,
          email,
          name,
          phone,
          role: role as any,
          onboardingCompleted: true,
        });
      }
      await refreshUserProfile();
    } catch (e) {
      throw e;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    refreshUserProfile,
    sendEmailVerification,
    isEmailVerified,
    initiatePhoneVerification,
    confirmPhoneVerification,
    completeGoogleOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
