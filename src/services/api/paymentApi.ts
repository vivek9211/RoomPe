// Payment API services - Razorpay Route client stubs
// These functions assume a backend server that talks to Razorpay securely.
// Replace BASE_URL and wire auth headers as per your backend.

// TODO: move to a dedicated config (do not use process.env in React Native)
// Replace with your computer's IP address when testing on device/emulator
const BASE_URL = 'http://192.168.1.88:4000'; // Your computer's IP address

export interface CreateLinkedAccountInput {
  name: string;
  email: string;
  contact: string;
  business_type?: 'individual' | 'proprietorship' | 'partnership' | 'private_limited' | 'public_limited' | 'ngo' | 'society' | 'trust';
  address?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface CreateLinkedAccountResponse {
  linkedAccountId: string; // acc_XXXX
  status: 'under_review' | 'activated' | 'needs_clarification';
}

export async function createLinkedAccount(input: CreateLinkedAccountInput) {
  try {
    const res = await fetch(`${BASE_URL}/payments/route/linked-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Failed to create linked account: ${res.status} ${res.statusText} - ${errorData.error || 'Unknown error'}`);
    }
    return (await res.json()) as CreateLinkedAccountResponse;
  } catch (error: any) {
    if (error.message.includes('Network request failed')) {
      throw new Error(`Cannot connect to payment server at ${BASE_URL}. Make sure the server is running and update BASE_URL with your computer's IP address.`);
    }
    throw error;
  }
}

export interface UpdateSettlementsInput {
  accountId: string;
  beneficiary_name: string;
  account_number: string;
  ifsc_code: string;
  productId?: string;
}

export async function updateLinkedAccountSettlements(input: UpdateSettlementsInput) {
  try {
    const { accountId, productId, ...body } = input;
    const url = productId
      ? `${BASE_URL}/payments/route/linked-accounts/${accountId}/products/${productId}/settlements`
      : `${BASE_URL}/payments/route/linked-accounts/${accountId}/settlements`;
    
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Failed to update settlements: ${res.status} ${res.statusText} - ${errorData.error || 'Unknown error'}`);
    }
    
    return await res.json();
  } catch (error: any) {
    if (error.message.includes('Network request failed')) {
      throw new Error(`Cannot connect to payment server at ${BASE_URL}. Make sure the server is running.`);
    }
    throw error;
  }
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

export async function getRouteAccountStatus(accountId: string) {
  const res = await fetch(`${BASE_URL}/payments/route/linked-accounts/${accountId}?ensure_product=true&_=${Date.now()}`);
  if (!res.ok) throw new Error('Failed to fetch linked account status');
  return (await res.json()) as {
    linkedAccountId?: string;
    status?: string;
    needsClarificationFields?: string[];
  };
}

export interface OrderStatusResponse {
  orderId: string;
  status: 'created' | 'attempted' | 'paid' | 'failed';
  amount: number;
  currency: string;
  created_at: number;
  notes?: Record<string, string>;
  paymentDetails?: {
    id: string;
    status: string;
    method: string;
    amount: number;
    currency: string;
    captured: boolean;
    created_at: number;
    description?: string;
    notes?: Record<string, string>;
  };
}

export async function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  try {
    const res = await fetch(`${BASE_URL}/payments/route/orders/${orderId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Failed to fetch order status: ${res.status} ${res.statusText} - ${errorData.error || 'Unknown error'}`);
    }
    
    return (await res.json()) as OrderStatusResponse;
  } catch (error: any) {
    if (error.message.includes('Network request failed')) {
      throw new Error(`Cannot connect to payment server at ${BASE_URL}. Make sure the server is running.`);
    }
    throw error;
  }
}

export default {
  createLinkedAccount,
  updateLinkedAccountSettlements,
  createOrderWithTransfers,
  verifyPaymentSignature,
  getRouteAccountStatus,
  getOrderStatus
};
