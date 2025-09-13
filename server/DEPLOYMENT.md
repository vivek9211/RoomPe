# RoomPe Payment Server Deployment Guide

## Quick Fix for "Cannot GET /" Error

The server has been updated with proper route handlers. The main issues were:

1. **Missing root route handler** - Now fixed with a proper welcome message
2. **No 404 error handling** - Now provides helpful error messages
3. **Missing health check endpoint** - Added for deployment monitoring

## Environment Variables

Create a `.env` file in the server directory with:

```env
PORT=4000
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NODE_ENV=production
```

## Deployment Steps

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Set environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your Razorpay credentials

3. **Start the server:**
   ```bash
   npm start
   ```

## Available Endpoints

- `GET /` - Server status and available routes
- `GET /health` - Health check endpoint
- `POST /payments/route/linked-accounts` - Create linked account
- `GET /payments/route/linked-accounts/:accountId` - Get account status
- `POST /payments/route/orders` - Create payment order
- `POST /payments/route/verify` - Verify payment signature
- `GET /payments/route/orders/:orderId` - Get order status

## Client Configuration

Update your client's `BASE_URL` in `src/services/api/paymentApi.ts` to point to your deployed server URL instead of the local IP address.

## Common Deployment Platforms

### Heroku
- Set `PORT` environment variable (automatically provided)
- Ensure `NODE_ENV=production`

### Railway
- Set environment variables in dashboard
- Port is automatically configured

### Vercel
- Use serverless functions
- May need to adjust for serverless deployment

### DigitalOcean/AWS/GCP
- Ensure firewall allows traffic on your chosen port
- Use PM2 or similar for process management in production
