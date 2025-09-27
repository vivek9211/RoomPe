import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, dimensions } from '../../constants';
import { usePayments } from '../../hooks/usePayments';
import { useAuth } from '../../contexts/AuthContext';
import { Payment, PaymentStatus, PaymentType } from '../../types/payment.types';
// Local formatting functions to avoid import issues
const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

const formatDate = (date: Date | any): string => {
  if (!date) return 'N/A';
  
  let dateObj: Date;
  if (date instanceof Date) {
    dateObj = date;
  } else if (date.toDate && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  } else {
    dateObj = new Date(date);
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'N/A';
  }
  
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

interface TenantPaymentScreenProps {
  navigation: any;
}

const TenantPaymentScreen: React.FC<TenantPaymentScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuth();
  const {
    payments,
    currentMonthRent,
    pendingPayments,
    paymentStats,
    loading,
    error,
    totalOutstanding,
    overduePayments,
    currentMonthStatus,
    loadPayments,
    loadCurrentMonthRent,
    loadPendingPayments,
    loadPaymentStats,
    processOnlinePayment,
    verifyPayment,
    syncAllPayments,
    cleanupDuplicatePayments,
    clearError,
    getTenantDepositInfo,
    createDepositPayment,
    processDepositPayment,
    verifyDepositPayment
  } = usePayments();

  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [autoSyncCompleted, setAutoSyncCompleted] = useState(false);
  const [depositInfo, setDepositInfo] = useState<any>(null);
  const [processingDeposit, setProcessingDeposit] = useState(false);

  // Auto-sync payment status when screen loads (only once)
  useEffect(() => {
    if (autoSyncCompleted) return; // Prevent multiple auto-syncs
    
    let isMounted = true;
    
    const autoSyncPayments = async () => {
      try {
        // First cleanup any duplicate payments
        const cleanupResult = await cleanupDuplicatePayments();
        if (isMounted && cleanupResult.success && cleanupResult.duplicatesRemoved > 0) {
          console.log(`Auto-cleanup: Removed ${cleanupResult.duplicatesRemoved} duplicate payments`);
        }
        
        // Then sync if there are pending payments with transaction IDs
        const hasPendingPaymentsWithTransactionId = pendingPayments.some(
          payment => payment.transactionId && (payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.OVERDUE)
        );
        
        if (isMounted && hasPendingPaymentsWithTransactionId) {
          console.log('Auto-syncing pending payments with Razorpay...');
          const result = await syncAllPayments();
          if (isMounted && result.success && result.updated > 0) {
            console.log(`Auto-sync completed: ${result.updated} payments updated`);
          }
        }
        
        if (isMounted) {
          setAutoSyncCompleted(true);
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
        // Don't show error to user for auto-sync failures
        if (isMounted) {
          setAutoSyncCompleted(true);
        }
      }
    };

    // Run auto-sync after a short delay to allow initial data to load
    const timer = setTimeout(autoSyncPayments, 2000);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []); // Empty dependency array - only run once on mount

  // Load deposit info when component mounts
  useEffect(() => {
    loadDepositInfo();
  }, []);

  const loadDepositInfo = async () => {
    try {
      const deposit = await getTenantDepositInfo();
      setDepositInfo(deposit);
    } catch (error) {
      console.error('Error loading deposit info:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setAutoSyncCompleted(false); // Reset auto-sync flag for manual refresh
    try {
      // First cleanup any duplicate payments
      const cleanupResult = await cleanupDuplicatePayments();
      if (cleanupResult.success && cleanupResult.duplicatesRemoved > 0) {
        console.log(`Cleaned up ${cleanupResult.duplicatesRemoved} duplicate payments`);
      }
      
      // Then sync all pending payments with Razorpay
      await syncAllPayments();
      
      // Finally reload all payment data
      await Promise.all([
        loadPayments(),
        loadCurrentMonthRent(),
        loadPendingPayments(),
        loadPaymentStats(),
        loadDepositInfo()
      ]);
    } catch (err) {
      console.error('Error refreshing payments:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePayDeposit = async () => {
    if (!depositInfo || !userProfile?.uid) {
      Alert.alert('Error', 'Deposit information not available');
      return;
    }

    try {
      setProcessingDeposit(true);

      // Create deposit payment
      const paymentId = await createDepositPayment(
        depositInfo.propertyId,
        depositInfo.roomId,
        depositInfo.depositAmount
      );

      // Process payment with Razorpay
      const orderData = await processDepositPayment(paymentId, userProfile.uid, depositInfo.propertyId);

      // Open Razorpay checkout
      const RazorpayCheckout = require('react-native-razorpay').default;
      const options = {
        description: 'Security Deposit Payment',
        image: 'https://your-logo-url.com/logo.png',
        currency: 'INR',
        key: orderData.keyId,
        amount: orderData.amount,
        order_id: orderData.orderId,
        name: 'RoomPe',
        prefill: {
          email: userProfile.email || '',
          contact: userProfile.phone || '',
          name: userProfile.name || '',
        },
        theme: { color: colors.primary },
        handler: async (response: any) => {
          try {
            await verifyDepositPayment(
              paymentId,
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );

            Alert.alert(
              'Payment Successful!',
              'Your security deposit has been paid successfully.',
              [{ text: 'OK', onPress: () => onRefresh() }]
            );
          } catch (verifyError: any) {
            Alert.alert(
              'Payment Successful!',
              'Your security deposit payment has been processed. The payment status will be updated automatically.',
              [{ text: 'OK', onPress: () => onRefresh() }]
            );
          } finally {
            setProcessingDeposit(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingDeposit(false);
          },
        },
      };

      RazorpayCheckout.open(options).catch((error: any) => {
        Alert.alert('Error', 'Payment cancelled or failed');
        setProcessingDeposit(false);
      });

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process deposit payment');
      setProcessingDeposit(false);
    }
  };

  const handlePayNow = async (payment: Payment) => {
    if (!userProfile?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setProcessingPayment(payment.id);
      
      // Process payment using Razorpay Route
      const result = await processOnlinePayment(payment.id, payment.propertyId);
      
      // Initialize Razorpay checkout
      const options = {
        description: `Rent payment for ${payment.month}`,
        image: 'https://your-app-logo-url.com/logo.png', // Replace with your app logo
        currency: 'INR',
        key: result.keyId,
        amount: result.amount,
        name: 'RoomPe',
        order_id: result.orderId,
        prefill: {
          email: userProfile.email || '',
          contact: userProfile.phone || '',
          name: userProfile.name || '',
        },
        theme: {
          color: colors.primary,
        },
        handler: async (response: any) => {
          try {
            console.log('Payment response received:', response);
            
            // Verify payment
            const isVerified = await verifyPayment(
              payment.id,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            
            if (isVerified) {
              Alert.alert('Success', 'Payment completed successfully!');
              onRefresh();
            } else {
              Alert.alert('Error', 'Payment verification failed. The payment status will be synced automatically.');
              onRefresh(); // Refresh to trigger auto-sync
            }
          } catch (error) {
            console.error('Payment handler error:', error);
            Alert.alert('Error', 'Payment verification failed. The payment status will be synced automatically.');
            onRefresh(); // Refresh to trigger auto-sync
          } finally {
            setProcessingPayment(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(null);
          },
        },
      };

      // Open Razorpay checkout
      const RazorpayCheckout = require('react-native-razorpay').default;
      RazorpayCheckout.open(options).catch((error: any) => {
        Alert.alert('Error', 'Payment cancelled or failed');
        setProcessingPayment(null);
      });
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process payment');
      setProcessingPayment(null);
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
        return 'Unknown';
    }
  };

  const renderPaymentCard = (payment: Payment) => {
    const isProcessing = processingPayment === payment.id;
    const totalAmount = payment.amount + (payment.lateFee || 0);
    
    return (
      <View key={payment.id} style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentType}>
              {payment.type === PaymentType.RENT ? 'Monthly Rent' : 
               payment.type === PaymentType.SECURITY_DEPOSIT ? 'Security Deposit' : 
               payment.type}
            </Text>
            <Text style={styles.paymentMonth}>{payment.month}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
            <Text style={styles.statusText}>{getStatusText(payment.status)}</Text>
          </View>
        </View>
        
        <View style={styles.paymentDetails}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount:</Text>
            <Text style={styles.amountValue}>{formatCurrency(payment.amount)}</Text>
          </View>
          
          {payment.lateFee && payment.lateFee > 0 && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Late Fee:</Text>
              <Text style={[styles.amountValue, { color: colors.error }]}>
                {formatCurrency(payment.lateFee)}
              </Text>
            </View>
          )}
          
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Due Date:</Text>
            <Text style={styles.amountValue}>{formatDate(payment.dueDate.toDate())}</Text>
          </View>
          
          {payment.paidAt && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Paid On:</Text>
              <Text style={styles.amountValue}>{formatDate(payment.paidAt.toDate())}</Text>
            </View>
          )}
        </View>
        
        {/* No Pay Now button in payment history - only show for current month */}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + dimensions.spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Payments</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Month Status */}
        {currentMonthRent && (
          <View style={styles.currentMonthSection}>
            <Text style={styles.sectionTitle}>Current Month</Text>
            <View style={styles.currentMonthCard}>
              <View style={styles.currentMonthHeader}>
                <Text style={styles.currentMonthText}>
                  {currentMonthRent.month} Rent
                </Text>
                <View style={[styles.currentStatusBadge, { backgroundColor: getStatusColor(currentMonthRent.status) }]}>
                  <Text style={styles.currentStatusText}>
                    {getStatusText(currentMonthRent.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.currentAmount}>
                {formatCurrency(currentMonthRent.amount + (currentMonthRent.lateFee || 0))}
              </Text>
              {currentMonthRent.status === PaymentStatus.PENDING || currentMonthRent.status === PaymentStatus.OVERDUE ? (
                <TouchableOpacity
                  style={styles.currentPayButton}
                  onPress={() => handlePayNow(currentMonthRent)}
                  disabled={processingPayment === currentMonthRent.id}
                >
                  {processingPayment === currentMonthRent.id ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.currentPayButtonText}>Pay Now</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}

        {/* Security Deposit Section */}
        {depositInfo && (
          <View style={styles.depositSection}>
            <Text style={styles.sectionTitle}>Security Deposit</Text>
            <View style={styles.depositCard}>
              <View style={styles.depositHeader}>
                <Text style={styles.depositTitle}>Security Deposit</Text>
                <View style={[styles.depositStatusBadge, { 
                  backgroundColor: depositInfo.depositPaid ? colors.success : colors.warning 
                }]}>
                  <Text style={styles.depositStatusText}>
                    {depositInfo.depositPaid ? 'Paid' : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.depositAmount}>
                {formatCurrency(depositInfo.depositAmount)}
              </Text>
              {depositInfo.depositPaid ? (
                <View style={styles.depositPaidInfo}>
                  <Text style={styles.depositPaidText}>
                    Paid on: {formatDate(depositInfo.depositPaidAt)}
                  </Text>
                  <Text style={styles.depositNote}>
                    This is a one-time payment. The deposit will be refunded when you move out.
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.depositPayButton}
                  onPress={handlePayDeposit}
                  disabled={processingDeposit}
                >
                  {processingDeposit ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.depositPayButtonText}>Pay Deposit</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Payment Statistics */}
        {paymentStats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatCurrency(paymentStats.totalAmount)}</Text>
                <Text style={styles.statLabel}>Total Amount</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {formatCurrency(paymentStats.paidAmount)}
                </Text>
                <Text style={styles.statLabel}>Paid</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {formatCurrency(paymentStats.pendingAmount)}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.error }]}>
                  {formatCurrency(paymentStats.overdueAmount)}
                </Text>
                <Text style={styles.statLabel}>Overdue</Text>
              </View>
            </View>
          </View>
        )}

        {/* Outstanding Amount */}
        {totalOutstanding > 0 && (
          <View style={styles.outstandingSection}>
            <View style={styles.outstandingCard}>
              <Text style={styles.outstandingTitle}>Total Outstanding</Text>
              <Text style={styles.outstandingAmount}>{formatCurrency(totalOutstanding)}</Text>
              <Text style={styles.outstandingSubtitle}>
                {overduePayments.length > 0 
                  ? `${overduePayments.length} payment(s) overdue`
                  : `${pendingPayments.length} payment(s) pending`
                }
              </Text>
            </View>
          </View>
        )}

        {/* Payment History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {payments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>No Payments Yet</Text>
              <Text style={styles.emptySubtitle}>
                Your payment history will appear here once you make your first payment.
              </Text>
            </View>
          ) : (
            <View style={styles.paymentList}>
              {payments.map(renderPaymentCard)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.errorDismiss}>
            <Text style={styles.errorDismissText}>Dismiss</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginTop: dimensions.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    padding: dimensions.spacing.sm,
  },
  backButtonText: {
    fontSize: fonts.md,
    color: colors.primary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 60, // Same width as back button to center the title
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  currentMonthSection: {
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  currentMonthCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  currentMonthText: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  currentStatusBadge: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  currentStatusText: {
    fontSize: fonts.sm,
    color: colors.white,
    fontWeight: '500',
  },
  currentAmount: {
    fontSize: fonts.xxl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.lg,
  },
  currentPayButton: {
    backgroundColor: colors.primary,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  currentPayButtonText: {
    color: colors.white,
    fontSize: fonts.lg,
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: dimensions.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dimensions.spacing.md,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  statLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  outstandingSection: {
    marginBottom: dimensions.spacing.lg,
  },
  outstandingCard: {
    backgroundColor: colors.error,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    alignItems: 'center',
  },
  outstandingTitle: {
    fontSize: fonts.md,
    color: colors.white,
    marginBottom: dimensions.spacing.xs,
  },
  outstandingAmount: {
    fontSize: fonts.xxl,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: dimensions.spacing.xs,
  },
  outstandingSubtitle: {
    fontSize: fonts.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  historySection: {
    marginBottom: dimensions.spacing.xl,
  },
  paymentList: {
    gap: dimensions.spacing.md,
  },
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentType: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  paymentMonth: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  statusText: {
    fontSize: fonts.sm,
    color: colors.white,
    fontWeight: '500',
  },
  paymentDetails: {
    marginBottom: dimensions.spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.xs,
  },
  amountLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: fonts.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xl,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: dimensions.spacing.md,
  },
  emptyTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  emptySubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: colors.error,
    padding: dimensions.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: colors.white,
    fontSize: fonts.sm,
    flex: 1,
  },
  errorDismiss: {
    paddingLeft: dimensions.spacing.md,
  },
  errorDismissText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
  depositSection: {
    marginBottom: dimensions.spacing.lg,
  },
  depositCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  depositHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  depositTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  depositStatusBadge: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.sm,
  },
  depositStatusText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  depositAmount: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: dimensions.spacing.md,
  },
  depositPaidInfo: {
    backgroundColor: colors.successLight,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.sm,
  },
  depositPaidText: {
    fontSize: fonts.sm,
    color: colors.success,
    fontWeight: '600',
    marginBottom: dimensions.spacing.xs,
  },
  depositNote: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  depositPayButton: {
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.md,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  depositPayButtonText: {
    color: colors.white,
    fontSize: fonts.lg,
    fontWeight: '600',
  },
});

export default TenantPaymentScreen;
