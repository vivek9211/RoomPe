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
import { createOrderWithTransfers, verifyPaymentSignature } from './paymentApi';

export class PaymentService {
  private collection = 'payments';

  // Removed createMonthlyRentPayment method - no longer needed

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
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
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

      const currentMonthRent = payments.find(payment => 
        payment.type === PaymentType.RENT && payment.month === currentMonth
      );

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
      
      // Calculate stats based on tenant rent amount
      const monthlyRent = tenantData.rent || 0;
      const currentDate = new Date();
      
      // Initialize stats with current month only
      const stats: PaymentStats = {
        totalPayments: 1, // Only current month
        totalAmount: monthlyRent, // Only current month amount
        paidAmount: 0,
        pendingAmount: monthlyRent, // Current month rent
        overdueAmount: 0,
        averagePaymentDelay: 0,
        totalLatePayments: 0,
        totalLateFees: 0
      };

      // Update stats based on actual payments
      let hasCurrentMonthPayment = false;
      
      payments.forEach(payment => {
        // Check if this is a current month payment
        const currentMonth = currentDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
        
        if (payment.month === currentMonth) {
          hasCurrentMonthPayment = true;
        }
        
        switch (payment.status) {
          case PaymentStatus.PAID:
            stats.paidAmount += payment.amount;
            if (payment.month === currentMonth) {
              stats.pendingAmount = 0; // Current month is paid
            }
            break;
          case PaymentStatus.OVERDUE:
            stats.overdueAmount += payment.amount;
            stats.totalLatePayments++;
            break;
          case PaymentStatus.PENDING:
            if (payment.month === currentMonth) {
              stats.pendingAmount = payment.amount; // Use actual payment amount
            }
            break;
        }
      });
      
      // If no current month payment exists, keep the default monthly rent
      if (!hasCurrentMonthPayment) {
        stats.pendingAmount = monthlyRent;
      }

      return stats;
    } catch (error) {
      console.error('Error getting tenant-based payment stats:', error);
      throw new Error('Failed to get tenant-based payment stats');
    }
  }
}

export const paymentService = new PaymentService();
