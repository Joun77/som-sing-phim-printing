import React, { useState, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  Maximize2,
  PackageCheck,
  BookOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter,
  Eye,
  EyeOff,
  X,
  Layers,
  Database,
  Hash,
  Scale,
} from 'lucide-react';
import { LOOKUP_GROUPS, LookupType, SystemLookup } from '../types';
import { useLookups, useDeleteLookup, useUpdateLookup } from '../api/lookupsApi';
import { LookupFormModal } from './LookupFormModal';

export const MasterDataManagement: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLookup, setEditingLookup] = useState<SystemLookup | null>(null);

  // Fetch all lookups across categories
  const { data: allLookups = [], isLoading, isError, refetch, isRefetching } = useLookups(undefined, false);
  const deleteMutation = useDeleteLookup();
  const updateMutation = useUpdateLookup();

  // Helper to get count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    LOOKUP_GROUPS.forEach((g) => {
      counts[g.key] = allLookups.filter((item) => item.lookup_type === g.key).length;
    });
    return counts;
  }, [allLookups]);

  // Filtered items based on Category, Status Docky, and Search
  const filteredLookups = useMemo(() => {
    return allLookups.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && item.lookup_type !== selectedCategory) {
        return false;
      }

      // 2. Status Docky Filter
      if (statusFilter === 'active' && !item.is_active) return false;
      if (statusFilter === 'hidden' && item.is_active) return false;
      if (statusFilter === 'custom' && (!item.attributes || Object.keys(item.attributes).length === 0)) {
        return false;
      }

      // 3. Search Query Filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        item.name_lo.toLowerCase().includes(q) ||
        item.name_en.toLowerCase().includes(q) ||
        (item.name_th && item.name_th.toLowerCase().includes(q))
      );
    });
  }, [allLookups, selectedCategory, statusFilter, searchQuery]);

  const handleOpenCreateModal = () => {
    setEditingLookup(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: SystemLookup) => {
    setEditingLookup(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການປິດໃຊ້ງານລາຍການຂໍ້ມູນພື້ນຖານນີ້?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleToggleActive = async (item: SystemLookup) => {
    await updateMutation.mutateAsync({
      id: item.id,
      input: {
        is_active: !item.is_active,
      },
    });
  };

  // Helper for category metadata
  const getCategoryMeta = (type: string) => {
    const group = LOOKUP_GROUPS.find((g) => g.key === type);
    if (!group) {
      return {
        labelLo: type,
        labelEn: type,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      };
    }
    switch (type) {
      case 'paper_type':
        return { ...group, badgeClass: 'bg-sky-50 text-sky-700 border-sky-100' };
      case 'surface_finish':
        return { ...group, badgeClass: 'bg-amber-50 text-amber-700 border-amber-100' };
      case 'standard_dimension':
        return { ...group, badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
      case 'unit_of_measure':
        return { ...group, badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'binding_type':
        return { ...group, badgeClass: 'bg-purple-50 text-purple-700 border-purple-100' };
      default:
        return { ...group, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const activeCategoryGroup = LOOKUP_GROUPS.find((g) => g.key === selectedCategory);

  return (
    <div className="w-full space-y-6 animate-fade-in text-slate-800">
      {/* 1. Header Banner - Matching Web Catalog & Admin Pages */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ຈັດການຂໍ້ມູນພື້ນຖານລະບົບ (Universal Master Data)
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
            ກຳນົດຄ່າຄົງທີ່ອ້າງອິງຂອງໂຮງພິມ Som Sing Phim: ປະເພດເນື້ອເຈ້ຍ, ຜິວເຄືອບ, ຂະໜາດມາດຕະຖານ, ຫົວໜ່ວຍນັບ ແລະ ວິທີເຂົ້າເຫຼັ້ມ
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl font-bold shadow-xs hover:border-slate-300 transition active:scale-98 cursor-pointer disabled:opacity-60 text-xs sm:text-sm"
            title="ດຶງຂໍ້ມູນລ່າສຸດ"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-600 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>ຣີເຟຣຊ</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ເພີ່ມຂໍ້ມູນພື້ນຖານໃໝ່</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">ຂໍ້ມູນພື້ນຖານທັງໝົດ</span>
            <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{allLookups.length}</div>
          <p className="text-[11px] text-slate-400 font-semibold">ລວມທຸກໝວດໝູ່ທີ່ຕັ້ງຄ່າໄວ້</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ເປີດໃຊ້ງານ (Active)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {allLookups.filter((i) => i.is_active).length}
          </div>
          <p className="text-[11px] text-slate-400 font-semibold">ພ້ອມດຶງໄປໃຊ້ໃນ Dropdown ຕ່າງໆ</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ປະເພດເນື້ອເຈ້ຍ</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-600">{categoryCounts['paper_type'] || 0}</div>
          <p className="text-[11px] text-slate-400 font-semibold">ອາດມັນ, ປອນ, ຄຣາຟ, ສະຕິກເກີ, ຈົ່ວປັງ</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ຂະໜາດມາດຕະຖານ</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600">{categoryCounts['standard_dimension'] || 0}</div>
          <p className="text-[11px] text-slate-400 font-semibold">A4, A3, SRA3, แผ่นใหญ่ 31x43"</p>
        </div>
      </div>

      {/* 3. Main Split View: Left Sticky Sidebar & Right Grid Cards */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* LEFT SIDEBAR: Search, Status Docky & Category List */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4 lg:sticky lg:top-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-5">
            {/* Search Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                <span>ຄົ້ນຫາຂໍ້ມູນ (Search)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ຊື່, Code ຫຼື ພາສາ..."
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition font-semibold"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Segmented Docky (Exact layout from user screenshot) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
                <span>ສະຖານະ (Status)</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', label: 'ທັງໝົດ' },
                  { id: 'active', label: 'ສະແດງ' },
                  { id: 'hidden', label: 'ເຊື່ອງໄວ້' },
                  { id: 'custom', label: 'ມີສະເປັກ' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      statusFilter === st.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Navigation (Vertical List with Item Counts) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ໝວດໝູ່ຂໍ້ມູນ (Categories)</span>
                </label>
                <span className="text-[11px] font-bold text-slate-400">
                  {LOOKUP_GROUPS.length} ໝວດ
                </span>
              </div>

              <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1 scrollbar-none">
                {/* All Option */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">ທັງໝົດ (All Categories)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      selectedCategory === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {allLookups.length}
                  </span>
                </button>

                {/* 5 Specific Master Data Groups */}
                {LOOKUP_GROUPS.map((g) => {
                  const isSelected = selectedCategory === g.key;
                  const count = categoryCounts[g.key] || 0;
                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setSelectedCategory(g.key)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{g.labelLo}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT: Grid of Cards taking full available width */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Header of Grid with Count & Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500">ສະແດງຜົນ:</span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-extrabold">
                {filteredLookups.length} ລາຍການ
              </span>

              {selectedCategory !== 'all' && (
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-100">
                  ໝວດ: {activeCategoryGroup?.labelLo || selectedCategory}
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-indigo-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {statusFilter !== 'all' && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-200">
                  ສະຖານະ: {statusFilter === 'active' ? 'ສະແດງ' : statusFilter === 'hidden' ? 'ເຊື່ອງໄວ້' : 'ມີສະເປັກ'}
                  <button onClick={() => setStatusFilter('all')} className="hover:text-slate-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-200">
                  ຄຳຄົ້ນ: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-slate-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ເພີ່ມຂໍ້ມູນພື້ນຖານ</span>
            </button>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="py-24 text-center text-sm text-slate-400 bg-white rounded-3xl border border-slate-100">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
              <span>ກຳລັງໂຫຼດຂໍ້ມູນພື້ນຖານ...</span>
            </div>
          ) : isError ? (
            <div className="py-20 text-center text-sm text-rose-500 bg-white rounded-3xl border border-slate-100">
              ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ
            </div>
          ) : filteredLookups.length === 0 ? (
            <div className="py-24 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 space-y-3">
              <Database className="w-10 h-10 mx-auto text-slate-300" />
              <div className="text-sm font-bold text-slate-600">ບໍ່ພົບຂໍ້ມູນພື້ນຖານທີ່ກົງກັບເງື່ອນໄຂ</div>
              <p className="text-xs text-slate-400">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ກົດປຸ່ມເພີ່ມຂໍ້ມູນພື້ນຖານໃໝ່</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ລ້າງຕົວກັ່ນຕອງທັງໝົດ
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredLookups.map((item) => {
                const meta = getCategoryMeta(item.lookup_type);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between space-y-4 relative group"
                  >
                    {/* Top Tag & Status Toggle Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${meta.badgeClass}`}>
                        {meta.labelLo}
                      </span>

                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                          item.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="ກົດເພື່ອເປີດ/ປິດການໃຊ້ງານ"
                      >
                        {item.is_active ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ສະແດງ</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            <span>ເຊື່ອງໄວ້</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Titles */}
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                        {item.name_lo}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500">
                        {item.name_en}
                      </p>
                      {item.name_th && (
                        <p className="text-[11px] font-medium text-slate-400">
                          {item.name_th}
                        </p>
                      )}
                    </div>

                    {/* Spec & Attributes Box (Matching card specs in screenshot) */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold bg-white text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
                          {item.code}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          ລຳດັບ: {item.sort_order}
                        </span>
                      </div>

                      {item.attributes && Object.keys(item.attributes).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/60">
                          {Object.entries(item.attributes).map(([k, v]) => (
                            <span
                              key={k}
                              className="text-[10px] font-mono font-bold bg-white text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100"
                            >
                              {k === 'width_mm'
                                ? `ກວ້າງ: ${v}mm`
                                : k === 'height_mm'
                                ? `ຍາວ: ${v}mm`
                                : k === 'multiplier'
                                ? `x${v}`
                                : `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          ບໍ່ມີຄຸນລັກສະນະເພີ່ມເຕີມ
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Path & Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] text-slate-400 truncate max-w-[140px]">
                        /{item.lookup_type}/{item.code.toLowerCase()}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="ແກ້ໄຂ"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="ປິດໃຊ້ງານ / ລຶບ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Universal Form Modal */}
      <LookupFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeType={(selectedCategory !== 'all' ? selectedCategory : 'paper_type') as LookupType}
        editingLookup={editingLookup}
      />
    </div>
  );
};
