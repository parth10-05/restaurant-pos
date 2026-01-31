import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminPage from './pages/AdminPage';
import POSPage from './pages/POSPage';
import KitchenPage from './pages/KitchenPage';

// Root redirect component - handles "/" based on auth state
function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  
  if (isAuthenticated && user) {
    const roleRoutes = {
      admin: '/admin',
      cashier: '/pos',
      kitchen: '/kitchen',
    };
    return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
  }
  
  return <Navigate to="/login" replace />;
}

function App() {
  const { hydrate, isLoading } = useAuthStore();

  // Hydrate auth state on app startup
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Show loading state while hydrating
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

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos/*"
          element={
            <ProtectedRoute allowedRoles={['cashier']}>
              <POSPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen/*"
          element={
            <ProtectedRoute allowedRoles={['kitchen']}>
              <KitchenPage />
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route 
          path="/" 
          element={<RootRedirect />} 
        />
        
        {/* Catch all - redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
