import React, { useState, useEffect } from 'react';
import { 
  User, 
  X, 
  Save, 
  Tag, 
  Phone, 
  MapPin, 
  Truck, 
  FileText,
  Building2,
  Check
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { Customer } from '../types';
import { LAO_LOCATIONS, getDistrictsForProvince } from '../../../data/laoLocations';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onOpenManageCategories?: () => void;
  onSuccess?: () => void;
}

export function CustomerFormModal({
  isOpen,
  onClose,
  customer,
  onOpenManageCategories,
  onSuccess
}: CustomerFormModalProps) {
  const { customerCategories = [], addCustomer, updateCustomer, showToast } = useApp();
  const isEdit = Boolean(customer && customer.id);

  // Form States
  const [name, setName] = useState('');
  const [tier, setTier] = useState('RETAIL');
  const [phone, setPhone] = useState('');
  
  // Location States (Village, District, Province)
  const [province, setProvince] = useState('ນະຄອນຫຼວງວຽງຈັນ');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');

  // Shipping & Tax
  const [preferredCourier, setPreferredCourier] = useState('');
  const [hasTaxInfo, setHasTaxInfo] = useState(false);
  const [taxId, setTaxId] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate data on open / customer change
  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setName(customer.name || '');
        setTier(customer.tier || 'RETAIL');
        setPhone(customer.phone || '');
        setProvince(customer.province || 'ນະຄອນຫຼວງວຽງຈັນ');
        setDistrict(customer.district || '');
        setVillage(customer.village || '');
        setPreferredCourier(customer.preferredCourier || '');
        setHasTaxInfo(Boolean(customer.taxId));
        setTaxId(customer.taxId || '');
        setBranchCode(customer.branchCode || '');
        setNotes(customer.notes || '');
      } else {
        // Reset for Add
        setName('');
        const defaultCat = customerCategories.find((c: any) => c.isDefault) || customerCategories[0];
        setTier(defaultCat ? defaultCat.id : 'RETAIL');
        setPhone('');
        setProvince('ນະຄອນຫຼວງວຽງຈັນ');
        setDistrict('');
        setVillage('');
        setPreferredCourier('');
        setHasTaxInfo(false);
        setTaxId('');
        setBranchCode('');
        setNotes('');
      }
    }
  }, [isOpen, customer, customerCategories]);

  if (!isOpen) return null;

  // Available districts for the selected province
  const availableDistricts = getDistrictsForProvince(province);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('ກະລຸນາປ້ອນຊື່ລູກຄ້າ', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build full address string from village, district, province
      const addressParts = [
        village ? `ບ້ານ ${village.trim()}` : '',
        district ? `ເມືອງ ${district.trim()}` : '',
        province ? (province.startsWith('ແຂວງ') || province.startsWith('ນະຄອນຫຼວງ') ? province.trim() : `ແຂວງ ${province.trim()}`) : ''
      ].filter(Boolean);
      const fullAddress = addressParts.join(', ');

      const payload = {
        name: name.trim(),
        tier,
        phone: phone.trim(),
        province,
        district: district.trim(),
        village: village.trim(),
        address: fullAddress,
        preferredCourier: preferredCourier.trim() || undefined,
        taxId: hasTaxInfo && taxId.trim() ? taxId.trim() : undefined,
        branchCode: hasTaxInfo && branchCode.trim() ? branchCode.trim() : undefined,
        notes: notes.trim() || undefined,
        creditLimit: 0,
      };

      if (isEdit && customer) {
        await updateCustomer(customer.id, payload);
        showToast('ອັບເດດຂໍ້ມູນລູກຄ້າສຳເລັດ!', 'success');
      } else {
        await addCustomer(payload);
        showToast('ລົງທະບຽນລູກຄ້າໃໝ່ສຳເລັດ!', 'success');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'ບັນທຶກບໍ່ສຳເລັດ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden my-auto animate-scale-up">
        
        {/* Universal Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${isEdit ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-accent-sky'}`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {isEdit ? 'ແກ້ໄຂຂໍ້ມູນລູກຄ້າ (Edit Customer)' : 'ລົງທະບຽນລູກຄ້າໃໝ່ (Register Customer)'}
              </h2>
              <p className="text-xs text-slate-400 font-semibold">
                {isEdit ? 'ປັບປຸງຂໍ້ມູນປະຈຳຕົວ ແລະ ທີ່ຢູ່ຈັດສົ່ງ' : 'ບັນທຶກໂປຣໄຟລ໌ລູກຄ້າ ແລະ ທີ່ຢູ່ຈັດສົ່ງ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition shadow-sm border border-transparent hover:border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Universal Form Body */}
        <form id="customer-universal-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs font-bold text-slate-700">
          
          {/* Row 1: Name & Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-600 uppercase block text-[11px]">
                ຊື່ລູກຄ້າ / ຊື່ຮ້ານ / ບໍລິສັດ *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ສົມໃຈ ພິມງາມ"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:outline-none focus:border-accent-sky"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-600 uppercase block text-[11px] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-accent-sky" /> ໝວດໝູ່ລູກຄ້າ *
                </label>
                {onOpenManageCategories && (
                  <button
                    type="button"
                    onClick={onOpenManageCategories}
                    className="text-[10px] text-accent-sky hover:underline font-bold"
                  >
                    + ຈັດການໝວດໝູ່
                  </button>
                )}
              </div>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:border-accent-sky"
              >
                {customerCategories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Phone & Preferred Courier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-600 uppercase block text-[11px] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> ເບີໂທຕິດຕໍ່
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 020 55554444"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:outline-none focus:border-accent-sky"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-600 uppercase block text-[11px] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-500" /> ຂົນສົ່ງປະຈຳ (Preferred Courier)
              </label>
              <input
                type="text"
                value={preferredCourier}
                onChange={(e) => setPreferredCourier(e.target.value)}
                placeholder="e.g. ຮຸ່ງອາລຸນ, ອານຸສິດ, Flash, ມີໄຊ..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:outline-none focus:border-accent-sky"
              />
            </div>
          </div>

          {/* Location Section: ບ້ານ, ເມືອງ, ແຂວງ */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <span className="font-black text-slate-800 flex items-center gap-1.5 text-xs">
              <MapPin className="w-4 h-4 text-accent-sky" />
              <span>ທີ່ຢູ່ຈັດສົ່ງສິນຄ້າ (ບ້ານ / ເມືອງ / ແຂວງ)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. ແຂວງ (Province) */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase block text-[10px]">
                  ແຂວງ (Province)
                </label>
                <select
                  value={province}
                  onChange={(e) => {
                    setProvince(e.target.value);
                    setDistrict('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:border-accent-sky"
                >
                  {LAO_LOCATIONS.map((prov) => (
                    <option key={prov.name} value={prov.label}>
                      {prov.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. ເມືອງ (District) */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase block text-[10px]">
                  ເມືອງ (District)
                </label>
                {availableDistricts.length > 0 ? (
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 text-xs focus:outline-none focus:border-accent-sky"
                  >
                    <option value="">-- ເລືອກເມືອງ --</option>
                    {availableDistricts.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="ລະບຸເມືອງ"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:outline-none focus:border-accent-sky"
                  />
                )}
              </div>

              {/* 3. ບ້ານ (Village) */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase block text-[10px]">
                  ບ້ານ (Village)
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. ໂພນສະຫວັນ"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:outline-none focus:border-accent-sky"
                />
              </div>
            </div>
          </div>

          {/* Tax Information (Optional Section) */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-800 flex items-center gap-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasTaxInfo}
                  onChange={(e) => setHasTaxInfo(e.target.checked)}
                  className="w-4 h-4 rounded text-accent-sky focus:ring-0 cursor-pointer"
                />
                <FileText className="w-4 h-4 text-amber-600" />
                <span>ຂໍ້ມູນໃບກຳກັບພາສີ (Tax ID)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </div>

            {hasTaxInfo && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase block">
                    ເລກປະຈຳຕົວຜູ້ເສຍພາສີ (Tax ID)
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="e.g. 0100000000"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-accent-sky"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase block">
                    ລະຫັດສາຂາ (Branch Code)
                  </label>
                  <input
                    type="text"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    placeholder="e.g. 00000 (ສຳນັກງານໃຫຍ່)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-accent-sky"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-slate-600 uppercase block text-[11px]">
              ໝາຍເຫດເພີ່ມເຕີມ (Notes)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ໝາຍເຫດພິເສດກ່ຽວກັບລູກຄ້າທ່ານນີ້..."
              rows={2}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:outline-none focus:border-accent-sky resize-none"
            />
          </div>
        </form>

        {/* Universal Sticky Modal Footer: Distinct Cancel & Save Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            ຍົກເລີກ (Cancel)
          </button>

          <button
            type="submit"
            form="customer-universal-form"
            disabled={isSubmitting}
            className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition shadow-sm cursor-pointer ${
              isSubmitting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : isEdit
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-accent-sky hover:bg-sky-600 text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'ກຳລັງບັນທຶກ...' : isEdit ? 'ບັນທຶກການແກ້ໄຂ' : 'ບັນທຶກຂໍ້ມູນລູກຄ້າ'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
