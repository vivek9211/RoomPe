import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/api/paymentService';
import { 
  Payment, 
  PaymentStats, 
  PaymentFilters, 
  PaymentStatus,
  PaymentType,
  CreatePaymentData 
} from '../types/payment.types';
import { useAuth } from '../contexts/AuthContext';
// Removed test payment generation - using real tenant data

export const usePayments = () => {
  const { userProfile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentMonthRent, setCurrentMonthRent] = useState<Payment | null>(null);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get tenant rent information for display
  const getTenantRentInfo = useCallback(async () => {
    if (!userProfile?.uid) return null;

    try {
      // Get tenant data to show rent information
      const tenantData = await paymentService.getTenantByUserId(userProfile.uid);
      return tenantData;
    } catch (error) {
      console.error('Error getting tenant rent info:', error);
      return null;
    }
  }, [userProfile?.uid]);

  // Load all payments for the current user
  const loadPayments = useCallback(async (filters?: PaymentFilters) => {
    if (!userProfile?.uid) return;

    try {
    setLoading(true);
    setError(null);
      
      const userPayments = await paymentService.getTenantPayments(userProfile.uid, filters);
      setPayments(userPayments);
    } catch (err: any) {
      console.error('Error loading payments:', err);
      // Don't set error for payments loading failure, just set empty array
      // This prevents the UI from showing errors when there are no payments yet
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.uid]);

  // Load current month's rent from tenant data
  const loadCurrentMonthRent = useCallback(async () => {
    if (!userProfile?.uid) return;

    try {
      setError(null);
      
      // Get tenant data to show current month rent
      const tenantData = await getTenantRentInfo();
      
      if (tenantData && tenantData.rent) {
        // Create a virtual payment object for display
        const currentDate = new Date();
        const month = currentDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
        
        const virtualPayment: Payment = {
          id: 'current-month',
          tenantId: tenantData.id, // Use actual tenant ID, not user ID
          propertyId: tenantData.propertyId,
          roomId: tenantData.roomId,
          amount: tenantData.rent,
          type: PaymentType.RENT,
          status: PaymentStatus.PENDING,
          month: month,
          dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1) as any,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
          description: `Monthly rent for ${month}`,
        };
        
        setCurrentMonthRent(virtualPayment);
      } else {
        setCurrentMonthRent(null);
      }
    } catch (err: any) {
      console.error('Error loading current month rent:', err);
      setCurrentMonthRent(null);
    }
  }, [userProfile?.uid, getTenantRentInfo]);

  // Load pending payments
  const loadPendingPayments = useCallback(async () => {
    if (!userProfile?.uid) return;

    try {
      setError(null);
      
      const pending = await paymentService.getPendingPayments(userProfile.uid);
      setPendingPayments(pending);
    } catch (err: any) {
      console.error('Error loading pending payments:', err);
      // Don't set error for pending payments loading failure
      setPendingPayments([]);
    }
  }, [userProfile?.uid]);

  // Load payment statistics based on tenant rent
  const loadPaymentStats = useCallback(async () => {
    if (!userProfile?.uid) return;

    try {
      setError(null);
      
      const stats = await paymentService.getTenantBasedPaymentStats(userProfile.uid);
      setPaymentStats(stats);
    } catch (err: any) {
      console.error('Error loading payment stats:', err);
      // Don't set error for stats loading failure, just log it
      // This prevents the UI from showing errors when there are no payments yet
      setPaymentStats({
        totalPayments: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        averagePaymentDelay: 0,
        totalLatePayments: 0,
        totalLateFees: 0
      });
    }
  }, [userProfile?.uid]);

  // Process online payment
  const processOnlinePayment = useCallback(async (paymentId: string, propertyId: string) => {
    if (!userProfile?.uid) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);
      
      const result = await paymentService.processOnlinePayment(paymentId, userProfile.uid, propertyId);
      
      // Reload payments after processing
      await loadPayments();
      await loadPendingPayments();
      await loadPaymentStats();
      
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
      console.error('Error processing payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userProfile?.uid, loadPayments, loadPendingPayments, loadPaymentStats]);

  // Verify payment
  const verifyPayment = useCallback(async (paymentId: string, orderId: string, razorpayPaymentId: string, signature: string) => {
    try {
    setLoading(true);
    setError(null);
      
      const success = await paymentService.verifyPayment(paymentId, orderId, razorpayPaymentId, signature);
      
      if (success) {
        // Reload all payment data
        await Promise.all([
          loadPayments(),
          loadCurrentMonthRent(),
          loadPendingPayments(),
          loadPaymentStats()
        ]);
      }
      
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to verify payment');
      console.error('Error verifying payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPayments, loadCurrentMonthRent, loadPendingPayments, loadPaymentStats]);

  // Removed createMonthlyRentPayment function - no longer needed

  // Removed generateMonthlyRentPayments function - no longer needed

  // Load all payment data on mount
  useEffect(() => {
    if (userProfile?.uid) {
      Promise.all([
        loadPayments(),
        loadCurrentMonthRent(),
        loadPendingPayments(),
        loadPaymentStats()
      ]);
    }
  }, [userProfile?.uid, loadPayments, loadCurrentMonthRent, loadPendingPayments, loadPaymentStats]);

  // Get total outstanding amount (only current month + overdue)
  const getTotalOutstanding = useCallback(() => {
    // If we have payment stats, use those for more accurate calculation
    if (paymentStats) {
      return paymentStats.pendingAmount + paymentStats.overdueAmount;
    }
    
    // Fallback to pending payments calculation
    return pendingPayments.reduce((total, payment) => {
      const amount = payment.amount + (payment.lateFee || 0);
      return total + amount;
    }, 0);
  }, [pendingPayments, paymentStats]);

  // Get overdue payments
  const getOverduePayments = useCallback(() => {
    return pendingPayments.filter(payment => payment.status === PaymentStatus.OVERDUE);
  }, [pendingPayments]);

  // Get current month payment status
  const getCurrentMonthStatus = useCallback(() => {
    if (!currentMonthRent) return 'no_payment';
    
    switch (currentMonthRent.status) {
      case PaymentStatus.PAID:
        return 'paid';
      case PaymentStatus.PENDING:
        return 'pending';
      case PaymentStatus.OVERDUE:
        return 'overdue';
      default:
        return 'unknown';
    }
  }, [currentMonthRent]);

  return {
    // Data
    payments,
    currentMonthRent,
    pendingPayments,
    paymentStats,
    loading,
    error,
    
    // Actions
    loadPayments,
    loadCurrentMonthRent,
    loadPendingPayments,
    loadPaymentStats,
    processOnlinePayment,
    verifyPayment,
    
    // Computed values
    totalOutstanding: getTotalOutstanding(),
    overduePayments: getOverduePayments(),
    currentMonthStatus: getCurrentMonthStatus(),
    
    // Utilities
    clearError: () => setError(null),
  };
};

export { usePayments };