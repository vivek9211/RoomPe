import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';
import { usePayments } from '../../hooks/usePayments';
import { PaymentStatus } from '../../types/payment.types';

const PaymentListScreen: React.FC = () => {
  const { 
    loading, 
    payments, 
    pendingPayments, 
    syncPaymentStatus, 
    syncAllPayments,
    lastSyncResult 
  } = usePayments();
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleRefresh = () => {
    setLastRefreshedAt(Date.now());
  };

  const handleSyncAllPayments = async () => {
    try {
      setSyncing(true);
      const result = await syncAllPayments();
      
      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Synced ${result.synced} payments. ${result.updated} payments were updated.${result.errors.length > 0 ? `\n\nErrors: ${result.errors.join(', ')}` : ''}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Sync Failed',
          `Failed to sync payments. Errors: ${result.errors.join(', ')}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Sync Error', error.message || 'Failed to sync payments');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return colors.success;
      case PaymentStatus.PENDING:
        return colors.warning;
      case PaymentStatus.OVERDUE:
        return colors.error;
      case PaymentStatus.FAILED:
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'Paid';
      case PaymentStatus.PENDING:
        return 'Pending';
      case PaymentStatus.OVERDUE:
        return 'Overdue';
      case PaymentStatus.FAILED:
        return 'Failed';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>Manage your payments</Text>
          
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.addButton, { marginTop: dimensions.spacing.md }]} 
            onPress={handleRefresh}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.syncButton, { marginTop: dimensions.spacing.md }]} 
            onPress={handleSyncAllPayments}
            disabled={syncing || loading}
          >
            <Text style={styles.syncButtonText}>
              {syncing ? 'Syncing with Razorpay...' : 'Sync with Razorpay'}
            </Text>
          </TouchableOpacity>

          {lastRefreshedAt ? (
            <Text style={styles.helper}>Last refreshed: {new Date(lastRefreshedAt).toLocaleString()}</Text>
          ) : null}

          {lastSyncResult && (
            <View style={styles.syncResult}>
              <Text style={styles.syncResultTitle}>Last Sync Result:</Text>
              <Text style={styles.syncResultText}>
                Synced: {lastSyncResult.synced} | Updated: {lastSyncResult.updated}
              </Text>
              {lastSyncResult.errors.length > 0 && (
                <Text style={styles.syncErrorText}>
                  Errors: {lastSyncResult.errors.join(', ')}
                </Text>
              )}
            </View>
          )}

          {/* Payment List */}
          {payments.length > 0 && (
            <View style={styles.paymentList}>
              <Text style={styles.sectionTitle}>All Payments</Text>
              {payments.map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentAmount}>₹{payment.amount}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(payment.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentDescription}>{payment.description || payment.month}</Text>
                  <Text style={styles.paymentDate}>
                    Due: {payment.dueDate.toDate().toLocaleDateString()}
                  </Text>
                  {payment.transactionId && (
                    <Text style={styles.transactionId}>
                      Transaction: {payment.transactionId}
                    </Text>
                  )}
                  {payment.status === PaymentStatus.PENDING && payment.transactionId && (
                    <TouchableOpacity 
                      style={styles.syncSingleButton}
                      onPress={() => syncPaymentStatus(payment.id)}
                    >
                      <Text style={styles.syncSingleButtonText}>Sync Status</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {pendingPayments.length > 0 && (
            <View style={styles.paymentList}>
              <Text style={styles.sectionTitle}>Pending Payments</Text>
              {pendingPayments.map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentAmount}>₹{payment.amount}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(payment.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentDescription}>{payment.description || payment.month}</Text>
                  <Text style={styles.paymentDate}>
                    Due: {payment.dueDate.toDate().toLocaleDateString()}
                  </Text>
                  {payment.transactionId && (
                    <Text style={styles.transactionId}>
                      Transaction: {payment.transactionId}
                    </Text>
                  )}
                  {payment.transactionId && (
                    <TouchableOpacity 
                      style={styles.syncSingleButton}
                      onPress={() => syncPaymentStatus(payment.id)}
                    >
                      <Text style={styles.syncSingleButtonText}>Sync Status</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {payments.length === 0 && pendingPayments.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No payments found</Text>
              <Text style={styles.emptyStateSubtext}>
                Payments will appear here once they are created
              </Text>
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: dimensions.spacing.xl,
    paddingTop: dimensions.spacing.xl,
    paddingBottom: dimensions.spacing.xl,
  },
  title: {
    fontSize: fonts.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xl,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
  syncButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  syncButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
  helper: { 
    color: colors.textSecondary, 
    marginTop: dimensions.spacing.sm,
    textAlign: 'center',
  },
  syncResult: {
    backgroundColor: colors.surface,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginTop: dimensions.spacing.md,
  },
  syncResultTitle: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  syncResultText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  syncErrorText: {
    fontSize: fonts.sm,
    color: colors.error,
    marginTop: dimensions.spacing.xs,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
  },
  paymentList: {
    marginTop: dimensions.spacing.lg,
  },
  paymentItem: {
    backgroundColor: colors.surface,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.md,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  paymentAmount: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  statusText: {
    fontSize: fonts.sm,
    fontWeight: '500',
    color: colors.white,
  },
  paymentDescription: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  paymentDate: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  transactionId: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: dimensions.spacing.sm,
  },
  syncSingleButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  syncSingleButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: dimensions.spacing.xl,
  },
  emptyStateText: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default PaymentListScreen;
