import React from 'react';

/**
 * Kitchen item row component
 * Displays individual order item with status and click-to-advance functionality
 */
export default function KitchenItemRow({ item, onStatusChange, isUpdating }) {
  const handleClick = () => {
    // Don't allow clicks while updating
    if (isUpdating) {
      return;
    }
    
    // Determine next status
    let nextStatus = null;
    
    if (item.kitchenStatus === 'PENDING') {
      nextStatus = 'PREPARING';
    } else if (item.kitchenStatus === 'PREPARING') {
      nextStatus = 'READY';
    }
    
    if (nextStatus && onStatusChange) {
      onStatusChange(item.id, nextStatus);
    }
  };

  // Calculate urgency based on time elapsed
  const getUrgency = () => {
    if (!item.sentToKitchenAt || item.kitchenStatus === 'READY') {
      return 'NORMAL';
    }

    const sentTime = new Date(item.sentToKitchenAt);
    const now = new Date();
    const elapsedMinutes = Math.floor((now - sentTime) / 1000 / 60);

    if (elapsedMinutes > 10) return 'CRITICAL';
    if (elapsedMinutes >= 5) return 'WARNING';
    return 'NORMAL';
  };

  const urgency = getUrgency();

  // Urgency styling
  const getUrgencyStyles = () => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-red-50 border-l-4 border-l-red-500';
      case 'WARNING':
        return 'bg-orange-50 border-l-4 border-l-orange-400';
      default:
        return '';
    }
  };

  // Status badge styles
  const getStatusStyles = () => {
    switch (item.kitchenStatus) {
      case 'PENDING':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-900',
          border: 'border-amber-200',
          label: 'Pending',
        };
      case 'PREPARING':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-900',
          border: 'border-blue-200',
          label: 'Preparing',
        };
      case 'READY':
        return {
          bg: 'bg-green-50',
          text: 'text-green-900',
          border: 'border-green-200',
          label: 'Ready',
        };
      default:
        return {
          bg: 'bg-neutral-50',
          text: 'text-neutral-900',
          border: 'border-neutral-200',
          label: 'Unknown',
        };
    }
  };

  const statusStyles = getStatusStyles();
  const isClickable = item.kitchenStatus !== 'READY' && !isUpdating;
  const urgencyStyles = getUrgencyStyles();

  return (
    <div
      className={`flex items-center justify-between p-5 border-b border-neutral-200 transition-all ${
        isClickable ? 'cursor-pointer hover:bg-neutral-50 active:bg-neutral-100' : 'cursor-default'
      } ${isUpdating ? 'opacity-60' : ''} ${urgencyStyles}`}
      onClick={handleClick}
      role={isClickable ? 'button' : 'row'}
      tabIndex={isClickable ? 0 : undefined}
      onKeyPress={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <span className="text-base font-semibold text-neutral-900">
            {item.productName}
          </span>
          <span className="text-base font-bold text-neutral-600 bg-neutral-100 px-2 py-1 rounded">
            ×{item.quantity}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span
          className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide border ${statusStyles.bg} ${statusStyles.text} ${statusStyles.border}`}
        >
          {statusStyles.label}
        </span>
        
        {isUpdating ? (
          <div className="text-neutral-500 text-sm font-medium flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Updating...
          </div>
        ) : isClickable ? (
          <div className="text-neutral-400 text-xs font-medium uppercase tracking-wide">
            Tap to advance
          </div>
        ) : null}
      </div>
    </div>
  );
}
