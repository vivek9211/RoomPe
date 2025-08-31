import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { firestoreService } from '../../services/firestore';
import { UserRole } from '../../types/user.types';
import { useAuth } from '../../contexts/AuthContext';

interface TenantRegistrationScreenProps {
  navigation: any;
}

const TenantRegistrationScreen: React.FC<TenantRegistrationScreenProps> = ({ navigation }) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    if (!formData.password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Create the tenant account using the existing signUp function
      await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.phone,
        'tenant'
      );
      
      Alert.alert(
        'Registration Successful',
        'Your tenant account has been created successfully. Please check your email for verification.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Don't navigate here - let the AppNavigator handle the routing
              // The user will be automatically redirected to EmailVerification if needed
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tenant Registration</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeIcon}>🏠</Text>
          <Text style={styles.welcomeTitle}>Join RoomPe as a Tenant</Text>
          <Text style={styles.welcomeSubtitle}>
            Create your account to access your rental property information, make payments, and submit maintenance requests.
          </Text>
        </View>

        {/* Registration Form */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Create Your Account</Text>
          
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textMuted}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor={colors.textMuted}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.textMuted}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor={colors.textMuted}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor={colors.textMuted}
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Terms and Privacy */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            By creating an account, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
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
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    height: 56,
  },
  backButton: {
    marginRight: dimensions.spacing.md,
  },
  backIcon: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xl,
  },
  welcomeIcon: {
    fontSize: 64,
    marginBottom: dimensions.spacing.lg,
  },
  welcomeTitle: {
    fontSize: fonts.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    marginBottom: dimensions.spacing.xl,
  },
  formTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.lg,
  },
  inputGroup: {
    marginBottom: dimensions.spacing.lg,
  },
  inputLabel: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    paddingVertical: dimensions.spacing.lg,
    alignItems: 'center',
    marginTop: dimensions.spacing.lg,
  },
  registerButtonDisabled: {
    backgroundColor: colors.lightGray,
    opacity: 0.6,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: fonts.lg,
    fontWeight: '600',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  loginText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: fonts.md,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: dimensions.spacing.xs,
  },
  termsSection: {
    paddingBottom: dimensions.spacing.xl,
  },
  termsText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '500',
  },
});

export default TenantRegistrationScreen;
