import React, { useState } from 'react';
import { 
  FolderPlus, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Tag, 
  Store, 
  Globe, 
  Building2, 
  Handshake, 
  Plus, 
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { CustomerCategory } from '../types';

interface CustomerCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { id: 'sky', label: 'Sky Blue', bg: 'bg-sky-500', text: 'text-sky-700', badge: 'bg-sky-50 border-sky-200' },
  { id: 'violet', label: 'Violet', bg: 'bg-violet-500', text: 'text-violet-700', badge: 'bg-violet-50 border-violet-200' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 border-emerald-200' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500', text: 'text-amber-800', badge: 'bg-amber-50 border-amber-200' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-50 border-rose-200' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-50 border-indigo-200' },
  { id: 'slate', label: 'Slate', bg: 'bg-slate-500', text: 'text-slate-700', badge: 'bg-slate-100 border-slate-200' },
];

export function CustomerCategoryModal({ isOpen, onClose }: CustomerCategoryModalProps) {
  const { 
    customers, 
    customerCategories = [], 
    addCustomerCategory, 
    updateCustomerCategory, 
    deleteCustomerCategory, 
    showToast, 
    askConfirmation 
  } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomerCategory | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('sky');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setId('');
    setDescription('');
    setColor('sky');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: CustomerCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setId(cat.id);
    setDescription(cat.description || '');
    setColor(cat.color || 'sky');
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('ກະລຸນາປ້ອນຊື່ໝວດໝູ່', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        if (updateCustomerCategory) {
          await updateCustomerCategory(editingCategory.id, {
            name: name.trim(),
            description: description.trim(),
            color
          });
          showToast('ອັບເດດໝວດໝູ່ສຳເລັດ', 'success');
        }
      } else {
        if (addCustomerCategory) {
          await addCustomerCategory({
            id: id.trim() || undefined,
            name: name.trim(),
            description: description.trim(),
            color
          });
          showToast('ສ້າງໝວດໝູ່ໃໝ່ສຳເລັດ', 'success');
        }
      }
      handleCloseForm();
    } catch (err: any) {
      showToast(err.message || 'ບັນທຶກບໍ່ສຳເລັດ', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (cat: CustomerCategory, count: number) => {
    if (cat.isSystem) {
      showToast('ໝວດໝູ່ຫຼັກຂອງລະບົບບໍ່ສາມາດລຶບໄດ້', 'warning');
      return;
    }
    if (count > 0) {
      showToast(`ບໍ່ສາມາດລຶບໄດ້! ມີລູກຄ້າ ${count} ຄົນກຳລັງໃຊ້ໝວດໝູ່ນີ້ຢູ່`, 'warning');
      return;
    }

    askConfirmation(`ທ່ານຕ້ອງການລຶບໝວດໝູ່ "${cat.name}" ແທ້ຫຼືບໍ່?`, async () => {
      try {
        if (deleteCustomerCategory) {
          await deleteCustomerCategory(cat.id);
          showToast('ລຶບໝວດໝູ່ສຳເລັດ', 'success');
        }
      } catch (err: any) {
        showToast(err.message || 'ລຶບບໍ່ສຳເລັດ', 'error');
      }
    });
  };

  const renderIcon = (catId: string) => {
    const key = catId.toUpperCase();
    if (key === 'RETAIL') return <Store className="w-4 h-4 text-sky-600" />;
    if (key === 'ONLINE') return <Globe className="w-4 h-4 text-violet-600" />;
    if (key === 'CORPORATE') return <Building2 className="w-4 h-4 text-emerald-600" />;
    if (key === 'CONTRACT_PARTNER') return <Handshake className="w-4 h-4 text-amber-600" />;
    return <Tag className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-accent-sky flex items-center justify-center shadow-sm">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                ຈັດການໝວດໝູ່ລູກຄ້າ (Customer Categories)
              </h2>
              <p className="text-xs text-slate-400 font-semibold">
                Universal Dynamic Client Tiers & Categories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition shadow-sm border border-transparent hover:border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Action Bar (When Form is closed) */}
          {!isFormOpen && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                ໝວດໝູ່ທັງໝົດ ({customerCategories.length})
              </span>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-accent-sky hover:bg-sky-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>ເພີ່ມໝວດໝູ່ໃໝ່</span>
              </button>
            </div>
          )}

          {/* Inline Universal Form */}
          {isFormOpen && (
            <form onSubmit={handleSave} className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="font-black text-slate-800 text-xs flex items-center gap-2">
                  <Tag className="w-4 h-4 text-accent-sky" />
                  {editingCategory ? `ແກ້ໄຂໝວດໝູ່: ${editingCategory.name}` : 'ສ້າງໝວດໝູ່ລູກຄ້າໃໝ່'}
                </span>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ຍົກເລີກ
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase block">
                    ຊື່ປະເພດ / ໝວດໝູ່ລູກຄ້າ *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. ລູກຄ້າ VIP, ຕົວແທນຕ່າງແຂວງ"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:outline-none focus:border-accent-sky"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase block">
                    ລະຫັດ Code (Unique ID)
                  </label>
                  <input
                    type="text"
                    disabled={!!editingCategory}
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="e.g. VIP, RESELLER_PROV"
                    className={`w-full px-3.5 py-2.5 border rounded-xl font-mono text-xs focus:outline-none ${
                      editingCategory ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800 focus:border-accent-sky'
                    }`}
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase block">
                  ສີປ້າຍກຳກັບ (Badge Color Theme)
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setColor(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition border ${
                        color === c.id
                          ? 'border-slate-900 bg-white shadow-sm ring-2 ring-slate-900/10 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.bg}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase block">
                  ຄຳອະທິບາຍເພີ່ມເຕີມ
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ລະບຸເງື່ອນໄຂ ຫຼື ລາຍລະອຽດຂອງໝວດໝູ່ນີ້..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:outline-none focus:border-accent-sky resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກໝວດໝູ່'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Categories List View */}
          <div className="space-y-2.5">
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/30">
              {customerCategories.map((cat) => {
                const assignedCustomers = customers.filter(
                  (c) => (c.tier || 'RETAIL').toUpperCase() === cat.id.toUpperCase()
                );
                const count = assignedCustomers.length;
                const preset = COLOR_PRESETS.find((p) => p.id === cat.color) || COLOR_PRESETS[0];

                return (
                  <div
                    key={cat.id}
                    className="p-3.5 bg-white flex items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${preset.badge}`}>
                        {renderIcon(cat.id)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs truncate">
                            {cat.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            ({cat.id})
                          </span>
                          {cat.isSystem && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold">
                              System
                            </span>
                          )}
                        </div>
                        {cat.description && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{count} ຄົນ</span>
                      </span>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        title="ແກ້ໄຂໝວດໝູ່"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button (non-system only) */}
                      {!cat.isSystem && (
                        <button
                          type="button"
                          onClick={() => handleDelete(cat, count)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="ລຶບໝວດໝູ່"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black transition"
          >
            ສຳເລັດ / ປິດ
          </button>
        </div>
      </div>
    </div>
  );
}
