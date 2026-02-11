import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import OrderCard from './components/OrderCard';
import StationSelector from './components/StationSelector';
import StockManagement from './components/StockManagement';
import kitchenService from '../services/kitchen.service';
import { formatDuration } from '../utils/formatters';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Enhanced Kitchen Dashboard Component
 * Production-grade Kitchen Display System (KDS)
 * 
 * Features:
 * - Real-time WebSocket updates
 * - Item-level status tracking
 * - Time-based urgency indicators
 * - Kitchen station routing/filtering
 * - Incremental order updates
 * - Clear "Ready to Serve" indication
 */
export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [showStockManagement, setShowStockManagement] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  
  const socketRef = useRef(null);

  /**
   * Initialize Socket.IO connection for real-time updates
   */
  useEffect(() => {
    const token = localStorage.getItem('token'); // Changed from 'authToken' to 'token'
    
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Connection status handlers
    socket.on('connect', () => {
      console.log('[KDS] Socket.IO connected');
      setIsSocketConnected(true);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('[KDS] Socket.IO disconnected:', reason);
      setIsSocketConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[KDS] Socket.IO connection error:', error);
      setIsSocketConnected(false);
    });

    // Real-time event handlers
    socket.on('kitchen:item:new', (data) => {
      console.log('[KDS] New items received:', data);
      handleNewItems(data.items);
    });

    socket.on('kitchen:item:update', (data) => {
      console.log('[KDS] Item status updated:', data);
      handleItemUpdate(data.item);
    });

    socket.on('kitchen:order:update', (data) => {
      console.log('[KDS] Order status updated:', data);
      handleOrderUpdate(data.order);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  /**
   * Handle new items from real-time events
   * Prevents duplicate items if order already exists
   */
  const handleNewItems = useCallback((newItems) => {
    if (!newItems || newItems.length === 0) return;

    setOrders(prevOrders => {
      const orderMap = new Map(prevOrders.map(o => [o.orderId, o]));
      
      newItems.forEach(item => {
        const orderId = item.orderId;
        
        if (orderMap.has(orderId)) {
          // Order exists, check if item already present
          const existingOrder = orderMap.get(orderId);
          const itemExists = existingOrder.items.some(i => i.id === item.id);
          
          if (!itemExists) {
            // Add new item to existing order
            orderMap.set(orderId, {
              ...existingOrder,
              items: [...existingOrder.items, item]
            });
          }
        } else {
          // Create new order entry
          orderMap.set(orderId, {
            orderId: orderId,
            orderNumber: item.orderNumber || `#${orderId}`,
            table: item.table || null,
            createdAt: item.sentToKitchenAt,
            items: [item]
          });
        }
      });

      return Array.from(orderMap.values());
    });
    
    setLastUpdate(new Date());
  }, []);

  /**
   * Handle item status update from real-time events
   */
  const handleItemUpdate = useCallback((updatedItem) => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.orderId !== updatedItem.orderId) return order;
        
        return {
          ...order,
          items: order.items.map(item =>
            item.id === updatedItem.id ? updatedItem : item
          )
        };
      })
    );
    
    setLastUpdate(new Date());
  }, []);

  /**
   * Handle order-level updates (e.g., all items ready)
   */
  const handleOrderUpdate = useCallback((updatedOrder) => {
    setOrders(prevOrders => {
      const orderExists = prevOrders.some(o => o.orderId === updatedOrder.orderId);
      
      if (!orderExists) return prevOrders;
      
      // Check if all items are ready
      const allItemsReady = updatedOrder.items?.every(
        item => item.kitchenStatus === 'READY'
      );
      
      if (allItemsReady) {
        // Remove order after 30 seconds
        setTimeout(() => {
          setOrders(prev => prev.filter(o => o.orderId !== updatedOrder.orderId));
        }, 30000);
      }
      
      return prevOrders.map(order =>
        order.orderId === updatedOrder.orderId ? updatedOrder : order
      );
    });
    
    setLastUpdate(new Date());
  }, []);

  // Fetch kitchen orders (with station filter)
  const fetchOrders = useCallback(async () => {
    try {
      const data = await kitchenService.getKitchenOrders(selectedStation);
      setOrders(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch kitchen orders:', err);
      setError(err.response?.data?.message || 'Failed to load kitchen orders');
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  // Fetch low stock count for badge
  const fetchLowStockCount = useCallback(async () => {
    try {
      const result = await kitchenService.getLowStockAlerts();
      setLowStockCount(result.count || 0);
    } catch (err) {
      console.error('Failed to fetch low stock count:', err);
    }
  }, []);

  // Handle item status change
  const handleItemStatusChange = async (itemId, newStatus) => {
    // Prevent multiple simultaneous updates on same item
    if (updatingItems.has(itemId)) {
      return;
    }

    try {
      // Mark item as updating
      setUpdatingItems(prev => new Set(prev).add(itemId));

      // Update on server first (no optimistic update to avoid race conditions)
      await kitchenService.updateItemStatus(itemId, newStatus);

      // Refresh to get accurate state (including isReadyToServe)
      await fetchOrders();
      
      setError(null);
    } catch (err) {
      console.error('Failed to update item status:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update item status';
      setError(errorMessage);
      
      // Refresh to ensure we have correct state
      await fetchOrders();
    } finally {
      // Remove item from updating set
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Initial fetch and refetch on station change
  useEffect(() => {
    fetchOrders();
    fetchLowStockCount();
  }, [fetchOrders, fetchLowStockCount, selectedStation]);

  // Polling fallback (only when socket disconnected)
  useEffect(() => {
    if (isSocketConnected) return; // Skip polling when socket is active
    
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchOrders, isSocketConnected]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchOrders();
  };

  // Format last update time
  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    
    const now = new Date();
    const diffMs = now - lastUpdate;
    
    if (diffMs < 10000) return 'Just now';
    if (diffMs < 60000) return `${Math.floor(diffMs / 1000)}s ago`;
    
    return formatDuration(diffMs) + ' ago';
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-neutral-300 shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-neutral-900">
                Kitchen Display System
              </h1>
              <div className="h-8 w-px bg-neutral-300"></div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <div className={`w-2 h-2 rounded-full ${
                  isSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
                }`}></div>
                <span>{isSocketConnected ? 'Real-time' : 'Polling'}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Last Update */}
              <div className="text-sm text-neutral-600">
                Updated: {formatLastUpdate()}
              </div>

              {/* Stock Management Button */}
              <button
                onClick={() => setShowStockManagement(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium relative flex items-center gap-2"
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                    <path
                        d="M20.5 7.27783L12 12.0001M12 12.0001L3.49997 7.27783M12 12.0001L12 21.5001M21 16.0586V7.94153C21 7.59889 21 7.42757 20.9495 7.27477C20.9049 7.13959 20.8318 7.01551 20.7354 6.91082C20.6263 6.79248 20.4766 6.70928 20.177 6.54288L12.777 2.43177C12.4934 2.27421 12.3516 2.19543 12.2015 2.16454C12.0685 2.13721 11.9315 2.13721 11.7986 2.16454C11.6484 2.19543 11.5066 2.27421 11.223 2.43177L3.82297 6.54288C3.52345 6.70928 3.37369 6.79248 3.26463 6.91082C3.16816 7.01551 3.09515 7.13959 3.05048 7.27477C3 7.42757 3 7.59889 3 7.94153V16.0586C3 16.4013 3 16.5726 3.05048 16.7254C3.09515 16.8606 3.16816 16.9847 3.26463 17.0893C3.37369 17.2077 3.52345 17.2909 3.82297 17.4573L11.223 21.5684C11.5066 21.726 11.6484 21.8047 11.7986 21.8356C11.9315 21.863 12.0685 21.863 12.2015 21.8356C12.3516 21.8047 12.4934 21.726 12.777 21.5684L20.177 17.4573C20.4766 17.2909 20.6263 17.2077 20.7354 17.0893C20.8318 16.9847 20.9049 16.8606 20.9495 16.7254C21 16.5726 21 16.4013 21 16.0586Z"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path d="M16.5 9.5L7.5 4.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Stock
                {lowStockCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                    {lowStockCount}
                  </span>
                )}
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Station Selector */}
          <div className="mt-4">
            <StationSelector
              selectedStation={selectedStation}
              onStationChange={setSelectedStation}
            />
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <main className="px-6 py-6">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-neutral-600 text-lg">Loading orders...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border-2 border-dashed border-neutral-300">
            <svg
              className="w-16 h-16 text-neutral-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-xl text-neutral-600 font-medium">No active orders</p>
            <p className="text-sm text-neutral-500 mt-2">
              Orders will appear here when sent to kitchen
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                onItemStatusChange={handleItemStatusChange}
                updatingItems={updatingItems}
              />
            ))}
          </div>
        )}
      </main>

      {/* Stock Management Modal */}
      <StockManagement
        isOpen={showStockManagement}
        onClose={() => {
          setShowStockManagement(false);
          fetchLowStockCount(); // Refresh count when closing
        }}
      />
    </div>
  );
}
