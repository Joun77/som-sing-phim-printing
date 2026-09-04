import React, { useState, useEffect } from 'react';
import { RotateCcw, ShoppingBag, ArrowRight, Layers, Tag, Check, Sparkles } from 'lucide-react';
import { useShop } from '../../context/ShopContext.tsx';
import type { CustomerOrderSummary } from '../../types/customer.ts';

interface QuickReorderShelfProps {
  onOpenHub: (tab?: 'card' | 'reorder' | 'address') => void;
}

export const QuickReorderShelf: React.FC<QuickReorderShelfProps> = ({ onOpenHub }) => {
  const { customerProfile, isLoggedIn, addToCart, openCart } = useShop();
  const [recentOrders, setRecentOrders] = useState<CustomerOrderSummary[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleReorder = (item: any) => {
    addToCart({
      product: {
        id: item.job_name || 'reorder-item',
        slug: 'waterproof-pp-sticker',
        name: item.item_name || item.job_name || 'ງານພິມສັ່ງຊ້ຳ (Re-order)',
        nameEn: item.job_name || 'Reorder Printing Item',
        category: 'general',
        description: 'ສັ່ງພິມຊ້ຳຈາກປະຫວັດງານເກົ່າ',
        thumbnail: '/images/products/sticker-pp.jpg',
        images: [],
        features: ['ສັ່ງພິມຊ້ຳ 1-Click', 'ຄຸນນະພາບມາດຕະຖານໂຮງພິມ'],
        minQty: 1,
        leadDays: 1,
        options: {},
        basePrice: { THB: 50, LAK: 35000 },
        isFeatured: true,
      },
      config: {
        sizeId: item.paper_size || 'standard',
        materialId: 'default',
        finishingId: 'none',
        quantity: item.quantity || 100,
        specLabels: {
          size: item.paper_size || 'Standard',
          paper: item.specs?.material || 'Standard Paper',
          finishing: item.specs?.cutting || 'Standard',
        },
      },
      driveLink: '',
      permissionConfirmed: true,
      specialNotes: `ສັ່ງພິມຊ້ຳ (1-Click Re-order) ອ້າງອີງສະເປກເດີມ: ${JSON.stringify(item.specs || {})}`,
      price: {
        subtotal: item.total_price_lak || 50000,
        subtotalTHB: Math.round((item.total_price_lak || 50000) / 630),
        discount: 0,
        shipping: 0,
        total: item.total_price_lak || 50000,
        totalTHB: Math.round((item.total_price_lak || 50000) / 630),
        currency: 'LAK',
      },
    });

    openCart();
  };

  return (
    <section className="py-8 bg-slate-950 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>ງານພິມຫຼ້າສຸດຂອງທ່ານ (Quick Re-order)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
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
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
          >
            <span>ເບິ່ງທັງໝົດ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Shelf Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentOrders.map((ord) => {
            const firstItem = ord.items?.[0] || { job_name: 'ງານພິມສະຕິກເກີ/ນາມບັດ', quantity: 100 };
            return (
              <div 
                key={ord.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition shadow-lg flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                    <span className="text-amber-400/90 font-bold">{ord.orderNumber || ord.id}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
                      {new Date(ord.createdAt).toLocaleDateString('lo-LA')}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition line-clamp-1">
                    {firstItem.item_name || firstItem.job_name}
                  </h4>

                  <div className="text-xs text-slate-400 mt-1 space-y-0.5 font-mono">
                    <div>ຈຳນວນ: <strong className="text-slate-200">{firstItem.quantity} ຊິ້ນ</strong></div>
                    <div>ຂະໜາດ/ສະເປກ: <span className="text-slate-300">{firstItem.paper_size || 'Standard Size'}</span></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-sm font-black text-white font-mono">
                    ₭ {(ord.totalAmountLAK || 0).toLocaleString()}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleReorder(firstItem)}
                    className="py-1.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-amber-500/20"
                  >
                    <RotateCcw className="w-3 h-3" />
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
