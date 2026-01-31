import { useState } from 'react';
import { orderService } from '../../services/order.service';
import FloorTableSelector from '../components/FloorTableSelector';
import ProductSelector from '../components/ProductSelector';
import OrderCart from '../components/OrderCart';

export default function CreateOrderTab({ hasSession }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTableSelect = async (table) => {
    if (!hasSession) {
      setError('No active session. Cannot create order.');
      return;
    }

    setSelectedTable(table);
    setError('');
    setLoading(true);

    try {
      // Check if table has an active order
      const activeOrderResult = await orderService.getActiveOrderForTable(table.id);
      
      if (activeOrderResult.success && activeOrderResult.data) {
        // Table is occupied - load existing order
        setCurrentOrder(activeOrderResult.data);
      } else {
        // Table is free - create new order
        const result = await orderService.createOrder(table.id);
        if (result.success) {
          setCurrentOrder(result.data);
        } else {
          setError(result.error);
          setSelectedTable(null);
        }
      }
    } catch {
      setError('Failed to load or create order');
      setSelectedTable(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = async (product) => {
    if (!currentOrder) {
      setError('Please select a table first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await orderService.addOrderLine(currentOrder.id, product.id, 1);
      if (result.success) {
        setCurrentOrder(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Failed to add item to order');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOrder = async () => {
    if (!currentOrder) return;

    setLoading(true);
    setError('');

    try {
      const result = await orderService.sendToKitchen(currentOrder.id);
      if (result.success) {
        // Reload the order to get updated status
        const updatedResult = await orderService.getOrderById(currentOrder.id);
        if (updatedResult.success) {
          setCurrentOrder(updatedResult.data.data);
          alert('Order sent to kitchen successfully!');
        }
      } else {
        setError(result.error);
      }
    } catch {
      setError('Failed to send order to kitchen');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!currentOrder) return;

    // Confirm before completing
    if (!window.confirm('Complete this order? No more items can be added after this.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await orderService.completeOrder(currentOrder.id);
      if (result.success) {
        // Order completed - reset UI for next table
        setCurrentOrder(null);
        setSelectedTable(null);
        alert('Order completed! Proceed to Payment tab to collect payment.');
      } else {
        setError(result.error);
      }
    } catch {
      setError('Failed to complete order');
    } finally {
      setLoading(false);
    }
  };

  if (!hasSession) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Active Session</h3>
          <p className="text-sm text-neutral-600">
            An administrator must open a POS session before you can create orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Error Banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Three-Zone Layout */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-300px)]">
        {/* LEFT ZONE - Table Selection */}
        <div className="col-span-3 bg-white border border-neutral-200 rounded-lg p-6 overflow-y-auto">
          <h3 className="text-sm font-bold text-neutral-900 uppercase mb-4">
            Step 1: Select Table
          </h3>
          <FloorTableSelector
            selectedTable={selectedTable}
            onTableSelect={handleTableSelect}
            disabled={loading}
          />
        </div>

        {/* CENTER ZONE - Product Selection */}
        <div className="col-span-5 bg-white border border-neutral-200 rounded-lg p-6 overflow-y-auto">
          <h3 className="text-sm font-bold text-neutral-900 uppercase mb-4">
            Step 2: Add Products
          </h3>
          <ProductSelector
            onProductSelect={handleProductSelect}
            disabled={!currentOrder || loading}
          />
        </div>

        {/* RIGHT ZONE - Order Cart */}
        <div className="col-span-4 bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-sm font-bold text-neutral-900 uppercase mb-4">
            Order Summary
          </h3>
          <OrderCart
            order={currentOrder}
            onSendOrder={handleSendOrder}
            onCompleteOrder={handleCompleteOrder}
            disabled={loading}
          />
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-neutral-900">Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
