import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Button, Input } from '../../components/common';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

interface PhoneVerificationScreenProps {
  navigation: any;
}

const PhoneVerificationScreen: React.FC<PhoneVerificationScreenProps> = ({ navigation }) => {
  const { initiatePhoneVerification, confirmPhoneVerification, userProfile } = useAuth();
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSendCode = async () => {
    try {
      setSending(true);
      const id = await initiatePhoneVerification(phone);
      setVerificationId(id);
      Alert.alert('Code sent', 'A verification code has been sent to your phone.');
    } catch (e: any) {
      Alert.alert('Failed to send code', e.message || 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationId) {
      Alert.alert('Missing code', 'Please request a code first.');
      return;
    }
    try {
      setVerifying(true);
      await confirmPhoneVerification(verificationId, code);
      Alert.alert('Phone verified', 'Thank you!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Verification failed', e.message || 'Please check the code and try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />
      <View style={styles.content}>
        <Text style={styles.title}>Verify your phone</Text>
        <Input label="Phone number" placeholder="Enter phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Button title="Send code" onPress={handleSendCode} loading={sending} variant="primary" size="large" style={styles.button} />
        <Input label="Verification code" placeholder="Enter code" value={code} onChangeText={setCode} keyboardType="numeric" />
        <Button title="Verify" onPress={handleVerify} loading={verifying} variant="secondary" size="large" />
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
    marginBottom: dimensions.spacing.lg,
  },
  button: {
    marginBottom: dimensions.spacing.lg,
  },
});

export default PhoneVerificationScreen;

