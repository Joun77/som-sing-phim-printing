import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Sparkles, 
  FileText, 
  Printer, 
  Package, 
  Scissors, 
  Tag, 
  Eye, 
  Save, 
  RotateCcw,
  Coins
} from 'lucide-react';
import { 
  PublicProduct, 
  CreateProductInput, 
  PublicCategory, 
  PricingModel, 
  SpecGroup, 
  ProductDiscountTier, 
  ProductInfoTab, 
  FeaturesConfig 
} from './types';
import { Step1GeneralInfo } from './components/steps/Step1GeneralInfo';
import { Step2PrintEngine } from './components/steps/Step2PrintEngine';
import { Step3MaterialInventory } from './components/steps/Step3MaterialInventory';
import { Step4PostPressFinishing } from './components/steps/Step4PostPressFinishing';
import { Step5DiscountsAndTabs } from './components/steps/Step5DiscountsAndTabs';
import { Step6CustomerPreview } from './components/steps/Step6CustomerPreview';

export interface ProductStudioPageProps {
  editingProduct: PublicProduct | null;
  categories: PublicCategory[];
  onBack: () => void;
  onSave: (payload: CreateProductInput) => Promise<void>;
  isSaving: boolean;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ProductStudioPage: React.FC<ProductStudioPageProps> = ({
  editingProduct,
  categories,
  onBack,
  onSave,
  isSaving,
  showToast,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: General Info State
  const [nameLo, setNameLo] = useState(editingProduct?.nameLo || editingProduct?.name || '');
  const [nameEn, setNameEn] = useState(editingProduct?.nameEn || '');
  const [name, setName] = useState(editingProduct?.name || '');
  const [slug, setSlug] = useState(editingProduct?.slug || '');
  const [categoryId, setCategoryId] = useState<number | undefined>(editingProduct?.categoryId || (categories.length > 0 ? categories[0].id : undefined));
  const [category, setCategory] = useState(editingProduct?.category || (categories.length > 0 ? categories[0].slug : 'stickers'));
  const [descriptionLo, setDescriptionLo] = useState(editingProduct?.descriptionLo || editingProduct?.description || '');
  const [descriptionEn, setDescriptionEn] = useState(editingProduct?.descriptionEn || '');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [basePrice, setBasePrice] = useState(editingProduct?.basePrice || 0);
  const [pricingModel, setPricingModel] = useState<PricingModel>(editingProduct?.pricingModel || 'STANDARD_FLAT');
  const [thumbnailUrl, setThumbnailUrl] = useState(editingProduct?.thumbnailUrl || '');
  const [galleryUrls, setGalleryUrls] = useState<string[]>(editingProduct?.galleryUrls || []);
  const [bestseller, setBestseller] = useState(editingProduct?.bestseller ?? false);
  const [isActive, setIsActive] = useState(editingProduct?.isActive ?? true);
  const [featuresList, setFeaturesList] = useState<string[]>(editingProduct?.features || ['ພິມລະອຽດສູງ Ultra HD', 'ກັນນ້ຳ 100%']);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [featuresConfig, setFeaturesConfig] = useState<FeaturesConfig>(editingProduct?.featuresConfig || {
    hasCoverUpload: true,
    hasInnerUpload: false,
    hasSpineCalc: false,
    hasPreflightCheck: true,
    hasCustomDim: false,
    hasGeneralDocUpload: true,
    uploadWorkflow: 'artwork_preflight',
    allowedFileTypes: ['pdf', 'ai', 'psd', 'png', 'jpg'],
  });

  // Step 2 & 3 & 4 State
  const [baselineCoveragePercent, setBaselineCoveragePercent] = useState<number>(
    editingProduct?.featuresConfig?.baselineCoveragePercent || 
    (editingProduct as any)?.baselineCoveragePercent || 
    15
  );
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(editingProduct?.targetMarginPercent || 35);
  const [defaultMachineId, setDefaultMachineId] = useState<string>(editingProduct?.defaultMachineId || 'PRN-FUJI-V180');
  const [defaultMachineName, setDefaultMachineName] = useState<string>(editingProduct?.defaultMachineName || 'Fuji Xerox Versant 180 Press');
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>(() => {
    if (editingProduct?.specGroups && editingProduct.specGroups.length > 0) {
      return editingProduct.specGroups;
    }
    return [
      {
        id: 'group_print_mode',
        titleLo: 'ລະບົບການພິມ / ໂໝດສີ (Print Color Mode)',
        titleEn: 'Print Color Mode',
        displayType: 'cards',
        groupType: 'printing_mode',
        options: [
          {
            optionType: 'printing_mode',
            machineId: editingProduct?.defaultMachineId || 'PRN-FUJI-V180',
            machineName: editingProduct?.defaultMachineName || 'Fuji Xerox Versant 180 Press',
            label: 'ພິມ 4 ສີ (Full Color CMYK)',
            labelLo: 'ພິມ 4 ສີ (Full Color CMYK)',
            labelEn: 'Full Color CMYK',
            value: 'cmyk_4c',
            isDefault: true,
            extraCostRate: 1250,
            addPrice: 0,
          },
          {
            optionType: 'printing_mode',
            machineId: editingProduct?.defaultMachineId || 'PRN-FUJI-V180',
            machineName: editingProduct?.defaultMachineName || 'Fuji Xerox Versant 180 Press',
            label: 'ພິມຂາວດຳ (Monochrome K)',
            labelLo: 'ພິມຂາວດຳ (Monochrome K)',
            labelEn: 'Monochrome Black & White',
            value: 'mono_k',
            isDefault: false,
            extraCostRate: 280,
            addPrice: 0,
          }
        ]
      }
    ];
  });

  // Step 5 State
  const [minQuantity, setMinQuantity] = useState<number>(editingProduct?.minQuantity || 1);
  const [discountTiers, setDiscountTiers] = useState<ProductDiscountTier[]>(editingProduct?.discountTiers || [
    { minQuantity: 100, discountPercentage: 5 },
    { minQuantity: 500, discountPercentage: 10 },
    { minQuantity: 1000, discountPercentage: 15 },
  ]);
  const [infoTabs, setInfoTabs] = useState<ProductInfoTab[]>(editingProduct?.infoTabs || []);

  // Synchronize all state fields whenever editingProduct prop updates (e.g. fresh DB fetch / re-opening edit)
  React.useEffect(() => {
    if (editingProduct) {
      setNameLo(editingProduct.nameLo || editingProduct.name || '');
      setNameEn(editingProduct.nameEn || '');
      setName(editingProduct.name || '');
      setSlug(editingProduct.slug || '');
      setCategoryId(editingProduct.categoryId);
      setCategory(editingProduct.category || 'stickers');
      setDescriptionLo(editingProduct.descriptionLo || editingProduct.description || '');
      setDescriptionEn(editingProduct.descriptionEn || '');
      setDescription(editingProduct.description || '');
      setBasePrice(editingProduct.basePrice || 0);
      setPricingModel(editingProduct.pricingModel || 'STANDARD_FLAT');
      setThumbnailUrl(editingProduct.thumbnailUrl || '');
      setGalleryUrls(editingProduct.galleryUrls || []);
      setBestseller(editingProduct.bestseller ?? false);
      setIsActive(editingProduct.isActive ?? true);
      setFeaturesList(editingProduct.features || ['ພິມລະອຽດສູງ Ultra HD', 'ກັນນ້ຳ 100%']);
      if (editingProduct.featuresConfig) {
        setFeaturesConfig(editingProduct.featuresConfig);
      }
      setTargetMarginPercent(editingProduct.targetMarginPercent || 35);
      setDefaultMachineId(editingProduct.defaultMachineId || 'PRN-FUJI-V180');
      setDefaultMachineName(editingProduct.defaultMachineName || 'Fuji Xerox Versant 180 Press');
      if (editingProduct.specGroups && editingProduct.specGroups.length > 0) {
        setSpecGroups(editingProduct.specGroups);
      }
      setMinQuantity(editingProduct.minQuantity || 1);
      if (editingProduct.discountTiers && editingProduct.discountTiers.length > 0) {
        setDiscountTiers(editingProduct.discountTiers);
      }
      if (editingProduct.infoTabs && editingProduct.infoTabs.length > 0) {
        setInfoTabs(editingProduct.infoTabs);
      }
    }
  }, [editingProduct]);

  const STEPS = [
    { num: 1, title: '1. ຂໍ້ມູນທົ່ວໄປ', subtitle: 'General & Upload', icon: FileText },
    { num: 2, title: '2. ເຄື່ອງພິມ & ຕົ້ນທຶນ', subtitle: 'Print Engine', icon: Printer },
    { num: 3, title: '3. ຄັງວັດຖຸດິບ', subtitle: 'Raw Materials', icon: Package },
    { num: 4, title: '4. ງານຕັດ & ຫຼັງພິມ', subtitle: 'Post-Press & Cut', icon: Scissors },
    { num: 5, title: '5. ຕົ້ນທຶນ, ກຳໄລ & ສ່ວນຫຼຸດ', subtitle: 'Cost, Margin & Discounts', icon: Coins },
    { num: 6, title: '6. ພຣີວິວໜ້າເວັບ', subtitle: 'Live Storefront', icon: Eye },
  ];

  const handleValidateStep = (step: number): boolean => {
    if (step === 1) {
      if (!nameLo.trim() && !name.trim()) {
        showToast('ກະລຸນາປ້ອນຊື່ສິນຄ້າ (ພາສາລາວ)', 'error');
        return false;
      }
      if (!nameEn.trim()) {
        showToast('ກະລຸນາປ້ອນຊື່ສິນຄ້າ (English)', 'error');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (!handleValidateStep(currentStep)) return;
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!handleValidateStep(1)) return;

    // Flatten all options from spec groups
    const flattenedOptions = specGroups.flatMap(group => 
      group.options.map(opt => ({
        optionType: opt.optionType || group.groupType || 'material',
        label: opt.label || opt.labelLo || 'Option',
        labelLo: opt.labelLo || opt.label,
        labelEn: opt.labelEn,
        hintLo: opt.hintLo,
        hintEn: opt.hintEn,
        value: opt.value || opt.label,
        materialSku: opt.materialSku,
        paperCode: opt.paperCode,
        machineId: opt.machineId,
        machineName: opt.machineName,
        addPrice: Number(opt.addPrice || 0),
        isDefault: Boolean(opt.isDefault),
        extraCostRate: Number(opt.extraCostRate || 0),
      }))
    );

    const formattedTiers = discountTiers.map(t => ({
      minQuantity: Number(t.minQuantity || 1),
      discountPercentage: Number(t.discountPercentage || 0),
    }));

    const payload: CreateProductInput = {
      nameLo: nameLo.trim() || name.trim(),
      nameEn: nameEn.trim(),
      name: nameLo.trim() || name.trim(),
      slug: slug.trim() || nameEn.toLowerCase().replace(/\s+/g, '-'),
      categoryId: categoryId ? Number(categoryId) : undefined,
      category: category || 'stickers',
      descriptionLo: descriptionLo.trim(),
      descriptionEn: descriptionEn.trim(),
      description: descriptionLo.trim() || description.trim(),
      basePrice: basePrice || 0,
      pricingModel: pricingModel,
      unit: 'ແຜ່ນ',
      minQuantity: Number(minQuantity) || 1,
      leadTimeDays: 2,
      sortOrder: 0,
      thumbnailUrl: thumbnailUrl.trim(),
      galleryUrls: galleryUrls,
      specGroups: specGroups,
      options: flattenedOptions,
      discountTiers: formattedTiers,
      features: featuresList,
      featuresConfig: {
        ...featuresConfig,
        baselineCoveragePercent: baselineCoveragePercent,
      },
      infoTabs: infoTabs,
      bestseller: bestseller,
      isActive: isActive,
      targetMarginPercent: targetMarginPercent,
      defaultMachineId: defaultMachineId,
      defaultMachineName: defaultMachineName,
    };

    await onSave(payload);
  };

  return (
    <div className="space-y-6 animate-fade-in w-full text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-100 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ກັບຄືນ (Back to Products)</span>
        </button>
        <div>
          <span className="text-xs uppercase font-extrabold text-accent-sky tracking-wider font-sans block text-right">
            ຂັ້ນຕອນ {currentStep} ຈາກ 6
          </span>
          <h3 className="text-2xl font-black text-primary-navy mt-0.5">
            {editingProduct ? `ແກ້ໄຂສິນຄ້າ (Edit Product Studio)` : 'ຟອມສ້າງສິນຄ້າໃໝ່ (Create Product Studio)'}
          </h3>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-2 overflow-x-auto">
        {STEPS.map((s) => {
          const isCompleted = currentStep > s.num;
          const isCurrent = currentStep === s.num;

          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num <= currentStep || handleValidateStep(currentStep)) {
                  setCurrentStep(s.num);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={`flex-1 min-w-[130px] text-center py-3 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-accent-sky text-white shadow-md shadow-accent-sky/20'
                  : isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-slate-50 text-slate-400 border border-slate-100 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s.title}
            </button>
          );
        })}
      </div>

      {/* Full Page Main Workspace Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
        {currentStep === 1 && (
          <Step1GeneralInfo
            categories={categories}
            nameLo={nameLo}
            setNameLo={setNameLo}
            nameEn={nameEn}
            setNameEn={setNameEn}
            name={name}
            setName={setName}
            slug={slug}
            setSlug={setSlug}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            category={category}
            setCategory={setCategory}
            descriptionLo={descriptionLo}
            setDescriptionLo={setDescriptionLo}
            descriptionEn={descriptionEn}
            setDescriptionEn={setDescriptionEn}
            description={description}
            setDescription={setDescription}
            basePrice={basePrice}
            setBasePrice={setBasePrice}
            pricingModel={pricingModel}
            setPricingModel={setPricingModel}
            thumbnailUrl={thumbnailUrl}
            setThumbnailUrl={setThumbnailUrl}
            galleryUrls={galleryUrls}
            setGalleryUrls={setGalleryUrls}
            bestseller={bestseller}
            setBestseller={setBestseller}
            isActive={isActive}
            setIsActive={setIsActive}
            featuresConfig={featuresConfig}
            setFeaturesConfig={setFeaturesConfig}
            featuresList={featuresList}
            setFeaturesList={setFeaturesList}
            newFeatureInput={newFeatureInput}
            setNewFeatureInput={setNewFeatureInput}
            showToast={showToast}
          />
        )}

        {currentStep === 2 && (
          <Step2PrintEngine
            defaultMachineId={defaultMachineId}
            setDefaultMachineId={setDefaultMachineId}
            defaultMachineName={defaultMachineName}
            setDefaultMachineName={setDefaultMachineName}
            baselineCoveragePercent={baselineCoveragePercent}
            setBaselineCoveragePercent={setBaselineCoveragePercent}
            targetMarginPercent={targetMarginPercent}
            setTargetMarginPercent={setTargetMarginPercent}
            specGroups={specGroups}
            setSpecGroups={setSpecGroups}
            featuresConfig={featuresConfig}
            setFeaturesConfig={setFeaturesConfig}
            showToast={showToast}
          />
        )}

        {currentStep === 3 && (
          <Step3MaterialInventory
            specGroups={specGroups}
            setSpecGroups={setSpecGroups}
            targetMarginPercent={targetMarginPercent}
            featuresConfig={featuresConfig}
            setFeaturesConfig={setFeaturesConfig}
            showToast={showToast}
          />
        )}

        {currentStep === 4 && (
          <Step4PostPressFinishing
            specGroups={specGroups}
            setSpecGroups={setSpecGroups}
            targetMarginPercent={targetMarginPercent}
            featuresConfig={featuresConfig}
            setFeaturesConfig={setFeaturesConfig}
            showToast={showToast}
          />
        )}

        {currentStep === 5 && (
          <Step5DiscountsAndTabs
            basePrice={basePrice}
            setBasePrice={setBasePrice}
            targetMarginPercent={targetMarginPercent}
            setTargetMarginPercent={setTargetMarginPercent}
            defaultMachineId={defaultMachineId}
            defaultMachineName={defaultMachineName}
            baselineCoveragePercent={baselineCoveragePercent}
            specGroups={specGroups}
            setSpecGroups={setSpecGroups}
            discountTiers={discountTiers}
            setDiscountTiers={setDiscountTiers}
            infoTabs={infoTabs}
            setInfoTabs={setInfoTabs}
            featuresConfig={featuresConfig}
            setFeaturesConfig={setFeaturesConfig}
            minQuantity={minQuantity}
            setMinQuantity={setMinQuantity}
            showToast={showToast}
          />
        )}

        {currentStep === 6 && (
          <Step6CustomerPreview
            nameLo={nameLo}
            nameEn={nameEn}
            category={category}
            descriptionLo={descriptionLo}
            descriptionEn={descriptionEn}
            basePrice={basePrice}
            pricingModel={pricingModel}
            thumbnailUrl={thumbnailUrl}
            galleryUrls={galleryUrls}
            bestseller={bestseller}
            featuresList={featuresList}
            featuresConfig={featuresConfig}
            specGroups={specGroups}
            discountTiers={discountTiers}
            infoTabs={infoTabs}
            targetMarginPercent={targetMarginPercent}
            defaultMachineName={defaultMachineName}
            minQuantity={minQuantity}
            showToast={showToast}
          />
        )}

        {/* Footer Navigation & Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center gap-2 px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ຍ້ອນກັບ (Previous Step)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-3 text-xs font-bold text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              ຍົກເລີກ (Cancel)
            </button>
          )}

          <div className="flex items-center gap-3">
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-2 px-6 py-3 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-md shadow-accent-sky/20 transition active:scale-95 cursor-pointer"
              >
                <span>ຕໍ່ໄປ: {STEPS[currentStep]?.title || 'ຂັ້ນຕອນຕໍ່ໄປ'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-8 py-3 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-lg shadow-accent-sky/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກສິນຄ້າ (Save & Publish)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
