import { useCallback, useMemo, useState } from 'react';
import paymentApi, {
  CreateOrderWithTransfersInput,
  VerifyPaymentInput
} from '../services/api/paymentApi';

export default function usePayments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (params: CreateOrderWithTransfersInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentApi.createOrderWithTransfers(params);
      return res;
    } catch (e: any) {
      setError(e?.message || 'Failed to create order');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPayment = useCallback(async (params: VerifyPaymentInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentApi.verifyPaymentSignature(params);
      return res;
    } catch (e: any) {
      setError(e?.message || 'Verification failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(
    () => ({ createOrder, verifyPayment, loading, error }),
    [createOrder, verifyPayment, loading, error]
  );
}
