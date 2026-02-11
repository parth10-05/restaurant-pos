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

// --- Selective Caching Implementation ---
// Only cache static data (menu, categories, tables, floors, config)
// Never cache live data (orders, kitchen, payments, sessions)

const CACHE_PREFIX = 'API_CACHE_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for static data

// Endpoints that should be cached (static data only)
const CACHEABLE_PATTERNS = [
  '/admin/products',      // Admin: Product management
  '/admin/categories',    // Admin: Category management
  '/admin/floors',        // Admin: Floor configuration
  '/admin/ingredients',   // Admin: Ingredient list
  '/cashier/products',    // Cashier: Menu items
  '/cashier/categories',  // Cashier: Menu categories
  '/cashier/floors',      // Cashier: Floor/table layout
  '/cashier/pos-config',  // Cashier: POS configuration
];

// Patterns that should NEVER be cached (live data)
const NEVER_CACHE_PATTERNS = [
  '/orders',              // Order data (live)
  '/kitchen',             // Kitchen status (live)
  '/sessions',            // Session data (live)
  '/admin/reports',       // Reports (dynamic)
  '/admin/ai',            // AI predictions (dynamic)
  '/auth',                // Authentication (should be fresh)
  '/cashier/tables/',     // Individual table status (live, has table ID)
  '/admin/settings',      // Settings (should be fresh)
];

// Check if URL should be cached
const shouldCache = (url) => {
  // Explicitly never cache certain patterns
  if (NEVER_CACHE_PATTERNS.some(pattern => url.includes(pattern))) {
    return false;
  }
  // Only cache whitelisted patterns
  return CACHEABLE_PATTERNS.some(pattern => url.startsWith(pattern));
};

// Clear cache for specific patterns
const clearCachePattern = (patterns) => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      const match = patterns.some(pattern => key.includes(pattern));
      if (match) {
        localStorage.removeItem(key);
      }
    }
  });
};

// Helper to generate cache key
const getCacheKey = (url, params) => {
  const paramsKey = params ? JSON.stringify(params) : '';
  return `${CACHE_PREFIX}${url}_${paramsKey}`;
};

// Override api.get to implement selective caching
const originalGet = api.get.bind(api);

api.get = async (url, config = {}) => {
  const safeConfig = config || {};
  
  // Skip caching for live data endpoints
  if (!shouldCache(url)) {
    return originalGet(url, safeConfig);
  }
  
  const cacheKey = getCacheKey(url, safeConfig.params);
  let cachedItem = null;

  try {
    cachedItem = localStorage.getItem(cacheKey);
  } catch {
    // LocalStorage might be unavailable
  }

  if (cachedItem) {
    try {
      const { data, timestamp } = JSON.parse(cachedItem);
      // Check if cache is still valid
      if (Date.now() - timestamp < CACHE_TTL) {
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
    } catch {
      localStorage.removeItem(cacheKey); // Corrupted
    }
  }

  // Fetch fresh data
  const response = await originalGet(url, safeConfig);
  
  // Cache successful responses for static data
  if (response.status === 200) {
    try {
      const dataToStore = JSON.stringify({
        data: response.data,
        timestamp: Date.now()
      });
      
      // Limit cache size: Don't cache if larger than 500KB
      if (dataToStore.length < 500000) {
        localStorage.setItem(cacheKey, dataToStore);
      }
    } catch {
      // Silently fail on storage errors
    }
  }
  return response;
};

// Clear only static data cache on mutations that affect them
api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    const url = response.config.url;
    
    if (['post', 'put', 'delete', 'patch'].includes(method)) {
      // Clear cache selectively based on what was modified
      if (url.includes('/products') || url.includes('/categories')) {
        clearCachePattern(['/products', '/categories']);
      } else if (url.includes('/floors')) {
        clearCachePattern(['/floors']);
      } else if (url.includes('/ingredients')) {
        clearCachePattern(['/ingredients']);
      } else if (url.includes('/pos-config')) {
        clearCachePattern(['/pos-config']);
      }
    }
    return response;
  }
);
