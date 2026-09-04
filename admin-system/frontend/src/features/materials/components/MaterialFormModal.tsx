import React, { useState, useEffect } from 'react';
import { X, Check, Globe, Tag, Layers, HelpCircle, Link as LinkIcon, FileText } from 'lucide-react';
import { ProductMaterial, DEFAULT_MATERIAL_CATEGORIES, CreateMaterialInput } from '../types';
import { useCreateMaterial, useUpdateMaterial, useMaterialCategories } from '../api/materialsApi';

interface MaterialFormModalProps {
  material?: ProductMaterial | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MaterialFormModal: React.FC<MaterialFormModalProps> = ({
  material,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isEdit = !!material;
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const { data: dynamicCategories = [] } = useMaterialCategories();

  const [activeLangTab, setActiveLangTab] = useState<'lo' | 'en'>('lo');

  // Form states
  const [category, setCategory] = useState('art');
  const [categoryNameLo, setCategoryNameLo] = useState('');
  const [categoryNameEn, setCategoryNameEn] = useState('');
  const [nameLo, setNameLo] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [gsm, setGsm] = useState<number>(160);
  const [finishLo, setFinishLo] = useState('');
  const [finishEn, setFinishEn] = useState('');
  const [textureClass, setTextureClass] = useState('texture-artcard');
  const [descriptionLo, setDescriptionLo] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [prosLo, setProsLo] = useState('');
  const [prosEn, setProsEn] = useState('');
  const [consLo, setConsLo] = useState('');
  const [consEn, setConsEn] = useState('');
  const [finishingCompatLo, setFinishingCompatLo] = useState('');
  const [finishingCompatEn, setFinishingCompatEn] = useState('');
  const [suitableForLoInput, setSuitableForLoInput] = useState('');
  const [suitableForEnInput, setSuitableForEnInput] = useState('');
  const [productLink, setProductLink] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [sortOrder, setSortOrder] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (material) {
      setCategory(material.category || 'art');
      setCategoryNameLo(material.categoryNameLo || '');
      setCategoryNameEn(material.categoryNameEn || '');
      setNameLo(material.nameLo || '');
      setNameEn(material.nameEn || '');
      setGsm(material.gsm || 0);
      setFinishLo(material.finishLo || '');
      setFinishEn(material.finishEn || '');
      setTextureClass(material.textureClass || 'texture-artcard');
      setDescriptionLo(material.descriptionLo || '');
      setDescriptionEn(material.descriptionEn || '');
      setProsLo(material.prosLo || '');
      setProsEn(material.prosEn || '');
      setConsLo(material.consLo || '');
      setConsEn(material.consEn || '');
      setFinishingCompatLo(material.finishingCompatLo || '');
      setFinishingCompatEn(material.finishingCompatEn || '');
      setSuitableForLoInput((material.suitableForLo || []).join(', '));
      setSuitableForEnInput((material.suitableForEn || []).join(', '));
      setProductLink(material.productLink || '');
      setProductTitle(material.productTitle || '');
      setSortOrder(material.sortOrder ?? 10);
      setIsActive(material.isActive !== undefined ? material.isActive : true);
    } else {
      // Default reset
      setCategory('art');
      setCategoryNameLo('Art Paper (ເຈ້ຍອາດ)');
      setCategoryNameEn('Art Paper & Card');
      setNameLo('');
      setNameEn('');
      setGsm(160);
      setFinishLo('');
      setFinishEn('');
      setTextureClass('texture-artcard');
      setDescriptionLo('');
      setDescriptionEn('');
      setProsLo('');
      setProsEn('');
      setConsLo('');
      setConsEn('');
      setFinishingCompatLo('');
      setFinishingCompatEn('');
      setSuitableForLoInput('');
      setSuitableForEnInput('');
      setProductLink('');
      setProductTitle('');
      setSortOrder(10);
      setIsActive(true);
    }
    setErrorMsg('');
  }, [material, isOpen]);

  const handleCategoryChange = (catId: string) => {
    setCategory(catId);
    const foundDynamic = dynamicCategories.find((c) => c.key === catId);
    if (foundDynamic) {
      setCategoryNameLo(foundDynamic.nameLo);
      setCategoryNameEn(foundDynamic.nameEn);
      return;
    }
    const foundDefault = DEFAULT_MATERIAL_CATEGORIES.find((c) => c.id === catId);
    if (foundDefault) {
      setCategoryNameLo(foundDefault.labelLo);
      setCategoryNameEn(foundDefault.labelEn);
    }
  };

  const parseTags = (str: string): string[] => {
    return str
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nameLo.trim()) {
      setErrorMsg('ກະລຸນາລະບຸຊື່ເຈ້ຍ (ພາສາລາວ)');
      return;
    }

    const payload: CreateMaterialInput = {
      category,
      categoryNameLo,
      categoryNameEn,
      nameLo: nameLo.trim(),
      nameEn: nameEn.trim(),
      gsm: Number(gsm) || 0,
      finishLo: finishLo.trim(),
      finishEn: finishEn.trim(),
      textureClass: textureClass.trim(),
      descriptionLo: descriptionLo.trim(),
      descriptionEn: descriptionEn.trim(),
      prosLo: prosLo.trim(),
      prosEn: prosEn.trim(),
      consLo: consLo.trim(),
      consEn: consEn.trim(),
      finishingCompatLo: finishingCompatLo.trim(),
      finishingCompatEn: finishingCompatEn.trim(),
      suitableForLo: parseTags(suitableForLoInput),
      suitableForEn: parseTags(suitableForEnInput),
      productLink: productLink.trim(),
      productTitle: productTitle.trim(),
      sortOrder: Number(sortOrder) || 0,
      isActive,
    };

    try {
      if (isEdit && material) {
        await updateMutation.mutateAsync({
          id: material.id,
          input: { ...payload, id: material.id },
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ');
    }
  };

  if (!isOpen) return null;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {isEdit ? 'ແກ້ໄຂຂໍ້ມູນວັດສະດຸ / ເຈ້ຍ' : 'ເພີ່ມວັດສະດຸ / ເຈ້ຍໃໝ່'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit ? `ID: ${material?.id}` : 'ກຳນົດສະເປັກແລະຄຳອະທິບາຍເຈ້ຍສຳລັບສະແດງໜ້າເວັບ Storefront'}
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

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Basic Classification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">ໝວດໝູ່ (Category)</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {dynamicCategories.length > 0
                  ? dynamicCategories.map((cat) => (
                      <option key={cat.id} value={cat.key}>
                        {cat.nameLo} ({cat.key})
                      </option>
                    ))
                  : DEFAULT_MATERIAL_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.labelLo}
                      </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">ນ້ຳໜັກເຈ້ຍ (GSM)</label>
              <div className="relative">
                <input
                  type="number"
                  value={gsm}
                  onChange={(e) => setGsm(Number(e.target.value))}
                  placeholder="300"
                  className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-12"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">gsm</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Texture Class (CSS)</label>
              <input
                type="text"
                value={textureClass}
                onChange={(e) => setTextureClass(e.target.value)}
                placeholder="texture-artcard"
                className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Section 2: Bilingual Content Controls */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-700">ຂໍ້ມູນສອງພາສາ (Bilingual Details)</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveLangTab('lo')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    activeLangTab === 'lo'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  ພາສາລາວ (Lao)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLangTab('en')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    activeLangTab === 'en'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Lao Fields */}
            {activeLangTab === 'lo' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      ຊື່ວັດສະດຸ (ພາສາລາວ) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nameLo}
                      onChange={(e) => setNameLo(e.target.value)}
                      placeholder="ເຈ້ຍອາດກາດ 2 ໜ້າ (Art Card)"
                      className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      ຊື່ໝວດໝູ່ທີ່ສະແດງ (Lao)
                    </label>
                    <input
                      type="text"
                      value={categoryNameLo}
                      onChange={(e) => setCategoryNameLo(e.target.value)}
                      placeholder="Art Paper (ເຈ້ຍອາດ)"
                      className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">ຜິວສຳຜັດ (Finish)</label>
                  <input
                    type="text"
                    value={finishLo}
                    onChange={(e) => setFinishLo(e.target.value)}
                    placeholder="ຜິວກຶ່ງມັນກຶ່ງດ້ານ ລຽບນຽນພິເສດ"
                    className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">ຄຳອະທິບາຍ (Description)</label>
                  <textarea
                    rows={2}
                    value={descriptionLo}
                    onChange={(e) => setDescriptionLo(e.target.value)}
                    placeholder="ເນື້ອເຈ້ຍແໜ້ນ ໜາແຂງແຮງ ພິມສີສັນສົດໃສ..."
                    className="w-full text-sm border-slate-200 rounded-lg p-3 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-700 mb-1.5">ຈຸດເດັ່ນ (Pros)</label>
                    <textarea
                      rows={2}
                      value={prosLo}
                      onChange={(e) => setProsLo(e.target.value)}
                      placeholder="ຮອງຮັບການປ້ຳນູນ (Emboss), ປ້ຳຟອຍຄຳ..."
                      className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-white border focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-700 mb-1.5">ຂໍ້ຄວນລະວັງ (Cons)</label>
                    <textarea
                      rows={2}
                      value={consLo}
                      onChange={(e) => setConsLo(e.target.value)}
                      placeholder="ຕ້ອງເຮັດຮອຍພັບ (Crease) ກ່ອນດັດພັບ..."
                      className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-white border focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    ງານຫຼັງພິມທີ່ຮອງຮັບ (Finishing Compatibility)
                  </label>
                  <input
                    type="text"
                    value={finishingCompatLo}
                    onChange={(e) => setFinishingCompatLo(e.target.value)}
                    placeholder="ເຄືອບ PVC ເງົາ/ດ້ານ, Spot UV 3D, ປ້ຳຟອຍຄຳ/ເງິນ..."
                    className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    ເໝາະສຳລັບ (Suitable For) — ຄັ່ນດ້ວຍເຄື່ອງໝາຍຈຸດ (,)
                  </label>
                  <input
                    type="text"
                    value={suitableForLoInput}
                    onChange={(e) => setSuitableForLoInput(e.target.value)}
                    placeholder="ນາມບັດ VIP, ກ່ອງບັນຈຸພັນ, ປົກປຶ້ມ/ລາຍງານ, ບັດເຊີນງານດອງ"
                    className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* English Fields */}
            {activeLangTab === 'en' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Material Name (English)</label>
                    <input
                      type="text"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder="Double-Sided Coated Art Card"
                      className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category Name (English)</label>
                    <input
                      type="text"
                      value={categoryNameEn}
                      onChange={(e) => setCategoryNameEn(e.target.value)}
                      placeholder="Art Paper & Card"
                      className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Finish Surface (English)</label>
                  <input
                    type="text"
                    value={finishEn}
                    onChange={(e) => setFinishEn(e.target.value)}
                    placeholder="Semi-matte ultra-smooth multi-coated stock"
                    className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description (English)</label>
                  <textarea
                    rows={2}
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    placeholder="Rigid, high-density art board engineered for vibrant color reproduction..."
                    className="w-full text-sm border-slate-200 rounded-lg p-3 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-700 mb-1.5">Pros (English)</label>
                    <textarea
                      rows={2}
                      value={prosEn}
                      onChange={(e) => setProsEn(e.target.value)}
                      placeholder="Supports Embossing, Gold Foil, Spot UV..."
                      className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-white border focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-700 mb-1.5">Cons (English)</label>
                    <textarea
                      rows={2}
                      value={consEn}
                      onChange={(e) => setConsEn(e.target.value)}
                      placeholder="Requires creasing line before folding..."
                      className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-white border focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Finishing Compatibility (English)
                  </label>
                  <input
                    type="text"
                    value={finishingCompatEn}
                    onChange={(e) => setFinishingCompatEn(e.target.value)}
                    placeholder="Gloss/Matte PVC, 3D Spot UV, Hot Foil Stamping..."
                    className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Suitable For (English) — comma-separated
                  </label>
                  <input
                    type="text"
                    value={suitableForEnInput}
                    onChange={(e) => setSuitableForEnInput(e.target.value)}
                    placeholder="VIP Business Cards, Packaging Boxes, Book Covers"
                    className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Navigation Link & Visibility */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Product Link (Storefront)</label>
              <input
                type="text"
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
                placeholder="/product/photo-print-card?paper=art-350"
                className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Product Link Title</label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder="ງານນາມບັດ & ການ໌ດ"
                className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-6 pt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ລຳດັບ (Sort Order)</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-24 text-sm border-slate-200 rounded-lg px-3 py-1.5 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-4">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-700">ເປີດໃຊ້ງານ (Active)</span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                'ກຳລັງບັນທຶກ...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {isEdit ? 'ບັນທຶກການແກ້ໄຂ' : 'ສ້າງວັດສະດຸໃໝ່'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
