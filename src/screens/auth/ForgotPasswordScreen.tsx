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
import { Button, Input } from '../../components/common';
import { validateEmail } from '../../utils/validation';
import { useAuth } from '../../contexts/AuthContext';

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const emailValidation = validateEmail(email);
    setEmailError(emailValidation || '');
    return !emailValidation;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await resetPassword(email);
      setIsSuccess(true);
      Alert.alert(
        'Reset Email Sent',
        'Please check your email for password reset instructions.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('LoginScreen')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Reset Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLogin = () => {
    navigation.navigate('LoginScreen');
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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password
            </Text>
          </View>

          {/* Reset Form */}
          <View style={styles.formContainer}>
            <Input
              label="Email"
              placeholder="Enter your email address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
            />

            <Button
              title="Send Reset Link"
              onPress={handleResetPassword}
              variant="primary"
              size="large"
              loading={isLoading}
              style={styles.resetButton}
            />
          </View>

          {/* Back to Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Remember your password? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
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
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  resetButton: {
    marginTop: dimensions.spacing.lg,
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
});

export default ForgotPasswordScreen;
