import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';
import usePayments from '../../hooks/usePayments';

const PaymentListScreen: React.FC = () => {
  const { loading } = usePayments();
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);

  const handleRefresh = () => {
    setLastRefreshedAt(Date.now());
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Payments</Text>
        <Text style={styles.subtitle}>Manage your payments</Text>
        
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.addButton, { marginTop: dimensions.spacing.md }]} onPress={handleRefresh}>
          <Text style={styles.addButtonText}>{loading ? 'Refreshing...' : 'Refresh Status'}</Text>
        </TouchableOpacity>

        {lastRefreshedAt ? (
          <Text style={styles.helper}>Last refreshed: {new Date(lastRefreshedAt).toLocaleString()}</Text>
        ) : null}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fonts.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xl,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  addButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
  helper: { color: colors.textSecondary, marginTop: dimensions.spacing.sm },
});

export default PaymentListScreen;
