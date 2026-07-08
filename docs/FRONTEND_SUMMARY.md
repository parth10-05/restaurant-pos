# Frontend Technical Summary

## Stack
- **Framework:** React 19.2
- **Build Tool:** Vite 7.2
- **Styling:** TailwindCSS 4.1
- **Routing:** React Router DOM 7.13
- **State:** Zustand 5.0
- **HTTP:** Axios 1.13
- **Charts:** Recharts 3.7
- **Real-time:** Socket.IO Client 4.8

## Architecture Pattern
```
Page Container → Service Layer → API (axios) → Backend REST API
                ↓
         Zustand Store (auth state)
                ↓
         Components (UI rendering)
```

## File Structure
```
src/
├── main.jsx                   # React entry, renders App
├── App.jsx                    # Root router, role-based redirects
├── config/
│   └── api.js                 # Axios instance, JWT interceptor
├── routes/
│   └── ProtectedRoute.jsx     # Auth guard HOC
├── store/
│   └── auth.store.js          # Zustand: user, token, login, logout
├── services/                  # 9 API client services
│   ├── product.service.js
│   ├── ingredient.service.js
│   ├── category.service.js
│   ├── order.service.js
│   ├── session.service.js
│   ├── kitchen.service.js
│   ├── floor.service.js
│   ├── report.service.js
│   └── ai.service.js
├── pages/                     # Top-level route containers
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── AdminPage.jsx          # Tab-based admin dashboard
│   ├── POSPage.jsx            # Cashier order interface
│   └── KitchenPage.jsx        # Kitchen ticket display
├── admin/                     # Admin module
│   ├── tabs/                  # ProductsTab, CategoriesTab, etc.
│   └── components/            # ProductForm, ProductsTable, CategorySidebar
├── cashier/                   # POS module
├── kitchen/                   # Kitchen display module
├── components/                # Shared UI components
├── layouts/                   # Layout wrappers
├── hooks/                     # Custom React hooks
└── utils/                     # Helper functions
```

## Routing
```
/ → RootRedirect (role-based: admin→/admin, cashier→/pos, kitchen→/kitchen)
/login → Login
/signup → Signup

/admin/* (Protected: admin role)
  ├── /admin → AdminPage (tabbed interface)
  │   ├── Dashboard Tab
  │   ├── Products Tab
  │   ├── Categories Tab
  │   ├── Floors/Tables Tab
  │   ├── Users Tab
  │   ├── Settings Tab
  │   ├── Reports Tab
  │   └── AI Analytics Tab

/pos/* (Protected: cashier role)
  └── /pos → POSPage (order entry, table selection, payment)

/kitchen/* (Protected: kitchen role)
  └── /kitchen → KitchenPage (ticket dashboard with real-time updates)
```

## State Management (Zustand)
```javascript
// store/auth.store.js
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  
  login: async (email, password) => {
    const response = await authService.login(email, password);
    localStorage.setItem('token', response.token);
    set({ user: response.user, token: response.token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  hydrate: () => {
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token with backend
      authService.me().then(user => {
        set({ user, token, isAuthenticated: true, isLoading: false });
      });
    } else {
      set({ isLoading: false });
    }
  }
}));
```

## API Client Pattern
```javascript
// config/api.js
export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`,
  headers: { 'Content-Type': 'application/json' }
});

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
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
```

## Service Layer Example
```javascript
// services/product.service.js
export const productService = {
  async getAll(filters = {}) {
    const params = {};
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.isActive !== undefined) params.isActive = filters.isActive;
    if (filters.search) params.search = filters.search;
    
    const response = await api.get('/admin/products', { params });
    return { success: true, data: response.data.data };
  },
  
  async create(data) {
    const response = await api.post('/admin/products', data);
    return { success: true, data: response.data.data };
  },
  
  async update(id, data) {
    const response = await api.put(`/admin/products/${id}`, data);
    return { success: true, data: response.data.data };
  },
  
  async delete(id) {
    const response = await api.delete(`/admin/products/${id}`);
    return { success: true };
  }
};
```

## Key Features

### 1. Product Management (Admin)
**Components:**
- `ProductsTab.jsx` - Main container, search, category switching
- `ProductsTable.jsx` - Table display, edit/delete actions
- `ProductForm.jsx` - Modal form, ingredient management
- `CategorySidebar.jsx` - Category list with product counts

**Features:**
- ✅ Global search across all categories (debounced 300ms)
- ✅ Category filtering
- ✅ Ingredient search and selection
- ✅ Create new ingredient inline
- ✅ Ingredient quantity per product
- ✅ Soft delete (isActive: false)
- ✅ Real-time category count updates

**Search Implementation:**
```javascript
// ProductsTab.jsx
const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  if (activeCategory) {
    const timer = setTimeout(() => {
      fetchProducts(activeCategory.id, searchTerm);
    }, 300); // Debounce
    return () => clearTimeout(timer);
  }
}, [activeCategory, searchTerm]);

const fetchProducts = async (categoryId, search = '') => {
  const filters = { isActive: true };
  
  if (search && search.trim()) {
    filters.search = search.trim();
    // No categoryId filter when searching globally
  } else if (categoryId) {
    filters.categoryId = categoryId;
  }
  
  const result = await productService.getAll(filters);
  setProducts(result.data);
};
```

**Ingredient Management:**
```javascript
// ProductForm.jsx
const [selectedIngredients, setSelectedIngredients] = useState([]);
const [ingredientSearch, setIngredientSearch] = useState('');
const [ingredientResults, setIngredientResults] = useState([]);
const [newIngredient, setNewIngredient] = useState({
  name: '',
  unit: '',
  costPerUnit: 0,
});

// Search ingredients
useEffect(() => {
  if (ingredientSearch.trim()) {
    ingredientService.search(ingredientSearch).then(results => {
      setIngredientResults(results.data);
    });
  }
}, [ingredientSearch]);

// Add ingredient to product
const handleSelectIngredient = (ingredient) => {
  setSelectedIngredients([...selectedIngredients, {
    id: ingredient.id,
    name: ingredient.name,
    unit: ingredient.unit,
    quantity: 1
  }]);
};

// Submit with ingredients
const handleSubmit = async () => {
  const productData = {
    name, price, taxPercent, categoryId,
    ingredients: selectedIngredients.map(ing => ({
      ingredientId: ing.id,
      quantity: ing.quantity
    }))
  };
  
  await productService.create(productData);
};
```

### 2. POS System (Cashier)
**Components:**
- `POSPage.jsx` - Main container
- `TableSelection.jsx` - Floor/table picker
- `OrderEntry.jsx` - Product selection, order lines
- `PaymentModal.jsx` - Payment processing

**Flow:**
1. Open POS session (cash drawer)
2. Select floor → table
3. Add products to order (qty, price, tax auto-calculated)
4. Submit order → creates kitchen ticket
5. Process payment (cash/digital/UPI)
6. Close session at shift end

### 3. Kitchen Display
**Components:**
- `KitchenPage.jsx` - Ticket dashboard
- `TicketCard.jsx` - Individual ticket with status buttons

**Features:**
- Real-time updates via Socket.IO
- Status control: to_cook → preparing → ready
- Filters by kitchen station
- Auto-refresh on new orders

**Socket.IO Integration:**
```javascript
// KitchenPage.jsx
useEffect(() => {
  const socket = io(import.meta.env.VITE_API_URL);
  
  socket.on('connect', () => {
    socket.emit('join-kitchen', { station: 'GRILL' });
  });
  
  socket.on('ticket-update', (ticket) => {
    setTickets(prev => prev.map(t => t.id === ticket.id ? ticket : t));
  });
  
  return () => socket.disconnect();
}, []);
```

### 4. Admin Dashboard
**Components:**
- `DashboardTab.jsx` - KPI cards, charts
- `ReportsTab.jsx` - Session reports, sales analytics
- `AITab.jsx` - Demand forecasting, waste risk

**Charts (Recharts):**
- Line chart: Daily sales trend
- Bar chart: Top products by revenue
- Pie chart: Category-wise distribution

## Styling (TailwindCSS)

### Color Palette
```javascript
// Neutral-based design
bg-neutral-50      // Light backgrounds
bg-neutral-900     // Dark buttons, headers
text-neutral-600   // Muted text
border-neutral-200 // Subtle borders
```

### Component Patterns
```jsx
// Button (primary)
<button className="px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-colors">
  Submit
</button>

// Input field
<input 
  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500"
  type="text"
/>

// Modal overlay
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    {/* Modal content */}
  </div>
</div>
```

## Environment Variables
```env
VITE_API_URL=http://localhost:3000
```

## Build & Deploy
```bash
# Development
npm run dev  # Vite dev server on port 5173

# Production build
npm run build  # Outputs to dist/

# Preview production build
npm run preview
```

## Docker (Production)
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Dependencies (Key)
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.13.0",
  "axios": "^1.13.4",
  "zustand": "^5.0.10",
  "recharts": "^3.7.0",
  "socket.io-client": "^4.8.3"
}
```

## Recent Changes
✅ Ingredient search UI in product form
✅ Global product search (ignores category filter)
✅ Debounced search (300ms delay)
✅ Category column in search results
✅ Ingredient creation inline
✅ Category counter shows only active products
✅ Delete functionality with soft delete pattern
