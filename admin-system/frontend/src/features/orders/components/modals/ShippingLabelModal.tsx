import React, { useState, useEffect, useMemo } from 'react';
import { Printer, Truck, Package, Check, FileText, Building2, Hash } from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';
import ShippingLabelTemplate from '../documents/ShippingLabelTemplate';
import { FormModalTemplate } from '../../../../components/common/FormModalTemplate';

interface ShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: any;
  orders?: any[];
}

const DEFAULT_COURIERS = [
  { id: 'anousith', name: 'Anousith Express', shortName: 'Anousith', defaultBranch: 'ANO-VTE-01' },
  { id: 'hal', name: 'HAL Logistics', shortName: 'HAL', defaultBranch: 'HAL-CENTRAL' },
  { id: 'flash', name: 'Flash Express', shortName: 'Flash', defaultBranch: 'FLASH-LA-02' },
  { id: 'jt', name: 'J&T Express', shortName: 'J&T', defaultBranch: 'JT-DONGDOK' },
];

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({
  isOpen,
  onClose,
  order,
  orders,
}) => {
  const { inventory, updateOrderTracking, dischargeInventoryStock, showToast } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const effectiveOrders: any[] = useMemo(() => {
    if (orders && orders.length > 0) return orders;
    if (order) return [order];
    return [];
  }, [orders, order]);

  const isBulk = effectiveOrders.length > 1;
  const primaryOrder = effectiveOrders[0];

  const [selectedCourier, setSelectedCourier] = useState<string>('Anousith Express');
  const [branchCode, setBranchCode] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [labelFormat, setLabelFormat] = useState<'100x150' | 'A4'>('100x150');
  const [deductPackaging, setDeductPackaging] = useState<boolean>(true);

  // Filter packaging items in inventory
  const packagingList = inventory.filter(i => 
    i.category === 'Packaging' ||
    i.id.startsWith('PKG-') ||
    i.name.toLowerCase().includes('box') ||
    i.name.toLowerCase().includes('envelope') ||
    i.name.toLowerCase().includes('ກ່ອງ') ||
    i.name.toLowerCase().includes('ຊອງ')
  );

  const [selectedBoxSku, setSelectedBoxSku] = useState<string>(packagingList[0]?.id || 'PKG-BOX-01');

  useEffect(() => {
    if (primaryOrder) {
      const activeCourierName = primaryOrder.courier || primaryOrder.deliveryMethod || 'Anousith Express';
      setSelectedCourier(activeCourierName);
      setBranchCode(primaryOrder.branchCode || primaryOrder.courierBranch || (DEFAULT_COURIERS.find(c => c.name === activeCourierName) as any)?.defaultBranch || '');
      setTrackingNumber(primaryOrder.trackingNumber || `LA-${Date.now().toString().slice(-8)}`);
    }
  }, [primaryOrder]);

  if (!isOpen || effectiveOrders.length === 0) return null;

  const handlePrint = () => {
    // 1. Update tracking number on order if changed
    if (updateOrderTracking) {
      effectiveOrders.forEach((ord, idx) => {
        const trk = isBulk 
          ? (ord.trackingNumber || `LA-${(Date.now() + idx).toString().slice(-8)}`)
          : trackingNumber;
        updateOrderTracking(ord.id, selectedCourier, trk, ord.shippingFee, branchCode);
      });
    }

    // 2. Optionally deduct packaging boxes
    if (deductPackaging && selectedBoxSku) {
      const boxItem = inventory.find(i => i.id === selectedBoxSku || i.skuCode === selectedBoxSku);
      const available = boxItem ? Number(boxItem.stockQty || 0) : 0;
      const qtyToDeduct = effectiveOrders.length;
      if (available >= qtyToDeduct) {
        dischargeInventoryStock(selectedBoxSku, qtyToDeduct, 'PACKAGING_USE', `ຕັດກ່ອງພັດສະດຸ ສຳລັບ ${qtyToDeduct} ອໍເດີ`);
        showToast(`ຕັດສະຕັອກກ່ອງພັດສະດຸ ${qtyToDeduct} ອັນສຳເລັດ!`, 'success');
      } else {
        showToast('ກ່ອງພັດສະດຸທີ່ເລືອກໃນສາງມີບໍ່ພຽງພໍ', 'warning');
      }
    }

    // 3. Trigger Browser Print
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Printer className="w-6 h-6" />}
      title={isBulk ? `ພິມໃບປະໜ້າພັດສະດຸຫຼາຍອໍເດີ (${effectiveOrders.length} ອໍເດີ)` : "ພິມໃບປະໜ້າພັດສະດຸ (Shipping Label & Packing Slip)"}
      subtitle={isBulk ? `ເລືອກພິມລວມ ${effectiveOrders.length} ລາຍການ • ພ້ອມຕັດສະຕັອກກ່ອງ` : `#${primaryOrder?.orderNo || primaryOrder?.id} • ${primaryOrder?.customerName || 'Customer'}`}
      badgeText={labelFormat === '100x150' ? (isBulk ? `${effectiveOrders.length} Labels (100x150)` : 'Thermal 100x150') : 'A4 Packing Slip'}
      maxWidthClass="max-w-5xl"
      footerActions={
        <div className="flex items-center justify-end gap-3 w-full no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-2.5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-md shadow-sky-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isBulk ? `ພິມທັງໝົດ (${effectiveOrders.length} ໃບ)` : 'ພິມໃບປະໜ້າ (Print Label)'}</span>
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 no-print">
          {/* Courier Selection */}
          <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              1. ບໍລິສັດຂົນສົ່ງ (Courier) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_COURIERS.map((c) => {
                const isSelected = selectedCourier === c.name || selectedCourier === c.shortName;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourier(c.name);
                      if (c.defaultBranch && !branchCode) {
                        setBranchCode(c.defaultBranch);
                      }
                    }}
                    className={`p-2.5 rounded-xl border-2 text-xs font-black transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-xs'
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className="truncate">{c.shortName}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Branch Code */}
            <div className="pt-2 space-y-1">
              <label className="block text-[11px] font-black text-slate-600 uppercase flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>ລະຫັດສາຂາ / ສາຂາຂົນສົ່ງ (Branch Code)</span>
              </label>
              <input
                type="text"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                placeholder="Ex: ANO-VTE-01"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tracking Number Input */}
          {!isBulk && (
            <div className="space-y-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-sky-600" />
                <span>2. ເລກພັດສະດຸ (Tracking Number) *</span>
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. ANO-88492019"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-1.5 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              {isBulk ? '2.' : '3.'} ຮູບແບບຂະໜາດໃບພິມ (Label Format)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLabelFormat('100x150')}
                className={`p-2.5 rounded-xl border text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  labelFormat === '100x150'
                    ? 'border-sky-600 bg-sky-50 text-sky-900 font-black'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Package className="w-4 h-4 text-sky-600" />
                <span>100×150 mm (Thermal)</span>
              </button>
              <button
                type="button"
                onClick={() => setLabelFormat('A4')}
                className={`p-2.5 rounded-xl border text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  labelFormat === 'A4'
                    ? 'border-sky-600 bg-sky-50 text-sky-900 font-black'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>A4 (Packing Slip)</span>
              </button>
            </div>
          </div>

          {/* Packaging Box Deduction Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deductPackaging}
                onChange={(e) => setDeductPackaging(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
              />
              <span className="text-xs font-black text-slate-800">
                ຕັດສະຕັອກກ່ອງພັດສະດຸ/ຊອງ ({effectiveOrders.length} ອັນ)
              </span>
            </label>

            {deductPackaging && (
              <div className="pt-2 space-y-1.5 border-t border-slate-100">
                <label className="block text-[10px] font-black uppercase text-slate-500">
                  ເລືອກຂະໜາດກ່ອງຈາກສາງ:
                </label>
                <select
                  value={selectedBoxSku}
                  onChange={(e) => setSelectedBoxSku(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                >
                  {(packagingList.length > 0 ? packagingList : inventory).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (ເຫຼືອ: {p.stockQty || 0})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right Live Preview (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center overflow-x-auto min-h-[380px] border border-slate-200 max-h-[70vh] overflow-y-auto">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 no-print">
            {isBulk ? `PREVIEW ${effectiveOrders.length} SHIPPING LABELS` : 'LIVE THERMAL LABEL PREVIEW (100×150 MM)'}
          </span>
          <div className="space-y-4 w-full flex flex-col items-center">
            {effectiveOrders.map((ord, idx) => (
              <div 
                key={ord.id || idx} 
                className="shadow-xl rounded-lg overflow-hidden bg-white max-w-full print:shadow-none print:m-0"
                style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
              >
                <ShippingLabelTemplate
                  order={ord}
                  courierName={selectedCourier}
                  trackingNumber={isBulk ? (ord.trackingNumber || `LA-${(Date.now() + idx).toString().slice(-8)}`) : trackingNumber}
                  format={labelFormat}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </FormModalTemplate>
  );
};

export default ShippingLabelModal;
