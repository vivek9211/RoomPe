import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';
import usePayments from '../../hooks/usePayments';

const PaymentDetailScreen: React.FC = () => {
  const { createOrder, verifyPayment, loading, error } = usePayments();
  const [orderId, setOrderId] = useState<string | null>(null);

  const handlePayNow = useCallback(async () => {
    // TODO: Replace hard-coded sample with actual route params/context
    const input = {
      tenantId: 'TENANT_ID',
      propertyId: 'PROPERTY_ID',
      amount: 1000, // INR
    };
    const order = await createOrder(input);
    setOrderId(order.orderId);
    // Here you would open Razorpay Checkout (native/web SDK) with order details.
    // After successful payment, you receive paymentId and signature to verify:
    // const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = checkoutResult;
    // await verifyPayment({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });
  }, [createOrder]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Payment Details</Text>
        <Text style={styles.subtitle}>View payment information</Text>
        
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.payButton} onPress={handlePayNow} disabled={loading}>
          <Text style={styles.payButtonText}>{loading ? 'Processing...' : 'Pay Now'}</Text>
        </TouchableOpacity>

        {orderId ? <Text style={styles.info}>Order created: {orderId}</Text> : null}
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
  payButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  payButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
  error: { color: colors.danger, marginBottom: dimensions.spacing.md },
  info: { color: colors.textSecondary, marginTop: dimensions.spacing.md },
});

export default PaymentDetailScreen;
