// Payment Controller for SoulSeer
// Handles Stripe Connect integration, pay-per-minute billing, and webhooks
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { pool } = require('../config/db');

// Add funds to client balance
exports.addFunds = async (req, res) => {
  try {
    const { client_id, amount, payment_method_id } = req.body;
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      payment_method: payment_method_id,
      confirm: true,
      metadata: { client_id },
    });
    // Update balance in DB
    await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, client_id]);
    res.status(200).json({ success: true, paymentIntent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add funds', details: err.message });
  }
};

// Stripe webhook for session billing
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SIGNING_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // Handle session payment events
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    // Log payment or update session as needed
  }
  res.json({ received: true });
};

// Get client balance
exports.getBalance = async (req, res) => {
  try {
    const { client_id } = req.params;
    const { rows } = await pool.query('SELECT balance FROM users WHERE id = $1', [client_id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ balance: rows[0].balance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch balance', details: err.message });
  }
};
