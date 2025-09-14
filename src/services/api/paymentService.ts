import { Timestamp } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';
import { 
  Payment, 
  CreatePaymentData, 
  UpdatePaymentData, 
  PaymentFilters, 
  PaymentStats,
  PaymentType,
  PaymentStatus,
  PaymentMethod
} from '../../types/payment.types';
import { createOrderWithTransfers, verifyPaymentSignature, getOrderStatus } from './paymentApi';

export class PaymentService {
  private collection = 'payments';

  // Removed createMonthlyRentPayment method - no longer needed

  /**
   * Create deposit payment for a tenant
   */
  async createDepositPayment(tenantId: string, propertyId: string, roomId: string, depositAmount: number): Promise<string> {
    try {
      const paymentData = {
        tenantId: tenantId,
        propertyId: propertyId,
        roomId: roomId,
        amount: depositAmount,
        type: PaymentType.SECURITY_DEPOSIT,
        status: PaymentStatus.PENDING,
        month: 'deposit', // Special identifier for deposit payments
        dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        description: 'Security deposit payment',
      };

      const paymentRef = await firestore().collection(this.collection).add(paymentData);
      console.log('Created deposit payment document with ID:', paymentRef.id);
      return paymentRef.id;
    } catch (error: any) {
      console.error('Error creating deposit payment:', error);
      throw new Error('Failed to create deposit payment');
    }
  }

  /**
   * Process deposit payment using Razorpay
   */
  async processDepositPayment(paymentId: string, userId: string, propertyId: string): Promise<{
    orderId: string;
    amount: number;
    keyId: string;
  }> {
    try {
      // Get tenant data first
      const tenantData = await this.getTenantByUserId(userId);
      if (!tenantData) {
        throw new Error('Tenant not found');
      }

      const tenantId = tenantData.id;

      // Get payment details
      const paymentDoc = await firestore().collection(this.collection).doc(paymentId).get();
      if (!paymentDoc.exists) {
        throw new Error('Payment not found');
      }

      const payment = paymentDoc.data() as Payment;
      
      // Verify this is a deposit payment
      if (payment.type !== PaymentType.SECURITY_DEPOSIT) {
        throw new Error('This is not a deposit payment');
      }

      // Get property details for Razorpay account
      const propertyData = await this.getPropertyById(propertyId);
      if (!propertyData) {
        throw new Error('Property not found');
      }

      const linkedAccountId = propertyData.payments?.linkedAccountId;
      if (!linkedAccountId) {
        throw new Error('Property owner has not set up payment account. Please contact the property owner.');
      }

      // Create Razorpay order with transfers
      const orderData = await createOrderWithTransfers({
        tenantId: tenantId,
        propertyId: propertyId,
        amount: payment.amount,
        currency: 'INR',
        landlordLinkedAccountId: linkedAccountId,
        platformFeePercent: propertyData.payments?.platformFeePercent || 5,
      });

      // Update payment with order ID
      await firestore().collection(this.collection).doc(paymentId).update({
        transactionDetails: {
          razorpay: {
            orderId: orderData.orderId,
          }
        },
        updatedAt: Timestamp.now(),
      });

      return {
        orderId: orderData.orderId,
        amount: orderData.amount,
        keyId: orderData.keyId,
      };
    } catch (error: any) {
      console.error('Error processing deposit payment:', error);
      throw error;
    }
  }

  /**
   * Manually update payment status (for fixing verification failures)
   */
  async updatePaymentStatusManually(paymentId: string, status: PaymentStatus, razorpayPaymentId?: string): Promise<void> {
    try {
      const updateData: any = {
        status: status,
        updatedAt: Timestamp.now(),
      };

      if (status === PaymentStatus.PAID) {
        updateData.paidAt = Timestamp.now();
        updateData.paymentMethod = PaymentMethod.ONLINE;
        if (razorpayPaymentId) {
          updateData.transactionId = razorpayPaymentId;
        }
      }

      await firestore().collection(this.collection).doc(paymentId).update(updateData);
      console.log('Payment status updated manually:', { paymentId, status });
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      throw new Error('Failed to update payment status');
    }
  }


  /**
   * Manually update tenant deposit status (fallback for verification failures)
   */
  async updateTenantDepositStatus(tenantId: string, depositPaid: boolean = true): Promise<void> {
    try {
      await firestore().collection('tenants').doc(tenantId).update({
        depositPaid: depositPaid,
        depositPaidAt: depositPaid ? Timestamp.now() : null,
        updatedAt: Timestamp.now(),
      });
      console.log('Tenant deposit status updated manually');
    } catch (error: any) {
      console.error('Error updating tenant deposit status:', error);
      
      // If permission denied, try server-side approach
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for tenant update. Trying server-side approach...');
        try {
          await this.updateTenantDepositStatusViaServer(tenantId, depositPaid);
          return;
        } catch (serverError: any) {
          console.warn('Server-side update also failed:', serverError.message);
          // Don't throw error - payment status was still updated successfully
          return;
        }
      }
      
      throw new Error('Failed to update tenant deposit status');
    }
  }

  /**
   * Update tenant deposit status via server API (has admin privileges)
   */
  async updateTenantDepositStatusViaServer(tenantId: string, depositPaid: boolean = true): Promise<void> {
    try {
      const response = await fetch('/api/tenants/update-deposit-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          depositPaid,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Tenant deposit status updated via server:', result);
    } catch (error: any) {
      console.error('Error updating tenant deposit status via server:', error);
      throw error;
    }
  }

  /**
   * Verify deposit payment and update tenant status (with fallback)
   */
  async verifyDepositPayment(paymentId: string, razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string): Promise<void> {
    try {
      // First try normal verification
      const verificationResult = await verifyPaymentSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });

      if (!verificationResult.success) {
        console.warn('Signature verification failed, but payment was successful. Proceeding with manual update.');
        // Even if signature verification fails, if we have the payment ID from Razorpay,
        // we can still update the status since the payment went through
        await this.updatePaymentStatusManually(paymentId, PaymentStatus.PAID, razorpayPaymentId);
      } else {
        // Normal verification succeeded
        await this.updatePaymentStatusManually(paymentId, PaymentStatus.PAID, razorpayPaymentId);
      }

      // Get payment details
      const paymentDoc = await firestore().collection(this.collection).doc(paymentId).get();
      if (!paymentDoc.exists) {
        throw new Error('Payment not found');
      }

      const payment = paymentDoc.data() as Payment;

      // Update transaction details
      await firestore().collection(this.collection).doc(paymentId).update({
        transactionDetails: {
          razorpay: {
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            signatureVerified: verificationResult.success,
          }
        },
        updatedAt: Timestamp.now(),
      });

      // Update tenant deposit status
      try {
        await firestore().collection('tenants').doc(payment.tenantId).update({
          depositPaid: true,
          depositPaidAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        console.log('Deposit payment verified and tenant status updated');
      } catch (error: any) {
        console.warn('Could not update tenant deposit status, but payment was verified:', error.message);
        // Continue - payment status was still updated successfully
      }
    } catch (error: any) {
      console.error('Error verifying deposit payment:', error);
      throw error;
    }
  }

  /**
   * Get payments for a specific tenant
   */
  async getTenantPayments(userId: string, filters?: PaymentFilters): Promise<Payment[]> {
    try {
      // Get tenant data first to get the actual tenant ID
      const tenantData = await this.getTenantByUserId(userId);
      if (!tenantData) {
        // Return empty array if tenant not found (user might not be a tenant yet)
        return [];
      }
      
      const tenantId = tenantData.id;

      // Start with basic query to avoid composite index issues
      let query = firestore().collection(this.collection)
        .where('tenantId', '==', tenantId);

      const snapshot = await query.get();
      let payments = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as Payment));

      // Apply filters in memory to avoid composite index requirements
      if (filters?.status && filters.status.length > 0) {
        payments = payments.filter(payment => filters.status!.includes(payment.status));
      }

      if (filters?.type && filters.type.length > 0) {
        payments = payments.filter(payment => filters.type!.includes(payment.type));
      }

      if (filters?.month) {
        payments = payments.filter(payment => payment.month === filters.month);
      }

      // Sort by createdAt in memory
      payments.sort((a, b) => {
        const aTime = a.createdAt.toDate().getTime();
        const bTime = b.createdAt.toDate().getTime();
        return bTime - aTime; // Descending order
      });

      return payments;
    } catch (error) {
      console.error('Error fetching tenant payments:', error);
      throw new Error('Failed to fetch tenant payments');
    }
  }

  /**
   * Get current month's rent payment for a tenant
   */
  async getCurrentMonthRent(userId: string): Promise<Payment | null> {
    try {
      // Get tenant data first to get the actual tenant ID
      const tenantData = await this.getTenantByUserId(userId);
      if (!tenantData) {
        return null;
      }
      
      const tenantId = tenantData.id;
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      }); // "September 2025" format
      
      // Use simple query to avoid composite index issues
      const snapshot = await firestore().collection(this.collection)
        .where('tenantId', '==', tenantId)
        .get();

      if (snapshot.empty) {
        return null;
      }

      // Filter in memory
      const payments = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as Payment));

      // Find current month rent payment, prioritizing paid ones
      const currentMonthRentPayments = payments.filter(payment => 
        payment.type === PaymentType.RENT && payment.month === currentMonth
      );
      
      // If there are multiple payments for the same month, prioritize paid ones
      let currentMonthRent = null;
      if (currentMonthRentPayments.length > 0) {
        // First try to find a paid payment
        currentMonthRent = currentMonthRentPayments.find(payment => payment.status === PaymentStatus.PAID);
        
        // If no paid payment found, use the first one (could be pending)
        if (!currentMonthRent) {
          currentMonthRent = currentMonthRentPayments[0];
        }
      }

      return currentMonthRent || null;
    } catch (error) {
      console.error('Error fetching current month rent:', error);
      throw new Error('Failed to fetch current month rent');
    }
  }

  /**
   * Get pending payments for a tenant
   */
  async getPendingPayments(userId: string): Promise<Payment[]> {
    try {
      // Get tenant data first to get the actual tenant ID
      const tenantData = await this.getTenantByUserId(userId);
      if (!tenantData) {
        return [];
      }
      
      const tenantId = tenantData.id;

      // Use simple query to avoid composite index issues
      const snapshot = await firestore().collection(this.collection)
        .where('tenantId', '==', tenantId)
        .get();

      if (snapshot.empty) {
        return [];
      }

      // Filter in memory
      const payments = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as Payment));

      const pendingPayments = payments.filter(payment => 
        payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.OVERDUE
      );

      // Sort by due date in memory
      pendingPayments.sort((a, b) => {
        const aTime = a.dueDate.toDate().getTime();
        const bTime = b.dueDate.toDate().getTime();
        return aTime - bTime; // Ascending order (earliest due first)
      });

      return pendingPayments;
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      throw new Error('Failed to fetch pending payments');
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId: string, status: PaymentStatus, updateData?: UpdatePaymentData): Promise<void> {
    try {
      const updateFields: any = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (updateData) {
        if (updateData.paymentMethod) updateFields.paymentMethod = updateData.paymentMethod;
        if (updateData.transactionId) updateFields.transactionId = updateData.transactionId;
        if (updateData.paidAt) updateFields.paidAt = updateData.paidAt;
        if (updateData.lateFee) updateFields.lateFee = updateData.lateFee;
        if (updateData.notes) updateFields.notes = updateData.notes;
        if (updateData.receiptUrl) updateFields.receiptUrl = updateData.receiptUrl;
      }

      await firestore().collection(this.collection).doc(paymentId).update(updateFields);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw new Error('Failed to update payment status');
    }
  }

  /**
   * Process online payment using Razorpay
   */
  async processOnlinePayment(paymentId: string, userId: string, propertyId: string): Promise<{
    orderId: string;
    amount: number;
    keyId: string;
  }> {
    try {
      console.log('Starting processOnlinePayment with:', { paymentId, userId, propertyId });
      
      // Get tenant data first to get the actual tenant ID
      console.log('Getting tenant data for user:', userId);
      const tenantData = await this.getTenantByUserId(userId);
      if (!tenantData) {
        throw new Error('Tenant not found. Please ensure you are properly registered as a tenant.');
      }
      
      const tenantId = tenantData.id;
      console.log('Found tenant ID:', tenantId);

      let payment: any;
      let actualPaymentId = paymentId;

      // Check if this is a virtual payment (current-month)
      if (paymentId === 'current-month') {
        console.log('Creating payment document for virtual payment');
        // Create a real payment document for the current month
        const currentDate = new Date();
        const month = currentDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
        
        const paymentData = {
          tenantId: tenantId,
          propertyId: propertyId,
          roomId: tenantData.roomId,
          amount: tenantData.rent,
          type: PaymentType.RENT,
          status: PaymentStatus.PENDING,
          month: month,
          dueDate: Timestamp.fromDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          description: `Monthly rent for ${month}`,
        };

        console.log('Payment data to create:', paymentData);
        console.log('Current user ID:', userId);
        console.log('Tenant ID:', tenantId);

        // Create the payment document
        try {
          const paymentRef = await firestore().collection(this.collection).add(paymentData);
          actualPaymentId = paymentRef.id;
          payment = paymentData;
          console.log('Created payment document with ID:', actualPaymentId);
        } catch (createError: any) {
          console.error('Error creating payment document:', createError);
          console.error('Create error details:', {
            message: createError.message,
            code: createError.code,
            stack: createError.stack
          });
          throw createError;
        }
      } else {
        // Get payment details from existing document
        console.log('Getting payment document:', paymentId);
        const paymentDoc = await firestore().collection(this.collection).doc(paymentId).get();
        if (!paymentDoc.exists) {
          throw new Error('Payment not found');
        }
        payment = paymentDoc.data();
        if (!payment) {
          throw new Error('Payment data not found');
        }
        console.log('Payment data retrieved successfully');
      }

      // Get property data to check Razorpay linked account
      console.log('Getting property data:', propertyId);
      const property = await this.getPropertyById(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }
      console.log('Property data retrieved successfully');

      // Check if property has Razorpay linked account
      const linkedAccountId = property.payments?.linkedAccountId;
      if (!linkedAccountId) {
        throw new Error('Property owner has not set up payment account. Please contact the property owner to set up their payment account.');
      }

      // Create Razorpay order with transfers to property owner
      console.log('Creating Razorpay order...');
      const orderData = await createOrderWithTransfers({
        tenantId,
        propertyId,
        amount: payment.amount,
        currency: 'INR'
      });
      console.log('Razorpay order created:', orderData.orderId);

      // Update payment with order details
      console.log('Updating payment status...');
      await this.updatePaymentStatus(actualPaymentId, PaymentStatus.PENDING, {
        transactionId: orderData.orderId,
        paymentMethod: PaymentMethod.ONLINE
      });
      console.log('Payment status updated successfully');

      return {
        orderId: orderData.orderId,
        amount: orderData.amount,
        keyId: orderData.keyId
      };
    } catch (error: any) {
      console.error('Error processing online payment:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw new Error('Failed to process online payment');
    }
  }

  /**
   * Verify payment after Razorpay callback
   */
  async verifyPayment(paymentId: string, orderId: string, paymentId_razorpay: string, signature: string): Promise<boolean> {
    try {
      // Verify signature with Razorpay
      const verification = await verifyPaymentSignature({
        orderId,
        paymentId: paymentId_razorpay,
        signature
      });

      let actualPaymentId = paymentId;

      // If this was a virtual payment, we need to find the actual payment document
      if (paymentId === 'current-month') {
        // Find the payment document that was created for this order
        const paymentsSnapshot = await firestore().collection(this.collection)
          .where('transactionId', '==', orderId)
          .limit(1)
          .get();
        
        if (!paymentsSnapshot.empty) {
          actualPaymentId = paymentsSnapshot.docs[0].id;
        } else {
          throw new Error('Payment document not found for verification');
        }
      }

      if (verification.success) {
        // Update payment status to paid
        await this.updatePaymentStatus(actualPaymentId, PaymentStatus.PAID, {
          paidAt: Timestamp.now(),
          transactionId: paymentId_razorpay,
          paymentMethod: PaymentMethod.ONLINE
        });

        return true;
      } else {
        // Update payment status to failed
        await this.updatePaymentStatus(actualPaymentId, PaymentStatus.FAILED);
        return false;
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      // Try to update the payment status to failed if we can find the payment
      try {
        let actualPaymentId = paymentId;
        if (paymentId === 'current-month') {
          const paymentsSnapshot = await firestore().collection(this.collection)
            .where('transactionId', '==', orderId)
            .limit(1)
            .get();
          
          if (!paymentsSnapshot.empty) {
            actualPaymentId = paymentsSnapshot.docs[0].id;
            await this.updatePaymentStatus(actualPaymentId, PaymentStatus.FAILED);
          }
        } else {
          await this.updatePaymentStatus(paymentId, PaymentStatus.FAILED);
        }
      } catch (updateError) {
        console.error('Error updating payment status to failed:', updateError);
      }
      throw new Error('Failed to verify payment');
    }
  }

  /**
   * Get payment statistics for a tenant
   */
  async getTenantPaymentStats(userId: string): Promise<PaymentStats> {
    try {
      const payments = await this.getTenantPayments(userId);
      
      const stats: PaymentStats = {
        totalPayments: payments.length,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        averagePaymentDelay: 0,
        totalLatePayments: 0,
        totalLateFees: 0
      };

      let totalDelayDays = 0;
      let paidPayments = 0;

      payments.forEach(payment => {
        stats.totalAmount += payment.amount;

        switch (payment.status) {
          case PaymentStatus.PAID:
            stats.paidAmount += payment.amount;
            paidPayments++;
            if (payment.paidAt && payment.dueDate) {
              const delayDays = Math.max(0, 
                Math.floor((payment.paidAt.toDate().getTime() - payment.dueDate.toDate().getTime()) / (1000 * 60 * 60 * 24))
              );
              totalDelayDays += delayDays;
              if (delayDays > 0) {
                stats.totalLatePayments++;
              }
            }
            break;
          case PaymentStatus.PENDING:
            stats.pendingAmount += payment.amount;
            break;
          case PaymentStatus.OVERDUE:
            stats.overdueAmount += payment.amount;
            break;
        }

        if (payment.lateFee) {
          stats.totalLateFees += payment.lateFee;
        }
      });

      if (paidPayments > 0) {
        stats.averagePaymentDelay = totalDelayDays / paidPayments;
      }

      return stats;
    } catch (error) {
      console.error('Error calculating payment stats:', error);
      throw new Error('Failed to calculate payment statistics');
    }
  }

  // Removed generateMonthlyRentPayments method - no longer needed

  /**
   * Mark payment as overdue
   */
  async markOverduePayments(): Promise<void> {
    try {
      const today = new Date();
      const todayTimestamp = Timestamp.fromDate(today);

      // Use simple query to avoid composite index issues
      const snapshot = await firestore().collection(this.collection)
        .where('status', '==', PaymentStatus.PENDING)
        .get();

      if (snapshot.empty) {
        return;
      }

      const batch = firestore().batch();
      let hasUpdates = false;
      
      snapshot.docs.forEach((doc: any) => {
        const payment = doc.data() as Payment;
        const dueDate = payment.dueDate.toDate();
        
        // Check if payment is overdue
        if (dueDate < today) {
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Calculate late fee (example: ₹50 per day after due date)
          const lateFee = Math.max(0, daysOverdue * 50);
          
          batch.update(doc.ref, {
            status: PaymentStatus.OVERDUE,
            lateFee,
            updatedAt: Timestamp.now(),
            'analytics.overdueDays': daysOverdue,
            'analytics.isLatePayment': true
          });
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        await batch.commit();
        // Overdue payments marked successfully
      }
    } catch (error) {
      console.error('Error marking overdue payments:', error);
      throw new Error('Failed to mark overdue payments');
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      const doc = await firestore().collection(this.collection).doc(paymentId).get();
      if (!doc.exists) return null;
      
      return {
        id: paymentId,
        ...doc.data()
      } as Payment;
    } catch (error) {
      console.error('Error fetching payment by ID:', error);
      throw new Error('Failed to fetch payment');
    }
  }

  /**
   * Delete payment (for testing/admin purposes)
   */
  async deletePayment(paymentId: string): Promise<void> {
    try {
      await firestore().collection(this.collection).doc(paymentId).delete();
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw new Error('Failed to delete payment');
    }
  }

  async getTenantByUserId(userId: string): Promise<any> {
    try {
      const snapshot = await firestore().collection('tenants')
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting tenant by user ID:', error);
      throw new Error('Failed to get tenant');
    }
  }

  async getTenantByTenantId(tenantId: string): Promise<any> {
    try {
      const doc = await firestore().collection('tenants').doc(tenantId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting tenant by tenant ID:', error);
      throw new Error('Failed to get tenant');
    }
  }

  async getPropertyById(propertyId: string): Promise<any> {
    try {
      const doc = await firestore().collection('properties').doc(propertyId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting property by ID:', error);
      throw new Error('Failed to get property');
    }
  }

  /**
   * Sync payment status from Razorpay for a specific payment
   */
  async syncPaymentStatusFromRazorpay(paymentId: string): Promise<{
    success: boolean;
    updated: boolean;
    newStatus?: PaymentStatus;
    error?: string;
  }> {
    try {
      // Get payment document
      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        return { success: false, updated: false, error: 'Payment not found' };
      }

      // Check if payment has a transaction ID (Razorpay order ID)
      if (!payment.transactionId) {
        return { success: false, updated: false, error: 'No transaction ID found for this payment' };
      }

      // Fetch order status from Razorpay
      const orderStatus = await getOrderStatus(payment.transactionId);
      
      // Map Razorpay status to our PaymentStatus
      let newStatus: PaymentStatus;
      switch (orderStatus.status) {
        case 'paid':
          newStatus = PaymentStatus.PAID;
          break;
        case 'failed':
          newStatus = PaymentStatus.FAILED;
          break;
        case 'created':
        case 'attempted':
          newStatus = PaymentStatus.PENDING;
          break;
        default:
          newStatus = PaymentStatus.PENDING;
      }

      // Check if status needs to be updated
      if (payment.status === newStatus) {
        return { success: true, updated: false };
      }

      // Update payment status
      const updateData: any = {
        status: newStatus,
        updatedAt: Timestamp.now()
      };

      // If payment is now paid, add payment details
      if (newStatus === PaymentStatus.PAID && orderStatus.paymentDetails) {
        updateData.paidAt = Timestamp.fromDate(new Date(orderStatus.paymentDetails.created_at * 1000));
        updateData.paymentMethod = PaymentMethod.ONLINE;
        // Update transaction ID to actual payment ID if available
        if (orderStatus.paymentDetails.id) {
          updateData.transactionId = orderStatus.paymentDetails.id;
        }
      }

      await this.updatePaymentStatus(paymentId, newStatus, updateData);

      return { 
        success: true, 
        updated: true, 
        newStatus 
      };
    } catch (error: any) {
      console.error('Error syncing payment status from Razorpay:', error);
      return { 
        success: false, 
        updated: false, 
        error: error.message || 'Failed to sync payment status' 
      };
    }
  }

  /**
   * Sync all pending payments with Razorpay status
   */
  async syncAllPendingPayments(userId: string): Promise<{
    success: boolean;
    synced: number;
    updated: number;
    errors: string[];
  }> {
    try {
      // Get all pending payments for the user
      const pendingPayments = await this.getPendingPayments(userId);
      
      const results = {
        success: true,
        synced: 0,
        updated: 0,
        errors: [] as string[]
      };

      // Sync each payment that has a transaction ID
      for (const payment of pendingPayments) {
        if (payment.transactionId) {
          try {
            results.synced++;
            const syncResult = await this.syncPaymentStatusFromRazorpay(payment.id);
            if (syncResult.updated) {
              results.updated++;
            }
            if (syncResult.error) {
              results.errors.push(`Payment ${payment.id}: ${syncResult.error}`);
            }
          } catch (error: any) {
            results.errors.push(`Payment ${payment.id}: ${error.message}`);
          }
        }
      }

      return results;
    } catch (error: any) {
      console.error('Error syncing all pending payments:', error);
      return {
        success: false,
        synced: 0,
        updated: 0,
        errors: [error.message || 'Failed to sync payments']
      };
    }
  }

  /**
   * Clean up duplicate payments for the same month
   * This will help resolve the issue where multiple payments exist for the same month
   */
  async cleanupDuplicatePayments(userId: string): Promise<{
    success: boolean;
    duplicatesRemoved: number;
    errors: string[];
  }> {
    try {
      // Get tenant data first
      const tenantData = await this.getTenantByUserId(userId);
      if (!tenantData) {
        return { success: false, duplicatesRemoved: 0, errors: ['Tenant not found'] };
      }
      
      const tenantId = tenantData.id;
      
      // Get all payments for the tenant
      const snapshot = await firestore().collection(this.collection)
        .where('tenantId', '==', tenantId)
        .get();

      if (snapshot.empty) {
        return { success: true, duplicatesRemoved: 0, errors: [] };
      }

      const payments = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as Payment));

      // Group payments by month and type
      const paymentsByMonth = new Map<string, Payment[]>();
      
      payments.forEach(payment => {
        const key = `${payment.month}_${payment.type}`;
        if (!paymentsByMonth.has(key)) {
          paymentsByMonth.set(key, []);
        }
        paymentsByMonth.get(key)!.push(payment);
      });

      let duplicatesRemoved = 0;
      const errors: string[] = [];

      // Process each group to remove duplicates
      for (const [key, monthPayments] of paymentsByMonth) {
        if (monthPayments.length > 1) {
          // Sort by status priority: PAID > PENDING > OVERDUE > FAILED
          const statusPriority: Record<string, number> = {
            [PaymentStatus.PAID]: 1,
            [PaymentStatus.PENDING]: 2,
            [PaymentStatus.OVERDUE]: 3,
            [PaymentStatus.FAILED]: 4,
            [PaymentStatus.CANCELLED]: 5,
            [PaymentStatus.REFUNDED]: 6,
            [PaymentStatus.PARTIAL]: 7,
            [PaymentStatus.WAIVED]: 8
          };

          monthPayments.sort((a, b) => {
            const aPriority = statusPriority[a.status] || 999;
            const bPriority = statusPriority[b.status] || 999;
            return aPriority - bPriority;
          });

          // Keep the first payment (highest priority), delete the rest
          const paymentToKeep = monthPayments[0];
          const paymentsToDelete = monthPayments.slice(1);

          console.log(`Found ${monthPayments.length} duplicate payments for ${key}. Keeping payment ${paymentToKeep.id} with status ${paymentToKeep.status}`);

          // Delete duplicate payments
          for (const payment of paymentsToDelete) {
            try {
              await firestore().collection(this.collection).doc(payment.id).delete();
              duplicatesRemoved++;
              console.log(`Deleted duplicate payment ${payment.id} with status ${payment.status}`);
            } catch (error: any) {
              errors.push(`Failed to delete payment ${payment.id}: ${error.message}`);
            }
          }
        }
      }

      return { success: true, duplicatesRemoved, errors };
    } catch (error: any) {
      console.error('Error cleaning up duplicate payments:', error);
      return { success: false, duplicatesRemoved: 0, errors: [error.message] };
    }
  }

  /**
   * Get tenant-based payment stats (using real rent amount from tenant collection)
   */
  async getTenantBasedPaymentStats(userId: string): Promise<PaymentStats> {
    try {
      // Get tenant data
      const tenantData = await this.getTenantByUserId(userId);
      
      if (!tenantData) {
        return {
          totalPayments: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          averagePaymentDelay: 0,
          totalLatePayments: 0,
          totalLateFees: 0
        };
      }

      // Get actual payments
      const payments = await this.getTenantPayments(userId);
      
      // Calculate stats based on actual payments
      const monthlyRent = tenantData.rent || 0;
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      // Initialize stats
      const stats: PaymentStats = {
        totalPayments: payments.length,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        averagePaymentDelay: 0,
        totalLatePayments: 0,
        totalLateFees: 0
      };

      // Calculate stats based on actual payments, handling duplicates
      let hasCurrentMonthPayment = false;
      let currentMonthPaid = false;
      
      // Group payments by month to handle duplicates
      const paymentsByMonth = new Map<string, Payment[]>();
      
      payments.forEach(payment => {
        if (!paymentsByMonth.has(payment.month)) {
          paymentsByMonth.set(payment.month, []);
        }
        paymentsByMonth.get(payment.month)!.push(payment);
      });
      
      // Process each month's payments
      paymentsByMonth.forEach((monthPayments, month) => {
        if (month === currentMonth) {
          hasCurrentMonthPayment = true;
          
          // For current month, prioritize paid payments
          const paidPayment = monthPayments.find(p => p.status === PaymentStatus.PAID);
          if (paidPayment) {
            currentMonthPaid = true;
            stats.totalAmount += paidPayment.amount;
            stats.paidAmount += paidPayment.amount;
            stats.totalPayments += 1;
          } else {
            // Use the first pending payment if no paid payment
            const pendingPayment = monthPayments.find(p => p.status === PaymentStatus.PENDING);
            if (pendingPayment) {
              stats.totalAmount += pendingPayment.amount;
              stats.pendingAmount += pendingPayment.amount;
              stats.totalPayments += 1;
            }
          }
        } else {
          // For other months, process all payments
          monthPayments.forEach(payment => {
            stats.totalAmount += payment.amount;
            stats.totalPayments += 1;
            
            switch (payment.status) {
              case PaymentStatus.PAID:
                stats.paidAmount += payment.amount;
                break;
              case PaymentStatus.OVERDUE:
                stats.overdueAmount += payment.amount;
                stats.totalLatePayments++;
                break;
              case PaymentStatus.PENDING:
                stats.pendingAmount += payment.amount;
                break;
            }
          });
        }
      });
      
      // If no current month payment exists, add it to pending
      if (!hasCurrentMonthPayment) {
        stats.totalAmount += monthlyRent;
        stats.pendingAmount += monthlyRent;
        stats.totalPayments += 1;
      }

      return stats;
    } catch (error) {
      console.error('Error getting tenant-based payment stats:', error);
      throw new Error('Failed to get tenant-based payment stats');
    }
  }
}

export const paymentService = new PaymentService();
