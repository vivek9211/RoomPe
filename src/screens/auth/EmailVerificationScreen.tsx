import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Button } from '../../components/common';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

interface EmailVerificationScreenProps {
  navigation: any;
}

const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({ navigation }) => {
  const { sendEmailVerification, isEmailVerified, refreshUserProfile } = useAuth();
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    try {
      setSending(true);
      await sendEmailVerification();
      Alert.alert('Verification email sent', 'Please check your inbox.');
    } catch (e: any) {
      Alert.alert('Failed to send email', e.message || 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleCheck = async () => {
    try {
      setChecking(true);
      const verified = await isEmailVerified(true);
      if (verified) {
        Alert.alert('Email verified', 'Thank you!');
        // Refresh user profile to update emailVerified status
        await refreshUserProfile();
        // The AppNavigator will automatically route to the appropriate dashboard
      } else {
        Alert.alert('Not verified yet', 'Please verify your email and try again.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Please try again.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Optionally auto-send on arrive
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />
      <View style={styles.content}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>We sent a verification link to your email. Please verify to continue.</Text>
        <Button title="Resend verification email" onPress={handleSend} loading={sending} variant="primary" size="large" style={styles.button} />
        <Button title="I have verified" onPress={handleCheck} loading={checking} variant="secondary" size="large" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.xl,
    paddingTop: dimensions.spacing.xl,
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
    marginBottom: dimensions.spacing.xl,
  },
  button: {
    marginBottom: dimensions.spacing.lg,
  },
});

export default EmailVerificationScreen;

