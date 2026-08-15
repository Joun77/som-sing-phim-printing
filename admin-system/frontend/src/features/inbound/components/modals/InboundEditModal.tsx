import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Edit3, DollarSign, Calendar, CreditCard, Phone, Link as LinkIcon } from 'lucide-react';
import DynamicSpecForm from '@features/inventory/components/forms/DynamicSpecForm';

interface InboundEditModalProps {
  item: any;
  onSave: (updatedItem: any) => void;
  onClose: () => void;
}

export default function InboundEditModal({ item, onSave, onClose }: InboundEditModalProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const category = (item.category || '').toUpperCase();
  const [formData, setFormData] = useState({ ...item });

  const [receiptDate, setReceiptDate] = useState(item.receiptDate || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(item.paymentMethod || 'TRANSFER');
  const [totalPrice, setTotalPrice] = useState(item.totalPrice || 0);
  const [initialQty, setInitialQty] = useState(item.initialQty || item.currentQty || 1);
  const [supplierPhone, setSupplierPhone] = useState(item.supplier_phone || item.specs?.supplier_phone || '');
  const [purchaseLink, setPurchaseLink] = useState(item.purchase_link || item.specs?.purchase_link || '');

  const handleSpecChange = (updatedSpecs: any) => {
    setFormData(prev => ({
      ...prev,
      ...updatedSpecs,
      specs: {
        ...(prev.specs || {}),
        ...updatedSpecs
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const specsData = {
      ...(item.specs || {}),
      ...(item.technical_specs || {}),
      ...(formData.specs || {}),
      ...formData,
      supplier_phone: supplierPhone,
      purchase_link: purchaseLink
    };

    const updatedItem = {
      ...item,
      ...formData,
      receiptDate,
      paymentMethod,
      totalPrice: Number(totalPrice),
      initialQty: Number(initialQty),
      currentQty: Number(initialQty),
      supplier_phone: supplierPhone,
      purchase_link: purchaseLink,
      specs: specsData,
      technical_specs: specsData
    };

    onSave(updatedItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-sky-600" />
            <span>
              {currentLang === 'lo' ? 'ແກ້ໄຂຂໍ້ມູນການນຳເຂົ້າ (Edit Inbound Entry)' : 'Edit Inbound Entry'} - <span className="font-mono text-sky-700">{item.sku || item.id}</span>
            </span>
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin">
          {/* Category Spec Form Component */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              {currentLang === 'lo' ? 'ສະເປັກທາງເຕັກນິກ (Category Technical Specs)' : 'Category Technical Specs'}
            </h4>
            <DynamicSpecForm categoryType={category} formData={formData} onChange={handleSpecChange} />
          </div>

          {/* Purchasing Info & Financials */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>{currentLang === 'lo' ? 'ຂໍ້ມູນການຈັດຊື້ & ການຊຳລະເງິນ' : 'Purchasing & Payment Details'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {currentLang === 'lo' ? 'ຈຳນວນນຳເຂົ້າ (Import Qty):' : 'Import Quantity:'}
                </label>
                <input 
                  type="number"
                  min="1"
                  value={initialQty}
                  onChange={(e) => setInitialQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {currentLang === 'lo' ? 'ราคานำเข้ารวม (Total Import Price LAK):' : 'Total Import Cost (LAK):'}
                </label>
                <input 
                  type="number"
                  min="0"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentLang === 'lo' ? 'ຊ່ອງທາງຊຳລະເງິນ (Payment Method):' : 'Payment Method:'}</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                >
                  <option value="TRANSFER">{currentLang === 'lo' ? 'ໂອນເງິນ (Bank Transfer)' : 'Bank Transfer (โอนเงิน)'}</option>
                  <option value="CASH">{currentLang === 'lo' ? 'ເງິນສົດ (Cash)' : 'Cash (เงินสด)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentLang === 'lo' ? 'ວັນທີນຳເຂົ້າ (Import Date):' : 'Import Date:'}</span>
                </label>
                <input 
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentLang === 'lo' ? 'ເບີໂທຜູ້ຂາຍ (Supplier Phone):' : 'Supplier Phone:'}</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. +856 20 5555 1234"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentLang === 'lo' ? 'ລິ້ງຈັດຊື້ (Purchase Link):' : 'Purchase Link:'}</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. https://supplier.com/item/123"
                  value={purchaseLink}
                  onChange={(e) => setPurchaseLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-sky-600/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{currentLang === 'lo' ? 'ບັນທຶກການແກ້ໄຂ' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
