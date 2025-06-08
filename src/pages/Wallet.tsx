import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addFunds, getWallet } from '@/lib/backend';
import { CreditCard, DollarSign, CheckCircle, AlertCircle, ArrowRight, History } from 'lucide-react';

    id: 'tx1', 
    type: 'deposit', 
    amount: 50.00, 
    date: '2025-06-05T14:30:45Z', 
    description: 'Added funds via Stripe' 
  },
  { 
    id: 'tx2', 
    type: 'reading', 
    amount: -12.50, 
    date: '2025-06-04T16:15:22Z', 
    description: 'Reading with MysticMoon - 5 min' 
  },
  { 
    id: 'tx3', 
    type: 'reading', 
    amount: -25.00, 
    date: '2025-06-02T10:45:12Z', 
    description: 'Reading with StarGazer - 10 min' 
  },
  { 
    id: 'tx4', 
    type: 'deposit', 
    amount: 100.00, 
    date: '2025-06-01T09:12:33Z', 
    description: 'Added funds via Stripe' 
  },
];

const Wallet: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Getting params from location if we're being redirected from reader preview
  const neededAmount = location.state?.neededAmount;
  const currentBalance = location.state?.currentBalance || 0;
  const returnTo = location.state?.returnTo;
  
  const [balance, setBalance] = useState<number>(currentBalance);
  const [amountToAdd, setAmountToAdd] = useState<string>(neededAmount ? 
    Math.ceil(neededAmount - currentBalance).toString() : '50');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cardElement, setCardElement] = useState<HTMLElement | null>(null);
  const [transactions, setTransactions] = useState(mockTransactionHistory);
  const [showStripe, setShowStripe] = useState<boolean>(false);
  
  // Fetch balance on component mount
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/wallet' } });
      return;
    }
    
    const fetchBalance = async (): Promise<void> => {
      try {
        const balanceData = await getBalance();
        setBalance(balanceData);
      } catch (err: Error) {
        setError('Failed to fetch balance');
      }
    };
    
    fetchBalance();
    
    // In a real app, we'd initialize Stripe here
    // const stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
    // const elements = stripe.elements();
    // const card = elements.create('card', { style: { ... } });
    // card.mount('#card-element');
    // setCardElement(card);
    
    return () => {
      // Clean up Stripe elements
      // if (cardElement) cardElement.destroy();
    };
  }, [user, navigate]);
  
  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(amountToAdd);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, we'd create a payment method and use that ID
      // const { paymentMethod, error } = await stripe.createPaymentMethod({
      //   type: 'card',
      //   card: cardElement,
      // });
      // if (error) throw new Error(error.message);
      
      // Mock payment method for demo
      const paymentMethodId = 'pm_mock_' + Math.random().toString(36).substring(2, 15);
      
      // Call our API to add funds
      const result = await addFunds(amount, paymentMethodId);
      
      // Update balance & show success
      setBalance(balance + amount);
      setSuccess(true);
      
      // Add to transaction history
      setTransactions([
        {
          id: 'tx' + Date.now(),
          type: 'deposit',
          amount: amount,
          date: new Date().toISOString(),
          description: 'Added funds via Stripe'
        },
        ...transactions
      ]);
      
      // Reset form
      setAmountToAdd('');
      setShowStripe(false);
      
      // If we were redirected for a specific reading, go back there
      if (returnTo) {
        setTimeout(() => {
          navigate(returnTo);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add funds');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-alex-brush mb-8 text-center text-accent glow-text-sm">
        Your Spiritual Wallet
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="lg:col-span-1">
          <Card className="bg-black/50 border border-primary/30">
            <CardHeader>
              <CardTitle className="text-accent">Balance</CardTitle>
              <CardDescription>Your current balance for readings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold text-white mb-4 flex items-center">
                <DollarSign className="h-8 w-8 text-accent mr-1" />
                {balance.toFixed(2)}
              </div>
              
              {neededAmount && balance < neededAmount && (
                <div className="bg-yellow-900/20 border border-yellow-700/50 text-yellow-300 rounded p-3 mb-6 text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      You need at least ${neededAmount.toFixed(2)} to start the reading.
                      <div className="text-xs text-yellow-400/70 mt-1">
                        Missing: ${(neededAmount - balance).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Button asChild className="w-full mb-2">
                <Link to="/wallet/topup">Add Funds (Card)</Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Payment form */}
          {showStripe && (
            <Card className="mt-6 bg-black/50 border border-primary/30">
              <CardHeader>
                <CardTitle className="text-accent">Add Funds</CardTitle>
                <CardDescription>Secure payment via Stripe</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddFunds}>
                  {error && (
                    <div className="bg-red-900/20 border border-red-700/50 text-red-300 rounded p-3 mb-4 text-sm">
                      {error}
                    </div>
                  )}
                  
                  {success && (
                    <div className="bg-green-900/20 border border-green-700/50 text-green-300 rounded p-3 mb-4 text-sm flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Funds added successfully!
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="5"
                        step="5"
                        value={amountToAdd}
                        onChange={(e) => setAmountToAdd(e.target.value)}
                        className="bg-black/30 border border-primary/30"
                        placeholder="50"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="card-element">Card Details</Label>
                      {/* This would be replaced with a real Stripe card element */}
                      <div className="bg-black/30 border border-primary/30 rounded-md p-3 h-10 flex items-center text-gray-400">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <span className="text-sm">**** **** **** 4242</span>
                      </div>
                      <div className="font-bold text-lg mb-2">Wallet Balance</div>
                      For demo purposes, we're simulating a card payment
                    </div>
                    
                    <Button 
                      type="submit"
                      disabled={loading} 
                      className="w-full bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 text-white glow-mystic"
                    >
                      {loading ? 'Processing...' : `Pay $${amountToAdd || 0}`}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Transaction History */}
        <div className="lg:col-span-2">
          <Card className="bg-black/50 border border-primary/30 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-accent">Transaction History</CardTitle>
                <CardDescription>Your recent activity</CardDescription>
              </div>
              <History className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id}
                      className="flex items-center justify-between border-b border-gray-800 pb-4"
                    >
                      <div className="flex items-center">
                        <div className={`mr-3 p-2 rounded-full ${
                          tx.type === 'deposit' ? 'bg-green-900/20 text-green-400' : 'bg-purple-900/20 text-purple-400'
                        }`}>
                          {tx.type === 'deposit' ? <DollarSign className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tx.description}</p>
                          <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <div className={`text-sm font-semibold ${
                        tx.amount > 0 ? 'text-green-400' : 'text-white'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <p>No transactions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
