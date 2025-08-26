import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Button } from '../../components/common';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

interface RoleSelectionScreenProps {
  navigation: any;
}

const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ navigation }) => {
  const { completeGoogleOnboarding } = useAuth();
  const [role, setRole] = useState<'tenant' | 'owner' | null>(null);
  const [loading, setLoading] = useState(false);

  const onContinue = async () => {
    if (!role) {
      Alert.alert('Select role', 'Please choose Tenant or Owner to continue.');
      return;
    }
    try {
      setLoading(true);
      await completeGoogleOnboarding(role);
      navigation.navigate('Dashboard');
    } catch (e: any) {
      Alert.alert('Failed to complete setup', e.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />
      <View style={styles.content}>
        <Text style={styles.title}>Choose your role</Text>
        <Text style={styles.subtitle}>Tell us how you'll use RoomPe</Text>

        <Button
          title={role === 'tenant' ? 'Tenant ✓' : 'I am a Tenant'}
          onPress={() => setRole('tenant')}
          variant="outline"
          size="large"
          style={styles.button}
        />
        <Button
          title={role === 'owner' ? 'Owner ✓' : 'I am an Owner'}
          onPress={() => setRole('owner')}
          variant="outline"
          size="large"
          style={styles.button}
        />
        <Button title="Continue" onPress={onContinue} loading={loading} variant="primary" size="large" />
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

export default RoleSelectionScreen;