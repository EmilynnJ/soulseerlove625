import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

import { createPaymentIntent } from '@/lib/backend';

interface BookingPaymentFormProps {
  amount: number;
  onSuccess: () => void;
}

const BookingPaymentForm: React.FC<BookingPaymentFormProps> = ({ amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!stripe || !elements) throw new Error('Stripe not loaded');
      // 1. Create PaymentIntent (real backend)
      const { clientSecret } = await createPaymentIntent(amount);
      // 2. Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });
      if (result.error) throw new Error(result.error.message);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <label className="block text-sm mb-2 font-medium">Card Details</label>
        <div className="p-2 rounded bg-gray-900 border border-gray-700">
          <CardElement options={{ style: { base: { color: '#fff', fontFamily: 'inherit', fontSize: '16px' } } }} />
        </div>
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <Button type="submit" className="w-full" disabled={loading || !stripe || !elements}>
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)} & Book`}
      </Button>
    </form>
  );
};

export default BookingPaymentForm;
