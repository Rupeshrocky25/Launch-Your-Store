import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { Package, Clock, CheckCircle2, Truck, AlertCircle, Eye, X } from 'lucide-react';

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PENDING', label: 'Order Placed' },
  { key: 'PROCESSING', label: 'Packed & Ready' },
  { key: 'SHIPPED', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export const CustomerOrders: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function loadOrders() {
      if (!user) {
        setOrders([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await api.getOrders({ customerId: user.id });
        setOrders(res);
      } catch (err) {
        console.error('Failed to load customer orders:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, [user]);

  function getStepIndex(status: OrderStatus) {
    switch (status) {
      case 'PENDING': return 0;
      case 'PROCESSING': return 1;
      case 'SHIPPED': return 2;
      case 'DELIVERED': return 3;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-zinc-900">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Order History & Tracking</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Track live dispatch status and view item receipts for your purchases.
          </p>
        </div>
      </div>

      {!user ? (
        <div className="p-12 text-center rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <Package className="w-12 h-12 stroke-[1.2] mx-auto text-zinc-300 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-800">Sign in to view your orders</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Please sign in to track your order deliveries and receipts.
          </p>
          <button
            onClick={() => openAuthModal('CUSTOMER')}
            className="mt-4 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      ) : isLoading ? (
        <div className="py-16 text-center text-xs text-zinc-400">Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <Package className="w-12 h-12 stroke-[1.2] mx-auto text-zinc-300 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-800">No orders placed yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            You haven't placed any orders yet. Visit any of our storefronts and shop handcrafted products!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const currentStepIdx = getStepIndex(order.status);
            const isCancelled = order.status === 'CANCELLED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden transition-all hover:border-zinc-300"
              >
                {/* Order Header */}
                <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-zinc-900 text-sm">{order.id}</span>
                    <span className="text-zinc-400">·</span>
                    <span className="text-zinc-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-zinc-400">·</span>
                    <span className="font-mono font-semibold text-zinc-900">₹{order.total}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : order.status === 'SHIPPED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status}
                    </span>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>
                  </div>
                </div>

                {/* Estimated Delivery Arrival Banner */}
                {!isCancelled && (
                  <div className="px-6 py-2.5 bg-emerald-50/70 border-b border-emerald-100 text-xs font-semibold text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Estimated Arrival:{' '}
                        <strong className="text-emerald-950 font-bold">
                          {order.estimatedDeliveryDate ||
                            (new Date(order.createdAt).getHours() < 14
                              ? 'Delivery by Today by 8:00 PM'
                              : 'Delivery by Tomorrow by 6:00 PM')}
                        </strong>
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      {order.status === 'DELIVERED' ? 'Order Complete' : 'Guaranteed On-Time'}
                    </span>
                  </div>
                )}

                {/* Tracking Progress Stepper */}
                {!isCancelled ? (
                  <div className="px-6 py-5 bg-white border-b border-zinc-100">
                    <div className="grid grid-cols-4 gap-2 relative">
                      {STATUS_STEPS.map((step, idx) => {
                        const isDone = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div key={step.key} className="flex flex-col items-center text-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isDone
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-zinc-100 text-zinc-400'
                              } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                            >
                              {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span
                              className={`text-[11px] font-medium mt-1.5 ${
                                isDone ? 'text-zinc-900 font-semibold' : 'text-zinc-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-3 bg-rose-50/50 border-b border-rose-100 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Order was cancelled. Inventory was automatically restored and payment refunded.</span>
                  </div>
                )}

                {/* Items preview */}
                <div className="p-4 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-md border border-zinc-100"
                          />
                        )}
                        <div>
                          <p className="font-medium text-zinc-900">{item.name}</p>
                          {item.variantLabel && (
                            <p className="text-[11px] text-zinc-500">Option: {item.variantLabel}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-500">Qty: {item.quantity}</span>
                        <span className="ml-3 font-mono font-semibold text-zinc-900">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden text-zinc-900">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-zinc-900">{selectedOrder.id}</span>
                <h3 className="text-base font-bold text-zinc-900">Order Invoice & Status History</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4 text-xs">
              {/* Delivery info */}
              <div className="p-3.5 bg-zinc-50 rounded-xl space-y-1 border border-zinc-200">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-zinc-900 text-sm">{selectedOrder.shippingAddress.fullName}</p>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedOrder.estimatedDeliveryDate || 'Delivery by Today by 8:00 PM'}
                  </span>
                </div>
                <p className="text-zinc-600">{selectedOrder.shippingAddress.street}</p>
                <p className="text-zinc-600">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.postalCode}</p>
                <p className="text-zinc-500 font-mono mt-1">Contact: {selectedOrder.customerPhone}</p>
              </div>

              {/* Status Timeline History */}
              <div>
                <h4 className="font-bold text-zinc-900 mb-2 uppercase tracking-wider text-[11px]">
                  Fulfillment Status Timeline
                </h4>
                <div className="space-y-2 border-l-2 border-zinc-200 pl-3 ml-1">
                  {selectedOrder.statusHistory.map((hist, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-white" />
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-zinc-900">{hist.status}</span>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-zinc-600 mt-0.5">{hist.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="border-t border-zinc-200 pt-3 space-y-1.5">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>GST (5%)</span>
                  <span className="font-mono">₹{selectedOrder.tax}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Shipping</span>
                  <span className="font-mono">₹{selectedOrder.shipping}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-900 text-sm border-t border-zinc-200 pt-2">
                  <span>Total Paid</span>
                  <span className="font-mono text-emerald-700">₹{selectedOrder.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
