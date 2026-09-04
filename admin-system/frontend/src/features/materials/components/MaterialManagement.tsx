import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit3,
  Trash2,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Sparkles,
  Tag,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FolderCog,
} from 'lucide-react';
import { ProductMaterial, DEFAULT_MATERIAL_CATEGORIES } from '../types';
import {
  useMaterials,
  useDeleteMaterial,
  useUpdateMaterial,
  useReorderMaterials,
  useMaterialCategories,
} from '../api/materialsApi';
import { MaterialFormModal } from './MaterialFormModal';
import { FaqManagement } from './FaqManagement';
import { CategoryManagerModal } from './CategoryManagerModal';

export const MaterialManagement: React.FC = () => {
  const { data: materials = [], isLoading, isError, refetch } = useMaterials();
  const { data: categories = [] } = useMaterialCategories();
  const deleteMutation = useDeleteMaterial();
  const updateMutation = useUpdateMaterial();
  const reorderMutation = useReorderMaterials();

  const [activeTab, setActiveTab] = useState<'materials' | 'faqs'>('materials');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ProductMaterial | null>(null);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        m.nameLo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.categoryNameLo && m.categoryNameLo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.finishLo && m.finishLo.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [materials, selectedCategory, searchQuery]);

  const handleCreate = () => {
    setEditingMaterial(null);
    setIsModalOpen(true);
  };

  const handleEdit = (m: ProductMaterial) => {
    setEditingMaterial(m);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການປິດໃຊ້ງານ/ລຶບວັດສະດຸນີ້?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleToggleActive = async (m: ProductMaterial) => {
    await updateMutation.mutateAsync({
      id: m.id,
      input: {
        ...m,
        isActive: !m.isActive,
      },
    });
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= materials.length) return;

    const newItems = [...materials];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const payload = newItems.map((item, idx) => ({
      id: item.id,
      sortOrder: (idx + 1) * 10,
    }));

    await reorderMutation.mutateAsync(payload);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              ຈັດການຂໍ້ມູນວັດສະດຸ & FAQ (Material Guide System)
            </h1>
            <p className="text-xs text-slate-500">
              ກຳນົດສະເປັກເຈ້ຍ, ຜິວສຳຜັດ, ຈຸດເດັ່ນ-ຂໍ້ຄວນລະວັງ ແລະ ຄຳຖາມ-ຕອບ ທີ່ສະແດງໜ້າເວັບ Storefront ແບບ Dynamic
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2.5 text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:scale-95 rounded-xl border border-indigo-200 shadow-sm transition-all"
          >
            <FolderCog className="w-4 h-4" />
            ຈັດການໝວດໝູ່ ({categories.length})
          </button>
          {activeTab === 'materials' && (
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              ເພີ່ມວັດສະດຸໃໝ່
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Toggle */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'materials'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          ລາຍການວັດສະດຸ / ເຈ້ຍ ({materials.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('faqs')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'faqs'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          ຄຳຖາມທີ່ພົບເລື້ອຍ (FAQ)
        </button>
      </div>

      {/* Tab 1: Materials */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ທັງໝົດ ({materials.length})
              </button>
              {categories.length > 0
                ? categories.map((cat) => {
                    const count = materials.filter((m) => m.category === cat.key).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.key)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 transition-colors ${
                          selectedCategory === cat.key
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.nameLo} ({count})
                      </button>
                    );
                  })
                : DEFAULT_MATERIAL_CATEGORIES.map((cat) => {
                    const count = materials.filter((m) => m.category === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.labelLo} ({count})
                      </button>
                    );
                  })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ຄົ້ນຫາຊື່ເຈ້ຍ, ຜິວສຳຜັດ..."
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Materials Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                ກຳລັງໂຫຼດຂໍ້ມູນວັດສະດຸ...
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-rose-600 bg-rose-50 text-sm">
                ບໍ່ສາມາດໂຫຼດຂໍ້ມູນວັດສະດຸໄດ້ ກະລຸນາກວດສອບການເຊື່ອມຕໍ່ Backend API
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                ບໍ່ພົບຂໍ້ມູນວັດສະດຸທີ່ກົງກັບເງື່ອນໄຂ
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">ລຳດັບ</th>
                      <th className="py-3 px-4">ໝວດໝູ່</th>
                      <th className="py-3 px-4">ຊື່ວັດສະດຸ / ເຈ້ຍ</th>
                      <th className="py-3 px-4">ແກຣມ (GSM)</th>
                      <th className="py-3 px-4">ຜິວສຳຜັດ (Finish)</th>
                      <th className="py-3 px-4">ເໝາະສຳລັບ</th>
                      <th className="py-3 px-4 text-center">ສະຖານະ</th>
                      <th className="py-3 px-4 text-right">ຈັດການ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMaterials.map((m, index) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Reorder Buttons */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMove(index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-200"
                              title="ຍ້າຍຂຶ້ນ"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(index, 'down')}
                              disabled={index === materials.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-200"
                              title="ຍ້າຍລົງ"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {m.categoryNameLo || m.category}
                          </span>
                        </td>

                        {/* Names */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 text-sm">{m.nameLo}</div>
                          {m.nameEn && <div className="text-[11px] text-slate-400 italic">{m.nameEn}</div>}
                          {m.productLink && (
                            <a
                              href={m.productLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-0.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {m.productTitle || m.productLink}
                            </a>
                          )}
                        </td>

                        {/* GSM */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                            {m.gsm} gsm
                          </span>
                        </td>

                        {/* Finish */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-slate-700 font-medium truncate">{m.finishLo || '-'}</div>
                          {m.finishEn && <div className="text-slate-400 text-[10px] truncate">{m.finishEn}</div>}
                        </td>

                        {/* Suitable For */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {(m.suitableForLo || []).slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {(m.suitableForLo || []).length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{(m.suitableForLo || []).length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Active Toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(m)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                              m.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {m.isActive ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> ເປີດໃຊ້
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> ປິດໃຊ້
                              </>
                            )}
                          </button>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(m)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="ແກ້ໄຂ"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(m.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="ລຶບ / ປິດໃຊ້ງານ"
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
        </div>
      )}

      {/* Tab 2: FAQ Management */}
      {activeTab === 'faqs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <FaqManagement />
        </div>
      )}

      {/* Modal: Material Form */}
      <MaterialFormModal
        isOpen={isModalOpen}
        material={editingMaterial}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMaterial(null);
        }}
        onSuccess={() => refetch()}
      />

      {/* Modal: Category Manager */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};
