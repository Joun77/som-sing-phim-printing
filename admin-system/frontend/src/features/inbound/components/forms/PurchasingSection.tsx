import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Phone, Link as LinkIcon, Upload, X } from 'lucide-react';
import { InboundItemFormData } from './types';

interface PurchasingSectionProps {
  item: InboundItemFormData;
  currentLang: string;
  updateField: (field: keyof InboundItemFormData, value: any) => void;
}

export const PurchasingSection: React.FC<PurchasingSectionProps> = ({
  item,
  currentLang,
  updateField
}) => {
  const { t } = useTranslation();

  return (
    <div className="border-t border-slate-100 pt-6">
      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
        <Settings className="w-4 h-4 text-slate-500" />
        <span>{t('inbound.printer.purchasing_section')}</span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/30 p-5 rounded-3xl border border-indigo-100/60">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {t('inbound.printer.import_qty')} *
          </label>
          <input 
            type="number" 
            value={item.importQty} 
            onChange={(e) => updateField('importQty', Number(e.target.value))} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            min="1" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {t('inbound.printer.import_cost')} *
          </label>
          <div className="relative">
            <input 
              type="number" 
              value={item.importCost} 
              onChange={(e) => updateField('importCost', e.target.value)} 
              className="w-full pl-4 pr-16 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
              placeholder="0.00" 
              required 
            />
            <select 
              value={item.importCurrency} 
              onChange={(e) => updateField('importCurrency', e.target.value)} 
              className="absolute right-2 top-2 bottom-2 bg-slate-100 border border-slate-200 rounded-xl px-2 text-[10px] font-black focus:outline-none"
            >
              <option value="LAK">LAK</option>
              <option value="THB">THB</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {currentLang === 'lo' ? 'ຊ່ອງທາງຊຳລະເງິນ (Payment Method) *' : 'Payment Method *'}
          </label>
          <select 
            value={item.paymentMethod} 
            onChange={(e) => updateField('paymentMethod', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
          >
            <option value="TRANSFER">{currentLang === 'lo' ? 'ໂອນເງິນ (Bank Transfer)' : 'Bank Transfer'}</option>
            <option value="CASH">{currentLang === 'lo' ? 'ເງິນສົດ (Cash)' : 'Cash'}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('inbound.printer.supplier_phone')}</span>
          </label>
          <input 
            type="tel" 
            value={item.supplierPhone} 
            onChange={(e) => updateField('supplierPhone', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="e.g. +856 20 12345678" 
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-black uppercase text-slate-400 mb-2 flex items-center gap-1">
            <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentLang === 'lo' ? 'ລິ້ງສັ່ງຊື້ສິນຄ້າ / ເວັບໄຊ (Purchase Link)' : 'Purchase / Order URL'}</span>
          </label>
          <input 
            type="url" 
            value={item.purchaseLink} 
            onChange={(e) => updateField('purchaseLink', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="https://..." 
          />
        </div>

        {/* Actual Product Photos Upload (Multiple) */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase text-slate-400">
            {currentLang === 'lo' ? 'ຮູບພາບສິນຄ້າຕົວຈິງ (Product Photos)' : 'Actual Product Photos'}
          </label>
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 bg-white text-center transition cursor-pointer relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;
                Array.from(files).forEach(file => {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (ev.target?.result) {
                      updateField('actualImages', [...(item.actualImages || []), ev.target!.result as string]);
                    }
                  };
                  reader.readAsDataURL(file);
                });
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center gap-1.5 text-slate-500">
              <Upload className="w-5 h-5 text-indigo-600" />
              <p className="text-xs font-semibold">{t('inbound.printer.upload_placeholder')}</p>
            </div>
          </div>

          {item.actualImages && item.actualImages.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {item.actualImages.map((img, imgIdx) => (
                <div key={imgIdx} className="relative w-14 h-14 rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <img src={img} alt={`Product ${imgIdx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      updateField('actualImages', item.actualImages.filter((_, i) => i !== imgIdx));
                    }}
                    className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded-full opacity-80 hover:opacity-100 transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Slip Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase text-slate-400">
            {currentLang === 'lo' ? 'ໃບບິນ / ສະລິບໂອນເງິນ (Payment Slip)' : 'Payment Slip / Receipt'}
          </label>
          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-4 bg-white text-center transition cursor-pointer relative">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  if (ev.target?.result) updateField('paymentSlip', ev.target.result as string);
                };
                reader.readAsDataURL(file);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center gap-1.5 text-slate-500">
              <Upload className="w-5 h-5 text-emerald-600" />
              <p className="text-xs font-semibold">{t('inbound.printer.upload_placeholder')}</p>
            </div>
          </div>

          {item.paymentSlip && (
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700 truncate">Payment Slip Uploaded</span>
              <button 
                type="button" 
                onClick={() => updateField('paymentSlip', '')} 
                className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
              >
                {t('common.delete')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
