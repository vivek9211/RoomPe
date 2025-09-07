import { razorpay } from '../../_lib/razorpayClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const { name, email, contact, business_type = 'individual', tnc_accepted = true } = req.body || {};
    if (!name || !email || !contact) return res.status(400).json({ error: 'Missing required fields' });
    const account = await razorpay.accounts.create({
      email,
      phone: contact,
      type: 'route',
      legal_business_name: name,
      business_type,
      profile: {
        category: 'others',
        subcategory: 'others',
        description: 'RoomPe landlord',
        addresses: { registered: { street1: 'NA', city: 'NA', state: 'NA', postal_code: '000000', country: 'IN' } },
      },
      tnc_accepted,
    });
    return res.json({ linkedAccountId: account.id, status: 'under_review' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to create linked account' });
  }
}

