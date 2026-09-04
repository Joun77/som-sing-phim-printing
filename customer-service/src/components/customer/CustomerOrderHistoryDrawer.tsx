import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useShop } from '../../context/ShopContext.tsx';
import { ShoppingBag, X, RefreshCw, FileText, CheckCircle, Clock, Truck, PlayCircle } from 'lucide-react';
import { formatMoney } from '../../utils/currency.ts';
import { computePrice } from '../../utils/pricing.ts';

interface CustomerOrderHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const CustomerOrderHistoryDrawer: React.FC<CustomerOrderHistoryDrawerProps> = ({
  isOpen,
  onClose,
  phone
}) => {
  const { getProduct, addToCart, openCart, language } = useShop();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    if (!phone) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/v1/public/customer/orders?phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') {
          setOrders(json.data || []);
        } else {
          setError('ບໍ່ສາມາດດຶງຂໍ້ມູນປະຫວັດການສັ່ງຊື້ໄດ້');
        }
      } else {
        setError('ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່');
      }
    } catch (e) {
      setError('ຜິດພາດໃນການເຊື່ອມຕໍ່ເຊີບເວີ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && phone) {
      fetchOrders();
    }
  }, [isOpen, phone]);

  const handleReorder = (orderItem: any, overallOrder: any) => {
    // Attempt to map back item specifications to product config
    const specs = orderItem.specs || {};
    
    // Resolve product from slug or id
    const productSlug = orderItem.product_id || orderItem.item_name || 'brochures';
    const product = getProduct(productSlug) || getProduct('brochures');
    if (!product) {
      alert('ບໍ່ພົບຂໍ້ມູນສິນຄ້ານີ້ໃນລະບົບປັດຈຸບັນ');
      return;
    }

    // Try parsing spec options
    const sizeId = specs.sizeId || product.sizes?.find((s: any) => s.label === specs.size || s.id === specs.size)?.id || product.sizes?.[0]?.id || 'standard';
    const materialId = specs.materialId || product.materials?.find((m: any) => m.label === specs.paper || m.id === specs.paper)?.id || product.materials?.[0]?.id || 'standard';
    const finishingId = specs.finishingId || product.finishings?.find((f: any) => f.label === specs.finishing || f.id === specs.finishing)?.id || product.finishings?.[0]?.id || 'standard';
    const quantity = orderItem.quantity || 1;

    // Recalculate price dynamically for current rates
    const calculatedPrice = computePrice(product, { sizeId, materialId, finishingId, quantity });
    
    const cartConfig = {
      product,
      config: {
        sizeId,
        materialId,
        finishingId,
        quantity,
        specLabels: {
          size: specs.size || product.sizes?.find((s: any) => s.id === sizeId)?.label || 'Standard',
          paper: specs.paper || product.materials?.find((m: any) => m.id === materialId)?.label || 'Standard',
          finishing: specs.finishing || product.finishings?.find((f: any) => f.id === finishingId)?.label || 'Standard',
        }
      },
      driveLink: overallOrder.google_drive_link || '',
      permissionConfirmed: true,
      specialNotes: 'ສັ່ງພິມຊ້ຳຈາກອໍເດີເລກທີ ' + (overallOrder.order_no || overallOrder.id),
      price: calculatedPrice || {
        unitPrice: orderItem.unit_price_lak || 0,
        total: orderItem.total_price_lak || 0,
        totalTHB: (orderItem.total_price_lak || 0) / 630, // Fallback conversion
        qty: quantity,
        discount: 0
      }
    };

    addToCart(cartConfig);
    onClose();
    openCart();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
        return <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[10px] font-black rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> ຈັດສົ່ງສຳເລັດ</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-900 text-[10px] font-black rounded-full flex items-center gap-1"><Truck className="w-3 h-3" /> ກຳລັງຈັດສົ່ງ</span>;
      case 'IN_PRODUCTION':
        return <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 text-[10px] font-black rounded-full flex items-center gap-1 animate-pulse"><PlayCircle className="w-3 h-3" /> ກຳລັງຜະລິດ</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-[10px] font-black rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> ລໍຖ້າກວດສອບ</span>;
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <span className="text-base font-black text-slate-900 dark:text-white">
              ປະຫວັດການສັ່ງຊື້ ({orders.length})
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-xs font-semibold">ກຳລັງໂຫຼດປະຫວັດການສັ່ງຊື້...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs font-bold rounded-2xl">
              {error}
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300" />
              <p className="text-sm font-bold text-slate-500">ບໍ່ມີປະຫວັດການສັ່ງຊື້ພາຍໃຕ້ເບີໂທລະສັບນີ້</p>
              <p className="text-xs text-slate-400">ເລີ່ມຕົ້ນສັ່ງຊື້ກັບ ສົມ ສິ່ງ ພິມ ມື້ນີ້!</p>
            </div>
          )}

          {!loading && !error && orders.map((o, idx) => (
            <div 
              key={o.id || idx} 
              className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-800/80 rounded-2xl space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">ເລກທີອໍເດີ</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{o.order_no || o.order_number || o.id}</span>
                </div>
                {getStatusBadge(o.status || o.overall_status)}
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-200/55 dark:divide-slate-850">
                {(o.items || []).map((item: any, iIdx: number) => (
                  <div key={item.id || iIdx} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-slate-850 dark:text-slate-100">{item.item_name}</span>
                      <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-2">
                        <span>ຂະໜາດ: {item.specs?.size || 'Standard'}</span>
                        <span>·</span>
                        <span>ກະດາດ: {item.specs?.paper || 'Standard'}</span>
                        <span>·</span>
                        <span>ຈຳນວນ: {item.quantity || 1}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReorder(item, o)}
                      className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.97] text-slate-950 text-[10px] font-black rounded-lg transition"
                    >
                      ສັ່ງພິມຊ້ຳ
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200/55 dark:border-slate-850 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400">ຍອດລວມ:</span>
                <span className="font-black text-slate-900 dark:text-white font-mono text-sm">
                  {formatMoney(o.total_amount_lak || o.totalPrice || 0, 'LAK')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
