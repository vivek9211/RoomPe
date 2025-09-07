import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';
import { Button, Input, SocialButton, Toggle } from '../../components/common';
import { 
  validateEmail, 
  validatePassword, 
  validateName,
  validatePhoneNumber
} from '../../utils/validation';
import { useAuth } from '../../contexts/AuthContext';
import firestoreService from '../../services/firestore';
import auth from '@react-native-firebase/auth';
import { UserRole } from '../../types/user.types';

interface RegisterScreenProps {
  navigation: any; // Replace with proper navigation type
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { signUp, signInWithGoogle } = useAuth();
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  // User type toggle (false = Tenant, true = Owner)
  const [isOwner, setIsOwner] = useState(false);
  
  // Error states
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Check if all required fields are filled for Google sign-up (no password required)
  const isGoogleFormValid = fullName.trim() && email.trim() && phone.trim();

  const validateForm = (): boolean => {
    const fullNameValidation = validateName(fullName);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const phoneValidation = validatePhoneNumber(phone);

    // Confirm password validation
    let confirmPasswordValidation = null;
    if (!confirmPassword) {
      confirmPasswordValidation = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      confirmPasswordValidation = 'Passwords do not match';
    }

    setFullNameError(fullNameValidation || '');
    setEmailError(emailValidation || '');
    setPasswordError(passwordValidation || '');
    setConfirmPasswordError(confirmPasswordValidation || '');
    setPhoneError(phoneValidation || '');

    return !fullNameValidation && !emailValidation && !passwordValidation && 
           !confirmPasswordValidation && !phoneValidation;
  };

  const validateRequiredFields = (): boolean => {
    const fullNameValidation = validateName(fullName);
    const emailValidation = validateEmail(email);
    const phoneValidation = validatePhoneNumber(phone);

    setFullNameError(fullNameValidation || '');
    setEmailError(emailValidation || '');
    setPhoneError(phoneValidation || '');

    return !fullNameValidation && !emailValidation && !phoneValidation;
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000); // Hide after 3 seconds
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Use Firebase authentication with Firestore
      await signUp(email, password, fullName, phone, isOwner ? 'owner' : 'tenant');
      
      console.log('Registration successful:', { 
        fullName, 
        email, 
        phone,
        userType: isOwner ? 'Owner' : 'Tenant' 
      });
      
      // Don't navigate here - let the AppNavigator handle the routing
      // The user will be automatically redirected to EmailVerification if needed
      // or to their dashboard if email verification is not required
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    // Validate required fields for Google sign-up (no password required)
    if (!validateRequiredFields()) {
      showToastMessage('Fill required fields first');
      return;
    }

    setIsGoogleLoading(true);
    
    try {
      // Sign in with Google
      await signInWithGoogle();
      
      // Get current user directly from Firebase Auth
      const currentUser = auth().currentUser;
      if (!currentUser?.uid) {
        throw new Error('No authenticated user after Google sign-in');
      }
      
      // Create user profile with the form data
      await firestoreService.createUserProfile({
        uid: currentUser.uid,
        email,
        name: fullName,
        phone,
        role: isOwner ? UserRole.OWNER : UserRole.TENANT,
        onboardingCompleted: false, // Set to false to ensure email verification
      });
      
      // Send email verification for Google users
      try {
        await currentUser.sendEmailVerification();
      } catch (e) {
        console.warn('Failed to send email verification for Google user:', e);
      }
      
      console.log('Google Sign-Up successful:', { 
        fullName, 
        email, 
        phone,
        userType: isOwner ? 'Owner' : 'Tenant' 
      });
      
      // Don't navigate here - let the AppNavigator handle the routing
      // The user will be automatically redirected to EmailVerification
    } catch (error: any) {
      Alert.alert('Google Registration Failed', error.message || 'Unable to sign up with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join RoomPe to manage your rentals</Text>
          </View>

          {/* User Type Toggle */}
          <Toggle
            value={isOwner}
            onValueChange={setIsOwner}
            leftLabel="Tenant"
            rightLabel="Owner"
            style={styles.toggleContainer}
          />

          {/* Registration Form */}
          <View style={styles.formContainer}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (fullNameError) setFullNameError('');
              }}
              autoCapitalize="words"
              error={fullNameError}
              required
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
              required
            />

            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (phoneError) setPhoneError('');
              }}
              keyboardType="phone-pad"
              error={phoneError}
              required
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              secureTextEntry
              error={passwordError}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError('');
              }}
              secureTextEntry
              error={confirmPasswordError}
            />

            <Button
              title={`Sign Up as ${isOwner ? 'Owner' : 'Tenant'}`}
              onPress={handleRegister}
              variant="primary"
              size="large"
              loading={isLoading}
              style={styles.registerButton}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Registration */}
          <View style={styles.socialContainer}>
            <SocialButton
              title="Continue with Google"
              onPress={handleGoogleRegister}
              provider="google"
              loading={isGoogleLoading}
              style={styles.googleButton}
            />
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Toast Notification */}
      {showToast && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
    paddingTop: dimensions.spacing.md,
  },
  backButton: {
    padding: dimensions.spacing.sm,
  },
  backButtonText: {
    fontSize: fonts.xl,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.xl,
    paddingTop: dimensions.spacing.xl,
  },
  titleContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  title: {
    fontSize: fonts.xxxl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  toggleContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  formContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  registerButton: {
    marginTop: dimensions.spacing.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: dimensions.spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.lightGray,
  },
  dividerText: {
    marginHorizontal: dimensions.spacing.lg,
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  socialContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  googleButton: {
    marginBottom: dimensions.spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.xxl,
  },
  loginText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: fonts.md,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: colors.error,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: colors.white,
    fontSize: fonts.md,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
});

export default RegisterScreen;
