import React, { useState, useEffect } from 'react';
import { Truck, Check, X, PackageCheck, Hash } from 'lucide-react';
import type { Courier } from '../../../types';

interface QuickTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  couriers?: Courier[];
  onSaveTracking: (orderId: string, courierName: string, trackingNumber: string, shippingFee?: number) => void;
}

const DEFAULT_COURIERS = [
  { id: 'anousith', name: 'Anousith Express', shortName: 'Anousith' },
  { id: 'hal', name: 'HAL Logistics', shortName: 'HAL' },
  { id: 'flash', name: 'Flash Express', shortName: 'Flash' },
  { id: 'jt', name: 'J&T Express', shortName: 'J&T' },
];

export const QuickTrackingModal: React.FC<QuickTrackingModalProps> = ({
  isOpen,
  onClose,
  order,
  couriers = [],
  onSaveTracking,
}) => {
  const [selectedCourier, setSelectedCourier] = useState<string>('Anousith Express');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [shippingFee, setShippingFee] = useState<number>(15000);

  const availableCouriers = couriers && couriers.length > 0 ? couriers : DEFAULT_COURIERS;

  useEffect(() => {
    if (order) {
      setSelectedCourier(order.deliveryMethod || order.courier || availableCouriers[0]?.name || 'Anousith Express');
      setTrackingNumber(order.trackingNumber || '');
      setShippingFee(order.shippingFee || 15000);
    }
  }, [order, availableCouriers]);

  if (!isOpen || !order) return null;

  const orderIdentifier = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTracking(order.id, selectedCourier, trackingNumber.trim(), shippingFee);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Truck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">ກະລຸນາໃສ່ເລກພັດສະດຸ (Tracking No.)</h3>
              <p className="text-xs text-slate-300 font-mono">#{orderIdentifier} - {order.customerName || order.customer_name || 'Customer'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Select Courier */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              ເລືອກບໍລິສັດຂົນສົ່ງ (Courier) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableCouriers.map((c: any) => {
                const isSelected = selectedCourier === c.name || selectedCourier === c.shortName;
                return (
                  <button
                    key={c.id || c.name}
                    type="button"
                    onClick={() => setSelectedCourier(c.name)}
                    className={`p-3 rounded-2xl border-2 text-xs font-black transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/70 text-sky-950 shadow-xs'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 text-slate-600'
                    }`}
                  >
                    <span className="truncate">{c.shortName || c.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tracking Number Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              ເລກພັດສະດຸ (Tracking Number) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Ex: ANO98234123LA"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-black text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Shipping Fee */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              ຄ່າຂົນສົ່ງ (LAK)
            </label>
            <input
              type="number"
              value={shippingFee}
              onChange={(e) => setShippingFee(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none transition"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-md shadow-sky-600/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              <span>ບັນທຶກເລກພັດສະດຸ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickTrackingModal;
