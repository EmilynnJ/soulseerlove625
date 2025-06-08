import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

import { createPaymentIntent, topUpWallet } from '@/lib/backend';

const WalletTopUp: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('20');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      if (!stripe || !elements) throw new Error('Stripe not loaded');
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 5) throw new Error('Minimum top-up is $5');
      // 1. Create PaymentIntent (mock)
      const { clientSecret } = await createPaymentIntent(parsedAmount);
      // 2. Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });
      if (result.error) throw new Error(result.error.message);
      setSuccess(true);
      setTimeout(() => navigate('/wallet'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-mystic-950 to-celestial-950">
      <Card className="max-w-md w-full p-8 bg-black/60 border border-primary/30">
        <h1 className="text-2xl font-alex-brush text-accent mb-6 text-center">Add Funds to Your Wallet</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2 font-medium">Amount (USD)</label>
            <input
              type="number"
              min="5"
              step="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm mb-2 font-medium">Card Details</label>
            <div className="p-2 rounded bg-gray-900 border border-gray-700">
              <CardElement options={{ style: { base: { color: '#fff', fontFamily: 'inherit', fontSize: '16px' } } }} />
            </div>
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {success && <div className="text-green-400 text-sm">Payment successful! Redirecting...</div>}
          <Button type="submit" className="w-full" disabled={loading || !stripe || !elements}>
            {loading ? 'Processing...' : 'Add Funds'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default WalletTopUp;
