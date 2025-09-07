import 'dotenv/config';
import express from 'express';
import cors from 'cors';
// No direct Razorpay usage here; logic moved to controllers
import paymentsRouter from './routes/payments.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.use('/payments', paymentsRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Payments server running on http://localhost:${PORT}`);
  console.log(`Server accessible from network at http://192.168.1.88:${PORT}`);
});


