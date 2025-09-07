import express from 'express';
import { createLinkedAccount, getLinkedAccountStatus, createOrder, verifyPayment, webhooks, updateLinkedAccountSettlements, createLinkedAccountStakeholder } from '../controllers/paymentsController.js';

const router = express.Router();

router.post('/route/linked-accounts', createLinkedAccount);
router.get('/route/linked-accounts/:accountId', getLinkedAccountStatus);
router.post('/route/orders', createOrder);
router.post('/route/verify', verifyPayment);
router.post('/route/webhooks', express.raw({ type: '*/*' }), webhooks);
router.patch('/route/linked-accounts/:accountId/settlements', updateLinkedAccountSettlements);
router.patch('/route/linked-accounts/:accountId/products/:productId/settlements', updateLinkedAccountSettlements);
router.post('/route/linked-accounts/:accountId/stakeholders', createLinkedAccountStakeholder);

export default router;


