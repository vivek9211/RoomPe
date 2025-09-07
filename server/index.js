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

app.listen(PORT, () => {
  console.log(`Payments server running on http://localhost:${PORT}`);
});


