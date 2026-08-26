import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FolderPlus, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Layers, 
  ArrowUp, 
  ArrowDown, 
  Sparkles,
  BookOpen,
  Image,
  Tag,
  CreditCard,
  FileText,
  Package,
  Printer,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PublicCategory, CreateCategoryInput } from './types';
import { useApp } from '@store/AppContext';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE = '/api/v1';

const ICON_OPTIONS = [
  { id: 'book', label: 'ປຶ້ມ / ເອກະສານ (Book/Doc)', icon: BookOpen },
  { id: 'photo', label: 'ຮູບພາບ / ອັນບັ້ມ (Photo)', icon: Image },
  { id: 'sticker', label: 'ສະຕິກເກີ / ສະຫຼາກ (Sticker)', icon: Tag },
  { id: 'card', label: 'ນາມບັດ / ບັດ (Card)', icon: CreditCard },
  { id: 'flyer', label: 'ແຜ່ນພັບ / ໃບປິວ (Flyer)', icon: FileText },
  { id: 'box', label: 'ກ່ອງບັນຈຸພັນ (Box/Packaging)', icon: Package },
  { id: 'printer', label: 'ງານພິມທົ່ວໄປ (General/Print)', icon: Printer },
  { id: 'folder', label: 'ໂຟນເດີທົ່ວໄປ (Folder)', icon: Layers },
];

export function CategoryManagerModal({ isOpen, onClose }: CategoryManagerModalProps) {
  const { showToast, askConfirmation } = useApp();
  const queryClient = useQueryClient();

  const [editingCategory, setEditingCategory] = useState<PublicCategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State (Bilingual)
  const [nameLo, setNameLo] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [taglineLo, setTaglineLo] = useState('');
  const [taglineEn, setTaglineEn] = useState('');
  const [descriptionLo, setDescriptionLo] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [icon, setIcon] = useState('folder');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Fetch Categories
  const { data: categories = [], isLoading } = useQuery<PublicCategory[]>({
    queryKey: ['admin-catalog-categories'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admin/catalog/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      return json.data || [];
    },
    enabled: isOpen,
  });

  // Save Mutation (Create / Update)
  const saveMutation = useMutation({
    mutationFn: async (payload: CreateCategoryInput & { id?: number }) => {
      const url = payload.id 
        ? `${API_BASE}/admin/catalog/categories/${payload.id}`
        : `${API_BASE}/admin/catalog/categories`;
      const method = payload.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save category');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-catalog-products'] });
      showToast(editingCategory ? 'ອັບເດດໝວດໝູ່ສຳເລັດ' : 'ສ້າງໝວດໝູ່ໃໝ່ສຳເລັດ', 'success');
      handleCloseForm();
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/admin/catalog/categories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-catalog-products'] });
      showToast('ລຶບໝວດໝູ່ສຳເລັດ', 'success');
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setNameLo('');
    setNameEn('');
    setSlug('');
    setTaglineLo('');
    setTaglineEn('');
    setDescriptionLo('');
    setDescriptionEn('');
    setIcon('folder');
    setSortOrder(categories.length + 1);
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: PublicCategory) => {
    setEditingCategory(cat);
    setNameLo(cat.nameLo || '');
    setNameEn(cat.nameEn || '');
    setSlug(cat.slug || '');
    setTaglineLo(cat.taglineLo || '');
    setTaglineEn(cat.taglineEn || '');
    setDescriptionLo(cat.descriptionLo || '');
    setDescriptionEn(cat.descriptionEn || '');
    setIcon(cat.icon || 'folder');
    setSortOrder(cat.sortOrder || 0);
    setIsActive(cat.isActive);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameLo.trim()) {
      showToast('ກະລຸນາລະບຸຊື່ໝວດໝູ່ພາສາລາວ', 'warning');
      return;
    }
    if (!nameEn.trim()) {
      showToast('ກະລຸນາລະບຸຊື່ໝວດໝູ່ພາສາອັງກິດ (English Name)', 'warning');
      return;
    }

    saveMutation.mutate({
      id: editingCategory?.id,
      nameLo: nameLo.trim(),
      nameEn: nameEn.trim(),
      slug: slug.trim(),
      taglineLo: taglineLo.trim(),
      taglineEn: taglineEn.trim(),
      descriptionLo: descriptionLo.trim(),
      descriptionEn: descriptionEn.trim(),
      icon,
      sortOrder,
      isActive,
    });
  };

  const handleDelete = (cat: PublicCategory) => {
    askConfirmation(
      `ທ່ານຕ້ອງການລຶບໝວດໝູ່ "${cat.nameLo}" (${cat.nameEn}) ແທ້ຫຼືບໍ່?`,
      () => deleteMutation.mutate(cat.id)
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                ຈັດການໝວດໝູ່ສິນຄ້າໜ້າເວັບ (Web Categories)
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                  Bilingual (ລາວ / EN)
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                ຄວບຄຸມໝວດໝູ່ທີ່ຈະສະແດງໃນໜ້າເລືອກສິນຄ້າ ແລະ ເມນູຫຼັກຂອງເວັບໄຊບໍລິການລູກຄ້າ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">
              ລາຍການໝວດໝູ່ທັງໝົດ ({categories.length})
            </div>
            {!isFormOpen && (
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all hover:shadow-indigo-500/25 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                ເພີ່ມໝວດໝູ່ໃໝ່
              </button>
            )}
          </div>

          {/* Form: Add/Edit Category */}
          {isFormOpen && (
            <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100/60">
                <span className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  {editingCategory ? `ແກ້ໄຂໝວດໝູ່: ${editingCategory.nameLo}` : 'ສ້າງໝວດໝູ່ໃໝ່'}
                </span>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Lao */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ຊື່ໝວດໝູ່ (ພາສາລາວ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameLo}
                    onChange={(e) => setNameLo(e.target.value)}
                    placeholder="ຕົວຢ່າງ: ງານເອກະສານ & ປຶ້ມ"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                {/* Name English */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Name (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Documents & Books"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL Slug (ລະບຸເອງ ຫຼື ປະວ່າງເພື່ອສ້າງອັດຕະໂນມັດ)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. documents-books"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono text-slate-900"
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ໄອຄອນໝວດໝູ່ (Category Icon)
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tagline Lao */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ຄຳໂປຣໂມດສັ້ນ (Tagline ພາສາລາວ)
                  </label>
                  <input
                    type="text"
                    value={taglineLo}
                    onChange={(e) => setTaglineLo(e.target.value)}
                    placeholder="ຕົວຢ່າງ: ກັອບປີ້ເອກະສານ, ເຂົ້າເລັ້ມສັນກາວ, ປຶ້ມ & ລາຍງານ"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                {/* Tagline English */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tagline (English)
                  </label>
                  <input
                    type="text"
                    value={taglineEn}
                    onChange={(e) => setTaglineEn(e.target.value)}
                    placeholder="e.g. Document copying, glue binding, books & reports"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                {/* Description Lao */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ລາຍລະອຽດເຕັມ (ພາສາລາວ)
                  </label>
                  <textarea
                    rows={2}
                    value={descriptionLo}
                    onChange={(e) => setDescriptionLo(e.target.value)}
                    placeholder="ອະທິບາຍລັກສະນະງານ ແລະ ຄຸນນະພາບສິນຄ້າໃນໝວດນີ້..."
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                {/* Description English */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Description (English)
                  </label>
                  <textarea
                    rows={2}
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    placeholder="Detailed category description for English-speaking clients..."
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                {/* Sort Order & Active */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ລຳດັບສະແດງຜົນ (Sort Order)
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                <div className="flex items-center h-full pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-800">
                      ເປີດສະແດງຜົນໃນໜ້າເວັບ (Active on Web Shop)
                    </span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-indigo-100/60">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saveMutation.isPending ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກໝວດໝູ່'}
                </button>
              </div>
            </form>
          )}

          {/* Category Table / List */}
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              ກຳລັງໂຫຼດຂໍ້ມູນໝວດໝູ່...
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 p-6">
              <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">ຍັງບໍ່ມີໝວດໝູ່ສິນຄ້າ</p>
              <button
                onClick={handleOpenCreate}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                ສ້າງໝວດໝູ່ທຳອິດ
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">ລຳດັບ</th>
                    <th className="px-4 py-3">ໄອຄອນ / ຊື່ໝວດໝູ່ (ລາວ - EN)</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">ສະຖານະ</th>
                    <th className="px-4 py-3 text-right">ຈັດການ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {categories.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 text-center text-xs font-mono text-slate-400">
                        {cat.sortOrder || idx + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            {cat.icon === 'photo' ? <Image className="w-4 h-4" /> :
                             cat.icon === 'sticker' ? <Tag className="w-4 h-4" /> :
                             cat.icon === 'card' ? <CreditCard className="w-4 h-4" /> :
                             cat.icon === 'flyer' ? <FileText className="w-4 h-4" /> :
                             cat.icon === 'box' ? <Package className="w-4 h-4" /> :
                             cat.icon === 'printer' ? <Printer className="w-4 h-4" /> :
                             cat.icon === 'book' ? <BookOpen className="w-4 h-4" /> :
                             <Layers className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              {cat.nameLo}
                              <span className="text-xs font-normal text-slate-400">
                                ({cat.nameEn})
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 line-clamp-1">
                              {cat.taglineLo || cat.descriptionLo || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-xs font-mono text-slate-600">
                          {cat.slug}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {cat.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ເປີດໃຊ້ງານ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                            ປິດການສະແດງ
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="ແກ້ໄຂ"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ລຶບ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            ໝວດໝູ່ທີ່ສ້າງຈະຖືກສົ່ງໄປສະແດງຜົນທີ່ໜ້າຮ້ານ Customer Service ອັດຕະໂນມັດ
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            ປິດໜ້າຕ່າງ
          </button>
        </div>

      </div>
    </div>
  );
}
