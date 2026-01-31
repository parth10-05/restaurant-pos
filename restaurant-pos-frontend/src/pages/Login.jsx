import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import AuthLayout from '../layouts/AuthLayout';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const successMessage = location.state?.message;

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes = {
        admin: '/admin',
        cashier: '/pos',
        kitchen: '/kitchen',
      };
      navigate(roleRoutes[user.role] || '/admin');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      const roleRoutes = {
        admin: '/admin',
        cashier: '/pos',
        kitchen: '/kitchen',
      };
      navigate(roleRoutes[result.user.role] || '/admin');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
            Sign In
          </h2>
          <p className="text-sm text-neutral-600">
            Enter your credentials to access the system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900 placeholder-neutral-400"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-2.5 rounded-md font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-medium text-neutral-900 hover:text-neutral-700 underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
