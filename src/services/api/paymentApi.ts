// Payment API services - Razorpay Route client stubs
// These functions assume a backend server that talks to Razorpay securely.
// Replace BASE_URL and wire auth headers as per your backend.

// TODO: move to a dedicated config (do not use process.env in React Native)
const BASE_URL = 'http://localhost:4000';

export interface CreateLinkedAccountInput {
  ownerId: string; // app user uid
}

export interface CreateLinkedAccountResponse {
  linkedAccountId: string; // acc_XXXX
  status: 'under_review' | 'activated' | 'needs_clarification';
}

export async function createLinkedAccount(input: CreateLinkedAccountInput) {
  const res = await fetch(`${BASE_URL}/payments/route/linked-accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error('Failed to create linked account');
  return (await res.json()) as CreateLinkedAccountResponse;
}

export interface CreateOrderWithTransfersInput {
  tenantId: string;
  propertyId: string;
  amount: number; // rupees
  currency?: 'INR';
}

export interface CreateOrderWithTransfersResponse {
  orderId: string; // order_XXXX
  amount: number; // paise
  currency: string;
  keyId: string; // Razorpay key for client checkout
  notes?: Record<string, string>;
}

export async function createOrderWithTransfers(input: CreateOrderWithTransfersInput) {
  const res = await fetch(`${BASE_URL}/payments/route/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error('Failed to create order');
  return (await res.json()) as CreateOrderWithTransfersResponse;
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export async function verifyPaymentSignature(input: VerifyPaymentInput) {
  const res = await fetch(`${BASE_URL}/payments/route/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error('Signature verification failed');
  return (await res.json()) as { success: boolean };
}

export async function getLinkedAccountStatus(ownerId: string) {
  const res = await fetch(`${BASE_URL}/payments/route/linked-accounts/${ownerId}`);
  if (!res.ok) throw new Error('Failed to fetch linked account status');
  return (await res.json()) as {
    linkedAccountId?: string;
    status?: string;
    needsClarificationFields?: string[];
  };
}

export default {
  createLinkedAccount,
  createOrderWithTransfers,
  verifyPaymentSignature,
  getLinkedAccountStatus
};
