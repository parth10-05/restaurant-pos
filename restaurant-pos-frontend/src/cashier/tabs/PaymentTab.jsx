import { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { orderService } from '../../services/order.service';
import { downloadReceipt } from '../../services/settings.service';

export default function PaymentTab({ hasSession }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [posConfig, setPosConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (hasSession) {
      loadOrders();
      loadPosConfig();
      
      // Auto-refresh only when no orders are present (empty list)
      // Don't refresh if there are orders - it disrupts the user experience
      const interval = setInterval(() => {
        if (orders.length === 0) {
          loadOrders();
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [hasSession, orders.length]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await orderService.getSessionOrders();
      
      if (result.success && result.data.data) {
        // Filter only completed orders (ready for payment)
        const payableOrders = result.data.data.filter(
          order => order.status === 'completed'
        );
        setOrders(payableOrders);
      } else if (result.success && result.data) {
        // Handle case where data is directly in result.data (not nested)
        const payableOrders = result.data.filter(
          order => order.status === 'completed'
        );
        setOrders(payableOrders);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPosConfig = async () => {
    try {
      const response = await api.get('/cashier/pos-config');
      if (response.data.success) {
        setPosConfig(response.data.data);
      }
    } catch (err) {
      console.error('Error loading POS config:', err);
    }
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setPaymentMethod('');
    setError('');
  };

  const handlePayment = async () => {
    if (!selectedOrder || !paymentMethod) {
      setError('Please select payment method');
      return;
    }

    setProcessingPayment(true);
    setError('');

    try {
      const result = await orderService.payOrder(selectedOrder.id, paymentMethod);
      
      if (result.success) {
        // Payment successful - auto download receipt
        try {
          await downloadReceipt(selectedOrder.id);
        } catch (receiptErr) {
          console.error('Receipt download failed:', receiptErr);
          // Don't block success flow if receipt fails
        }

        // Reset and refresh
        setSelectedOrder(null);
        setPaymentMethod('');
        await loadOrders();
        
        alert('Payment processed successfully!');
      } else {
        setError(result.error || 'Payment failed');
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getAvailablePaymentMethods = () => {
    if (!posConfig) return [];
    
    const methods = [];
    if (posConfig.enableCash) methods.push({ id: 'cash', label: 'Cash', icon: '💵' });
    if (posConfig.enableDigital) methods.push({ id: 'digital', label: 'Card/Digital', icon: '💳' });
    if (posConfig.enableUpi) methods.push({ id: 'upi', label: 'UPI', icon: '📱' });
    
    return methods;
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
            An administrator must open a POS session before you can process payments.
          </p>
        </div>
      </div>
    );
  }

  const availablePaymentMethods = getAvailablePaymentMethods();

  return (
    <div className="h-full">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-300px)]">
        {/* LEFT: Orders List */}
        <div className="col-span-4 bg-white border border-neutral-200 rounded-lg p-6 overflow-y-auto">
          <h3 className="text-sm font-bold text-neutral-900 uppercase mb-4">
            Orders Ready for Payment
          </h3>

          {loading ? (
            <div className="text-sm text-neutral-500 text-center py-8">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-sm text-neutral-500 text-center py-8">
              No orders ready for payment
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map(order => (
                <button
                  key={order.id}
                  onClick={() => handleOrderSelect(order)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedOrder?.id === order.id
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-bold text-neutral-900">
                      {order.table?.floor?.name} - Table {order.table?.number}
                    </div>
                    <div className="text-xs text-neutral-500">
                      #{order.id.substring(0, 8).toUpperCase()}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-neutral-900">
                    ₹{order.total.toFixed(2)}
                  </div>
                  <div className="text-xs text-neutral-600 mt-1">
                    {order.orderLines?.length || 0} items
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CENTER: Order Details & Payment */}
        <div className="col-span-8 space-y-6">
          {!selectedOrder ? (
            <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-neutral-500">Select an order to process payment</p>
            </div>
          ) : (
            <>
              {/* Order Summary */}
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <h3 className="text-sm font-bold text-neutral-900 uppercase mb-4">
                  Order Summary
                </h3>

                <div className="mb-4 pb-4 border-b border-neutral-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-600">Order ID:</span>
                    <span className="font-medium text-neutral-900">
                      #{selectedOrder.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Table:</span>
                    <span className="font-medium text-neutral-900">
                      {selectedOrder.table?.floor?.name} - Table {selectedOrder.table?.number}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {selectedOrder.orderLines?.map((line, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-neutral-700">
                        {line.name} × {line.qty}
                      </span>
                      <span className="font-medium text-neutral-900">
                        ₹{(line.price * line.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-neutral-200 space-y-2">
                  <div className="flex justify-between text-base">
                    <span className="font-semibold text-neutral-900">Total Amount</span>
                    <span className="text-2xl font-bold text-neutral-900">
                      ₹{selectedOrder.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <h3 className="text-sm font-bold text-neutral-900 uppercase mb-4">
                  Select Payment Method
                </h3>

                {availablePaymentMethods.length === 0 ? (
                  <div className="text-sm text-neutral-500 text-center py-8">
                    No payment methods enabled. Contact administrator.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {availablePaymentMethods.map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        disabled={processingPayment}
                        className={`p-6 rounded-lg border-2 transition-all ${
                          paymentMethod === method.id
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-200 hover:border-neutral-400'
                        } ${processingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-3xl mb-2">{method.icon}</div>
                        <div className="text-sm font-medium">{method.label}</div>
                      </button>
                    ))}
                  </div>
                )}

                {paymentMethod === 'upi' && posConfig?.upiId && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-center">
                    <div className="text-xs text-neutral-600 mb-2">UPI ID</div>
                    <div className="text-sm font-mono font-bold text-neutral-900">
                      {posConfig.upiId}
                    </div>
                    <div className="text-xs text-neutral-500 mt-2">
                      Amount: ₹{selectedOrder.total.toFixed(2)}
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={!paymentMethod || processingPayment}
                  className="w-full mt-6 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingPayment ? 'Processing...' : `Confirm Payment - ₹${selectedOrder.total.toFixed(2)}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
