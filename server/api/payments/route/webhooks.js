import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const rawBody = await getRawBody(req);
    const receivedSignature = req.headers['x-razorpay-signature'];
    const computed = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET).update(rawBody).digest('hex');
    if (receivedSignature !== computed) return res.status(400).send('Invalid signature');
    const event = JSON.parse(rawBody.toString('utf8'));
    switch (event?.event) {
      case 'transfer.processed':
      case 'transfer.failed':
      case 'settlement.processed':
      case 'product.route.under_review':
      case 'product.route.needs_clarification':
      case 'product.route.activated':
      default:
        break;
    }
    return res.status(200).send('ok');
  } catch (e) {
    console.error(e);
    return res.status(400).send('bad');
  }
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

