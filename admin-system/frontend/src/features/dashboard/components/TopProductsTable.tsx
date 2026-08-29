import React, { useMemo } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Package, 
  ArrowUpRight, 
  Sparkles,
  Layers,
  DollarSign
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';

export const TopProductsTable: React.FC = () => {
  const { orders = [], formatCurrency, setActiveTab } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const formatLAK = formatCurrency;

  const topProducts = useMemo(() => {
    const productMap: Record<string, {
      id: string;
      name: string;
      category: string;
      orderCount: number;
      unitsProduced: number;
      revenue: number;
      estCost: number;
    }> = {};

    orders.forEach(ord => {
      const items = Array.isArray(ord.items) ? ord.items : [];
      const orderRev = Number(ord.totalPriceCharged || ord.depositAmountPaid || 0);

      if (items.length === 0) {
        const prodName = (ord as any).productType || ord.notes || 'ງານພິມດ່ວນຕາມແບບ';
        const key = prodName.toLowerCase().trim();
        if (!productMap[key]) {
          productMap[key] = {
            id: key,
            name: prodName,
            category: 'Custom Print',
            orderCount: 0,
            unitsProduced: 0,
            revenue: 0,
            estCost: 0
          };
        }
        productMap[key].orderCount += 1;
        productMap[key].unitsProduced += 100;
        productMap[key].revenue += orderRev;
        productMap[key].estCost += Math.round(orderRev * 0.42);
      } else {
        items.forEach((item: any) => {
          const name = item.name || item.title || (ord as any).productType || 'ງານພິມດ່ວນ';
          const key = name.toLowerCase().trim();
          const itemRev = (Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1)) || (orderRev / items.length);

          if (!productMap[key]) {
            productMap[key] = {
              id: key,
              name,
              category: item.category || 'Printing',
              orderCount: 0,
              unitsProduced: 0,
              revenue: 0,
              estCost: 0
            };
          }
          productMap[key].orderCount += 1;
          productMap[key].unitsProduced += Number(item.quantity || 1);
          productMap[key].revenue += itemRev;
          productMap[key].estCost += Math.round(itemRev * 0.40);
        });
      }
    });

    return Object.values(productMap)
      .map(p => {
        const profit = Math.max(0, p.revenue - p.estCost);
        const margin = p.revenue > 0 ? Math.round((profit / p.revenue) * 100) : 58;
        const avgOrder = p.orderCount > 0 ? Math.round(p.revenue / p.orderCount) : p.revenue;
        return {
          ...p,
          profit,
          margin,
          avgOrder
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">1</span>;
      case 2:
        return <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow-xs">2</span>;
      case 3:
        return <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-xs">3</span>;
      default:
        return <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-black text-xs flex items-center justify-center">{rank}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {currentLang === 'lo' ? 'Top 5 ສິນຄ້າຂາຍດີທີ່ສຸດ (Best-Selling Products)' : 'Top 5 Best-Selling Print Products'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-0.5">
              {currentLang === 'lo' ? 'ສິນຄ້າທີ່ສ້າງຍອດຂາຍ ແລະ ກຳໄລສູງສຸດປະຈຳເດືອນ' : 'Highest revenue generating products of the month.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('orders')}
          className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
        >
          <span>{currentLang === 'lo' ? 'ເບິ່ງລາຍການອໍເດີ' : 'View Orders'}</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Ranked Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
              <th className="py-3 px-3 text-center w-12">ອັນດັບ</th>
              <th className="py-3 px-4">ຊື່ສິນຄ້າ (Product Name)</th>
              <th className="py-3 px-4 text-center">ຈຳນວນອໍເດີ (Jobs)</th>
              <th className="py-3 px-4 text-center">ຍອດຜະລິດ (Units)</th>
              <th className="py-3 px-4 text-right">ລາຍໄດ້ລວມ (Revenue)</th>
              <th className="py-3 px-4 text-right">ອັດຕາກຳໄລ (Margin)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
            {topProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  {currentLang === 'lo' ? 'ຍັງບໍ່ມີຂໍ້ມູນຍອດຂາຍ' : 'No sales records available'}
                </td>
              </tr>
            ) : (
              topProducts.map((prod, idx) => (
                <tr key={prod.id || idx} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex justify-center">
                      {getRankBadge(idx + 1)}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-[200px]">{prod.name}</span>
                        <span className="text-[10px] text-slate-400">{prod.category}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-sans font-bold text-slate-800">
                    {prod.orderCount} {currentLang === 'lo' ? 'ອໍເດີ' : 'jobs'}
                  </td>

                  <td className="py-3.5 px-4 text-center font-sans font-bold text-indigo-700">
                    <span className="px-2 py-0.5 bg-indigo-50 rounded-md">
                      {prod.unitsProduced.toLocaleString()}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-sans font-black text-slate-950">
                    {formatLAK(prod.revenue)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black font-sans">
                      {prod.margin}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default TopProductsTable;
