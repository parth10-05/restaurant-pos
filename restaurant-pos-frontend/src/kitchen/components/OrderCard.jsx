import React from 'react';
import KitchenItemRow from './KitchenItemRow';
import { formatDuration } from '../../utils/formatters';

/**
 * Order card component for kitchen display
 * Shows table info, order details, and items with their status
 */
export default function OrderCard({ order, onItemStatusChange, updatingItems }) {
  // Check if any item is critical or warning
  const getOrderUrgency = () => {
    if (!order.items || order.items.length === 0) return 'NORMAL';

    let hasCritical = false;
    let hasWarning = false;

    order.items.forEach(item => {
      if (!item.sentToKitchenAt || item.kitchenStatus === 'READY') return;

      const sentTime = new Date(item.sentToKitchenAt);
      const now = new Date();
      const elapsedMinutes = Math.floor((now - sentTime) / 1000 / 60);

      if (elapsedMinutes > 10) hasCritical = true;
      else if (elapsedMinutes >= 5) hasWarning = true;
    });

    if (hasCritical) return 'CRITICAL';
    if (hasWarning) return 'WARNING';
    return 'NORMAL';
  };

  const orderUrgency = getOrderUrgency();

  // Calculate time since first item was sent
  const getTimeSince = () => {
    if (!order.items || order.items.length === 0) return 'N/A';
    
    const firstItem = order.items.reduce((earliest, item) => {
      if (!earliest || new Date(item.sentToKitchenAt) < new Date(earliest.sentToKitchenAt)) {
        return item;
      }
      return earliest;
    }, null);

    if (!firstItem || !firstItem.sentToKitchenAt) return 'N/A';

    const sentTime = new Date(firstItem.sentToKitchenAt);
    const now = new Date();
    const diffMs = now - sentTime;

    if (diffMs < 60000) return 'Just now';
    return formatDuration(diffMs);
  };

  // Get border color based on urgency and readiness
  const getBorderClass = () => {
    if (order.isReadyToServe) return 'border-green-500 shadow-green-100';
    if (orderUrgency === 'CRITICAL') return 'border-red-500 shadow-red-100';
    if (orderUrgency === 'WARNING') return 'border-orange-400 shadow-orange-100';
    return 'border-neutral-300';
  };

  return (
    <div
      className={`bg-white rounded-xl border-2 shadow-lg overflow-hidden transition-all ${getBorderClass()}`}
    >
      {/* Order Header */}
      <div
        className={`px-6 py-5 border-b-2 ${
          order.isReadyToServe
            ? 'bg-green-50 border-green-200'
            : 'bg-neutral-50 border-neutral-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Table
              </span>
              <span className="text-4xl font-bold text-neutral-900 leading-none mt-1">
                {order.tableNumber}
              </span>
            </div>
            
            <div className="h-14 w-px bg-neutral-300"></div>
            
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Order
              </span>
              <span className="text-xl font-bold text-neutral-800 mt-1">
                #{order.orderNumber}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Time
            </span>
            <span className={`text-xl font-bold mt-1 ${
              orderUrgency === 'CRITICAL' ? 'text-red-600' :
              orderUrgency === 'WARNING' ? 'text-amber-600' :
              'text-neutral-900'
            }`}>
              {getTimeSince()}
            </span>
          </div>
        </div>

        {/* Ready to Serve Indicator */}
        {order.isReadyToServe && (
          <div className="mt-4 flex items-center justify-center">
            <div className="bg-green-600 text-white px-8 py-2.5 rounded-full font-bold text-sm uppercase tracking-wider shadow-md">
              Ready to Serve
            </div>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="divide-y divide-neutral-200">
        {order.items && order.items.length > 0 ? (
          order.items.map((item) => (
            <KitchenItemRow
              key={item.id}
              item={item}
              onStatusChange={onItemStatusChange}
              isUpdating={updatingItems?.has(item.id)}
            />
          ))
        ) : (
          <div className="p-6 text-center text-neutral-500">
            No items in this order
          </div>
        )}
      </div>
    </div>
  );
}
