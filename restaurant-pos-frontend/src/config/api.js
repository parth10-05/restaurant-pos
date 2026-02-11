import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Caching Implementation ---

const CACHE_PREFIX = 'API_CACHE_';
const CACHE_TTL = 60 * 1000; // 60 seconds

// Helper to generate cache key
const getCacheKey = (url, params) => {
  const paramsKey = params ? JSON.stringify(params) : '';
  return `${CACHE_PREFIX}${url}_${paramsKey}`;
};

// Override api.get to implement caching
const originalGet = api.get.bind(api);

api.get = async (url, config = {}) => {
  const safeConfig = config || {};
  const cacheKey = getCacheKey(url, safeConfig.params);
  let cachedItem = null;

  try {
    cachedItem = localStorage.getItem(cacheKey);
  } catch (error) {
    // LocalStorage might be unavailable
  }

  if (cachedItem) {
    try {
      const { data, timestamp } = JSON.parse(cachedItem);
      // Check if cache is still valid
      if (Date.now() - timestamp < CACHE_TTL) {
        // console.log(`Serving from cache: ${url}`);
        return {
          data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: safeConfig,
          request: {}
        };
      } else {
        localStorage.removeItem(cacheKey); // Expired
      }
    } catch (e) {
      localStorage.removeItem(cacheKey); // Corrupted
    }
  }

  // Fetch fresh data
  const response = await originalGet(url, safeConfig);
  
  // Only cache successful OK responses
  if (response.status === 200) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: response.data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('LocalStorage quota exceeded, clearing old cache');
      // Clear all API cache to make space
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  }
  return response;
};

// Clear cache on mutation (POST, PUT, DELETE, PATCH) to ensure data consistency
api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    if (['post', 'put', 'delete', 'patch'].includes(method)) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
    return response;
  }
);
