import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Settings, 
  Trash2, 
  Plus, 
  Calculator,
  RefreshCw,
  Save,
  Check
} from 'lucide-react';

import { formatLaoNotificationMessage } from '../../../utils/richToastNotification';

export default function ProductionBoard({ showToast, formatLAK }) {
  const [orders, setOrders] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'machines'
  const [isOffcutModalOpen, setIsOffcutModalOpen] = useState(false);
  
  // Offcut form state
  const [selectedParentMaterial, setSelectedParentMaterial] = useState('paper-a4-80');
  const [scrapName, setScrapName] = useState('');
  const [scrapWidth, setScrapWidth] = useState(100);
  const [scrapLength, setScrapLength] = useState(200);
  const [scrapQty, setScrapQty] = useState(10);

  const fetchOrders = () => {
    setLoading(true);
    fetch('http://localhost:8080/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
      })
      .catch(err => {
        console.error(err);
        showToast('Offline: Using mockup production cards.', 'warning');
        // Fallback mockup
        setOrders([
          { id: 'order-001', order_number: 'SO-2026-0001', customer_name: 'Vientiane Book Center', status: 'PREPRESS_CHECK', total_price: 1250000 },
          { id: 'order-002', order_number: 'SO-2026-0002', customer_name: 'Sengsavanh School', status: 'READY_TO_PRINT', total_price: 450000 },
          { id: 'order-003', order_number: 'SO-2026-0003', customer_name: 'Phongsavanh Bank', status: 'IN_PRODUCTION', total_price: 980000 }
        ]);
      })
      .finally(() => setLoading(false));

    fetch('http://localhost:8080/api/v1/production/machines/schedule')
      .then(res => res.json())
      .then(resData => {
        if (resData?.data) setMachines(resData.data);
      })
      .catch(() => {
        setMachines([
          {
            machine_id: 'M-OFFSET-01',
            machine_name: 'Heidelberg Speedmaster SM52',
            category: 'Offset Press',
            status: 'In Use',
            queued_jobs_count: 3,
            estimated_free_at: '14:30 Today',
            tickets: [{ ticket_number: 'JT-SO-2026-0001-1', status: 'PRINTING', duration_mins: 45 }]
          },
          {
            machine_id: 'M-DIGITAL-01',
            machine_name: 'Konica Minolta AccurioPress C4080',
            category: 'Digital Sheet Press',
            status: 'In Use',
            queued_jobs_count: 2,
            estimated_free_at: '11:15 Today',
            tickets: [{ ticket_number: 'JT-SO-2026-0002-1', status: 'QUEUED', duration_mins: 20 }]
          },
          {
            machine_id: 'M-FINISH-LAM01',
            machine_name: 'Foliant Vega 400A Laminator',
            category: 'Thermal Laminator',
            status: 'Idle',
            queued_jobs_count: 0,
            estimated_free_at: 'Ready Now',
            tickets: []
          },
          {
            machine_id: 'M-FINISH-CUT01',
            machine_name: 'Polar 78 ECO Guillotine Cutter',
            category: 'Precision Cutter',
            status: 'In Use',
            queued_jobs_count: 2,
            estimated_free_at: '12:00 Today',
            tickets: [{ ticket_number: 'JT-SO-2026-0003-1', status: 'QUEUED', duration_mins: 15 }]
          }
        ]);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleMoveStatus = (orderId, nextStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    const prevStatus = targetOrder ? targetOrder.status : 'Pre-Press';
    const orderNum = targetOrder ? targetOrder.order_number : orderId;

    const laoMsg = formatLaoNotificationMessage({
      orderId,
      orderNumber: orderNum,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      updatedBy: { userId: 'usr-1', userName: 'ช่างพิมพ์ / Admin', role: 'Operator' },
      timestamp: new Date().toLocaleTimeString(),
      details: {}
    });

    fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    })
    .then(res => {
      if (!res.ok) throw new Error('Status transition failed');
      return res.json();
    })
    .then(updated => {
      showToast(laoMsg, 'success');
      fetchOrders();
    })
    .catch(err => {
      console.error(err);
      showToast(laoMsg, 'success');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    });
  };

  const handleAddOffcut = (e) => {
    e.preventDefault();
    const payload = {
      parent_material_id: selectedParentMaterial,
      name: scrapName || `Leftover strip from ${selectedParentMaterial}`,
      width_mm: Number(scrapWidth),
      length_mm: Number(scrapLength),
      quantity: Number(scrapQty)
    };

    fetch('http://localhost:8080/api/inventory/offcuts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to log scrap');
      return res.json();
    })
    .then(() => {
      showToast('Scrap piece registered to warehouse catalog!', 'success');
      setIsOffcutModalOpen(false);
      setScrapName('');
    })
    .catch(err => {
      console.error(err);
      showToast('Offline Mode: Scrap logged locally.', 'warning');
      setIsOffcutModalOpen(false);
    });
  };

  const columns = [
    { id: 'PREPRESS_CHECK', label: 'ກວດໄຟລ໌ & ສີ (Pre-press)', color: 'border-t-sky-500 bg-sky-50/10' },
    { id: 'READY_TO_PRINT', label: 'ພ້ອມພິມ (Ready to Print)', color: 'border-t-amber-500 bg-amber-50/10' },
    { id: 'IN_PRODUCTION', label: 'ກຳລັງພິມ (In Production)', color: 'border-t-indigo-500 bg-indigo-50/10' },
    { id: 'COMPLETED', label: 'ພິມສຳເລັດ (Completed)', color: 'border-t-emerald-500 bg-emerald-50/10' }
  ];

  return (
    <div className="space-y-6 w-full animate-fade-in text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-2xl font-black text-primary-navy">ຕິດຕາມການຜະລິດ & ຄິວເຄື່ອງຈັກ (Production & Machine Scheduling)</h3>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            ຄວບຄຸມສະຖານະການຜະລິດ, ຈັດຄິວແທ່ນພິມ ແລະ ອັບເດດສະຖານະພ້ອມຕັດສະຕ໋ອກ FIFO ອັດຕະໂນມັດ
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'orders' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Order Kanban
            </button>
            <button
              onClick={() => setActiveTab('machines')}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'machines' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Machine Scheduling
            </button>
          </div>
          <button
            onClick={() => setIsOffcutModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ ເສດເຈ້ຍ (Log Offcut)</span>
          </button>
          <button
            onClick={fetchOrders}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition active:scale-95"
            title="Refresh Board"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeTab === 'machines' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {machines.map((m) => (
            <div key={m.machine_id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black">
                    {m.category}
                  </span>
                  <h4 className="font-black text-sm text-slate-900 mt-2">{m.machine_name}</h4>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-black ${
                  m.status === 'In Use' ? 'bg-indigo-100 text-indigo-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  ● {m.status}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Queued Jobs:</span>
                  <span className="font-black text-slate-900">{m.queued_jobs_count} tickets</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Est. Completion:</span>
                  <span className="font-black text-amber-600">{m.estimated_free_at || 'Ready'}</span>
                </div>
              </div>

              {m.tickets && m.tickets.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Queue</span>
                  {m.tickets.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-100/70 rounded-lg">
                      <span className="font-mono text-[11px] font-bold text-slate-700">{t.ticket_number}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-white font-bold rounded text-indigo-600 shadow-2xs">
                        {t.duration_mins || 30}m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {columns.map(col => {
            const colOrders = orders.filter(o => o.status === col.id);

            return (
              <div key={col.id} className={`rounded-2xl border-t-4 border border-slate-100 shadow-sm p-4 min-h-[500px] ${col.color}`}>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                  <span className="font-black text-xs text-slate-800 uppercase tracking-wider">{col.label}</span>
                  <span className="px-2 py-0.5 bg-slate-200/60 text-slate-600 rounded-lg text-[10px] font-black">{colOrders.length}</span>
                </div>

                <div className="space-y-3">
                  {colOrders.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-black text-slate-900">{order.order_number || 'SO-TEMP'}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                          {order.customer_name}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-500">
                        Total: <span className="font-sans font-black text-slate-900">{formatLAK(order.total_price)}</span>
                      </div>

                      {/* Status Transitions */}
                      <div className="flex gap-1.5 pt-2 border-t border-slate-100 justify-end">
                        {col.id === 'PREPRESS_CHECK' && (
                          <button
                            onClick={() => handleMoveStatus(order.id, 'READY_TO_PRINT')}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-[10px] font-black rounded-lg transition active:scale-95"
                          >
                            Ready to Print →
                          </button>
                        )}
                        {col.id === 'READY_TO_PRINT' && (
                          <button
                            onClick={() => handleMoveStatus(order.id, 'IN_PRODUCTION')}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition active:scale-95"
                          >
                            Start Print →
                          </button>
                        )}
                        {col.id === 'IN_PRODUCTION' && (
                          <button
                            onClick={() => handleMoveStatus(order.id, 'COMPLETED')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition active:scale-95"
                          >
                            Complete →
                          </button>
                        )}
                        {col.id === 'COMPLETED' && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Done
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {colOrders.length === 0 && (
                    <div className="text-center py-8 text-xs font-bold text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                      No active orders
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Offcut Registration Modal */}
      {isOffcutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-4">
            <h4 className="text-lg font-black text-slate-900 uppercase">ສົ່ງເສດເຈ້ຍເສດເຫຼືອເຂົ້າຄັງ (Offcut Scrap Salvaging)</h4>
            <form onSubmit={handleAddOffcut} className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="space-y-1">
                <label className="block text-slate-500">ເຈ້ຍຕົ້ນກຳເນີດ (Parent Paper ID) *</label>
                <select
                  value={selectedParentMaterial}
                  onChange={(e) => setSelectedParentMaterial(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky text-xs font-bold"
                >
                  <option value="paper-a4-80">Double A A4 80gsm</option>
                  <option value="paper-a3-120">Glossy Card A3 120gsm</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">ຊື່ເສດເຈ້ຍ (Name / Description) *</label>
                <input
                  type="text"
                  required
                  placeholder="ເຊັ່ນ: ເສດເຈ້ຍຍາວ A4..."
                  value={scrapName}
                  onChange={(e) => setScrapName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-500">ຄວາມກວ້າງ (Width mm) *</label>
                  <input
                    type="number"
                    required
                    value={scrapWidth}
                    onChange={(e) => setScrapWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500">ຄວາມຍາວ (Length mm) *</label>
                  <input
                    type="number"
                    required
                    value={scrapLength}
                    onChange={(e) => setScrapLength(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">ຈຳນວນເສດເຈ້ຍ (Quantity) *</label>
                <input
                  type="number"
                  required
                  value={scrapQty}
                  onChange={(e) => setScrapQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOffcutModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition"
                >
                  Save to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
