import React, { useState, useEffect } from 'react';
import { RotateCcw, ArrowRight, PackageCheck, Layers } from 'lucide-react';
import { useShop } from '../../context/ShopContext.tsx';
import type { CustomerOrderSummary, CustomerOrderItem } from '../../types/customer.ts';

interface QuickReorderShelfProps {
  onOpenHub: (tab?: 'card' | 'reorder' | 'address') => void;
}

export const QuickReorderShelf: React.FC<QuickReorderShelfProps> = ({ onOpenHub }) => {
  const { customerProfile, isLoggedIn, addToCart, openCart } = useShop();
  const [recentOrders, setRecentOrders] = useState<CustomerOrderSummary[]>([]);
  const [, setLoading] = useState(false);

  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '') || '/api';

  useEffect(() => {
    if (isLoggedIn && customerProfile?.phone) {
      setLoading(true);
      fetch(`${apiBase}/v1/public/customer/orders?phone=${encodeURIComponent(customerProfile.phone)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.status === 'success' && Array.isArray(json.data)) {
            setRecentOrders(json.data.slice(0, 3)); // show top 3 orders
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isLoggedIn, customerProfile?.phone, apiBase]);

  if (!isLoggedIn || !customerProfile || recentOrders.length === 0) {
    return null;
  }

  const handleReorder = (item: CustomerOrderItem) => {
    const unitPrice = item.unit_price_lak || 35000;
    const totalPrice = item.total_price_lak || (unitPrice * (item.quantity || 100));

    addToCart({
      product: {
        id: item.job_name || 'reorder-item',
        slug: 'custom-reorder-print',
        name: item.item_name || item.job_name || 'ງານພິມສັ່ງຊ້ຳ (Re-order)',
        nameEn: item.job_name || 'Reorder Printing Item',
        category: 'general',
        short: 'ສັ່ງພິມຊ້ຳຈາກປະຫວັດງານເກົ່າ',
        description: 'ສັ່ງພິມຊ້ຳຈາກປະຫວັດງານເກົ່າ ສະເປກເດີມ',
        image: '/images/products/sticker-pp.jpg',
        bestseller: false,
        basePrice: unitPrice,
        sizes: [],
        materials: [],
        finishings: [],
      },
      config: {
        sizeId: item.paper_size || 'standard',
        materialId: 'default',
        finishingId: 'none',
        quantity: item.quantity || 100,
        specLabels: {
          size: item.paper_size || 'Standard',
          paper: (item.specs?.material as string) || 'Standard Paper',
          finishing: (item.specs?.cutting as string) || 'Standard',
        },
      },
      driveLink: '',
      permissionConfirmed: true,
      specialNotes: `ສັ່ງພິມຊ້ຳ (1-Click Re-order) ອ້າງອີງສະເປກເດີມ: ${JSON.stringify(item.specs || {})}`,
      price: {
        unitPrice: unitPrice,
        total: totalPrice,
        totalTHB: Math.round(totalPrice / 630),
        qty: item.quantity || 100,
        discount: 0,
      },
    });

    openCart();
  };

  const formatOrderDate = (ord: CustomerOrderSummary) => {
    const rawDate = ord.createdAt || ord.created_at;
    if (!rawDate) return 'ເມື່ອเร็วໆນີ້';
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return 'ເມື່ອเร็วໆນີ້';
    return d.toLocaleDateString('lo-LA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <section className="py-7 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-xs">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>ງານພິມຫຼ້າສຸດຂອງທ່ານ (Quick Re-order)</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  1-Click Re-order
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ກົດສັ່ງພິມຊ້ຳໄດ້ທັນທີ ໂດຍບໍ່ຕ້ອງເລືອກສະເປກວັດສະດຸໃໝ່
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenHub('reorder')}
            className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>ເບິ່ງທັງໝົດ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Shelf Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentOrders.map((ord) => {
            const firstItem: CustomerOrderItem = ord.items?.[0] || {
              job_name: 'ງານພິມສະຕິກເກີ / ນາມບັດ',
              quantity: 100,
            };
            const totalLAK = ord.totalAmountLAK || ord.total_amount_lak || ord.total_price || 0;
            const orderCode = ord.orderNumber || ord.order_number || ord.orderNo || ord.order_no || ord.id;

            return (
              <div 
                key={ord.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-950/40 transition flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                    <span className="text-blue-300 font-bold bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-900/40">
                      {orderCode}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {formatOrderDate(ord)}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition line-clamp-1">
                    {firstItem.item_name || firstItem.job_name}
                  </h4>

                  <div className="text-xs text-slate-400 mt-2 space-y-1 font-mono">
                    <div className="flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>ຈຳນວນ: <strong className="text-slate-200">{firstItem.quantity} ຊິ້ນ</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>ຂະໜາດ: <span className="text-slate-300">{firstItem.paper_size || 'Standard Size'}</span></span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">ຍອດລວມ</span>
                    <span className="text-sm font-black text-amber-300 font-mono">
                      ₭ {totalLAK > 0 ? totalLAK.toLocaleString() : (firstItem.total_price_lak || 0).toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleReorder(firstItem)}
                    className="py-2 px-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs shadow-blue-900/40 border border-blue-400/30 active:scale-95"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-300" />
                    <span>ສັ່ງຊ້ຳ 1 ຄລິກ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
