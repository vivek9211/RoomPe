import 'dotenv/config';
import express from 'express';
import cors from 'cors';
// No direct Razorpay usage here; logic moved to controllers
import paymentsRouter from './routes/payments.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Root route handler
app.get('/', (req, res) => {
  res.json({
    message: 'RoomPe Payment Server is running!',
    status: 'active',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      payments: '/payments/*'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/payments', paymentsRouter);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /payments/route/linked-accounts',
      'GET /payments/route/linked-accounts/:accountId',
      'POST /payments/route/orders',
      'POST /payments/route/verify',
      'GET /payments/route/orders/:orderId'
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 RoomPe Payment Server running on port ${PORT}`);
  console.log(`📱 Server accessible at http://localhost:${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Payment endpoints: http://localhost:${PORT}/payments`);
});


