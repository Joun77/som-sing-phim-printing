import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Globe, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Layers, 
  Check, 
  X, 
  Upload, 
  Percent, 
  Eye, 
  EyeOff, 
  Sparkles,
  AlertTriangle,
  Clock,
  PackageCheck,
  RefreshCw
} from 'lucide-react';
import { PublicProduct, CreateProductInput, PublicProductOption, ProductDiscountTier } from './types';
import { useApp } from '@store/AppContext';

const API_BASE = '/api/v1';

const CATEGORIES = [
  { id: 'sticker', name: 'สติกเกอร์ (Stickers)' },
  { id: 'business_card', name: 'นามบัตร (Business Cards)' },
  { id: 'book', name: 'สมุด / แคตตาล็อก (Books & Catalogs)' },
  { id: 'brochure', name: 'โบรชัวร์ / ใบปลิว (Brochures & Leaflets)' },
  { id: 'banner', name: 'ป้ายไวนิล / แบนเนอร์ (Banners)' },
  { id: 'box', name: 'กล่องบรรจุภัณฑ์ (Packaging Boxes)' },
  { id: 'general', name: 'งานพิมพ์ทั่วไป (General Print)' },
];

export function WebCatalogPage() {
  const { showToast, askConfirmation } = useApp();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'general' | 'options' | 'discounts'>('general');
  const [editingProduct, setEditingProduct] = useState<PublicProduct | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('sticker');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryInput, setGalleryInput] = useState('');
  const [minQuantity, setMinQuantity] = useState(50);
  const [isOnDemand, setIsOnDemand] = useState(false);
  const [leadTimeDays, setLeadTimeDays] = useState(2);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  // Dynamic Options & Tiers
  const [options, setOptions] = useState<Array<{
    optionType: string;
    label: string;
    value: string;
    isDefault: boolean;
    extraCostRate: number;
  }>>([]);
  const [discountTiers, setDiscountTiers] = useState<Array<{
    minQuantity: number;
    discountPercentage: number;
  }>>([]);

  // Fetch Products
  const { data: products = [], isLoading, isRefetching, refetch } = useQuery<PublicProduct[]>({
    queryKey: ['admin-catalog-products'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admin/catalog/products`);
      if (!res.ok) throw new Error('Failed to fetch catalog products');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`${API_BASE}/admin/catalog/products/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Failed to toggle product status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog-products'] });
      showToast('ອັບເດດສະຖານະສິນຄ້າສຳເລັດ', 'success');
    },
    onError: (err: any) => {
      showToast(`ເກີດຂໍ້ຜິດພາດ: ${err.message}`, 'error');
    },
  });

  // Soft Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/admin/catalog/products/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete product');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog-products'] });
      showToast('ເກັບສິນຄ້າເຂົ້າ Archive ຮຽບຮ້ອຍ', 'success');
    },
    onError: (err: any) => {
      showToast(`ເກີดຂໍ້ຜິດພາດ: ${err.message}`, 'error');
    },
  });

  // Save (Create/Update) Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CreateProductInput & { id?: number }) => {
      const isEdit = Boolean(data.id);
      const url = isEdit 
        ? `${API_BASE}/admin/catalog/products/${data.id}`
        : `${API_BASE}/admin/catalog/products`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save product');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog-products'] });
      showToast(editingProduct ? 'ແກ້ໄຂສິນຄ້າຮຽບຮ້ອຍ' : 'ເພີ່ມສິນຄ້າໃໝ່ຮຽບຮ້ອຍ', 'success');
      closeModal();
    },
    onError: (err: any) => {
      showToast(`ເກີດຂໍ້ຜິດພາດ: ${err.message}`, 'error');
    },
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSlug('');
    setCategory('sticker');
    setDescription('');
    setFeatures(['กันน้ำ 100%', 'ไดคัทคมชัด พร้อมใช้งาน']);
    setThumbnailUrl('');
    setGalleryUrls([]);
    setIsOnDemand(false);
    setMinQuantity(50);
    setLeadTimeDays(2);
    setIsActive(true);
    setSortOrder(products.length + 1);
    setOptions([
      { optionType: 'material', label: 'PP ขาวเงา', value: 'pp_glossy_white', isDefault: true, extraCostRate: 0 },
      { optionType: 'cutting', label: 'ไดคัท 50% (Kiss Cut)', value: 'kiss_cut', isDefault: true, extraCostRate: 0 }
    ]);
    setDiscountTiers([
      { minQuantity: 500, discountPercentage: 5 },
      { minQuantity: 1000, discountPercentage: 10 }
    ]);
    setActiveFormTab('general');
    setIsModalOpen(true);
  };

  const openEditModal = (p: PublicProduct) => {
    setEditingProduct(p);
    setName(p.name);
    setSlug(p.slug);
    setCategory(p.category);
    setDescription(p.description || '');
    setFeatures(p.features || []);
    setThumbnailUrl(p.thumbnailUrl || '');
    setGalleryUrls(p.galleryUrls || []);
    setIsOnDemand(p.isOnDemand ?? (p.minQuantity === 1));
    setMinQuantity(p.minQuantity || 1);
    setLeadTimeDays(p.leadTimeDays || 2);
    setIsActive(p.isActive);
    setSortOrder(p.sortOrder || 0);

    setOptions((p.options || []).map(o => ({
      optionType: o.optionType,
      label: o.label,
      value: o.value,
      isDefault: o.isDefault || false,
      extraCostRate: o.extraCostRate || 0,
    })));

    setDiscountTiers((p.discountTiers || []).map(t => ({
      minQuantity: t.minQuantity,
      discountPercentage: t.discountPercentage,
    })));

    setActiveFormTab('general');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumbnail: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      showToast('ກຳລັງອັບໂຫຼດຮູບພາບ...', 'info');
      const res = await fetch(`${API_BASE}/admin/catalog/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      if (json.url) {
        if (isThumbnail) {
          setThumbnailUrl(json.url);
        } else {
          setGalleryUrls([...galleryUrls, json.url]);
        }
        showToast('ອັບໂຫຼດຮູບພາບສຳເລັດ', 'success');
      }
    } catch (err: any) {
      showToast(`Upload error: ${err.message}`, 'error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('ກະລຸນາໃສ່ຊື່ສິນຄ້າ', 'warning');
      return;
    }

    const payload: CreateProductInput & { id?: number } = {
      id: editingProduct?.id,
      name,
      slug,
      category,
      description,
      features,
      thumbnailUrl,
      galleryUrls,
      minQuantity: isOnDemand ? 1 : (Number(minQuantity) || 1),
      isOnDemand,
      leadTimeDays: Number(leadTimeDays) || 1,
      isActive,
      sortOrder: Number(sortOrder) || 0,
      options,
      discountTiers,
    };

    saveMutation.mutate(payload);
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        p.slug.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const activeCount = products.filter(p => p.isActive).length;
  const inactiveCount = products.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-navy to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-sky/20 border border-accent-sky/40 rounded-full text-accent-sky text-xs font-black">
            <Globe className="w-3.5 h-3.5" />
            <span>Web Catalog & Dynamic Pricing Service</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            ຈັດການສິນຄ້າ ແລະ ບໍລິການໜ້າເວັບ
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl font-medium">
            ຄວບຄຸມລາຍການສິນຄ້າ, ຕົວເລືອກສະເປກວັດສະດຸ, ລະດັບສ່ວນຫຼຸດ ແລະ ສະວິດເປີດ/ປິດ ສຳລັບເວັບໄຊລູກຄ້າ
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-3 bg-white/10 hover:bg-white/20 text-slate-200 rounded-2xl border border-white/10 transition-all cursor-pointer"
            title="ໂຫຼດຂໍ້ມູນຄືນໃໝ່"
          >
            <RefreshCw className={`w-5 h-5 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-5 py-3.5 bg-gradient-to-r from-accent-sky to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>ເພີ່ມສິນຄ້າໃໝ່</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">ສິນຄ້າທັງໝົດ</p>
            <p className="text-2xl font-black text-slate-800">{products.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">ເປີດສະແດງໜ້າເວັບ</p>
            <p className="text-2xl font-black text-emerald-600">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <EyeOff className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">ປິດຊົ່ວຄາວ</p>
            <p className="text-2xl font-black text-amber-600">{inactiveCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">ໝວດໝູ່ທີ່ພ້ອມບໍລິການ</p>
            <p className="text-2xl font-black text-purple-600">{CATEGORIES.length}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ ຫຼື Slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ທຸກໝວດໝູ່
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-accent-sky text-white shadow-md shadow-accent-sky/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Table / Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-accent-sky" />
            <span>ກຳລັງໂຫຼດລາຍການສິນຄ້າ...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            ບໍ່ພົບລາຍການສິນຄ້າທີ່ກົງກັບເງື່ອນໄຂ
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">ສິນຄ້າ</th>
                  <th className="py-4 px-4">ໝວດໝູ່</th>
                  <th className="py-4 px-4">ຂັ້ນຕ່ຳ / ໄລຍະເວລາ</th>
                  <th className="py-4 px-4">ຕົວເລືອກສະເປກ</th>
                  <th className="py-4 px-4">ສ່ວນຫຼຸດ Tier</th>
                  <th className="py-4 px-4 text-center">ສະຖານະໜ້າເວັບ</th>
                  <th className="py-4 px-6 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Product Name & Thumbnail */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.thumbnailUrl ? (
                            <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <PackageCheck className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-400 font-mono">/{p.slug}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {CATEGORIES.find(c => c.id === p.category)?.name.split(' ')[0] || p.category}
                      </span>
                    </td>

                    {/* Min Qty & Lead Time */}
                    <td className="py-4 px-4">
                      <div className="text-xs space-y-0.5">
                        {p.isOnDemand || p.minQuantity === 1 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                            ⚡ On-Demand (1 ชิ้น)
                          </span>
                        ) : (
                          <span className="font-bold text-slate-800">MOQ: {p.minQuantity} ชิ้น</span>
                        )}
                        <div className="text-slate-400 text-[11px]">({p.leadTimeDays} วัน)</div>
                      </div>
                    </td>

                    {/* Options Count */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{(p.options || []).length} ตัวเลือก</span>
                      </div>
                    </td>

                    {/* Discount Tiers */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                        <Percent className="w-3.5 h-3.5" />
                        <span>{(p.discountTiers || []).length} Tiers</span>
                      </div>
                    </td>

                    {/* Toggle Active Switch */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          p.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        title={p.isActive ? 'ກົດເພື່ອປິດການສະແດງ' : 'ກົດເພື່ອເປີດການສະແດງ'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            p.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="ແກ້ໄຂສິນຄ້າ"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            askConfirmation(
                              `ທ່ານຕ້ອງການຍ້າຍສິນຄ້າ "${p.name}" ເຂົ້າ Archive ແມ່ນບໍ່?`,
                              () => deleteMutation.mutate(p.id)
                            );
                          }}
                          className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="ລົບ/Archive"
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

      {/* Create / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-sky/10 text-accent-sky flex items-center justify-center">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingProduct ? 'ແກ້ໄຂສິນຄ້າ (Edit Product)' : 'ເພີ່ມສິນຄ້າໃໝ່ (New Product)'}
                  </h3>
                  <p className="text-xs text-slate-500">ກຳນົດສະເປກວັດສະດຸ, ຕົວເລືອກ ແລະ ສ່ວນຫຼຸດຕາມຈຳນວນ</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex border-b border-slate-100 px-6 bg-white gap-4">
              <button
                type="button"
                onClick={() => setActiveFormTab('general')}
                className={`py-3 px-2 border-b-2 text-xs font-black transition-all cursor-pointer ${
                  activeFormTab === 'general'
                    ? 'border-accent-sky text-accent-sky'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                1. ຂໍ້ມູນທົ່ວໄປ (General Info)
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('options')}
                className={`py-3 px-2 border-b-2 text-xs font-black transition-all cursor-pointer ${
                  activeFormTab === 'options'
                    ? 'border-accent-sky text-accent-sky'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                2. ຕົວເລືອກ & ວັດສະດຸ (Options & Materials) ({options.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('discounts')}
                className={`py-3 px-2 border-b-2 text-xs font-black transition-all cursor-pointer ${
                  activeFormTab === 'discounts'
                    ? 'border-accent-sky text-accent-sky'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                3. ສ່ວນຫຼຸດຕາມຈຳນວນ (Discount Tiers) ({discountTiers.length})
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: General Info */}
              {activeFormTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        ຊື່ສິນຄ້າ (Product Name) *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="เช่น สติกเกอร์ PP ขาวเงากันน้ำ"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-accent-sky outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        URL Slug (เว้นว่างเพื่อสร้างให้อัตโนมัติ)
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="เช่น waterproof-pp-sticker"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-accent-sky outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        ໝວດໝູ່ (Category) *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-accent-sky outline-none bg-white"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1 md:col-span-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        ຮູບແບບການສັ່ງພິມ (Print Fulfillment Mode) *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsOnDemand(true);
                            setMinQuantity(1);
                          }}
                          className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                            isOnDemand
                              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 text-slate-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="p-1.5 rounded-lg bg-amber-500 text-slate-900 mt-0.5">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900">⚡ On-Demand (ບໍ່ມີຂັ້ນຕ່ຳ)</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">ສັ່ງພິມໄດ້ຕັ້ງແຕ່ 1 ຊິ້ນ ຕາມຄວາມຕ້ອງການລູກຄ້າ</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsOnDemand(false);
                            if (minQuantity <= 1) setMinQuantity(50);
                          }}
                          className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                            !isOnDemand
                              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500 text-slate-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="p-1.5 rounded-lg bg-primary-navy text-white mt-0.5">
                            <PackageCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900">📦 Bulk Order (ມີຂັ້ນຕ່ຳ MOQ)</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">ກຳນົດຈຳນວນຂັ້ນຕ່ຳ ເຊັ່ນ 50, 100, 500 ຊິ້ນ</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        ຈຳນວນສັ່ງຂັ້ນຕ່ຳ (Min Qty / MOQ)
                      </label>
                      <input
                        type="number"
                        min="1"
                        disabled={isOnDemand}
                        value={isOnDemand ? 1 : minQuantity}
                        onChange={(e) => setMinQuantity(Number(e.target.value))}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none ${
                          isOnDemand
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            : 'border-slate-200 focus:border-accent-sky bg-white'
                        }`}
                      />
                      {isOnDemand && (
                        <span className="text-[10px] text-amber-600 font-bold mt-1 block">
                          ⚡ ລັອກຂັ້ນຕ່ຳທີ່ 1 ຊິ້ນສຳລັບ On-Demand
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        ໄລຍະເວລາຜະລິດ (Lead Time - ວັນ)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={leadTimeDays}
                        onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-accent-sky outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      ຄຳອະທິບາຍສິນຄ້າ (Description)
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="อธิบายคุณสมบัติเด่น การใช้งาน และจุดเด่นของงานพิมพ์..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-accent-sky outline-none"
                    />
                  </div>

                  {/* Features Tag Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      ຈຸດເດັ່ນຂອງສິນຄ້າ (Key Features)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (featureInput.trim()) {
                              setFeatures([...features, featureInput.trim()]);
                              setFeatureInput('');
                            }
                          }
                        }}
                        placeholder="พิมพ์จุดเด่น เช่น 'กันน้ำ 100%' แล้วกด Enter หรือปุ่มเพิ่ม"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (featureInput.trim()) {
                            setFeatures([...features, featureInput.trim()]);
                            setFeatureInput('');
                          }
                        }}
                        className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
                      >
                        ເພີ່ມ
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {features.map((feat, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-lg border border-sky-100">
                          <span>{feat}</span>
                          <button
                            type="button"
                            onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                            className="text-sky-400 hover:text-sky-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Thumbnail and Image Upload */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        ຮູບພາບປົກ (Thumbnail URL)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={thumbnailUrl}
                          onChange={(e) => setThumbnailUrl(e.target.value)}
                          placeholder="/images/products/sticker.jpg"
                          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium outline-none"
                        />
                        <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer flex items-center gap-1.5 text-xs font-bold">
                          <Upload className="w-4 h-4" />
                          <span>ອັບໂຫຼດ</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, true)} />
                        </label>
                      </div>
                      {thumbnailUrl && (
                        <div className="mt-2 w-20 h-20 rounded-xl border border-slate-200 overflow-hidden">
                          <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        ລຳດັບການສະແດງ (Sort Order) & ສະຖານະ
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          value={sortOrder}
                          onChange={(e) => setSortOrder(Number(e.target.value))}
                          placeholder="0"
                          className="w-24 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium outline-none"
                        />
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="w-4 h-4 rounded text-accent-sky"
                          />
                          <span>ເປີດສະແດງໜ້າເວັບ (Active)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: Dynamic Options & Materials */}
              {activeFormTab === 'options' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-800">ຕົວເລືອກສະເປກວັດສະດຸ ແລະ ການຕັດແຕ່ງ</h4>
                      <p className="text-xs text-slate-400">ຕົວເລືອກທີ່ລູກຄ້າສາມາດເລືອກໄດ້ໃນໜ້າ Customizer</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOptions([
                        ...options,
                        { optionType: 'material', label: '', value: '', isDefault: false, extraCostRate: 0 }
                      ])}
                      className="px-3.5 py-2 bg-accent-sky text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ເພີ່ມຕົວເລືອກ</span>
                    </button>
                  </div>

                  {options.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      ຍັງບໍ່ມີຕົວເລືອກ ກົດປຸ່ມ "ເພີ່ມຕົວເລືອກ" ເພື່ອກຳນົດວັດສະດຸ ຫຼື ການຕັດແຕ່ງ
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {options.map((opt, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center gap-3">
                          <div className="w-full md:w-32">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">ປະເພດ</label>
                            <select
                              value={opt.optionType}
                              onChange={(e) => {
                                const newOpts = [...options];
                                newOpts[idx].optionType = e.target.value;
                                setOptions(newOpts);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                            >
                              <option value="material">Material (ວັດສະດຸ)</option>
                              <option value="size">Size (ຂະໜາດ)</option>
                              <option value="cutting">Cutting (ການຕັດ)</option>
                              <option value="finishing">Finishing (ເຄືອບ)</option>
                              <option value="binding">Binding (ເຂົ້າເຫຼັ້ມ)</option>
                            </select>
                          </div>

                          <div className="flex-1 w-full">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">ຊື່ຕົວເລືອກ (Label)</label>
                            <input
                              type="text"
                              value={opt.label}
                              onChange={(e) => {
                                const newOpts = [...options];
                                newOpts[idx].label = e.target.value;
                                if (!newOpts[idx].value) {
                                  newOpts[idx].value = e.target.value.toLowerCase().replace(/\s+/g, '_');
                                }
                                setOptions(newOpts);
                              }}
                              placeholder="เช่น PP ขาวเงา"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                            />
                          </div>

                          <div className="w-full md:w-36">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Value Identifier</label>
                            <input
                              type="text"
                              value={opt.value}
                              onChange={(e) => {
                                const newOpts = [...options];
                                newOpts[idx].value = e.target.value;
                                setOptions(newOpts);
                              }}
                              placeholder="pp_glossy_white"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                            />
                          </div>

                          <div className="w-full md:w-28">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Extra Cost (+)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={opt.extraCostRate}
                              onChange={(e) => {
                                const newOpts = [...options];
                                newOpts[idx].extraCostRate = Number(e.target.value);
                                setOptions(newOpts);
                              }}
                              placeholder="0.00"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                            />
                          </div>

                          <div className="flex items-center gap-2 pt-3 md:pt-0">
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-bold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={opt.isDefault}
                                onChange={(e) => {
                                  const newOpts = [...options];
                                  newOpts[idx].isDefault = e.target.checked;
                                  setOptions(newOpts);
                                }}
                                className="rounded text-accent-sky"
                              />
                              <span>Default</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Discount Tiers */}
              {activeFormTab === 'discounts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-800">ອັດຕາສ່ວນຫຼຸດຕາມຈຳນວນ (Volume Discount Tiers)</h4>
                      <p className="text-xs text-slate-400">ສ່ວນຫຼຸດພິເສດເມື່ອລູກຄ້າສັ່ງພິມໃນປະລິມານຫຼາຍ</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDiscountTiers([
                        ...discountTiers,
                        { minQuantity: 500, discountPercentage: 5 }
                      ])}
                      className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ເພີ່ມ Tier ສ່ວນຫຼຸດ</span>
                    </button>
                  </div>

                  {discountTiers.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      ຍັງບໍ່ມີ Tier ສ່ວນຫຼຸດ (ຄິດລາຄາມາດຕະຖານທຸກຈຳນວນ)
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {discountTiers.map((tier, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                              ຈຳນວນຂັ້ນຕ່ຳ (Min Quantity)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={tier.minQuantity}
                              onChange={(e) => {
                                const newTiers = [...discountTiers];
                                newTiers[idx].minQuantity = Number(e.target.value);
                                setDiscountTiers(newTiers);
                              }}
                              placeholder="500"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                            />
                          </div>

                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                              ເປີເຊັນສ່ວນຫຼຸດ (Discount %)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="100"
                                value={tier.discountPercentage}
                                onChange={(e) => {
                                  const newTiers = [...discountTiers];
                                  newTiers[idx].discountPercentage = Number(e.target.value);
                                  setDiscountTiers(newTiers);
                                }}
                                placeholder="5.00"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white font-medium pr-8"
                              />
                              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDiscountTiers(discountTiers.filter((_, i) => i !== idx))}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg mt-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-6 py-2.5 bg-accent-sky hover:bg-sky-400 text-white text-xs font-black rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2"
                >
                  {saveMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingProduct ? 'ບັນທຶກການປ່ຽນແປງ' : 'ສ້າງສິນຄ້າ'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
