import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';
import { createLinkedAccount, getRouteAccountStatus } from '../../services/api/paymentApi';

interface PaymentSetupComponentProps {
  propertyId: string;
  onSetupComplete: (linkedAccountId: string) => void;
}

export const PaymentSetupComponent: React.FC<PaymentSetupComponentProps> = ({
  propertyId,
  onSetupComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);

  const handleCreateLinkedAccount = async () => {
    try {
      setLoading(true);
      
      // Get property owner details (you'll need to implement this)
      const ownerDetails = {
        name: 'Property Owner Name', // Get from property data
        email: 'owner@example.com', // Get from property data
        contact: '9876543210', // Get from property data
        business_type: 'individual' as const,
      };

      const result = await createLinkedAccount(ownerDetails);
      
      if (result.linkedAccountId) {
        Alert.alert(
          'Account Created',
          `Your Razorpay linked account has been created with ID: ${result.linkedAccountId}. Status: ${result.status}`,
          [
            {
              text: 'OK',
              onPress: () => onSetupComplete(result.linkedAccountId),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create linked account');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAccountStatus = async (accountId: string) => {
    try {
      setLoading(true);
      const status = await getRouteAccountStatus(accountId);
      setAccountStatus(status.status || 'Unknown');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check account status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Setup</Text>
      <Text style={styles.description}>
        Set up your Razorpay linked account to receive rent payments directly from tenants.
      </Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleCreateLinkedAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Create Linked Account</Text>
        )}
      </TouchableOpacity>

      {accountStatus && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Account Status:</Text>
          <Text style={[
            styles.statusText,
            { color: accountStatus === 'activated' ? colors.success : colors.warning }
          ]}>
            {accountStatus}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: dimensions.spacing.lg,
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    margin: dimensions.spacing.md,
  },
  title: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: dimensions.spacing.sm,
  },
  description: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.lg,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  buttonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: dimensions.spacing.sm,
  },
  statusLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginRight: dimensions.spacing.sm,
  },
  statusText: {
    fontSize: fonts.sm,
    fontWeight: '600',
  },
});

export default PaymentSetupComponent;
