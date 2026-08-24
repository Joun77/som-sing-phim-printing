import React, { useState, useMemo, useCallback } from 'react';
import type { Order, OrderStatus } from '../../types/order';

interface OrderHistoryTableProps {
  initialOrders?: Order[];
  onUpdateStatus?: (orderId: string, newStatus: OrderStatus) => Promise<void> | void;
  onUpdateOrder?: (order: Order) => Promise<void> | void;
  onSelectOrder?: (order: Order) => void;
}

interface EditModalState {
  isOpen: boolean;
  order: Order | null;
}

const statusBadgeStyles: Record<OrderStatus, string> = {
  QUOTATION: 'bg-slate-100 text-slate-700 border-slate-300',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800 border-amber-300',
  PENDING_SLIP_CHECK: 'bg-amber-100 text-amber-800 border-amber-300',
  PAID_PREPRESS: 'bg-blue-100 text-blue-800 border-blue-300',
  ORDER_CREATED: 'bg-sky-100 text-sky-800 border-sky-300',
  PREPRESS_CHECK: 'bg-purple-100 text-purple-800 border-purple-300',
  WAITING_APPROVAL: 'bg-orange-100 text-orange-800 border-orange-300',
  PROOF_REJECTED: 'bg-rose-100 text-rose-800 border-rose-300',
  FILE_CONFIRMED: 'bg-teal-100 text-teal-800 border-teal-300',
  READY_TO_PRINT: 'bg-teal-100 text-teal-800 border-teal-300',
  IN_PRODUCTION: 'bg-indigo-100 text-indigo-800 border-indigo-300 animate-pulse',
  POST_PRESS: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  FINISHING: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  SHIPPED: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  READY_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  REQUIRES_MANAGER_APPROVAL: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const OrderRow = React.memo(function OrderRow({
  order,
  onCopyTracking,
  onStatusChange,
  onEdit,
  onSelect,
}: {
  order: Order;
  onCopyTracking: (code: string) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onEdit: (order: Order) => void;
  onSelect?: (order: Order) => void;
}) {
  const tracking = order.tracking_code || order.order_no || order.id;

  return (
    <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-200">
      <td className="px-4 py-3 text-xs font-mono font-bold text-slate-900">
        <div className="flex items-center gap-1.5">
          <span>{tracking}</span>
          <button
            type="button"
            title="Copy Tracking Code"
            onClick={(e) => {
              e.stopPropagation();
              onCopyTracking(tracking);
            }}
            className="text-[10px] text-slate-500 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 px-1.5 py-0.5 rounded border border-slate-300"
          >
            Copy
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-semibold text-slate-800">{order.customer_name}</div>
        {order.customer_phone && <div className="text-xs text-slate-500">{order.customer_phone}</div>}
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">
        {order.items && order.items.length > 0 ? (
          <div>
            <div className="font-medium text-slate-800">{order.items[0].job_name || order.items[0].item_name}</div>
            <div className="text-slate-500">
              {order.items[0].quantity.toLocaleString()} ຊິ້ນ · {order.items[0].paper_size || 'Custom'}
            </div>
          </div>
        ) : (
          '—'
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="text-sm font-mono font-bold text-slate-900">
          {order.total_amount_lak.toLocaleString()} ₭
        </div>
        {order.deposit_lak > 0 && (
          <div className="text-[11px] text-slate-500">
            ມັດຈຳ: {order.deposit_lak.toLocaleString()} ₭
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            statusBadgeStyles[order.overall_status] || 'bg-slate-100 text-slate-800 border-slate-300'
          }`}
        >
          {order.overall_status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <select
            value={order.overall_status}
            onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
            className="text-xs rounded border border-slate-300 bg-white px-2 py-1 focus:ring-1 focus:ring-amber-500"
          >
            <option value="QUOTATION">QUOTATION</option>
            <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
            <option value="ORDER_CREATED">ORDER_CREATED</option>
            <option value="PREPRESS_CHECK">PREPRESS_CHECK</option>
            <option value="FILE_CONFIRMED">FILE_CONFIRMED</option>
            <option value="IN_PRODUCTION">IN_PRODUCTION</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button
            type="button"
            onClick={() => onEdit(order)}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded"
          >
            Edit
          </button>
          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(order)}
              className="text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded"
            >
              View
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

export const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({
  initialOrders = [],
  onUpdateStatus,
  onUpdateOrder,
  onSelectOrder,
}) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<EditModalState>({ isOpen: false, order: null });

  // Sync props if initialOrders updates
  React.useEffect(() => {
    if (initialOrders && initialOrders.length > 0) {
      setOrders(initialOrders);
    }
  }, [initialOrders]);

  const handleCopyTracking = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }, []);

  // Optimistic State Update for Status Transitions
  const handleOptimisticStatusChange = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      // 1. Snapshot previous state
      const previousOrders = [...orders];

      // 2. Optimistically update local state immediately
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId ? { ...ord, overall_status: newStatus, updated_at: new Date().toISOString() } : ord
        )
      );

      setAuditLog(`[AUDIT] Order ${orderId} transitioned to ${newStatus}`);
      setTimeout(() => setAuditLog(null), 3000);

      // 3. Perform backend API update
      try {
        if (onUpdateStatus) {
          await onUpdateStatus(orderId, newStatus);
        } else {
          const response = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
        }
      } catch (err) {
        // Rollback on network failure
        console.error('Failed to update status, rolling back optimistic state:', err);
        setOrders(previousOrders);
        setAuditLog(`[ERROR] Rollback: Failed to update status for ${orderId}`);
      }
    },
    [orders, onUpdateStatus]
  );

  const handleOpenEdit = useCallback((order: Order) => {
    setEditModal({ isOpen: true, order: { ...order } });
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditModal({ isOpen: false, order: null });
  }, []);

  const handleSaveDirectEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editModal.order) return;

      const updatedOrder = editModal.order;
      const previousOrders = [...orders];

      // Optimistic update
      setOrders((prev) =>
        prev.map((ord) => (ord.id === updatedOrder.id ? { ...updatedOrder, updated_at: new Date().toISOString() } : ord))
      );

      setAuditLog(`[AUDIT] Direct edit saved for Order ${updatedOrder.id}`);
      setTimeout(() => setAuditLog(null), 3000);
      handleCloseEdit();

      try {
        if (onUpdateOrder) {
          await onUpdateOrder(updatedOrder);
        } else {
          await fetch(`http://localhost:8080/api/v1/orders/${updatedOrder.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedOrder),
          });
        }
      } catch (err) {
        console.error('Failed to save direct edit, rolling back:', err);
        setOrders(previousOrders);
        setAuditLog(`[ERROR] Rollback: Failed to save edits for ${updatedOrder.id}`);
      }
    },
    [editModal.order, orders, onUpdateOrder, handleCloseEdit]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.tracking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || order.overall_status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ລູກຄ້າ, ເລກອໍເດີ, Tracking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-3 py-2 w-full md:w-72 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">ທຸກສະຖານະ (All Status)</option>
            <option value="QUOTATION">QUOTATION</option>
            <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
            <option value="ORDER_CREATED">ORDER_CREATED</option>
            <option value="PREPRESS_CHECK">PREPRESS_CHECK</option>
            <option value="FILE_CONFIRMED">FILE_CONFIRMED</option>
            <option value="IN_PRODUCTION">IN_PRODUCTION</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {auditLog && (
            <div className="text-xs font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300">
              {auditLog}
            </div>
          )}
          {copiedCode && (
            <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              ✓ Copied tracking: {copiedCode}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <th className="px-4 py-3">Tracking Code</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Job / Spec</th>
              <th className="px-4 py-3 text-right">Total Amount (LAK)</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Action / Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onCopyTracking={handleCopyTracking}
                  onStatusChange={handleOptimisticStatusChange}
                  onEdit={handleOpenEdit}
                  onSelect={onSelectOrder}
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">
                  ບໍ່ພົບລາຍການອໍເດີທີ່ຄົ້ນຫາ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Direct Edit Modal */}
      {editModal.isOpen && editModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                ແກ້ໄຂອໍເດີ (Direct Edit): {editModal.order.tracking_code || editModal.order.order_no}
              </h3>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDirectEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ຊື່ລູກຄ້າ</label>
                <input
                  type="text"
                  required
                  value={editModal.order.customer_name}
                  onChange={(e) =>
                    setEditModal((prev) =>
                      prev.order ? { ...prev, order: { ...prev.order, customer_name: e.target.value } } : prev
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ເບີໂທ</label>
                  <input
                    type="text"
                    value={editModal.order.customer_phone || ''}
                    onChange={(e) =>
                      setEditModal((prev) =>
                        prev.order ? { ...prev, order: { ...prev.order, customer_phone: e.target.value } } : prev
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ເງິນມັດຈຳ (LAK)</label>
                  <input
                    type="number"
                    value={editModal.order.deposit_lak || 0}
                    onChange={(e) =>
                      setEditModal((prev) =>
                        prev.order
                          ? { ...prev, order: { ...prev.order, deposit_lak: parseInt(e.target.value) || 0 } }
                          : prev
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ສະຖານະ (Status)</label>
                <select
                  value={editModal.order.overall_status}
                  onChange={(e) =>
                    setEditModal((prev) =>
                      prev.order
                        ? { ...prev, order: { ...prev.order, overall_status: e.target.value as OrderStatus } }
                        : prev
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                >
                  <option value="QUOTATION">QUOTATION</option>
                  <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                  <option value="ORDER_CREATED">ORDER_CREATED</option>
                  <option value="PREPRESS_CHECK">PREPRESS_CHECK</option>
                  <option value="FILE_CONFIRMED">FILE_CONFIRMED</option>
                  <option value="IN_PRODUCTION">IN_PRODUCTION</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg"
                >
                  ບັນທຶກການແກ້ໄຂ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
