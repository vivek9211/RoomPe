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
 
// Get the Route product for an account, creating it if missing. Returns { id, activation_status }
async function getOrCreateRouteProduct(accountId) {
  const auth = Buffer.from(`${RAZORPAY_KEY}:${RAZORPAY_SECRET}`).toString('base64');
  // Try fetch existing products first
  try {
    const productsResp = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/products`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    if (productsResp.ok) {
      const productsData = await productsResp.json();
      const existing = (productsData?.items || []).find(p => (p?.product_name || '').toLowerCase() === 'route');
      if (existing) return { id: existing.id, activation_status: existing.activation_status };
    }
  } catch (_) {}
 
  // Create Route product
  const createResp = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ product_name: 'route', tnc_accepted: true })
  });
  const createData = await createResp.json();
  if (!createResp.ok) {
    throw new Error(createData?.error?.description || 'Failed to create Route product');
  }
  return { id: createData.id, activation_status: createData.activation_status };
}
 
export async function createLinkedAccount(req, res) {
  try {
    const { name, email, contact, business_type = 'individual', address } = req.body || {};
    if (!name || !email || !contact) return res.status(400).json({ error: 'Missing required fields' });
    const registered = {
      street1: address?.street1,
      street2: address?.street2,
      city: address?.city,
      state: address?.state, // Use full state name
      postal_code: address?.postal_code,
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
    const { ensure_product } = req.query || {};
    if (!accountId) return res.status(400).json({ error: 'Missing accountId' });
    const auth = Buffer.from(`${RAZORPAY_KEY}:${RAZORPAY_SECRET}`).toString('base64');
    const account = await razorpay.accounts.fetch(accountId);
    let status = account?.status || account?.verification?.status || 'unknown';
    let routeProduct = null;
    // Try to fetch product details
    try {
      const resp = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/products`, {
        headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
      });
      const data = await resp.json();
      const items = Array.isArray(data?.items) ? data.items : (data?.id ? [data] : []);
      routeProduct = items.find(p => (p?.product_name || '').toLowerCase() === 'route');
    } catch (_) {}
    // Optionally ensure product exists and T&C accepted
    if (!routeProduct && (ensure_product === 'true' || ensure_product === '1')) {
      try {
        const resp = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/products`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_name: 'route', tnc_accepted: true })
        });
        const data = await resp.json();
        if (resp.ok) routeProduct = data;
      } catch (_) {}
    }
    // Prefer activation_status from product
    if (routeProduct?.activation_status) {
      status = routeProduct.activation_status;
    } else {
      const routeStatus = await fetchRouteProductStatus(accountId);
      if (routeStatus) status = routeStatus;
    }
    return res.json({ linkedAccountId: accountId, status, route_product: routeProduct || undefined });
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
 
// Fetch order status from Razorpay
export async function getOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });
    
    const order = await razorpay.orders.fetch(orderId);
    
    // Get payment details if order is paid
    let paymentDetails = null;
    if (order.status === 'paid' && order.payments && order.payments.length > 0) {
      try {
        const paymentId = order.payments[0];
        const payment = await razorpay.payments.fetch(paymentId);
        paymentDetails = {
          id: payment.id,
          status: payment.status,
          method: payment.method,
          amount: payment.amount,
          currency: payment.currency,
          captured: payment.captured,
          created_at: payment.created_at,
          description: payment.description,
          notes: payment.notes
        };
      } catch (paymentError) {
        console.error('Error fetching payment details:', paymentError);
      }
    }
    
    return res.json({
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      created_at: order.created_at,
      notes: order.notes,
      paymentDetails
    });
  } catch (e) {
    console.error('Error fetching order status:', e);
    return res.status(500).json({ error: 'Failed to fetch order status' });
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
   
    // Get or create Route product so we can PATCH settlements at product-level
    let routeProductId = productId;
    try {
      if (!routeProductId) {
        const routeProduct = await getOrCreateRouteProduct(accountId);
        routeProductId = routeProduct.id;
      }
    } catch (e) {
      // If product create fails, continue with other methods as fallback
      console.log('Route product get/create failed:', e?.message || e);
    }
   
    // Try different approaches to update settlements
    let success = false;
    let lastError = null;
   
    // Method 1: Try updating settlements via account profile (most common)
    try {
      const profileResp = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settlements: { beneficiary_name, account_number, ifsc_code }
        })
      });
     
      const profileData = await profileResp.json();
      if (profileResp.ok) {
        return res.json({ success: true, accountId, method: 'profile', data: profileData });
      } else {
        lastError = profileData;
        console.log('Profile method failed:', profileData);
      }
    } catch (e) {
      console.log('Profile method error:', e.message);
    }
   
    // Method 2: Try updating via account directly
    try {
      const accountResp = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settlements: { beneficiary_name, account_number, ifsc_code }
        })
      });
     
      const accountData = await accountResp.json();
      if (accountResp.ok) {
        return res.json({ success: true, accountId, method: 'account', data: accountData });
      } else {
        lastError = accountData;
        console.log('Account method failed:', accountData);
      }
    } catch (e) {
      console.log('Account method error:', e.message);
    }
   
    // Method 3: Try updating via product if we have productId (preferred)
    if (routeProductId) {
      try {
        const productResp = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/products/${routeProductId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            settlements: { beneficiary_name, account_number, ifsc_code }
          })
        });
       
        const productData = await productResp.json();
        if (productResp.ok) {
          return res.json({ success: true, accountId, productId: routeProductId, method: 'product', data: productData });
        } else {
          lastError = productData;
          console.log('Product method failed:', productData);
        }
      } catch (e) {
        console.log('Product method error:', e.message);
      }
    }
   
    // If all methods failed, return the last error
    return res.status(400).json({
      error: 'All settlement update methods failed. Account may not be ready for settlements yet.',
      lastError: lastError,
      suggestion: 'Please ensure the linked account is activated and try again later.'
    });
   
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