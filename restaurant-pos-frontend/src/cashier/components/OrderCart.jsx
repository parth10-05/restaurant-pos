export default function OrderCart({ order, onSendOrder, onCompleteOrder, disabled }) {
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-400 px-4">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <div className="text-sm font-medium">No order created</div>
        <div className="text-xs mt-1 text-center">Select a table to start</div>
      </div>
    );
  }

  const orderLines = order.orderLines || [];
  const sentItems = orderLines.filter(line => line.sentToKitchen);
  const pendingItems = orderLines.filter(line => !line.sentToKitchen);
  
  const subtotal = orderLines.reduce((sum, line) => sum + (line.price * line.qty), 0);
  const tax = orderLines.reduce((sum, line) => sum + (line.taxAmount || 0), 0);
  const total = order.total || (subtotal + tax);

  const canSendToKitchen = pendingItems.length > 0 && order.status !== 'completed' && order.status !== 'paid';
  const canComplete = order.status === 'sent_to_kitchen' && pendingItems.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Order Header */}
      <div className="border-b border-neutral-200 pb-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-neutral-500 uppercase">Current Order</div>
          <div className={`text-xs font-bold px-2 py-1 rounded ${
            order.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'sent_to_kitchen' ? 'bg-blue-100 text-blue-800' :
            order.status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-neutral-100 text-neutral-800'
          }`}>
            {order.status === 'draft' ? 'DRAFT' :
             order.status === 'sent_to_kitchen' ? 'IN KITCHEN' :
             order.status === 'completed' ? 'COMPLETED' :
             order.status}
          </div>
        </div>
        <div className="text-sm font-bold text-neutral-900 mt-1">
          {order.table?.floor?.name} - Table {order.table?.number}
        </div>
        <div className="text-xs text-neutral-600 mt-1">
          Order #{order.id?.substring(0, 8).toUpperCase()}
        </div>
      </div>

      {/* Order Items */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {orderLines.length === 0 ? (
          <div className="text-sm text-neutral-500 text-center py-8">
            No items added yet
          </div>
        ) : (
          <>
            {/* Sent Items */}
            {sentItems.length > 0 && (
              <div>
                <div className="text-xs font-bold text-neutral-500 uppercase mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Sent to Kitchen ({sentItems.length})
                </div>
                <div className="space-y-2">
                  {sentItems.map((line, index) => (
                    <div key={`sent-${index}`} className="flex items-start justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900 truncate">
                          {line.name}
                        </div>
                        <div className="text-xs text-neutral-600 mt-1">
                          ₹{(line.price || 0).toFixed(2)} × {line.qty}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-neutral-900 ml-3">
                        ₹{((line.price || 0) * line.qty).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Items */}
            {pendingItems.length > 0 && (
              <div>
                <div className="text-xs font-bold text-neutral-500 uppercase mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Pending ({pendingItems.length})
                </div>
                <div className="space-y-2">
                  {pendingItems.map((line, index) => (
                    <div key={`pending-${index}`} className="flex items-start justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900 truncate">
                          {line.name}
                        </div>
                        <div className="text-xs text-neutral-600 mt-1">
                          ₹{(line.price || 0).toFixed(2)} × {line.qty}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-neutral-900 ml-3">
                        ₹{((line.price || 0) * line.qty).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Totals */}
      {orderLines.length > 0 && (
        <div className="border-t border-neutral-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Subtotal</span>
            <span className="font-medium text-neutral-900">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Tax</span>
            <span className="font-medium text-neutral-900">₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-neutral-200 pt-2">
            <span className="text-neutral-900">Total</span>
            <span className="text-neutral-900">₹{total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2">
        {/* Send to Kitchen Button */}
        {canSendToKitchen && (
          <button
            onClick={onSendOrder}
            disabled={disabled}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send to Kitchen ({pendingItems.length} items)
          </button>
        )}

        {/* Complete Order Button */}
        {canComplete && (
          <button
            onClick={onCompleteOrder}
            disabled={disabled}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Complete Order
          </button>
        )}

        {/* Status Messages */}
        {order.status === 'completed' && (
          <div className="text-xs text-center text-green-700 bg-green-50 rounded-lg py-2 px-3">
            Order completed. Proceed to Payment tab.
          </div>
        )}
        {order.status === 'paid' && (
          <div className="text-xs text-center text-neutral-700 bg-neutral-100 rounded-lg py-2 px-3">
            Order already paid.
          </div>
        )}
      </div>
    </div>
  );
}
