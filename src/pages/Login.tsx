import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // If user is already logged in, redirect to dashboard
  if (user) {
    navigate('/dashboard', { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-mystic-950 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Star className="h-12 w-12 text-mystic-400 glow-mystic float" />
            <span className="text-3xl font-bold text-gradient-mystic">SoulSeer</span>
          </div>
          <p className="text-gray-400">Welcome back to your spiritual journey</p>
        </div>

        <Card className="bg-black/30 border-mystic-800/30 backdrop-blur-xl glow-mystic">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gradient-mystic">Sign In</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={async (e) => { await handleSubmit(e); }} className="space-y-6">
              {error && (
                <div className="bg-red-900/60 border border-red-700 text-red-300 rounded px-4 py-2 mb-4 text-center">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-mystic-900/20 border-mystic-800/50 text-white focus:border-mystic-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-mystic-900/20 border-mystic-800/50 text-white focus:border-mystic-400"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 text-white glow-mystic"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <Link to="/forgot-password" className="text-mystic-400 hover:text-mystic-300 text-sm">
                Forgot your password?
              </Link>
              
              <div className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-mystic-400 hover:text-mystic-300 font-medium">
                  Sign up here
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Moon className="h-8 w-8 text-celestial-400 mx-auto mb-2 float" />
          <p className="text-gray-500 text-sm">
            Your spiritual transformation awaits ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;