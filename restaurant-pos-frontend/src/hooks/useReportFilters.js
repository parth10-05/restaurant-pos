import { create } from 'zustand';

/**
 * Centralized Report Filter Store
 * 
 * All report components must use these filters.
 * Filters are applied consistently across all sections.
 */
export const useReportFilters = create((set, get) => ({
  // Date filters (backend-supported)
  filters: {
    fromDate: '',
    toDate: '',
    // Frontend filters (applied after fetch)
    sessionStatus: 'all', // 'all' | 'open' | 'closed'
    paymentMethods: [], // ['cash', 'digital', 'upi']
    categoryNames: [], // category filter (by name since backend returns categoryName)
  },

  // Update filters
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  // Reset all filters
  resetFilters: () => {
    set({
      filters: {
        fromDate: '',
        toDate: '',
        sessionStatus: 'all',
        paymentMethods: [],
        categoryNames: [],
      },
    });
  },

  // Get backend filter params (only date range)
  getBackendParams: () => {
    const { fromDate, toDate } = get().filters;
    const params = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    return params;
  },

  // Apply frontend filters to fetched data
  applyFrontendFilters: (data, type, categoryMap) => {
    const { sessionStatus, paymentMethods, categoryNames } = get().filters;
    
    if (!data || data.length === 0) return data;

    switch (type) {
      case 'sessions':
        return data.filter(session => {
          // Session status filter
          if (sessionStatus !== 'all' && session.status !== sessionStatus) {
            return false;
          }
          return true;
        });

      case 'payments':
        return data.filter(payment => {
          // Payment method filter
          if (paymentMethods.length > 0 && !paymentMethods.includes(payment.method)) {
            return false;
          }
          return true;
        });

      case 'products':
        return data.filter(product => {
          // Category filter by name
          if (categoryNames.length > 0 && !categoryNames.includes(product.categoryName)) {
            return false;
          }
          return true;
        });

      default:
        return data;
    }
  },

  // Calculate filtered summary metrics
  calculateFilteredSummary: (sessions, payments) => {
    const { paymentMethods, sessionStatus } = get().filters;

    // Filter sessions
    const filteredSessions = sessions.filter(s => {
      if (sessionStatus !== 'all' && s.status !== sessionStatus) return false;
      return true;
    });

    // Calculate total revenue from filtered sessions
    const totalRevenue = filteredSessions.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalOrders = filteredSessions.reduce((sum, s) => sum + s.orderCount, 0);

    // Filter payments
    const filteredPayments = payments.filter(p => {
      if (paymentMethods.length > 0 && !paymentMethods.includes(p.method)) return false;
      return true;
    });

    const paymentRevenue = filteredPayments.reduce((sum, p) => sum + p.total, 0);

    return {
      totalRevenue: paymentMethods.length > 0 ? paymentRevenue : totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? (paymentMethods.length > 0 ? paymentRevenue : totalRevenue) / totalOrders : 0,
    };
  },
}));
