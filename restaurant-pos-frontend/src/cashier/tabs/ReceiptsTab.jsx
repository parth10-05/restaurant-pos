import { useState, useEffect } from 'react';
import { orderService } from '../../services/order.service';
import ReceiptDownloadButton from '../../components/ReceiptDownloadButton';

export default function ReceiptsTab({ hasSession = false, onSessionRequired }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllOrders, setShowAllOrders] = useState(false);

  const fetchOrders = async () => {
    if (!hasSession) {
      setLoading(false);
      setOrders([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await orderService.getSessionOrders();
      
      if (result.success) {
        // Sort by most recent first
        const sortedOrders = (result.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sortedOrders);
      } else {
        // Check if it's a session error
        if (result.error?.includes('session') || result.error?.includes('Session')) {
          setError('No open POS session. Please open a session first to view orders.');
        } else {
          setError(result.error);
        }
      }
    } catch {
      setError('Failed to load orders. Please ensure you have an open POS session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Auto-refresh every 30 seconds if there's a session
    if (hasSession) {
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [hasSession]);

  // Filter orders based on toggle
  const displayedOrders = showAllOrders 
    ? orders 
    : orders.filter(order => order.status === 'paid');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
      draft: { label: 'Draft', className: 'bg-yellow-100 text-yellow-800' },
      sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-neutral-100 text-neutral-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Receipt History</h2>
          <p className="text-sm text-neutral-600 mt-1">
            View and download receipts for session orders
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Show All Orders Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAllOrders}
              onChange={(e) => setShowAllOrders(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
            />
            <span className="text-sm text-neutral-700">Show all orders</span>
          </label>

          {/* Refresh Button */}
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && orders.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-neutral-900 border-r-transparent"></div>
            <p className="mt-4 text-sm text-neutral-600">Loading orders...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && displayedOrders.length === 0 && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-neutral-900">
            {showAllOrders ? 'No orders found' : 'No paid orders found'}
          </h3>
          <p className="mt-2 text-sm text-neutral-600">
            {showAllOrders
              ? 'Orders will appear here once created'
              : 'Paid orders will appear here for receipt download'}
          </p>
        </div>
      )}

      {/* Orders Table */}
      {!loading && displayedOrders.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {displayedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        #{order.id.substring(0, 8).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">
                        {order.table?.floor?.name || 'N/A'} - Table {order.table?.number || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(order.payment?.amount || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ReceiptDownloadButton
                        orderId={order.id}
                        orderStatus={order.status}
                        className="text-xs px-3 py-1.5"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics Footer */}
      {!loading && displayedOrders.length > 0 && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-neutral-900">
                {displayedOrders.length}
              </div>
              <div className="text-xs text-neutral-600 mt-1">
                {showAllOrders ? 'Total Orders' : 'Paid Orders'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900">
                {displayedOrders.filter(o => o.status === 'paid').length}
              </div>
              <div className="text-xs text-neutral-600 mt-1">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  displayedOrders
                    .filter(o => o.status === 'paid')
                    .reduce((sum, o) => sum + (o.payment?.amount || 0), 0)
                )}
              </div>
              <div className="text-xs text-neutral-600 mt-1">Total Revenue</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
