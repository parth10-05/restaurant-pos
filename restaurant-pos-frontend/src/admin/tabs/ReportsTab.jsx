import React, { useState, useEffect } from 'react';
import ReportFilters from '../components/ReportFilters';
import MetricsOverview from '../components/MetricsOverview';
import PaymentMethodChart from '../components/PaymentMethodChart';
import SessionPerformanceTable from '../components/SessionPerformanceTable';
import SessionRevenueChart from '../components/SessionRevenueChart';
import TopProductsChart from '../components/TopProductsChart';
import { reportService } from '../../services/report.service';
import { categoryService } from '../../services/product.service';
import { useReportFilters } from '../../hooks/useReportFilters';

export default function ReportsTab() {
  const { getBackendParams, applyFrontendFilters, calculateFilteredSummary, filters } = useReportFilters();
  
  const [rawData, setRawData] = useState({
    summary: null,
    payments: [],
    sessions: [],
    products: [],
  });
  
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState({
    summary: false,
    payments: false,
    sessions: false,
    products: false,
  });

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      const result = await categoryService.getAll();
      if (result.success) {
        setCategories(result.data);
      }
    };
    fetchCategories();
  }, []);

  // Fetch all reports from backend
  const fetchReports = async () => {
    const params = getBackendParams();
    
    // Set all loading states
    setLoading({
      summary: true,
      payments: true,
      sessions: true,
      products: true,
    });

    // Fetch all reports in parallel (backend filters: date only)
    const [summaryResult, paymentsResult, sessionsResult, productsResult] = await Promise.all([
      reportService.getSummary(params.from, params.to),
      reportService.getPaymentReport(params.from, params.to),
      reportService.getSessionReport(params.from, params.to),
      reportService.getProductReport(params.from, params.to),
    ]);

    // Store raw data
    const newRawData = {
      summary: summaryResult.success ? summaryResult.data : null,
      payments: paymentsResult.success ? paymentsResult.data : [],
      sessions: sessionsResult.success ? sessionsResult.data : [],
      products: productsResult.success ? productsResult.data : [],
    };
    
    setRawData(newRawData);

    // Clear loading states
    setLoading({
      summary: false,
      payments: false,
      sessions: false,
      products: false,
    });
  };

  // Load initial data on mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Apply frontend filters to raw data
  const filteredSessions = applyFrontendFilters(rawData.sessions, 'sessions');
  const filteredPayments = applyFrontendFilters(rawData.payments, 'payments');
  const filteredProducts = applyFrontendFilters(rawData.products, 'products');
  
  // Calculate filtered summary metrics
  const filteredSummary = rawData.summary && rawData.sessions.length > 0
    ? (() => {
        const calculated = calculateFilteredSummary(rawData.sessions, rawData.payments);
        return {
          ...rawData.summary,
          totalRevenue: calculated.totalRevenue,
          totalOrders: calculated.totalOrders,
          averageOrderValue: calculated.averageOrderValue,
        };
      })()
    : rawData.summary;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Reports & Analytics</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Performance insights and revenue analysis
        </p>
        
        {/* Active Filter Indicators */}
        {(filters.sessionStatus !== 'all' || filters.paymentMethods.length > 0 || filters.categoryNames.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-medium text-neutral-600">Active Filters:</span>
            {filters.sessionStatus !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-900 text-white">
                Session: {filters.sessionStatus}
              </span>
            )}
            {filters.paymentMethods.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-900 text-white">
                Payment: {filters.paymentMethods.join(', ')}
              </span>
            )}
            {filters.categoryNames.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-900 text-white">
                Categories: {filters.categoryNames.join(', ')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <ReportFilters onApply={fetchReports} categories={categories} />

      {/* Key Metrics */}
      <MetricsOverview data={filteredSummary} loading={loading.summary} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment Method Chart */}
        <PaymentMethodChart data={filteredPayments} loading={loading.payments} />

        {/* Session Performance Summary */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Session Summary</h3>
          {loading.sessions ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-neutral-200 rounded w-full"></div>
              <div className="h-4 bg-neutral-100 rounded w-3/4"></div>
              <div className="h-4 bg-neutral-200 rounded w-full"></div>
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Total Sessions</span>
                <span className="text-xl font-semibold text-neutral-900">{filteredSessions.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Open Sessions</span>
                <span className="text-xl font-semibold text-green-600">
                  {filteredSessions.filter((s) => s.status === 'open').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Closed Sessions</span>
                <span className="text-xl font-semibold text-neutral-900">
                  {filteredSessions.filter((s) => s.status === 'closed').length}
                </span>
              </div>
              <div className="pt-3 border-t border-neutral-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Avg Revenue per Session</span>
                  <span className="text-lg font-semibold text-neutral-900">
                    ₹
                    {(
                      filteredSessions.reduce((sum, s) => sum + s.totalRevenue, 0) / filteredSessions.length
                    ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">No session data available</div>
          )}
        </div>
      </div>

      {/* Session Performance Table */}
      <SessionPerformanceTable data={filteredSessions} loading={loading.sessions} />

      {/* Session-wise Revenue Chart */}
      <SessionRevenueChart data={filteredSessions} loading={loading.sessions} />

      {/* Top Products */}
      <TopProductsChart data={filteredProducts} loading={loading.products} />
    </div>
  );
}
