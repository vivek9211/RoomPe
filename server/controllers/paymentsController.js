import crypto from 'crypto';
import { razorpay, RAZORPAY_SECRET, RAZORPAY_KEY } from '../razorpayClient.js';

async function fetchRouteProductStatus(accountId) {
  try {
    const auth = Buffer.from(`${RAZORPAY_KEY}:${RAZORPAY_SECRET}`).toString('base64');
    const resp = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/products`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    const routeProduct = items.find(p => (p?.product_name || '').toLowerCase() === 'route' || (p?.product_code || '').toLowerCase() === 'route');
    return routeProduct?.activation_status || null;
  } catch (_) {
    return null;
  }
}

export async function createLinkedAccount(req, res) {
  try {
    const { name, email, contact, business_type = 'individual', address } = req.body || {};
    if (!name || !email || !contact) return res.status(400).json({ error: 'Missing required fields' });
    const registered = {
      street1: address?.street1 || 'Address Line 1',
      street2: address?.street2 || 'Address Line 2',
      city: address?.city || 'Bengaluru',
      state: address?.state || 'Karnataka', // Use full state name
      postal_code: address?.postal_code || '560001',
      country: address?.country || 'IN',
    };
    const account = await razorpay.accounts.create({
      email,
      phone: contact,
      type: 'route',
      legal_business_name: name,
      customer_facing_business_name: name,
      business_type,
      profile: {
        category: 'others',
        subcategory: 'others',
        description: 'RoomPe landlord',
        addresses: { registered },
      },
    });
    return res.json({ linkedAccountId: account.id, status: 'under_review' });
  } catch (e) {
    const description = e?.error?.description || e?.message || 'Failed to create linked account';
    console.error('Create linked account error:', e?.error || e);
    return res.status(400).json({ error: description, raw: e?.error || undefined });
  }
}

export async function getLinkedAccountStatus(req, res) {
  try {
    const { accountId } = req.params;
    if (!accountId) return res.status(400).json({ error: 'Missing accountId' });
    const account = await razorpay.accounts.fetch(accountId);
    let status = account?.status || account?.verification?.status || 'unknown';
    const routeStatus = await fetchRouteProductStatus(accountId);
    if (routeStatus) status = routeStatus; // 'under_review' | 'needs_clarification' | 'activated'
    return res.json({ linkedAccountId: accountId, status });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to fetch linked account' });
  }
}

export async function createOrder(req, res) {
  try {
    const { tenantId, propertyId, amount, currency = 'INR', landlordLinkedAccountId, platformFeePercent = 5 } = req.body || {};
    if (!amount || !tenantId || !propertyId) return res.status(400).json({ error: 'Missing fields' });
    const amountPaise = Math.round(Number(amount) * 100);
    const landlordAccount = landlordLinkedAccountId || 'acc_demo_placeholder';
    const landlordAmount = Math.floor(amountPaise * (100 - platformFeePercent) / 100);
    const transfers = [ { account: landlordAccount, amount: landlordAmount, currency, notes: { propertyId, tenantId } } ];
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      notes: { tenantId, propertyId, route_transfers: JSON.stringify(transfers) },
    });
    return res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: RAZORPAY_KEY, notes: order.notes });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to create order' });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { orderId, paymentId, signature } = req.body || {};
    if (!orderId || !paymentId || !signature) return res.status(400).json({ error: 'Missing fields' });
    const expected = crypto.createHmac('sha256', RAZORPAY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
    const success = expected === signature;
    if (!success) return res.json({ success: false });
    const order = await razorpay.orders.fetch(orderId);
    let transfers = [];
    try { if (order?.notes?.route_transfers) transfers = JSON.parse(order.notes.route_transfers); } catch (_) {}
    if (transfers.length > 0) await razorpay.payments.transfer(paymentId, { transfers });
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Verification/transfer failed' });
  }
}

export function webhooks(req, res) {
  try {
    const rawBody = req.body; // Buffer (express.raw)
    const receivedSignature = req.headers['x-razorpay-signature'];
    const computed = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET).update(rawBody).digest('hex');
    if (receivedSignature !== computed) return res.status(400).send('Invalid signature');
    const event = JSON.parse(rawBody.toString('utf8'));
    switch (event?.event) {
      case 'transfer.processed':
        break;
      case 'transfer.failed':
        break;
      case 'settlement.processed':
        break;
      case 'product.route.under_review':
      case 'product.route.needs_clarification':
      case 'product.route.activated':
        break;
      default:
        break;
    }
    return res.status(200).send('ok');
  } catch (e) {
    console.error(e);
    return res.status(400).send('bad');
  }
}

// Update settlements bank details for a linked account
export async function updateLinkedAccountSettlements(req, res) {
  try {
    const { accountId, productId } = req.params;
    const { beneficiary_name, account_number, ifsc_code } = req.body || {};
    if (!accountId || !beneficiary_name || !account_number || !ifsc_code) {
      return res.status(400).json({ error: 'accountId, beneficiary_name, account_number, ifsc_code are required' });
    }
    const auth = Buffer.from(`${RAZORPAY_KEY}:${RAZORPAY_SECRET}`).toString('base64');
    // Update Route product configuration (settlements) for the linked account
    // Use productId if provided, else PATCH the products collection (some accounts support this)
    const url = productId
      ? `https://api.razorpay.com/v2/accounts/${accountId}/products/${productId}`
      : `https://api.razorpay.com/v2/accounts/${accountId}/products`;
    const resp = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        settlements: { beneficiary_name, account_number, ifsc_code }
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data?.error?.description || 'Failed to update settlements', raw: data?.error || data });
    }
    return res.json({ success: true, accountId, product: data });
  } catch (e) {
    console.error('Update settlements error:', e);
    return res.status(500).json({ error: 'Failed to update settlements' });
  }
}

// Create a minimal stakeholder for the linked account
export async function createLinkedAccountStakeholder(req, res) {
  try {
    const { accountId } = req.params;
    const { name, email, executive = true } = req.body || {};
    if (!accountId || !name || !email) {
      return res.status(400).json({ error: 'accountId, name, email are required' });
    }
    const auth = Buffer.from(`${RAZORPAY_KEY}:${RAZORPAY_SECRET}`).toString('base64');
    const resp = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/stakeholders`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        relationship: { executive: !!executive }
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data?.error?.description || 'Failed to create stakeholder', raw: data?.error || data });
    }
    return res.json({ success: true, stakeholder: data });
  } catch (e) {
    console.error('Create stakeholder error:', e);
    return res.status(500).json({ error: 'Failed to create stakeholder' });
  }
}


