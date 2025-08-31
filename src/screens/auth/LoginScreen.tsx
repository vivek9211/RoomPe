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
import { Button, Input, SocialButton } from '../../components/common';
import { validateEmail, validatePassword } from '../../utils/validation';
import { useAuth } from '../../contexts/AuthContext';
import firestoreService from '../../services/firestore';
import auth from '@react-native-firebase/auth';

interface LoginScreenProps {
  navigation: any; // Replace with proper navigation type
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { signIn, signInWithGoogle, isEmailVerified, refreshUserProfile, user, userProfile } = useAuth() as any;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validateForm = (): boolean => {
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    setEmailError(emailValidation || '');
    setPasswordError(passwordValidation || '');

    return !emailValidation && !passwordValidation;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await signIn(email, password);

      const verified = await isEmailVerified(true);
      if (!verified) {
        navigation.navigate('EmailVerification');
        return;
      }

      console.log('Login successful');
      // Don't navigate here - let the AppNavigator handle the routing
      // The user will be automatically redirected based on their role
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    
    try {
      await signInWithGoogle();
      
      // Get current user directly from Firebase Auth to avoid stale context
      const currentUser = auth().currentUser;
      if (!currentUser?.uid) {
        throw new Error('No authenticated user after Google sign-in');
      }
      
      // Get the latest profile directly from Firestore
      let profile = null;
      try {
        profile = await firestoreService.getUserProfile(currentUser.uid);
        console.log('Profile fetched:', profile);
      } catch (error) {
        console.log('Error fetching profile:', error);
      }

      const roleValue = (profile && (profile as any).role) as string | undefined;
      const hasValidRole = roleValue === 'tenant' || roleValue === 'owner';
      const onboardingCompleted = profile && (profile as any).onboardingCompleted === true;
      
      console.log('Role value:', roleValue, 'Has valid role:', hasValidRole, 'Onboarding completed:', onboardingCompleted);

      if (!profile || !hasValidRole) {
        console.log('Navigating to RoleSelection - Profile:', !!profile, 'Role:', roleValue);
        navigation.navigate('RoleSelection');
      } else if (!onboardingCompleted) {
        console.log('Profile exists but onboarding not completed - letting AppNavigator handle routing');
        // Don't navigate here - let the AppNavigator handle the routing
        // The user will be automatically redirected based on their role and onboarding status
      } else {
        console.log('Profile exists with role and onboarding completed - letting AppNavigator handle routing');
        // Don't navigate here - let the AppNavigator handle the routing
        // The user will be automatically redirected based on their role
      }
    } catch (error: any) {
      Alert.alert('Google Login Failed', error.message || 'Unable to sign in with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
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
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              secureTextEntry
              error={passwordError}
            />

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              variant="primary"
              size="large"
              loading={isLoading}
              style={styles.loginButton}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <SocialButton
              title="Continue with Google"
              onPress={handleGoogleLogin}
              provider="google"
              loading={isGoogleLoading}
              style={styles.googleButton}
            />
          </View>



          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    marginBottom: dimensions.spacing.xxxl,
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
  formContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: dimensions.spacing.lg,
  },
  forgotPasswordText: {
    fontSize: fonts.sm,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  loginButton: {
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.xxl,
  },
  registerText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: fonts.md,
    color: colors.primary,
    fontWeight: '600' as const,
  },

});

export default LoginScreen;
