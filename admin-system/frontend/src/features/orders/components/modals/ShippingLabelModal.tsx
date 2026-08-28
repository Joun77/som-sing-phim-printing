import React, { useState, useEffect } from 'react';
import { X, Printer, Truck, Package, Check, QrCode, FileText, Layers } from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';
import ShippingLabelTemplate from '../documents/ShippingLabelTemplate';

interface ShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

const DEFAULT_COURIERS = [
  { id: 'anousith', name: 'Anousith Express', shortName: 'Anousith' },
  { id: 'hal', name: 'HAL Logistics', shortName: 'HAL' },
  { id: 'flash', name: 'Flash Express', shortName: 'Flash' },
  { id: 'jt', name: 'J&T Express', shortName: 'J&T' },
];

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const { inventory, updateOrderTracking, dischargeInventoryStock, showToast } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [selectedCourier, setSelectedCourier] = useState<string>('Anousith Express');
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
    if (order) {
      setSelectedCourier(order.courier || order.deliveryMethod || 'Anousith Express');
      setTrackingNumber(order.trackingNumber || `LA-${Date.now().toString().slice(-8)}`);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    // 1. Update tracking number on order if changed
    if (updateOrderTracking && trackingNumber) {
      updateOrderTracking(order.id, selectedCourier, trackingNumber);
    }

    // 2. Optionally deduct packaging box
    if (deductPackaging && selectedBoxSku) {
      const boxItem = inventory.find(i => i.id === selectedBoxSku || i.skuCode === selectedBoxSku);
      const available = boxItem ? Number(boxItem.stockQty || 0) : 0;
      if (available > 0) {
        dischargeInventoryStock(selectedBoxSku, 1, 'PACKAGING_USE', `ຕັດກ່ອງພັດສະດຸສຳລັບອໍເດີ #${order.orderNo || order.id}`);
        showToast('ຕັດສະຕັອກກ່ອງພັດສະດຸ 1 ອັນສຳເລັດ!', 'success');
      } else {
        showToast('ກ່ອງພັດສະດຸທີ່ເລືອກໝົດສາງ ບໍ່ສາມາດຕັດສະຕັອກໄດ້', 'warning');
      }
    }

    // 3. Trigger Browser Print
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in no-print-modal">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden animate-scale-up text-slate-800 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Printer className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                ພິມໃບປະໜ້າພັດສະດຸ (Shipping Label & Packing Slip)
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                #{order.orderNo || order.id} • {order.customerName || 'Customer'}
              </p>
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

        {/* Modal Body: Left controls & Right Live Preview */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Controls (5 Cols) */}
          <div className="md:col-span-5 space-y-4 no-print">
            {/* Courier Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                ບໍລິສັດຂົນສົ່ງ (Courier) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_COURIERS.map((c) => {
                  const isSelected = selectedCourier === c.name || selectedCourier === c.shortName;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCourier(c.name)}
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
            </div>

            {/* Tracking Number Input */}
            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                ເລກພັດສະດຸ (Tracking Number) *
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. ANO-88492019"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Format Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                ຮູບແບບຂະໜາດໃບພິມ (Label Format)
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
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deductPackaging}
                  onChange={(e) => setDeductPackaging(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <span className="text-xs font-black text-slate-800">
                  ຕັດສະຕັອກກ່ອງພັດສະດຸ/ຊອງກັນກະແທກ (1 ອັນ)
                </span>
              </label>

              {deductPackaging && (
                <div className="pt-2 space-y-1.5 border-t border-slate-200">
                  <label className="block text-[10px] font-black uppercase text-slate-500">
                    ເລືອກຂະໜາດກ່ອງຈາກສາງ:
                  </label>
                  <select
                    value={selectedBoxSku}
                    onChange={(e) => setSelectedBoxSku(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
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

            {/* Print Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="w-2/3 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-md shadow-sky-600/20 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>ພິມໃບປະໜ້າ (Print)</span>
              </button>
            </div>
          </div>

          {/* Right Live Preview (7 Cols) */}
          <div className="md:col-span-7 bg-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center overflow-x-auto min-h-[360px] border border-slate-200">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 no-print">
              LIVE THERMAL LABEL PREVIEW (ຂະໜາດຈິງ 100×150 MM)
            </span>
            <div className="shadow-xl rounded-lg overflow-hidden bg-white">
              <ShippingLabelTemplate
                order={order}
                courierName={selectedCourier}
                trackingNumber={trackingNumber}
                format={labelFormat}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingLabelModal;
