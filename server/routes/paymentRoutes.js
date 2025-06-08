// Payment Routes for SoulSeer
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Add funds to client balance
router.post('/add-funds', protect, paymentController.addFunds);
// Get client balance
router.get('/balance/:client_id', protect, paymentController.getBalance);
// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

module.exports = router;
