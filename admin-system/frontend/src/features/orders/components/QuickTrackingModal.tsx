import React, { useState, useEffect } from 'react';
import { Truck, Check, X, PackageCheck, Hash, Building2, DollarSign } from 'lucide-react';
import type { Courier } from '../../../types';
import { FormModalTemplate, FormSection } from '../../../components/common/FormModalTemplate';

interface QuickTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  couriers?: Courier[];
  onSaveTracking: (orderId: string, courierName: string, trackingNumber: string, shippingFee?: number, branchCode?: string) => void;
}

const DEFAULT_COURIERS = [
  { id: 'anousith', name: 'Anousith Express', shortName: 'Anousith', defaultBranch: 'ANO-VTE-01' },
  { id: 'hal', name: 'HAL Logistics', shortName: 'HAL', defaultBranch: 'HAL-CENTRAL' },
  { id: 'flash', name: 'Flash Express', shortName: 'Flash', defaultBranch: 'FLASH-LA-02' },
  { id: 'jt', name: 'J&T Express', shortName: 'J&T', defaultBranch: 'JT-DONGDOK' },
];

export const QuickTrackingModal: React.FC<QuickTrackingModalProps> = ({
  isOpen,
  onClose,
  order,
  couriers = [],
  onSaveTracking,
}) => {
  const [selectedCourier, setSelectedCourier] = useState<string>('Anousith Express');
  const [branchCode, setBranchCode] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [shippingFee, setShippingFee] = useState<number>(15000);

  const availableCouriers = couriers && couriers.length > 0 ? couriers : DEFAULT_COURIERS;

  useEffect(() => {
    if (order) {
      const activeCourierName = order.deliveryMethod || order.courier || availableCouriers[0]?.name || 'Anousith Express';
      setSelectedCourier(activeCourierName);
      setBranchCode(order.branchCode || order.courierBranch || (availableCouriers.find(c => c.name === activeCourierName) as any)?.defaultBranch || '');
      setTrackingNumber(order.trackingNumber || '');
      setShippingFee(order.shippingFee || 15000);
    }
  }, [order, availableCouriers]);

  if (!isOpen || !order) return null;

  const orderIdentifier = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTracking(order.id, selectedCourier, trackingNumber.trim(), shippingFee, branchCode.trim());
    onClose();
  };

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Truck className="w-6 h-6" />}
      title="ບັນທຶກເລກພັດສະດຸ & ຂົນສົ່ງ (Courier Tracking)"
      subtitle={`Order #${orderIdentifier} • ${order.customerName || order.customer_name || 'Customer'}`}
      badgeText={selectedCourier}
      maxWidthClass="max-w-2xl"
      footerActions={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-md shadow-sky-600/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
          >
            <PackageCheck className="w-4 h-4" />
            <span>ບັນທຶກເລກພັດສະດຸ</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Select Courier */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
            1. ເລືອກບໍລິສັດຂົນສົ່ງ (Courier Company) *
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {availableCouriers.map((c: any) => {
              const isSelected = selectedCourier === c.name || selectedCourier === c.shortName;
              return (
                <button
                  key={c.id || c.name}
                  type="button"
                  onClick={() => {
                    setSelectedCourier(c.name);
                    if (c.defaultBranch && !branchCode) {
                      setBranchCode(c.defaultBranch);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-xs font-black transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/80 text-sky-950 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Truck className={`w-4 h-4 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className="truncate">{c.shortName || c.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Branch Code & Tracking Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Branch Code Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>2. ລະຫັດສາຂາ / ສາຂາຂົນສົ່ງ (Branch Code)</span>
            </label>
            <input
              type="text"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              placeholder="Ex: ANO-DONGDOK / 012"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-sky-500 focus:outline-none transition shadow-2xs"
            />
          </div>

          {/* Tracking Number Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-sky-600" />
              <span>3. ເລກພັດສະດຸ (Tracking Number) *</span>
            </label>
            <input
              type="text"
              required
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Ex: ANO98234123LA"
              className="w-full px-4 py-2.5 bg-white border-2 border-sky-400 rounded-xl text-sm font-mono font-black text-slate-900 focus:border-sky-600 focus:outline-none transition shadow-2xs"
            />
          </div>
        </div>

        {/* Shipping Fee */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>4. ຄ່າຂົນສົ່ງ (Shipping Fee - LAK)</span>
          </label>
          <input
            type="number"
            value={shippingFee}
            onChange={(e) => setShippingFee(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-sky-500 focus:outline-none transition shadow-2xs"
          />
        </div>
      </form>
    </FormModalTemplate>
  );
};

export default QuickTrackingModal;
