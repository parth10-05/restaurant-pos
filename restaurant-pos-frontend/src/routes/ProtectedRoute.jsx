import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  // Wait for hydration to complete
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-neutral-900 border-r-transparent"></div>
          <p className="mt-4 text-sm text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to their authorized route
    const roleRoutes = {
      admin: '/admin',
      cashier: '/pos',
      kitchen: '/kitchen',
    };
    return <Navigate to={roleRoutes[user?.role] || '/login'} replace />;
  }

  return children;
}
