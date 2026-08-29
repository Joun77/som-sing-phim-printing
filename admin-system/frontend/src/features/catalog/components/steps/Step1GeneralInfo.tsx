import React, { useRef } from 'react';
import { 
  FileText, 
  Tag, 
  DollarSign, 
  Sliders, 
  UploadCloud, 
  Trash2, 
  Plus, 
  Star, 
  Check, 
  Sparkles,
  Settings2,
  Image as ImageIcon,
  BookOpen,
  Ruler,
  Zap,
  Palette,
  Download,
  Scissors,
  Rocket
} from 'lucide-react';
import { PublicCategory, PricingModel, FeaturesConfig } from '../../types';

interface Step1GeneralInfoProps {
  categories: PublicCategory[];
  nameLo: string;
  setNameLo: (v: string) => void;
  nameEn: string;
  setNameEn: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  categoryId?: number;
  setCategoryId: (v?: number) => void;
  category: string;
  setCategory: (v: string) => void;
  descriptionLo: string;
  setDescriptionLo: (v: string) => void;
  descriptionEn: string;
  setDescriptionEn: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  basePrice: number;
  setBasePrice: (v: number) => void;
  pricingModel: PricingModel;
  setPricingModel: (v: PricingModel) => void;
  thumbnailUrl: string;
  setThumbnailUrl: (v: string) => void;
  galleryUrls: string[];
  setGalleryUrls: React.Dispatch<React.SetStateAction<string[]>>;
  bestseller: boolean;
  setBestseller: (v: boolean) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  featuresConfig: FeaturesConfig;
  setFeaturesConfig: React.Dispatch<React.SetStateAction<FeaturesConfig>>;
  featuresList: string[];
  setFeaturesList: React.Dispatch<React.SetStateAction<string[]>>;
  newFeatureInput: string;
  setNewFeatureInput: (v: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PRICING_MODELS: { id: PricingModel; label: string; desc: string }[] = [
  { id: 'STANDARD_FLAT', label: 'ງານແຜ່ນທົ່ວໄປ (Standard Flat)', desc: 'ສະຕິກເກີ, ນາມບັດ, ໂບຣຊົວ, ໂປສເຕີ (ຄິດລາຄາ Base + Add-on)' },
  { id: 'BOOK_MULTIPART', label: 'ງານປຶ້ມ / ເຂົ້າເລັ້ມ (Book / Multi-Part)', desc: 'ປົກ + ເນື້ອໃນ + ຈຳນວນໜ້າ + ເຂົ້າເລັ້ມ + ຄິດໄລ່ສັນປົກ' },
  { id: 'SQM_CUSTOM', label: 'ຄິດລາຄາຕາມຂະໜາດ / ຕາລາງແມັດ (SQM / Dimension)', desc: 'ປ້າຍໄວນິລ, ສະຕິກເກີມ້ວນ ຕາມ ກວ້າງ x ຍາວ' },
  { id: 'FIXED_UNIT', label: 'ລາຄາຄົງທີ່ຕໍ່ຊິ້ນ / ບໍລິການ (Fixed Unit / Service)', desc: 'ກັອບປີ້ເອກະສານ, ບໍລິການແປງໄຟລ໌, ຕາຢາງ' },
];

export const Step1GeneralInfo: React.FC<Step1GeneralInfoProps> = ({
  categories,
  nameLo,
  setNameLo,
  nameEn,
  setNameEn,
  name,
  setName,
  slug,
  setSlug,
  categoryId,
  setCategoryId,
  category,
  setCategory,
  descriptionLo,
  setDescriptionLo,
  descriptionEn,
  setDescriptionEn,
  basePrice,
  setBasePrice,
  pricingModel,
  setPricingModel,
  thumbnailUrl,
  setThumbnailUrl,
  galleryUrls,
  setGalleryUrls,
  bestseller,
  setBestseller,
  isActive,
  setIsActive,
  featuresConfig,
  setFeaturesConfig,
  featuresList,
  setFeaturesList,
  newFeatureInput,
  setNewFeatureInput,
  showToast
}) => {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [customGalleryUrl, setCustomGalleryUrl] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);

  const generateSlugFromName = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumbnail: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        showToast('ກະລຸນາເລືອກໄຟລ໌ຮູບພາບ (PNG, JPG, WebP)', 'error');
        continue;
      }

      // Try upload via Backend API
      try {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch('/api/v1/admin/catalog/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data?.url) {
            const finalUrl = json.data.url;
            if (isThumbnail && i === 0) {
              setThumbnailUrl(finalUrl);
              showToast('ອັບໂຫຼດຮູບຫຼັກຂຶ້ນເຊີເວີສຳເລັດ', 'success');
            } else {
              setGalleryUrls((prev) => [...prev, finalUrl]);
              showToast('ເພີ່ມຮູບໃນ Gallery ສຳເລັດ', 'success');
            }
            continue;
          }
        }
      } catch {
        // Fallback to FileReader base64 if upload endpoint is unreachable
      }

      // Fallback
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const base64 = loadEvt.target?.result as string;
        if (base64) {
          if (isThumbnail && i === 0) {
            setThumbnailUrl(base64);
            showToast('ອັບໂຫຼດຮູບຫຼັກສຳເລັດ (Local)', 'success');
          } else {
            setGalleryUrls((prev) => [...prev, base64]);
            showToast('ເພີ່ມຮູບໃນ Gallery ສຳເລັດ (Local)', 'success');
          }
        }
      };
      reader.readAsDataURL(file);
    }
    setIsUploading(false);
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setFeaturesList([...featuresList, newFeatureInput.trim()]);
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* 1. Basic Product Naming & Category */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-4 hover:border-slate-300 transition-all">
        <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-4 h-4" />
          </div>
          <span>1. ຂໍ້ມູນພື້ນຖານສິນຄ້າ (Basic Product Info)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Lao Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ຊື່ສິນຄ້າ (ພາສາລາວ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nameLo}
              onChange={(e) => {
                setNameLo(e.target.value);
                if (!name) setName(e.target.value);
              }}
              placeholder="ເຊັ່ນ: ສະຕິກເກີໄດຄັດ PVC ກັນນ້ຳ"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky font-medium text-slate-900 shadow-2xs"
            />
          </div>

          {/* English Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ຊື່ສິນຄ້າ (English Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nameEn}
              onChange={(e) => {
                setNameEn(e.target.value);
                if (!slug) setSlug(generateSlugFromName(e.target.value));
              }}
              placeholder="e.g. Waterproof PVC Die-Cut Sticker"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky font-medium text-slate-900 shadow-2xs"
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ໝວດໝູ່ສິນຄ້າ (Category)
            </label>
            <select
              value={categoryId || ''}
              onChange={(e) => {
                const catId = parseInt(e.target.value, 10);
                setCategoryId(catId || undefined);
                const found = categories.find((c) => c.id === catId);
                if (found) setCategory(found.slug);
              }}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky font-medium text-slate-900 shadow-2xs cursor-pointer"
            >
              <option value="">-- ເລືອກໝວດໝູ່ --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon || '📁'} {cat.nameLo || cat.nameEn || cat.slug} ({cat.slug})
                </option>
              ))}
            </select>
          </div>

          {/* URL Slug */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL Slug (ລະຫັດອ້າງອີງໜ້າເວັບ)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(generateSlugFromName(e.target.value))}
              placeholder="e.g. pvc-die-cut-sticker"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky font-mono font-bold text-sky-700 shadow-2xs"
            />
          </div>

          {/* Lao Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ຄຳອະທິບາຍສິນຄ້າ (ພາສາລາວ)
            </label>
            <textarea
              rows={2}
              value={descriptionLo}
              onChange={(e) => setDescriptionLo(e.target.value)}
              placeholder="ອະທິບາຍຈຸດເດັ່ນຂອງສິນຄ້າ ແລະ ການນຳໃຊ້..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky text-slate-800 shadow-2xs"
            />
          </div>

          {/* English Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ຄຳອະທິບາຍສິນຄ້າ (English Description)
            </label>
            <textarea
              rows={2}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              placeholder="Product highlights, use cases and materials..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky text-slate-800 shadow-2xs"
            />
          </div>

          {/* Base Starting Price */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                ລາຄາເລີ່ມຕົ້ນ (Base Starting Price LAK)
              </label>
              <span className="text-[10px] text-sky-700 font-bold flex items-center gap-1">
                <Zap className="w-3 h-3 text-sky-600" />
                <span>ຄິດໄລ່ຈາກຂັ້ນຕອນທີ 5</span>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                value={basePrice}
                onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-8 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky font-mono font-bold text-slate-900 shadow-2xs"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-mono font-bold">₭</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              ລາຄາເລີ່ມຕົ້ນຈະຖືກຄິດໄລ່ອັດຕະໂນມັດໃນ <strong>ຂັ້ນຕອນທີ 5</strong> ຈາກຕົ້ນທຶນ (ເຄື່ອງພິມ + ເຈ້ຍ + ງານຕັດ + Margin %)
            </p>
          </div>

          {/* Pricing Model */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ຮູບແບບການຄິດໄລ່ລາຄາ (Pricing Calculation Model)
            </label>
            <select
              value={pricingModel}
              onChange={(e) => setPricingModel(e.target.value as PricingModel)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky font-medium text-slate-900 shadow-2xs cursor-pointer"
            >
              {PRICING_MODELS.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Image Management & Gallery */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-4 hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <div className="p-1.5 bg-sky-50 text-sky-600 rounded-xl">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span>2. ຮູບພາບສິນຄ້າ (Product Thumbnail & Gallery)</span>
          </h4>
          <span className="text-[11px] font-medium text-slate-400">ຮອງຮັບ PNG, JPG, WebP</span>
        </div>

        {/* Hidden inputs */}
        <input
          ref={thumbnailInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e, true)}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e, false)}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {/* Main Thumbnail Card */}
          <div className="relative aspect-square rounded-2xl border-2 border-sky-300 bg-sky-50/40 flex flex-col items-center justify-center overflow-hidden group">
            {thumbnailUrl ? (
              <>
                <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 p-2">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">ຮູບຫຼັກ (Cover)</span>
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="w-full py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold"
                  >
                    ປ່ຽນຮູບ
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl('')}
                    className="w-full py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold"
                  >
                    ລຶບ
                  </button>
                </div>
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-sky-600 text-white text-[9px] font-black uppercase">
                  Cover
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-sky-100/50 transition"
              >
                <UploadCloud className="w-6 h-6 text-sky-600 mb-1" />
                <span className="text-[11px] font-bold text-sky-700">+ ອັບໂຫຼດຮູບຫຼັກ</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Thumbnail</span>
              </button>
            )}
          </div>

          {/* Gallery Items */}
          {galleryUrls.map((url, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden group"
            >
              <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 p-2">
                <button
                  type="button"
                  onClick={() => {
                    const oldThumb = thumbnailUrl;
                    setThumbnailUrl(url);
                    setGalleryUrls((prev) => prev.map((u, i) => (i === idx ? oldThumb || u : u)).filter(Boolean));
                    showToast('ຕັ້ງເປັນຮູບຫຼັກແລ້ວ', 'success');
                  }}
                  className="w-full py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold"
                >
                  ຕັ້ງເປັນຮູບຫຼັກ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGalleryUrls((prev) => prev.filter((_, i) => i !== idx));
                  }}
                  className="w-full py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>ລຶບ</span>
                </button>
              </div>
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-slate-900/80 text-white text-[9px] font-bold">
                #{idx + 1}
              </div>
            </div>
          ))}

          {/* Add Extra Button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50/50 hover:bg-sky-50/50 transition flex flex-col items-center justify-center p-3 text-center cursor-pointer group"
          >
            <Plus className="w-6 h-6 text-slate-400 group-hover:text-sky-600 mb-1 transition" />
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-sky-700">
              + ເພີ່ມຮູບອີກ
            </span>
          </button>
        </div>

        {/* Quick URL Fallback Input */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={customGalleryUrl}
              onChange={(e) => setCustomGalleryUrl(e.target.value)}
              placeholder="ຫຼື ວາງ URL ຮູບພາບໂດຍກົງ (https://... ຫຼື /images/...)"
              className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
            />
            <button
              type="button"
              onClick={() => {
                if (!customGalleryUrl.trim()) return;
                if (!thumbnailUrl) {
                  setThumbnailUrl(customGalleryUrl.trim());
                } else {
                  setGalleryUrls((prev) => [...prev, customGalleryUrl.trim()]);
                }
                setCustomGalleryUrl('');
                showToast('ເພີ່ມ URL ຮູບພາບສຳເລັດ', 'success');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
            >
              ເພີ່ມ URL
            </button>
          </div>
        </div>
      </div>

      {/* 3. Upload Mode Workflow & Feature Engine */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-4 hover:border-slate-300 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-xl">
              <Settings2 className="w-4 h-4" />
            </div>
            <span>3. ຮູບແບບການອັບໂຫຼດ & ຟັງຊັນຂອງສິນຄ້າ (Upload Workflow & Feature Engine)</span>
          </span>
        </div>

        {/* Upload Mode Presets */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            ຮູບແບບການອັບໂຫຼດຂອງສິນຄ້ານີ້ (Upload Mode):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() =>
                setFeaturesConfig((prev) => ({
                  ...prev,
                  uploadMode: 'print_ready_file',
                  hasPageCounter: false,
                  hasSqmCalculator: false,
                  hasPreflightCheck: true
                }))
              }
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                featuresConfig.uploadMode === 'print_ready_file'
                  ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <div>
                <span className="text-xs font-black flex items-center gap-1.5 mb-1">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                  <span>ໄຟລ໌ພ້ອມພິມທົ່ວໄປ (Print Ready)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  ສະຕິກເກີ, ນາມບັດ, ໂບຣຊົວ (PDF, JPG, PNG 1-2 ໜ້າ)
                </span>
              </div>
              {featuresConfig.uploadMode === 'print_ready_file' && (
                <span className="mt-2 text-[10px] font-bold text-sky-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> ເລືອກແລ້ວ
                </span>
              )}
            </div>

            <div
              onClick={() =>
                setFeaturesConfig((prev) => ({
                  ...prev,
                  uploadMode: 'multipart_book_pdf',
                  hasPageCounter: true,
                  hasSqmCalculator: false,
                  hasPreflightCheck: true
                }))
              }
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                featuresConfig.uploadMode === 'multipart_book_pdf'
                  ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <div>
                <span className="text-xs font-black flex items-center gap-1.5 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                  <span>ງານປຶ້ມ & ເອກະສານ (Multi-Page PDF)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  ນັບຈຳນວນໜ້າ PDF ອັດຕະໂນມັດ, ຄິດໄລ່ສັນປົກປຶ້ມ
                </span>
              </div>
              {featuresConfig.uploadMode === 'multipart_book_pdf' && (
                <span className="mt-2 text-[10px] font-bold text-sky-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> ເລືອກແລ້ວ
                </span>
              )}
            </div>

            <div
              onClick={() =>
                setFeaturesConfig((prev) => ({
                  ...prev,
                  uploadMode: 'large_format_sqm',
                  hasPageCounter: false,
                  hasSqmCalculator: true,
                  hasPreflightCheck: true
                }))
              }
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                featuresConfig.uploadMode === 'large_format_sqm'
                  ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <div>
                <span className="text-xs font-black flex items-center gap-1.5 mb-1">
                  <Ruler className="w-3.5 h-3.5 text-sky-600" />
                  <span>ປ້າຍຕາລາງແມັດ (Large Format SQM)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  ປ້າຍໄວນິລ, ສະຕິກເກີມ້ວນໃຫຍ່ ຄຳນວອນ ກວ້າງ x ຍາວ (m²)
                </span>
              </div>
              {featuresConfig.uploadMode === 'large_format_sqm' && (
                <span className="mt-2 text-[10px] font-bold text-sky-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> ເລືອກແລ້ວ
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white cursor-pointer transition">
            <input
              type="checkbox"
              checked={featuresConfig.hasPreflightCheck ?? true}
              onChange={(e) =>
                setFeaturesConfig((prev) => ({ ...prev, hasPreflightCheck: e.target.checked }))
              }
              className="w-4 h-4 text-sky-600 rounded"
            />
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>ກວດໄຟລ໌ Preflight ອັດຕະໂນມັດ (DPI, Bleed)</span>
            </span>
          </label>

          <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white cursor-pointer transition">
            <input
              type="checkbox"
              checked={featuresConfig.hasOnlineDesign ?? false}
              onChange={(e) =>
                setFeaturesConfig((prev) => ({ ...prev, hasOnlineDesign: e.target.checked }))
              }
              className="w-4 h-4 text-sky-600 rounded"
            />
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              <span>ອອກແບບອອນລາຍ (Canva / Canvas Editor)</span>
            </span>
          </label>

          <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white cursor-pointer transition">
            <input
              type="checkbox"
              checked={featuresConfig.hasTemplateDownload ?? true}
              onChange={(e) =>
                setFeaturesConfig((prev) => ({ ...prev, hasTemplateDownload: e.target.checked }))
              }
              className="w-4 h-4 text-sky-600 rounded"
            />
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>ດາວໂຫຼດ Template ໄດຄັດ (AI, PSD)</span>
            </span>
          </label>

          <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white cursor-pointer transition">
            <input
              type="checkbox"
              checked={featuresConfig.hasFinishingSelector ?? true}
              onChange={(e) =>
                setFeaturesConfig((prev) => ({ ...prev, hasFinishingSelector: e.target.checked }))
              }
              className="w-4 h-4 text-sky-600 rounded"
            />
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-purple-500" />
              <span>ງານຕັດ & ເຂົ້າເລັ້ມ (Finishing Selector)</span>
            </span>
          </label>

          <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white cursor-pointer transition">
            <input
              type="checkbox"
              checked={featuresConfig.hasExpeditedRush ?? true}
              onChange={(e) =>
                setFeaturesConfig((prev) => ({ ...prev, hasExpeditedRush: e.target.checked }))
              }
              className="w-4 h-4 text-sky-600 rounded"
            />
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5 text-rose-500" />
              <span>ງານດ່ວນພິເສດ (Rush 24h Delivery)</span>
            </span>
          </label>
        </div>
      </div>

      {/* 4. Feature Tags & Bestseller / Active Status */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-4 hover:border-slate-300 transition-all">
        <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-xl">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>4. ຈຸດເດັ່ນ & ສະຖານະສິນຄ້າ (Highlight Tags & Status)</span>
        </h4>

        <div className="flex flex-wrap items-center gap-6 py-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bestseller}
              onChange={(e) => setBestseller(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded focus:ring-accent-sky"
            />
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              ສິນຄ້າຍອດນິຍົມ (Bestseller)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded focus:ring-accent-sky"
            />
            <span className="text-xs font-bold text-emerald-600">
              ✓ ເປີດສະແດງໜ້າເວັບ (Active on Storefront)
            </span>
          </label>
        </div>

        {/* Feature Tags List */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            ປ້າຍຈຸດເດັ່ນຂອງສິນຄ້າ (Feature Highlights Tags):
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {featuresList.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl text-xs font-semibold"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="hover:text-rose-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newFeatureInput}
              onChange={(e) => setNewFeatureInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFeature();
                }
              }}
              placeholder="ພິມຈຸດເດັ່ນ ເຊັ່ນ: ກັນນ້ຳ 100%, ໄດຄັດຄົມຊັດ, ພິມລະອຽດສູງ ແລ້ວກົດ Enter..."
              className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
            />
            <button
              type="button"
              onClick={handleAddFeature}
              className="px-4 py-2 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              + ເພີ່ມແທັກ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
