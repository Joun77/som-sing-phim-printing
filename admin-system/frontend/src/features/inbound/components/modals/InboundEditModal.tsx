import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Edit3, DollarSign, Calendar, CreditCard, Phone, Link as LinkIcon } from 'lucide-react';
import DynamicSpecForm from '@features/inventory/components/forms/DynamicSpecForm';
import { FormModalTemplate } from '@components/common';

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

  const [itemName, setItemName] = useState(item.name || item.itemName || '');
  const [supplierName, setSupplierName] = useState(item.supplier || item.supplierName || '');
  const [receiptDate, setReceiptDate] = useState(item.receiptDate || item.inboundDate || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(item.paymentMethod || 'TRANSFER');
  const [totalPrice, setTotalPrice] = useState(item.totalPrice || 0);
  const [initialQty, setInitialQty] = useState(item.initialQty || item.currentQty || item.quantity || 1);
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

    if (updatedSpecs.colorName && (!itemName || itemName.includes('ໝຶກ') || itemName.includes('Ink'))) {
      const brand = updatedSpecs.brand || formData.specs?.brand || '';
      const prefix = brand ? `${brand} ` : 'ໝຶກ ';
      setItemName(`${prefix}${updatedSpecs.colorName}`);
    }
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
      name: itemName,
      itemName: itemName,
      supplier: supplierName,
      supplierName: supplierName,
      receiptDate,
      inboundDate: receiptDate,
      paymentMethod,
      totalPrice: Number(totalPrice),
      quantity: Number(initialQty),
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
    <FormModalTemplate
      onClose={onClose}
      icon={<Edit3 className="w-5 h-5 text-accent-sky" />}
      title={currentLang === 'lo' ? 'ແກ້ໄຂຂໍ້ມູນການນຳເຂົ້າ' : 'Edit Inbound Entry'}
      subtitle={`SKU / ID: ${item.sku || item.id} • Category: ${category}`}
      badgeText="EDIT INBOUND"
      maxWidthClass="max-w-5xl"
      footerActions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
          </button>
          <button
            type="submit"
            form="edit-inbound-form"
            className="px-6 py-2.5 rounded-2xl bg-accent-sky hover:bg-sky-600 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-sky-600/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ບັນທຶກການແກ້ໄຂ' : 'Save Changes'}</span>
          </button>
        </div>
      }
    >
      <form id="edit-inbound-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Category Spec Form Component */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
            {currentLang === 'lo' ? 'ສະເປັກທາງເຕັກນິກ (Category Technical Specs)' : 'Category Technical Specs'}
          </h4>
          <DynamicSpecForm categoryType={category} formData={formData} onChange={handleSpecChange} />
        </div>

        {/* Purchasing Info & Financials */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>{currentLang === 'lo' ? 'ຂໍ້ມູນການຈັດຊື້ & ການຊຳລະເງິນ' : 'Purchasing & Payment Details'}</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="md:col-span-2">
              <label className="block text-slate-600 font-bold mb-1">
                {currentLang === 'lo' ? 'ຊື່ສິນຄ້າ / ລາຍການ (Item Name)' : 'Item Name'}
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">
                {currentLang === 'lo' ? 'ຜູ້ສະໜອງ / ຮ້ານຄ້າ (Supplier Name)' : 'Supplier Name'}
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentLang === 'lo' ? 'ວັນທີຮັບສິນຄ້າ (Receipt Date)' : 'Receipt Date'}</span>
              </label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentLang === 'lo' ? 'ຊ່ອງທາງການຊຳລະເງິນ (Payment Method)' : 'Payment Method'}</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              >
                <option value="TRANSFER">โอนเงิน (Bank Transfer)</option>
                <option value="CASH">เงินสด (Cash)</option>
                <option value="CREDIT_30">เครดิต 30 วัน (30 Days Credit)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">
                {currentLang === 'lo' ? 'ຈຳນວນນຳເຂົ້າ (Initial Qty)' : 'Initial Qty'}
              </label>
              <input
                type="number"
                value={initialQty}
                onChange={(e) => setInitialQty(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">
                {currentLang === 'lo' ? 'ມູນຄ່າລວມ (Total Price LAK)' : 'Total Price (LAK)'}
              </label>
              <input
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentLang === 'lo' ? 'ເບີໂທຜູ້ສະໜອງ (Supplier Phone)' : 'Supplier Phone'}</span>
              </label>
              <input
                type="text"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                placeholder="e.g. 020-55558888"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentLang === 'lo' ? 'ລິ້ງສັ່ງຊື້ (Purchase Link)' : 'Purchase Link'}</span>
              </label>
              <input
                type="url"
                value={purchaseLink}
                placeholder="https://..."
                onChange={(e) => setPurchaseLink(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      </form>
    </FormModalTemplate>
  );
}
