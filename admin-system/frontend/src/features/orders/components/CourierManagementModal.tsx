import React, { useState, useRef } from 'react';
import { 
  Truck, 
  Upload, 
  Trash2, 
  Edit3, 
  Check, 
  Plus, 
  Image as ImageIcon
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { FormModalTemplate } from '../../../components/common/FormModalTemplate';
import type { Courier } from '../../../types';

interface CourierManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourier?: (courierName: string) => void;
  currentLang?: string;
}

export const CourierManagementModal: React.FC<CourierManagementModalProps> = ({
  isOpen,
  onClose,
  currentLang = 'lo',
}) => {
  const { couriers, addCourier, updateCourier, deleteCourier, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [fee, setFee] = useState<number>(15000);
  const [eta, setEta] = useState('1-2 ວັນ (1-2 Days)');
  const [color, setColor] = useState('#2563eb');
  const [isUploading, setIsUploading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setIsEditing(null);
    setName('');
    setShortName('');
    setLogoUrl('');
    setFee(15000);
    setEta('1-2 ວັນ (1-2 Days)');
    setColor('#2563eb');
    setPreviewError(false);
  };

  const handleEdit = (c: Courier) => {
    setIsEditing(c.id);
    setName(c.name);
    setShortName(c.shortName || c.name);
    setLogoUrl(c.logoUrl || '');
    setFee(c.fee || 0);
    setEta(c.eta || '1-2 ວັນ');
    setColor(c.color || '#2563eb');
    setPreviewError(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8080/api/v1/admin/couriers/upload-logo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success' && data.fileUrl) {
        setLogoUrl(`http://localhost:8080${data.fileUrl}`);
        setPreviewError(false);
        showToast(
          currentLang === 'lo' ? '✓ ອັບໂຫລດຮູບສຳເລັດ!' : 'Logo uploaded successfully!',
          'success'
        );
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setLogoUrl(reader.result as string);
          setPreviewError(false);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setLogoUrl(reader.result as string);
        setPreviewError(false);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາໃສ່ຊື່ບໍລິສັດຂົນສົ່ງ' : 'Please enter courier name', 'warning');
      return;
    }

    if (isEditing) {
      await updateCourier(isEditing, {
        name: name.trim(),
        shortName: shortName.trim() || name.trim(),
        logoUrl: logoUrl.trim(),
        fee: Number(fee) || 0,
        eta: eta.trim() || '1-2 ວັນ',
        color,
      });
      showToast(
        currentLang === 'lo' ? '✓ ອັບເດດຂໍ້ມູນຂົນສົ່ງສຳເລັດ!' : 'Courier updated successfully!',
        'success'
      );
    } else {
      const newId = `courier_${Date.now()}`;
      await addCourier({
        id: newId,
        name: name.trim(),
        shortName: shortName.trim() || name.trim(),
        logoUrl: logoUrl.trim(),
        fee: Number(fee) || 0,
        eta: eta.trim() || '1-2 ວັນ',
        color,
        isActive: true,
      });
      showToast(
        currentLang === 'lo' ? '✓ ເພີ່ມບໍລິສັດຂົນສົ່ງໃໝ່ຮຽບຮ້ອຍ!' : 'New courier added successfully!',
        'success'
      );
    }

    resetForm();
  };

  const handleDelete = async (id: string, courierName: string) => {
    if (confirm(currentLang === 'lo' ? `ຕ້ອງການລຶບຂົນສົ່ງ "${courierName}" ແທ້ບໍ່?` : `Delete courier "${courierName}"?`)) {
      await deleteCourier(id);
      showToast(
        currentLang === 'lo' ? 'ລຶບຂົນສົ່ງຮຽບຮ້ອຍ' : 'Courier deleted',
        'info'
      );
      if (isEditing === id) resetForm();
    }
  };

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Truck className="w-5.5 h-5.5 text-white" />}
      title={currentLang === 'lo' ? 'ຈັດການບໍລິສັດຂົນສົ່ງ (Couriers)' : 'Manage Couriers & Logistics'}
      subtitle={currentLang === 'lo' ? 'ເພີ່ມ, ແກ້ໄຂ ໂລໂກ້ ແລະ ຊື່ບໍລິສັດຂົນສົ່ງສຳລັບລະບົບຈັດສົ່ງ' : 'Add or edit courier logos and company details'}
      badgeText="LOGISTICS"
      maxWidthClass="max-w-4xl"
      footerActions={
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-black transition cursor-pointer"
        >
          {currentLang === 'lo' ? 'ປິດໜ້າຕ່າງ' : 'Close'}
        </button>
      }
    >
      <div className="space-y-6">
        {/* Add / Edit Form */}
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
              {isEditing ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-sky-600" />}
              <span>{isEditing ? (currentLang === 'lo' ? 'ແກ້ໄຂຂໍ້ມູນຂົນສົ່ງ' : 'Edit Courier') : (currentLang === 'lo' ? 'ເພີ່ມບໍລິສັດຂົນສົ່ງໃໝ່' : 'Add New Courier')}</span>
            </span>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-700 underline font-bold cursor-pointer"
              >
                {currentLang === 'lo' ? 'ຍົກເລີກການແກ້ໄຂ' : 'Cancel Edit'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            {/* Logo Upload / Preview (4 cols) */}
            <div className="sm:col-span-4 space-y-2">
              <label className="block text-[11px] font-black text-slate-700 uppercase">
                {currentLang === 'lo' ? 'ຮູບໂລໂກ້ຂົນສົ່ງ (Logo):' : 'Company Logo:'}
              </label>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-2xl border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50/50 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition relative group overflow-hidden"
              >
                {logoUrl && !previewError ? (
                  <>
                    <img 
                      src={logoUrl} 
                      alt="Preview" 
                      onError={() => setPreviewError(true)}
                      className="max-h-24 max-w-full object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Upload className="w-4 h-4" />
                      <span>ປ່ຽນຮູບ</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1 text-slate-400">
                    <ImageIcon className="w-6 h-6 mx-auto text-slate-400" />
                    <span className="text-[11px] font-bold block text-slate-500">
                      {isUploading ? 'ກຳລັງອັບໂຫລດ...' : 'ຄລິກອັບໂຫລດຮູບ'}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-mono">PNG, JPG, SVG</span>
                  </div>
                )}
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />

              <input
                type="text"
                value={logoUrl}
                onChange={(e) => {
                  setLogoUrl(e.target.value);
                  setPreviewError(false);
                }}
                placeholder="ຫຼື ໃສ່ Image URL"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Courier Fields (8 cols) */}
            <div className="sm:col-span-8 space-y-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  {currentLang === 'lo' ? 'ຊື່ບໍລິສັດຂົນສົ່ງ (Company Name) *:' : 'Courier Name *:'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Anousith Express, HAL Logistics, Kerry"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    {currentLang === 'lo' ? 'ຊື່ຫຍໍ້ (Short Name):' : 'Short Name:'}
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    placeholder="Ex: Anousith"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    {currentLang === 'lo' ? 'ຄ່າສົ່ງເລີ່ມຕົ້ນ (LAK):' : 'Default Fee:'}
                  </label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    placeholder="15000"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-sky-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? (currentLang === 'lo' ? 'ບັນທຶກການແກ້ໄຂ' : 'Save Changes') : (currentLang === 'lo' ? 'ເພີ່ມບໍລິສັດຂົນສົ່ງ' : 'Add Courier')}</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* List of Existing Couriers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-black text-slate-700 uppercase">
            <span>{currentLang === 'lo' ? `ລາຍຊື່ບໍລິສັດຂົນສົ່ງທັງໝົດ (${couriers?.length || 0})` : `All Couriers (${couriers?.length || 0})`}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {(couriers || []).map((c: Courier) => (
              <div
                key={c.id}
                className="p-4 bg-white border border-slate-200 hover:border-sky-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs transition group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain" />
                    ) : (
                      <Truck className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-900 truncate">{c.name}</div>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                      <span>{c.fee ? `${c.fee.toLocaleString()}₭` : 'ຟຣີ / ຮັບເອງ'}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-bold">Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(c)}
                    className="p-2.5 rounded-xl hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-2.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FormModalTemplate>
  );
};
