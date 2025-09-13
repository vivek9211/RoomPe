import crypto from 'crypto';
import { razorpay, RAZORPAY_SECRET } from '../../_lib/razorpayClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
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

