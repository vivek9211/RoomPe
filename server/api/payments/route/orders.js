import { razorpay, RAZORPAY_KEY } from '../../_lib/razorpayClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
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

