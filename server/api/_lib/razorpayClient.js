import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  throw new Error('Missing Razorpay credentials');
}

export const razorpay = new Razorpay({ key_id, key_secret });
export const RAZORPAY_SECRET = key_secret;
export const RAZORPAY_KEY = key_id;

