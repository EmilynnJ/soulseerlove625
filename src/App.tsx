import { Toaster } from "@/components/ui/toaster";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ClientDashboard from "./pages/ClientDashboard";
import ReaderDashboard from "./pages/ReaderDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import NotFound from "./pages/NotFound";
import ReadingMarketplace from "./pages/ReadingMarketplace";
import ReaderPreview from "./pages/ReaderPreview";
import ReadingSession from "./components/reading/ReadingSession";
import Wallet from "./pages/Wallet";
import MainReadingSession from './pages/MainReadingSession';
import ReadingReview from './pages/ReadingReview';

const queryClient = new QueryClient();
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51N8y2bL8J9gqB...');

// Auth guard component for protected routes
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="ethereal-glow animate-pulse">
          <p className="text-lg text-accent">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  return <Outlet />;
};

// Redirects user to the correct dashboard based on role
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return user.role === 'reader' ? <Navigate to="/dashboard/reader" /> : <Navigate to="/dashboard/client" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Elements stripe={stripePromise}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          {/* Auth routes without layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/welcome" element={<Welcome />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard/client" element={<Layout><ClientDashboard /></Layout>} />
            <Route path="/dashboard/reader" element={<Layout><ReaderDashboard /></Layout>} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/wallet" element={<Layout><Wallet /></Layout>} />
            <Route path="/reading/:readerId" element={<MainReadingSession />} />
            <Route path="/reading/:readerId/review" element={<ReadingReview />} />
          </Route>
          
          {/* Reading marketplace and reader preview */}
          <Route path="/marketplace" element={
            <Layout>
              <ReadingMarketplace />
            </Layout>
          } />
          
          <Route path="/reader/:readerId/preview" element={
            <Layout>
              <ReaderPreview />
            </Layout>
          } />
          
          {/* Main routes with layout */}
          <Route path="/" element={
            <Layout>
              <Home />
            </Layout>
          } />
          <Route path="/about" element={
            <Layout>
              <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-4xl font-bold text-gradient-mystic mb-4">About SoulSeer</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </Layout>
          } />
          <Route path="/readers" element={
            <Layout>
              <Navigate to="/marketplace" replace />
            </Layout>
          } />
          <Route path="/live" element={
            <Layout>
              <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-4xl font-bold text-gradient-mystic mb-4">Live Readings</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </Layout>
          } />
          <Route path="/shop" element={
            <Layout>
              <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-4xl font-bold text-gradient-mystic mb-4">Mystical Shop</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </Layout>
          } />
          <Route path="/community" element={
            <Layout>
              <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-4xl font-bold text-gradient-mystic mb-4">Spiritual Community</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </Layout>
          } />
          <Route path="/help" element={
            <Layout>
              <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-4xl font-bold text-gradient-mystic mb-4">Help Center</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </Layout>
          } />
          <Route path="/policies" element={
            <Layout>
              <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-4xl font-bold text-gradient-mystic mb-4">Policies</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </Layout>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
      </Elements>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
