import React, { useState } from 'react';
import {
  FolderPlus,
  Edit2,
  Trash2,
  X,
  Check,
  Layers,
  ArrowUp,
  ArrowDown,
  Tag,
  Leaf,
  Sparkles,
  FileText,
  Package,
  BookOpen,
} from 'lucide-react';
import { MaterialCategory, CreateMaterialCategoryInput } from '../types';
import {
  useMaterialCategories,
  useCreateMaterialCategory,
  useUpdateMaterialCategory,
  useDeleteMaterialCategory,
  useReorderMaterialCategories,
} from '../api/materialsApi';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CATEGORY_ICONS = [
  { id: 'layers', label: 'Layers (ຊັ້ນເຈ້ຍ)', icon: Layers },
  { id: 'file-text', label: 'FileText (ເອກະສານ)', icon: FileText },
  { id: 'leaf', label: 'Leaf (ຄຣາຟ/Eco)', icon: Leaf },
  { id: 'sparkles', label: 'Sparkles (ພິເສດ/ຫຼູ)', icon: Sparkles },
  { id: 'tag', label: 'Tag (ສະຕິກເກີ)', icon: Tag },
  { id: 'package', label: 'Package (ກ່ອງ)', icon: Package },
  { id: 'book-open', label: 'Book (ປຶ້ມ)', icon: BookOpen },
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
  const { data: categories = [], isLoading, refetch } = useMaterialCategories();
  const createMutation = useCreateMaterialCategory();
  const updateMutation = useUpdateMaterialCategory();
  const deleteMutation = useDeleteMaterialCategory();
  const reorderMutation = useReorderMaterialCategories();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [key, setKey] = useState('');
  const [nameLo, setNameLo] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [icon, setIcon] = useState('layers');
  const [descriptionLo, setDescriptionLo] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [sortOrder, setSortOrder] = useState(10);
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setKey('');
    setNameLo('');
    setNameEn('');
    setIcon('layers');
    setDescriptionLo('');
    setDescriptionEn('');
    setSortOrder(10);
    setIsAdding(false);
    setEditingId(null);
    setFormError('');
  };

  const startEdit = (cat: MaterialCategory) => {
    setEditingId(cat.id);
    setKey(cat.key || '');
    setNameLo(cat.nameLo || '');
    setNameEn(cat.nameEn || '');
    setIcon(cat.icon || 'layers');
    setDescriptionLo(cat.descriptionLo || '');
    setDescriptionEn(cat.descriptionEn || '');
    setSortOrder(cat.sortOrder ?? 10);
    setIsAdding(false);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!key.trim() || !nameLo.trim()) {
      setFormError('ກະລຸນາໃສ່ Key (Slug) ແລະ ຊື່ໝວດໝູ່ (ພາສາລາວ)');
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          input: {
            id: editingId,
            key: key.trim().toLowerCase(),
            nameLo: nameLo.trim(),
            nameEn: nameEn.trim(),
            icon,
            descriptionLo: descriptionLo.trim(),
            descriptionEn: descriptionEn.trim(),
            sortOrder: Number(sortOrder) || 0,
            isActive: true,
          },
        });
      } else {
        const payload: CreateMaterialCategoryInput = {
          key: key.trim().toLowerCase(),
          nameLo: nameLo.trim(),
          nameEn: nameEn.trim(),
          icon,
          descriptionLo: descriptionLo.trim(),
          descriptionEn: descriptionEn.trim(),
          sortOrder: Number(sortOrder) || 0,
          isActive: true,
        };
        await createMutation.mutateAsync(payload);
      }
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກໝວດໝູ່');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບໝວດໝູ່ "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newItems = [...categories];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const payload = newItems.map((item, idx) => ({
      id: item.id,
      sortOrder: (idx + 1) * 10,
    }));

    await reorderMutation.mutateAsync(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                ຈັດການໝວດໝູ່ວັດສະດຸ (Material Categories)
              </h2>
              <p className="text-xs text-slate-500">
                ເພີ່ມ ແກ້ໄຂ ແລະ ຈັດລຳດັບໝວດໝູ່ເຈ້ຍສຳລັບສະແດງທັງ Admin ແລະ Storefront
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Bar with Add Button */}
          {!isAdding && !editingId && (
            <div className="flex justify-between items-center bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl">
              <span className="text-xs font-semibold text-indigo-900">
                ມີທັງໝົດ {categories.length} ໝວດໝູ່
              </span>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
              >
                <FolderPlus className="w-4 h-4" />
                ເພີ່ມໝວດໝູ່ໃໝ່
              </button>
            </div>
          )}

          {/* Inline Form */}
          {(isAdding || editingId) && (
            <form
              onSubmit={handleSubmit}
              className="p-4 bg-white border-2 border-indigo-200 rounded-xl space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-indigo-700">
                  {editingId ? 'ແກ້ໄຂໝວດໝູ່' : 'ເພີ່ມໝວດໝູ່ໃໝ່'}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Key / Slug <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="art, eco-card"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ຊື່ໝວດໝູ່ (Lao) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameLo}
                    onChange={(e) => setNameLo(e.target.value)}
                    placeholder="Art Paper (ເຈ້ຍອາດ)"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Category Name (En)
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Art Paper & Card"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ໄອຄອນ (Icon)</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORY_ICONS.map((ic) => (
                      <option key={ic.id} value={ic.id}>
                        {ic.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ລຳດັບ (Sort Order)
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {editingId ? 'ບັນທຶກ' : 'ເພີ່ມໝວດໝູ່'}
                </button>
              </div>
            </form>
          )}

          {/* Category List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">ກຳລັງໂຫຼດໝວດໝູ່...</div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">ຍັງບໍ່ມີໝວດໝູ່ໃນລະບົບ</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th className="py-2.5 px-3 w-12 text-center">ລຳດັບ</th>
                    <th className="py-2.5 px-3">Key</th>
                    <th className="py-2.5 px-3">ຊື່ໝວດໝູ່</th>
                    <th className="py-2.5 px-3">Icon</th>
                    <th className="py-2.5 px-3 text-right">ຈັດການ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat, index) => (
                    <tr key={cat.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-200"
                            title="ຍ້າຍຂຶ້ນ"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'down')}
                            disabled={index === categories.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-200"
                            title="ຍ້າຍລົງ"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                        {cat.key}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{cat.nameLo}</div>
                        {cat.nameEn && (
                          <div className="text-[10px] text-slate-400 italic">{cat.nameEn}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                          {cat.icon || 'layers'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="ແກ້ໄຂ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id, cat.nameLo)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            title="ລຶບ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            ປິດໜ້າຕ່າງ
          </button>
        </div>
      </div>
    </div>
  );
};
