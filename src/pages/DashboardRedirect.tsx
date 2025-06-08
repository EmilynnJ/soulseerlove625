import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const DashboardRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'reader') {
    return <Navigate to="/dashboard/reader" replace />;
  }

  // Default to client dashboard
  return <Navigate to="/dashboard/client" replace />;
};

export default DashboardRedirect;
