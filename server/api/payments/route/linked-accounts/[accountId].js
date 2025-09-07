import { razorpay } from '../../../_lib/razorpayClient.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  try {
    const { accountId } = req.query || {};
    if (!accountId) return res.status(400).json({ error: 'Missing accountId' });
    const account = await razorpay.accounts.fetch(accountId);
    const status = account?.status || account?.verification?.status || 'unknown';
    return res.json({ linkedAccountId: accountId, status });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to fetch linked account' });
  }
}

