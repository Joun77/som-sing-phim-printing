import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, RotateCcw, Search, ArrowLeft, ArrowRight,
  PackageCheck, Layers, Truck, CheckCircle2, Clock, 
  FileText, Check
} from 'lucide-react';
import { useShop } from '../context/ShopContext.tsx';
import type { CustomerOrderSummary, CustomerOrderItem } from '../types/customer.ts';

export default function OrdersPage() {
  const navigate = useNavigate();
  const { 
    customerProfile, 
    isLoggedIn, 
    addToCart, 
    openCart 
  } = useShop();

  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PRODUCTION' | 'COMPLETED' | 'PENDING'>('ALL');

  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '') || '/api';

  useEffect(() => {
    if (!isLoggedIn && !localStorage.getItem('ssp_customer_phone')) {
      navigate('/');
      return;
    }

    const phone = customerProfile?.phone || localStorage.getItem('ssp_customer_phone');
    if (phone) {
      setLoading(true);
      fetch(`${apiBase}/v1/public/customer/orders?phone=${encodeURIComponent(phone)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.status === 'success' && Array.isArray(json.data)) {
            setOrders(json.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [customerProfile?.phone, isLoggedIn, navigate, apiBase]);

  const handleReorderItem = (item: CustomerOrderItem) => {
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s.includes('COMPLETED') || s.includes('DELIVERED')) {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>ສຳເລັດແລ້ວ</span>
        </span>
      );
    }
    if (s.includes('IN_PRODUCTION') || s.includes('READY')) {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-blue-50 border border-blue-300 text-blue-800 flex items-center gap-1">
          <Clock className="w-3 h-3 text-blue-600" />
          <span>ກຳລັງຜະລິດ</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-50 border border-amber-300 text-amber-800 flex items-center gap-1">
        <Clock className="w-3 h-3 text-amber-600" />
        <span>ລໍຖ້າກວດສອບ</span>
      </span>
    );
  };

  const filteredOrders = orders.filter((ord) => {
    const s = (ord.status || ord.overall_status || '').toUpperCase();
    if (statusFilter === 'COMPLETED') return s.includes('COMPLETED') || s.includes('DELIVERED');
    if (statusFilter === 'IN_PRODUCTION') return s.includes('IN_PRODUCTION') || s.includes('READY');
    if (statusFilter === 'PENDING') return s.includes('PENDING') || s.includes('WAITING') || s.includes('DRAFT');
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-8">
      <div className="w-[88%] max-w-[1380px] mx-auto space-y-6">
        
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <Link 
              to="/profile" 
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-slate-900 transition flex items-center justify-center cursor-pointer shadow-xs"
              title="ກັບຄືນໜ້າໂປຣໄຟລ໌"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ປະຫວັດການສັ່ງຊື້ & ງານພິມ (Order History)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                ລວມລາຍການສັ່ງພິມທັງໝົດ ພ້ອມກົດສັ່ງພິມຊ້ຳ (1-Click Re-order) ໄດ້ທັນທີ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/track"
              className="btn btn--gold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-glow"
            >
              <Search className="w-3.5 h-3.5" />
              <span>ຕິດຕາມສະຖານະພັດສະດຸ</span>
            </Link>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'ALL'
                ? 'btn btn--gold font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ທັງໝົດ ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('IN_PRODUCTION')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'IN_PRODUCTION'
                ? 'btn btn--gold font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ກຳລັງຜະລິດ
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'COMPLETED'
                ? 'btn btn--gold font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ສຳເລັດແລ້ວ
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'PENDING'
                ? 'btn btn--gold font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ລໍຖ້າດຳເນີນການ
          </button>
        </div>

        {/* Orders Listing */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            ກຳລັງໂຫຼດລາຍການອໍເດີ້...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">ບໍ່ພົບລາຍການອໍເດີ້</h3>
              <p className="text-xs text-slate-500 mt-1">
                ທ່ານຍັງບໍ່ມີປະຫວັດການສັ່ງຊື້ໃນໝວດໝູ່ນີ້
              </p>
            </div>
            <Link
              to="/"
              className="btn btn--gold inline-flex items-center gap-2 py-2 px-4 rounded-xl text-xs shadow-glow"
            >
              <span>ເລືອກເບິ່ງສິນຄ້າສັ່ງພິມ</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((ord) => {
              const totalLAK = ord.totalAmountLAK || ord.total_amount_lak || ord.total_price || 0;
              const orderCode = ord.orderNumber || ord.order_number || ord.orderNo || ord.order_no || ord.id;
              const items = ord.items || [];

              return (
                <div
                  key={ord.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 hover:border-amber-300 transition shadow-xs space-y-4"
                >
                  {/* Order Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-black text-blue-900 font-mono bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          {orderCode}
                        </span>
                        {getStatusBadge(ord.status || ord.overall_status)}
                        <span className="text-xs text-slate-500 font-mono">
                          {formatOrderDate(ord)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 font-mono">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>ຂົນສົ່ງ: {ord.courierName || ord.courier_name || 'Anousith Express'}</span>
                        {(ord.trackingCode || ord.tracking_code) && (
                          <span className="text-amber-700 font-bold">
                            [{ord.trackingCode || ord.tracking_code}]
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">ຍອດລວມທັງໝົດ</span>
                      <span className="text-base font-black text-amber-700 font-mono">
                        ₭ {totalLAK.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Order Line Items */}
                  <div className="space-y-2.5">
                    {items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-900">
                            {it.item_name || it.job_name}
                          </h4>
                          <div className="text-[11px] text-slate-500 space-x-3 font-mono">
                            <span>ຈຳນວນ: <strong className="text-slate-800">{it.quantity} ຊິ້ນ</strong></span>
                            <span>•</span>
                            <span>ຂະໜາດ: <span className="text-slate-700">{it.paper_size || 'Standard Size'}</span></span>
                            {it.binding_type && it.binding_type !== 'NONE' && (
                              <>
                                <span>•</span>
                                <span>ເຂົ້າເຫຼັ້ມ: {it.binding_type}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleReorderItem(it)}
                            className="btn btn--gold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-glow"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>ສັ່ງພິມຊ້ຳ 1 ຄລິກ</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Card Footer */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-400 text-[11px]">
                      ລາຍການສິນຄ້າ {items.length} ລາຍການ
                    </span>
                    <Link
                      to={`/track?q=${encodeURIComponent(orderCode)}`}
                      className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 transition"
                    >
                      <span>ກວດສອບສະຖານະການຈັດສົ່ງ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
