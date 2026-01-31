import { create } from 'zustand';
import { api } from '../config/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Login action
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data; // Backend returns { success, data: { token, user } }
      
      localStorage.setItem('token', token);
      set({ user, isAuthenticated: true });
      
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  },

  // Signup action
  signup: async (email, password, role) => {
    try {
      const response = await api.post('/auth/signup', {
        email,
        password,
        role,
      });
      
      // Backend doesn't return token on signup, just success message
      // User needs to login after signup
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Signup failed',
      };
    }
  },

  // Hydrate auth state from token
  hydrate: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const user = response.data.data; // Backend returns { success, data: user }
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem('token');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Logout action
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));
