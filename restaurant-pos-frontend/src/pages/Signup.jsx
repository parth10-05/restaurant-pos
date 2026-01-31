import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import AuthLayout from '../layouts/AuthLayout';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isAuthenticated, user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'cashier',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await signup(
      formData.email,
      formData.password,
      formData.role
    );

    if (result.success) {
      // Backend doesn't auto-authenticate, redirect to login
      navigate('/login', { 
        state: { message: 'Account created successfully. Please login.' }
      });
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
            Create Account
          </h2>
          <p className="text-sm text-neutral-600">
            Register a new user account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              minLength={6}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium text-neutral-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900 bg-white"
              disabled={loading}
            >
              <option value="cashier">Cashier</option>
              <option value="kitchen">Kitchen</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-2.5 rounded-md font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-neutral-900 hover:text-neutral-700 underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
