import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Check, 
  DollarSign, 
  CreditCard,
  ChevronRight,
  Info
} from 'lucide-react';

export default function HistoryAnalytics() {
  const { orders, spoilageLogs, inventory, settleOrderBalance } = useApp();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [timeframe, setTimeframe] = useState('month');

  // Settle balance state
  const [settleOrderId, setSettleOrderId] = useState(null);
  const [settleAmount, setSettleAmount] = useState(0);
  const [settleMethod, setSettleMethod] = useState('BCEL One');
  const [settleSlip, setSettleSlip] = useState('');

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num).replace('LAK', '₭');
  };

  const getTrendData = () => {
    if (timeframe === '7day') {
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date('2026-08-04T09:00:00');
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }

      return dates.map(dateStr => {
        const dayOrders = orders.filter(o => o.date === dateStr);
        const daySpoilage = spoilageLogs.filter(s => s.date === dateStr);

        const revenue = dayOrders.reduce((sum, o) => sum + o.totalPriceCharged, 0);
        
        let materialCost = 0;
        dayOrders.forEach(o => {
          o.items.forEach(item => {
            const inv = inventory.find(i => i.id === item.id);
            if (inv) materialCost += item.quantity * inv.costPerConsumptionUnit;
          });
        });
        const spoilageCost = daySpoilage.reduce((sum, s) => sum + s.totalCost, 0);
        let depreciation = 0;
        dayOrders.forEach(o => {
          const paper = o.items.find(i => i.id.startsWith('paper'));
          if (paper) depreciation += paper.quantity * 90;
        });

        const cost = materialCost + spoilageCost + depreciation;
        const profit = revenue - cost;

        const parts = dateStr.split('-');
        const label = `${parts[2]}/${parts[1]}`;

        return { label, revenue, cost, profit };
      });
    }

    if (timeframe === 'month') {
      const weeks = [
        { label: currentLang === 'lo' ? 'ອາທິດ 1 (Aug 1-2)' : 'Week 1 (Aug 1-2)', start: '2026-08-01', end: '2026-08-02' },
        { label: currentLang === 'lo' ? 'ອາທິດ 2 (Aug 3-4)' : 'Week 2 (Aug 3-4)', start: '2026-08-03', end: '2026-08-04' },
        { label: currentLang === 'lo' ? 'ອາທິດ 3 (Aug 5-10)' : 'Week 3 (Aug 5-10)', start: '2026-08-05', end: '2026-08-10' },
      ];

      return weeks.map(wk => {
        const wkOrders = orders.filter(o => o.date >= wk.start && o.date <= wk.end);
        const wkSpoilage = spoilageLogs.filter(s => s.date >= wk.start && s.date <= wk.end);

        const revenue = wkOrders.reduce((sum, o) => sum + o.totalPriceCharged, 0);
        let materialCost = 0;
        wkOrders.forEach(o => {
          o.items.forEach(item => {
            const inv = inventory.find(i => i.id === item.id);
            if (inv) materialCost += item.quantity * inv.costPerConsumptionUnit;
          });
        });
        const spoilageCost = wkSpoilage.reduce((sum, s) => sum + s.totalCost, 0);
        let depreciation = 0;
        wkOrders.forEach(o => {
          const paper = o.items.find(i => i.id.startsWith('paper'));
          if (paper) depreciation += paper.quantity * 90;
        });

        const cost = materialCost + spoilageCost + depreciation;
        const profit = revenue - cost;

        return { label: wk.label, revenue, cost, profit };
      });
    }

    const months = [
      { name: 'Jan', key: '2026-01' },
      { name: 'Feb', key: '2026-02' },
      { name: 'Mar', key: '2026-03' },
      { name: 'Apr', key: '2026-04' },
      { name: 'May', key: '2026-05' },
      { name: 'Jun', key: '2026-06' },
      { name: 'Jul', key: '2026-07' },
      { name: 'Aug', key: '2026-08' },
    ];

    return months.map(m => {
      const mOrders = orders.filter(o => o.date.startsWith(m.key));
      const mSpoilage = spoilageLogs.filter(s => s.date.startsWith(m.key));

      const revenue = mOrders.reduce((sum, o) => sum + o.totalPriceCharged, 0);
      let materialCost = 0;
      mOrders.forEach(o => {
        o.items.forEach(item => {
          const inv = inventory.find(i => i.id === item.id);
          if (inv) materialCost += item.quantity * inv.costPerConsumptionUnit;
        });
      });
      const spoilageCost = mSpoilage.reduce((sum, s) => sum + s.totalCost, 0);
      let depreciation = 0;
      mOrders.forEach(o => {
        const paper = o.items.find(i => i.id.startsWith('paper'));
        if (paper) depreciation += paper.quantity * 90;
      });

      const cost = materialCost + spoilageCost + depreciation;
      const profit = revenue - cost;

      return { label: m.name, revenue, cost, profit };
    });
  };

  const trendData = getTrendData();

  const getTopServices = () => {
    const counts = {};
    orders.forEach(ord => {
      ord.items.forEach(item => {
        if (!counts[item.name]) {
          counts[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        counts[item.name].quantity += item.quantity;
        counts[item.name].revenue += item.quantity * item.unitCost;
      });
    });

    return Object.values(counts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const topServices = getTopServices();

  const unpaidOrders = orders.filter(o => o.remainingUnpaidBalance > 0);

  const handleSettleSubmit = (e) => {
    e.preventDefault();
    if (!settleOrderId || settleAmount <= 0) return;
    settleOrderBalance(settleOrderId, Number(settleAmount), settleMethod, settleSlip);
    alert(currentLang === 'lo' ? 'ຊຳຣະລ້ຽງໜີ້ສຳເລັດ!' : 'Balance settled successfully!');
    setSettleOrderId(null);
    setSettleAmount(0);
    setSettleSlip('');
  };

  const handleOpenSettle = (order) => {
    setSettleOrderId(order.id);
    setSettleAmount(order.remainingUnpaidBalance);
  };

  const totalWastedMaterialsCost = spoilageLogs.reduce((sum, log) => sum + log.totalCost, 0);

  const chartWidth = 600;
  const chartHeight = 240;
  const padding = 40;

  const maxVal = Math.max(
    100000,
    ...trendData.map(d => Math.max(d.revenue, d.cost, Math.abs(d.profit)))
  ) * 1.1;

  const getX = (index) => {
    return padding + (index * (chartWidth - 2 * padding)) / (trendData.length - 1 || 1);
  };

  const getY = (value) => {
    const scale = (chartHeight - 2 * padding) / maxVal;
    return chartHeight - padding - value * scale;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary-navy tracking-wide">
            {t('reports.title')}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {t('reports.subtitle')}
          </p>
        </div>

        {/* Timeframe filters */}
        <div className="flex gap-1.5 p-1 bg-slate-200/60 rounded-xl border border-slate-200">
          <button
            onClick={() => setTimeframe('7day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === '7day' ? 'bg-white text-primary-navy shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {t('reports.filter_7days')}
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'month' ? 'bg-white text-primary-navy shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {t('reports.filter_month')}
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'year' ? 'bg-white text-primary-navy shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {t('reports.filter_year')}
          </button>
        </div>
      </div>

      {/* Grid: SVG chart and top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">
              {t('reports.chart_title')}
            </h3>
            <div className="flex gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> {t('reports.chart_revenue')}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-400 rounded-sm"></span> {t('reports.chart_cost')}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-accent-sky rounded-sm"></span> {t('reports.chart_profit')}</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto pr-1">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full min-w-[500px] h-60 text-slate-400"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const yVal = getY(maxVal * ratio * 0.9);
                return (
                  <g key={idx}>
                    <line 
                      x1={padding} 
                      y1={yVal} 
                      x2={chartWidth - padding} 
                      y2={yVal} 
                      stroke="#F1F5F9" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={padding - 5} 
                      y={yVal + 3} 
                      textAnchor="end" 
                      fontSize="9" 
                      fontWeight="600"
                      fill="#94A3B8"
                    >
                      {Math.round((maxVal * ratio * 0.9) / 1000).toLocaleString()}k
                    </text>
                  </g>
                );
              })}

              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={trendData.map((d, i) => `${getX(i)},${getY(d.revenue)}`).join(' ')}
              />
              
              <polyline
                fill="none"
                stroke="#F87171"
                strokeWidth="2.5"
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={trendData.map((d, i) => `${getX(i)},${getY(d.cost)}`).join(' ')}
              />

              <polyline
                fill="none"
                stroke="#0284C7"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={trendData.map((d, i) => `${getX(i)},${getY(d.profit)}`).join(' ')}
              />

              {trendData.map((d, i) => {
                const x = getX(i);
                return (
                  <g key={i}>
                    <circle cx={x} cy={getY(d.revenue)} r="4" fill="#10B981" />
                    <circle cx={x} cy={getY(d.profit)} r="4" fill="#0284C7" />
                    <text
                      x={x}
                      y={chartHeight - padding + 18}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#64748B"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Top products bar chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-accent-sky" />
              <span>{t('reports.top_services')}</span>
            </h3>
            
            {topServices.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">No order items</p>
            ) : (
              <div className="space-y-4">
                {topServices.map((service, idx) => {
                  const maxRevenue = Math.max(...topServices.map(s => s.revenue));
                  const percentage = maxRevenue > 0 ? (service.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 truncate max-w-[150px]">{service.name}</span>
                        <span className="text-slate-950 font-bold font-sans">{formatLAK(service.revenue)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-accent-sky h-full rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono w-8 text-right shrink-0">
                          {service.quantity}x
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receivables Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-500" />
              <span>{t('reports.unpaid_title')}</span>
            </h3>
          </div>

          {unpaidOrders.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-6">{t('reports.unpaid_empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100 font-bold">
                    <th className="pb-3">{t('reports.unpaid_customer')}</th>
                    <th className="pb-3">{t('common.phone')}</th>
                    <th className="pb-3 text-right">{t('reports.unpaid_total')}</th>
                    <th className="pb-3 text-right">{t('reports.unpaid_remaining')}</th>
                    <th className="pb-3 text-center">{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaidOrders.map(ord => (
                    <tr key={ord.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5">
                        <div className="font-bold text-slate-800">{ord.customerName}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{ord.id}</div>
                      </td>
                      <td className="py-2.5 font-sans">{ord.phone}</td>
                      <td className="py-2.5 text-right font-semibold font-sans">{formatLAK(ord.totalPriceCharged)}</td>
                      <td className="py-2.5 text-right font-extrabold text-red-500 font-sans">{formatLAK(ord.remainingUnpaidBalance)}</td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => handleOpenSettle(ord)}
                          className="px-2.5 py-1 text-[10px] bg-accent-sky text-white rounded-lg font-bold hover:bg-accent-sky/90"
                        >
                          {t('reports.btn_settle')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Spoilage Loss Share Analysis */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>{t('reports.waste_title')}</span>
            </h3>

            <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-red-600 block uppercase tracking-wider">Total Loss Value</span>
                <span className="text-2xl font-black text-red-600 font-sans mt-1 block">
                  {formatLAK(totalWastedMaterialsCost)}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 pt-2">
              {(() => {
                const paperLogs = spoilageLogs.filter(l => l.materialId.startsWith('paper') || l.materialId.startsWith('sticker'));
                const inkLogs = spoilageLogs.filter(l => l.materialId.startsWith('ink'));
                
                const paperLoss = paperLogs.reduce((sum, l) => sum + l.totalCost, 0);
                const inkLoss = inkLogs.reduce((sum, l) => sum + l.totalCost, 0);
                const totalLoss = paperLoss + inkLoss || 1;

                return (
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Paper & Stickers</span>
                        <span className="font-bold text-slate-800 font-sans">{formatLAK(paperLoss)} ({Math.round((paperLoss / totalLoss) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${(paperLoss / totalLoss) * 100}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Ink bottles</span>
                        <span className="font-bold text-slate-800 font-sans">{formatLAK(inkLoss)} ({Math.round((inkLoss / totalLoss) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(inkLoss / totalLoss) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* DIALOG: SETTLE BALANCE */}
      {settleOrderId && (
        <dialog
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
          open
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSettleOrderId(null)} />
          
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 z-10 border border-slate-100 animate-fade-in">
            <h3 className="text-xl font-bold text-primary-navy mb-4 border-b pb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent-sky" />
              <span>{t('orders.settle_title')}</span>
            </h3>

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border text-xs">
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-mono font-bold text-slate-900">{settleOrderId}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Outstanding:</span>
                  <span className="font-extrabold text-red-500 font-sans">
                    {formatLAK(orders.find(o => o.id === settleOrderId)?.remainingUnpaidBalance || 0)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">{t('orders.amount_to_pay')} *</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky text-sm font-bold font-sans text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">{t('orders.payment_method')} *</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none text-sm bg-white"
                >
                  <option value="BCEL One">BCEL One (โอน)</option>
                  <option value="Cash">Cash (เงินสด)</option>
                  <option value="Transfer">Transfer (โอนบัญชีธนาคาร)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">{t('orders.ref_number')}</label>
                <input 
                  type="text" 
                  placeholder="Slip note..."
                  value={settleSlip}
                  onChange={(e) => setSettleSlip(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setSettleOrderId(null)}
                  className="px-4 py-2 border rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
