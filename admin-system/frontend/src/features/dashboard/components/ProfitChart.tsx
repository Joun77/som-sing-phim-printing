import React, { useState, useMemo } from 'react';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  Layers, 
  Calendar, 
  TrendingUp, 
  Filter, 
  ChevronRight,
  BookOpen,
  Tag,
  FileSpreadsheet,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';

export const ProfitChart: React.FC = () => {
  const { orders = [], formatCurrency } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const formatLAK = formatCurrency;

  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter orders by timeframe
  const filteredOrders = useMemo(() => {
    const todayStr = '2026-08-04'; // Project baseline simulation date or current date
    const now = new Date(todayStr);

    return orders.filter(ord => {
      if (!ord.date) return true;
      if (timeframe === 'all') return true;

      const orderDate = new Date(ord.date);
      if (timeframe === 'today') {
        return ord.date.startsWith(todayStr);
      }
      if (timeframe === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDate >= weekAgo;
      }
      if (timeframe === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return orderDate >= monthAgo;
      }
      return true;
    });
  }, [orders, timeframe]);

  // Aggregate Revenue and Profit by Category
  const categoryStats = useMemo(() => {
    const categories: Record<string, {
      name: string;
      nameLao: string;
      icon: any;
      color: string;
      bgClass: string;
      barClass: string;
      revenue: number;
      cost: number;
      units: number;
      orderCount: number;
    }> = {
      books: {
        name: 'Books & Catalogs',
        nameLao: 'ປຶ້ມ & ແຄັດຕາລັອກ',
        icon: BookOpen,
        color: '#6366f1',
        bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        barClass: 'bg-indigo-500',
        revenue: 0,
        cost: 0,
        units: 0,
        orderCount: 0,
      },
      stickers: {
        name: 'Stickers & Labels',
        nameLao: 'ສະຕິກເກີ & ສະຫຼາກສິນຄ້າ',
        icon: Tag,
        color: '#0ea5e9',
        bgClass: 'bg-sky-50 text-sky-700 border-sky-200',
        barClass: 'bg-sky-500',
        revenue: 0,
        cost: 0,
        units: 0,
        orderCount: 0,
      },
      posters: {
        name: 'Posters & Leaflets',
        nameLao: 'ໂປສເຕີ & ໃບປິວ',
        icon: FileSpreadsheet,
        color: '#10b981',
        bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        barClass: 'bg-emerald-500',
        revenue: 0,
        cost: 0,
        units: 0,
        orderCount: 0,
      },
      cards: {
        name: 'Business Cards',
        nameLao: 'ນາມບັດ & ບັດສະມາຊິກ',
        icon: CreditCard,
        color: '#f59e0b',
        bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
        barClass: 'bg-amber-500',
        revenue: 0,
        cost: 0,
        units: 0,
        orderCount: 0,
      },
      calendars: {
        name: 'Desk Calendars',
        nameLao: 'ປະຕິທິນຕັ້ງໂຕະ / ແຂວນ',
        icon: Calendar,
        color: '#ec4899',
        bgClass: 'bg-pink-50 text-pink-700 border-pink-200',
        barClass: 'bg-pink-500',
        revenue: 0,
        cost: 0,
        units: 0,
        orderCount: 0,
      },
      custom: {
        name: 'Custom Packaging & Other',
        nameLao: 'ກ່ອງບັນຈຸພັນ & ງານພິເສດ',
        icon: Layers,
        color: '#8b5cf6',
        bgClass: 'bg-purple-50 text-purple-700 border-purple-200',
        barClass: 'bg-purple-500',
        revenue: 0,
        cost: 0,
        units: 0,
        orderCount: 0,
      }
    };

    filteredOrders.forEach(ord => {
      const orderRev = Number(ord.totalPriceCharged || ord.depositAmountPaid || 0);
      let catKey = 'custom';

      const items = Array.isArray(ord.items) ? ord.items : [];
      const itemNames = items.map((i: any) => (i.name || i.title || '').toLowerCase()).join(' ');
      const desc = `${(ord as any).productType || ''} ${ord.notes || ''} ${itemNames}`.toLowerCase();

      if (desc.includes('ປຶ້ມ') || desc.includes('book') || desc.includes('magazine') || desc.includes('report')) {
        catKey = 'books';
      } else if (desc.includes('ສະຕິກເກີ') || desc.includes('sticker') || desc.includes('label') || desc.includes('die-cut')) {
        catKey = 'stickers';
      } else if (desc.includes('ໂປສເຕີ') || desc.includes('poster') || desc.includes('flyer') || desc.includes('leaflet') || desc.includes('ໃບປິວ')) {
        catKey = 'posters';
      } else if (desc.includes('ນາມບັດ') || desc.includes('card') || desc.includes('namecard') || desc.includes('ບັດ')) {
        catKey = 'cards';
      } else if (desc.includes('ປະຕິທິນ') || desc.includes('calendar')) {
        catKey = 'calendars';
      }

      categories[catKey].revenue += orderRev;
      categories[catKey].orderCount += 1;
      
      const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
      categories[catKey].units += Math.max(1, totalQty);
      
      // Estimated material & print cost ~ 38% - 46% of revenue
      categories[catKey].cost += Math.round(orderRev * 0.42);
    });

    const totalRev = Object.values(categories).reduce((sum, c) => sum + c.revenue, 0) || 1;

    return Object.entries(categories).map(([key, data]) => {
      const margin = data.revenue > 0 ? Math.round(((data.revenue - data.cost) / data.revenue) * 100) : 55;
      const share = Math.round((data.revenue / totalRev) * 100);
      return {
        key,
        ...data,
        profit: Math.max(0, data.revenue - data.cost),
        margin,
        share
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  const totalFilteredRevenue = categoryStats.reduce((sum, c) => sum + c.revenue, 0);
  const totalFilteredProfit = categoryStats.reduce((sum, c) => sum + c.profit, 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {currentLang === 'lo' ? 'ການແຈກແຈງລາຍໄດ້ຕາມໝວດໝູ່ສິນຄ້າ' : 'Revenue by Product Category'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-0.5">
              {currentLang === 'lo' ? 'ວິເຄາະສັດສ່ວນລາຍຮັບ ແລະ ອັດຕາກຳໄລແຍກຕາມປະເພດງານພິມ' : 'Income distribution and profit margins across product lines.'}
            </p>
          </div>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
          {[
            { id: 'today', label: currentLang === 'lo' ? 'ມື້ນີ້' : 'Today' },
            { id: 'week', label: currentLang === 'lo' ? 'ອາທິດນີ້' : 'Week' },
            { id: 'month', label: currentLang === 'lo' ? 'ເດືອນນີ້' : 'Month' },
            { id: 'all', label: currentLang === 'lo' ? 'ທັງໝົດ' : 'All' }
          ].map(tf => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                timeframe === tf.id 
                  ? 'bg-white text-indigo-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {currentLang === 'lo' ? 'ລາຍຮັບລວມໃນຊ່ວງນີ້' : 'Selected Period Revenue'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-sans">
              {formatLAK(totalFilteredRevenue)}
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200">
            {filteredOrders.length} {currentLang === 'lo' ? 'ອໍເດີ' : 'Orders'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              {currentLang === 'lo' ? 'ກຳໄລປະເມີນ (Est. Profit)' : 'Estimated Net Profit'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 font-sans">
              {formatLAK(totalFilteredProfit)}
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-xl font-sans">
            {totalFilteredRevenue > 0 ? Math.round((totalFilteredProfit / totalFilteredRevenue) * 100) : 58}% Margin
          </span>
        </div>
      </div>

      {/* Visual Category Breakdown List */}
      <div className="space-y-4">
        {categoryStats.map(cat => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.key;

          return (
            <div 
              key={cat.key}
              onClick={() => setSelectedCategory(isSelected ? null : cat.key)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected 
                  ? 'border-indigo-400 bg-indigo-50/30 shadow-xs ring-2 ring-indigo-200' 
                  : 'border-slate-200/70 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${cat.bgClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                      {currentLang === 'lo' ? cat.nameLao : cat.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold font-sans">
                      {cat.orderCount} {currentLang === 'lo' ? 'ອໍເດີ' : 'orders'} • {cat.units.toLocaleString()} {currentLang === 'lo' ? 'ຊິ້ນ' : 'units'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-black text-slate-950 font-sans">
                    {formatLAK(cat.revenue)}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 font-sans">
                    {cat.share}% {currentLang === 'lo' ? 'ຂອງຍອດ' : 'share'} ({cat.margin}% margin)
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${cat.barClass}`}
                  style={{ width: `${Math.max(4, cat.share)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default ProfitChart;
