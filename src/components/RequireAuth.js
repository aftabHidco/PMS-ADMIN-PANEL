// src/components/RequireAuth.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function RequireAuth({ children }) {
  const auth = useAuth();
  const location = useLocation();

  // while auth is initializing, avoid redirect flicker:
  if (auth.loading) {
    return null; // or a spinner if you prefer
  }

  if (!auth.isAuthenticated) {
    // Redirect to /login and preserve the attempted URL in location.state.from
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
