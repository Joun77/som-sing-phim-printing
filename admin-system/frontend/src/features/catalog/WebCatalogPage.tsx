import React, { useState, useRef } from 'react';
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
  RefreshCw,
  FolderCog,
  Link as LinkIcon,
  Calculator,
  BookOpen,
  DollarSign,
  Tag,
  Wand2,
  FileText,
  CreditCard,
  Package,
  Sliders,
  Settings2,
  ChevronDown,
  LayoutGrid,
  ListFilter,
  Image as ImageIcon,
  UploadCloud,
  Star,
  Scissors,
  Printer
} from 'lucide-react';
import { PublicProduct, CreateProductInput, PublicProductOption, ProductDiscountTier, PublicCategory, PricingModel, SpecGroup, FeaturesConfig, ProductInfoTab } from './types';
import { CategoryManagerModal } from './CategoryManagerModal';
import { ProductStudioPage } from './ProductStudioPage';
import { useApp } from '@store/AppContext';
import { fetchMaterials } from '@features/inventory/api/inventoryApi';
import { MaterialMaster } from '@features/inventory/types';
import { calculateMachineFullCost } from '@utils/machineCostCalculator';

const API_BASE = '/api/v1';

const PRICING_MODELS: { id: PricingModel; label: string; desc: string }[] = [
  { id: 'STANDARD_FLAT', label: 'ງານແຜ່ນທົ່ວໄປ (Standard Flat)', desc: 'ສະຕິກເກີ, ນາມບັດ, ໂບຣຊົວ, ໂປສເຕີ (ຄິດລາຄາ Base + Add-on)' },
  { id: 'BOOK_MULTIPART', label: 'ງານປຶ້ມ / ເຂົ້າເລັ້ມ (Book / Multi-Part)', desc: 'ປົກ + ເນື້ອໃນ + ຈຳນວນໜ້າ + ເຂົ້າເລັ້ມ + ຄິດໄລ່ສັນປົກ' },
  { id: 'SQM_CUSTOM', label: 'ຄິດລາຄາຕາມຂະໜາດ / ຕາລາງແມັດ (SQM / Dimension)', desc: 'ປ້າຍໄວນິລ, ສະຕິກເກີມ້ວນ ຕາມ ກວ້າງ x ຍາວ' },
  { id: 'FIXED_UNIT', label: 'ລາຄາຄົງທີ່ຕໍ່ຊິ້ນ / ບໍລິການ (Fixed Unit / Service)', desc: 'ກັອບປີ້ເອກະສານ, ບໍລິການແປງໄຟລ໌, ຕາຢາງ' },
];

const DEFAULT_INFO_TABS: ProductInfoTab[] = [
  {
    id: 'materials',
    titleLo: 'ຄູ່ມືວັດສະດຸ & ປະເພດເຈ້ຍ',
    titleEn: 'Materials & Paper Guide',
    icon: '',
    contentLo: '• Art Card 260g - 350g: ເຈ້ຍເນື້ອແໜ້ນ ຜິວລຽບ ເໝາະສຳລັບໂປສເຕີ, ນາມບັດ, ປົກປຶ້ມ\n• Greenread 75g: ເຈ້ຍຖະໜອມສາຍຕາ ນ້ຳໜັກເບົາ\n• Sticker PP / PVC: ກັນນ້ຳ 100% ຕິດແໜ້ນ ທົນທານ',
    contentEn: 'Premium grade paper and synthetic materials for professional printing.',
  },
  {
    id: 'bleed',
    titleLo: 'ໄລຍະຕັດຕົກ & ມາດຕະຖານຟາຍ',
    titleEn: 'Bleed & File Specs',
    icon: '',
    contentLo: '• ເຜື່ອໄລຍະຕັດຕົກ (Bleed) +3mm ຮອບດ້ານ\n• ຄວາມລະອຽດແນະນຳ 300 DPI ຂຶ້ນໄປ\n• ໂໝດສີແນະນຳ CMYK Process Color',
    contentEn: 'Add +3mm bleed margin. Resolution at 300 DPI minimum. CMYK color profile recommended.',
  },
  {
    id: 'shipping',
    titleLo: 'ໄລຍະເວລາຜະລິດ & ການຈັດສົ່ງ',
    titleEn: 'Production & Delivery',
    icon: '',
    contentLo: '• ໄລຍະເວລາຜະລິດ: 1 - 2 ວັນລັດຖະການ\n• ຈັດສົ່ງທົ່ວປະເທດລາວຜ່ານ Anousith, HAL, Express\n• ນະຄອນຫຼວງວຽງຈັນ ສົ່ງດ່ວນເຖິງທີ່ພາຍໃນມື້',
    contentEn: 'Production time: 1-2 business days. Nationwide express shipping.',
  },
];

export function WebCatalogPage() {
  const { showToast, askConfirmation } = useApp();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterActiveStatus, setFilterActiveStatus] = useState<'all' | 'active' | 'hidden' | 'bestseller'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'general' | 'groups' | 'discounts' | 'infotabs'>('general');
  const [editingProduct, setEditingProduct] = useState<PublicProduct | null>(null);

  // Form State (Bilingual + Pricing Model)
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [nameLo, setNameLo] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('stickers');
  const [descriptionLo, setDescriptionLo] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [description, setDescription] = useState('');
  const [pricingModel, setPricingModel] = useState<PricingModel>('STANDARD_FLAT');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [unit, setUnit] = useState('ຊິ້ນ');
  const [bestseller, setBestseller] = useState(false);
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [infoTabs, setInfoTabs] = useState<ProductInfoTab[]>(DEFAULT_INFO_TABS);
  const [minQuantity, setMinQuantity] = useState(1);
  const [isOnDemand, setIsOnDemand] = useState(true);
  const [leadTimeDays, setLeadTimeDays] = useState(2);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  // Dynamic Features Config
  const [featuresConfig, setFeaturesConfig] = useState<FeaturesConfig>({
    hasCoverUpload: false,
    hasInnerUpload: false,
    hasSpineCalc: false,
    hasPreflightCheck: true,
    hasCustomDim: false,
  });

  // Dynamic Spec Groups
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);

  // Flat options for backward compatibility
  const [flatOptions, setFlatOptions] = useState<PublicProductOption[]>([]);

  const [discountTiers, setDiscountTiers] = useState<Array<{
    minQuantity: number;
    discountPercentage: number;
  }>>([]);

  // Product Level Dynamic Profit Margin (%)
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(35);

  const { inventory, equipment, printerColorLinks = [] } = useApp();

  // Dynamic machines pulled directly from actual Shop Equipment database with True Linked Inks & Depreciation
  const shopMachines = React.useMemo(() => {
    if (equipment && equipment.length > 0) {
      return equipment.map((eq: any) => {
        const costData = calculateMachineFullCost({
          equipment: eq,
          printerColorLinks,
          inventory,
          coveragePercent: 5,
        });

        const linkedInkNames = costData.linkedInks.map(i => `${i.slotName}: ${i.inkName}`);

        return {
          id: costData.id || eq.serialNumber || `MACH-${costData.name}`,
          name: costData.name,
          type: costData.type,
          clickRate: costData.totalColorCost > 0 ? costData.totalColorCost : 300,
          colorCostPerPage: costData.totalColorCost,
          bwCostPerPage: costData.totalBwCost,
          deprPerPage: costData.deprPerPage,
          inkCostColor: costData.colorInkCost,
          inkCostBw: costData.bwInkCost,
          linkedInksCount: costData.linkedInks.filter(i => i.isLinked).length,
          linkedInksSummary: linkedInkNames.length > 0 ? linkedInkNames.join(', ') : 'ໝຶກມາດຕະຖານ OEM',
          desc: `${costData.brand} ${costData.model} • ຫ້ອງ: ${costData.location}`,
          category: eq.category || 'Printer',
        };
      });
    }
    return [
      {
        id: 'PRN-FUJI-V180',
        name: 'Fuji Xerox Versant 180 Press',
        type: 'Digital Color Press',
        clickRate: 780,
        colorCostPerPage: 780,
        bwCostPerPage: 420,
        deprPerPage: 300,
        inkCostColor: 480,
        inkCostBw: 120,
        linkedInksCount: 4,
        linkedInksSummary: 'C, M, Y, K (Versant Inks)',
        desc: 'Fuji Xerox Versant 180 • Main Press Floor (Room A)',
        category: 'Printer'
      },
      {
        id: 'PRN-EPSON-L1800',
        name: 'Epson L1800 6-Color Photo',
        type: 'Inkjet Photo',
        clickRate: 240,
        colorCostPerPage: 240,
        bwCostPerPage: 130,
        deprPerPage: 93,
        inkCostColor: 147,
        inkCostBw: 37,
        linkedInksCount: 6,
        linkedInksSummary: '6-Color T673 Photo Inks',
        desc: 'Epson L1800 • Digital Finishing Room',
        category: 'Printer'
      }
    ];
  }, [equipment, printerColorLinks, inventory]);

  // Default Standard Production Machine for Quotation & Costing Baseline
  const [defaultMachineId, setDefaultMachineId] = useState<string>('PRN-FUJI-V180');
  const [defaultMachineName, setDefaultMachineName] = useState<string>('Fuji Xerox Versant 180 Press');

  // Fetch Inventory Materials from Backend
  const { data: backendMaterials = [] } = useQuery<MaterialMaster[]>({
    queryKey: ['materials'],
    queryFn: fetchMaterials,
  });

  // Unified materials merging Backend DB + AppContext Warehouse Inventory
  const materials: MaterialMaster[] = React.useMemo(() => {
    const map = new Map<string, MaterialMaster>();

    // 1. Load from AppContext warehouse inventory
    (inventory || []).forEach((inv: any) => {
      const sku = inv.sku || inv.id || '';
      if (sku) {
        map.set(sku, {
          id: inv.id || sku,
          sku: sku,
          name: inv.name || sku,
          category: inv.category || 'Paper',
          stock_qty: Number(inv.stockQty) || 0,
          consumption_unit: inv.consumptionUnit || 'ແຜ່ນ',
          cost_per_consumption_unit: Number(inv.costPerConsumptionUnit) || 0,
          stock_status: (inv.stockQty || 0) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
          is_active: true,
        } as MaterialMaster);
      }
    });

    // 2. Load from Backend DB (overrides with live DB records)
    (backendMaterials || []).forEach((mat: any) => {
      const sku = mat.sku || mat.id || '';
      if (sku) {
        map.set(sku, {
          id: mat.id || sku,
          sku: sku,
          name: mat.name || sku,
          category: mat.category || 'Paper',
          stock_qty: Number(mat.stock_qty ?? mat.stockQty) || 0,
          consumption_unit: mat.consumption_unit ?? mat.consumptionUnit ?? 'ແຜ່ນ',
          cost_per_consumption_unit: Number(mat.cost_per_consumption_unit ?? mat.costPerConsumptionUnit) || 0,
          stock_status: (mat.stock_qty || mat.stockQty || 0) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
          is_active: mat.is_active !== false,
        } as MaterialMaster);
      }
    });

    return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category) || a.sku.localeCompare(b.sku));
  }, [backendMaterials, inventory]);

  // Group materials for categorised dropdowns
  const categorizedMaterials = React.useMemo(() => {
    const groups: { [key: string]: MaterialMaster[] } = {
      Paper: [],
      Sticker: [],
      Finishing: [],
      Binding: [],
      Ink: [],
      Other: [],
    };

    materials.forEach((m) => {
      const cat = (m.category || '').toLowerCase();
      if (cat.includes('paper') || cat.includes('card') || cat.includes('sheet') || cat.includes('board')) {
        groups.Paper.push(m);
      } else if (cat.includes('sticker') || cat.includes('pp') || cat.includes('pvc') || cat.includes('label')) {
        groups.Sticker.push(m);
      } else if (cat.includes('film') || cat.includes('lamination') || cat.includes('finish') || cat.includes('foil')) {
        groups.Finishing.push(m);
      } else if (cat.includes('bind') || cat.includes('ring') || cat.includes('spine') || cat.includes('wire') || cat.includes('hardware') || cat.includes('glue')) {
        groups.Binding.push(m);
      } else if (cat.includes('ink') || cat.includes('toner')) {
        groups.Ink.push(m);
      } else {
        groups.Other.push(m);
      }
    });

    return groups;
  }, [materials]);

  // Material Picker Search Modal State
  const [materialPickerTarget, setMaterialPickerTarget] = useState<{
    isOpen: boolean;
    groupIdx: number;
    optIdx: number;
    search: string;
    categoryTab: string;
  }>({
    isOpen: false,
    groupIdx: -1,
    optIdx: -1,
    search: '',
    categoryTab: 'ALL',
  });

  // Fetch Categories
  const { data: categories = [] } = useQuery<PublicCategory[]>({
    queryKey: ['admin-catalog-categories'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admin/catalog/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      return json.data || [];
    },
  });

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
      showToast(`ເກີດຂໍ້ຜິດພາດ: ${err.message}`, 'error');
    },
  });

  // Create / Update Product Mutation
  const saveProductMutation = useMutation({
    mutationFn: async (payload: CreateProductInput & { id?: number }) => {
      const url = payload.id 
        ? `${API_BASE}/admin/catalog/products/${payload.id}`
        : `${API_BASE}/admin/catalog/products`;
      const method = payload.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save product');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog-products'] });
      showToast(editingProduct ? 'ອັບເດດສິນຄ້າສຳເລັດ' : 'ສ້າງສິນຄ້າໃໝ່ສຳເລັດ', 'success');
      handleCloseModal();
    },
    onError: (err: any) => {
      showToast(`ເກີດຂໍ້ຜິດພາດ: ${err.message}`, 'error');
    },
  });

  // Image Upload Refs & State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [customGalleryUrl, setCustomGalleryUrl] = useState('');

  const handleUploadFiles = async (files: FileList | File[], target: 'cover' | 'gallery') => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    setUploadProgress(`ກຳລັງອັບໂຫຼດ ${files.length} ຮູບພາບ...`);

    const uploadedUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch(`${API_BASE}/admin/catalog/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Upload failed for ${file.name}`);
        }

        const json = await res.json();
        if (json.data?.url) {
          uploadedUrls.push(json.data.url);
        }
      }

      if (target === 'cover') {
        if (uploadedUrls.length > 0) {
          setThumbnailUrl(uploadedUrls[0]);
          if (uploadedUrls.length > 1) {
            setGalleryUrls((prev) => [...prev, ...uploadedUrls.slice(1)]);
          }
          showToast(`ອັບໂຫຼດຮູບໜ້າປົກສຳເລັດ ${uploadedUrls.length > 1 ? `(+${uploadedUrls.length - 1} ຮູບໃນແກເລີຣີ)` : ''}`, 'success');
        }
      } else {
        setGalleryUrls((prev) => [...prev, ...uploadedUrls]);
        showToast(`ເພີ່ມ ${uploadedUrls.length} ຮູບເຂົ້າແກເລີຣີສຳເລັດ`, 'success');
      }
    } catch (err: any) {
      showToast(`ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດ: ${err.message}`, 'error');
    } finally {
      setIsUploadingImage(false);
      setUploadProgress('');
    }
  };

  // Preset Loaders
  const loadBookPreset = () => {
    setPricingModel('BOOK_MULTIPART');
    setUnit('ເຫຼັ້ມ');
    setFeaturesConfig({
      hasCoverUpload: true,
      hasInnerUpload: true,
      hasSpineCalc: true,
      hasPreflightCheck: true,
      hasCustomDim: false,
    });
    setSpecGroups([
      {
        id: 'group_size',
        titleLo: 'ຂະໜາດຮູບເລັ້ມ (Book Size)',
        titleEn: 'Book Size',
        displayType: 'cards',
        groupType: 'size',
        options: [
          { optionType: 'size', label: 'A4 (210×297 mm)', labelLo: 'A4 (210×297 mm)', labelEn: 'A4 Size', value: 'a4', isDefault: true, extraCostRate: 0, addPrice: 0 },
          { optionType: 'size', label: 'A5 (148×210 mm)', labelLo: 'A5 (148×210 mm)', labelEn: 'A5 Size', value: 'a5', isDefault: false, extraCostRate: 0, addPrice: 0 },
          { optionType: 'size', label: 'B5 (176×250 mm)', labelLo: 'B5 (176×250 mm)', labelEn: 'B5 Size', value: 'b5', isDefault: false, extraCostRate: 0, addPrice: 0 },
        ]
      },
      {
        id: 'group_cover_paper',
        titleLo: 'ກະດາດປົກ (Cover Paper Stock)',
        titleEn: 'Cover Paper Stock',
        displayType: 'cards',
        groupType: 'cover_paper',
        options: [
          { optionType: 'material', label: 'ອາດກາດ 260g (ມາດຕະຖານ)', labelLo: 'ອາດກາດ 260g (ມາດຕະຖານ)', labelEn: '260gsm Art Card', value: 'artcard_260', materialSku: 'MAT-ART-260', isDefault: true, extraCostRate: 0, addPrice: 0 },
          { optionType: 'material', label: 'ອາດກາດ 300g (ໜາພິເສດ)', labelLo: 'ອາດກາດ 300g (ໜາພິເສດ)', labelEn: '300gsm Art Card', value: 'artcard_300', materialSku: 'MAT-ART-300', isDefault: false, extraCostRate: 0, addPrice: 5000 },
          { optionType: 'material', label: 'ອາດກາດ 350g (ໜາແໜ້ນ)', labelLo: 'ອາດກາດ 350g (ໜາແໜ້ນ)', labelEn: '350gsm Art Card', value: 'artcard_350', materialSku: 'MAT-ART-350', isDefault: false, extraCostRate: 0, addPrice: 10000 },
        ]
      },
      {
        id: 'group_cover_lam',
        titleLo: 'ການເຄືອບປົກ (Cover Lamination)',
        titleEn: 'Cover Lamination',
        displayType: 'cards',
        groupType: 'cover_lamination',
        options: [
          { optionType: 'finishing', label: 'ເຄືອບດ້ານ Soft-Touch', labelLo: 'ເຄືອບດ້ານ Soft-Touch', labelEn: 'Soft-Touch Matte', value: 'matte_lam', isDefault: true, extraCostRate: 0, addPrice: 5000 },
          { optionType: 'finishing', label: 'ເຄືອບເງົາ Glossy', labelLo: 'ເຄືອບເງົາ Glossy', labelEn: 'Glossy Lamination', value: 'gloss_lam', isDefault: false, extraCostRate: 0, addPrice: 5000 },
          { optionType: 'finishing', label: 'ເຄືອບດ້ານ + Spot UV ປົກ', labelLo: 'ເຄືອບດ້ານ + Spot UV ປົກ', labelEn: 'Matte + Spot UV', value: 'spot_uv', isDefault: false, extraCostRate: 0, addPrice: 15000 },
          { optionType: 'finishing', label: 'ບໍ່ເຄືອບ', labelLo: 'ບໍ່ເຄືອບ', labelEn: 'No Coating', value: 'no_lam', isDefault: false, extraCostRate: 0, addPrice: 0 },
        ]
      },
      {
        id: 'group_inner_paper',
        titleLo: 'ກະດາດເນື້ອໃນ (Inner Pages Paper)',
        titleEn: 'Inner Pages Paper',
        displayType: 'dropdown',
        groupType: 'inner_paper',
        options: [
          { optionType: 'material', label: 'ເຈ້ຍປອນ 80g (Woodfree Bond)', labelLo: 'ເຈ້ຍປອນ 80g (ຂາວສະອາດ)', labelEn: '80gsm Woodfree Bond', value: 'bond_80', materialSku: 'MAT-BOND-80', isDefault: true, extraCostRate: 0, addPrice: 300 },
          { optionType: 'material', label: 'ເຈ້ຍຖະໜອມສາຍຕາ 75g (Green Read)', labelLo: 'ເຈ້ຍຖະໜອມສາຍຕາ 75g', labelEn: '75gsm Green Read', value: 'green_75', materialSku: 'MAT-GREEN-75', isDefault: false, extraCostRate: 0, addPrice: 350 },
          { optionType: 'material', label: 'ອາດມັນ 100g (Art Paper)', labelLo: 'ອາດມັນ 100g (ສີສົດໃສ)', labelEn: '100gsm Art Paper', value: 'art_100', materialSku: 'MAT-ART-100', isDefault: false, extraCostRate: 0, addPrice: 400 },
          { optionType: 'material', label: 'ອາດດ້ານ 130g (Premium Matte)', labelLo: 'ອາດດ້ານ 130g (ພຣີມ້ຽມ)', labelEn: '130gsm Matte Art', value: 'matte_130', materialSku: 'MAT-MATTE-130', isDefault: false, extraCostRate: 0, addPrice: 500 },
        ]
      },
      {
        id: 'group_binding',
        titleLo: 'ວິທີເຂົ້າເລັ້ມ (Binding Method)',
        titleEn: 'Binding Method',
        displayType: 'cards',
        groupType: 'binding',
        options: [
          { optionType: 'binding', label: 'ເຂົ້າເລັ້ມສັນກາວຮ້ອນ (Perfect Glue)', labelLo: 'ເຂົ້າເລັ້ມສັນກາວຮ້ອນ', labelEn: 'Perfect Glue Binding', value: 'perfect_glue', isDefault: true, extraCostRate: 0, addPrice: 10000 },
          { optionType: 'binding', label: 'ສັນຫ່ວງກະດູກງູ (Wire-O Binding)', labelLo: 'ສັນຫ່ວງກະດູກງູ', labelEn: 'Wire-O Binding', value: 'wire_o', isDefault: false, extraCostRate: 0, addPrice: 12000 },
          { optionType: 'binding', label: 'ເຢັບມຸມມາດຕະຖານ (Saddle Stitch)', labelLo: 'ເຢັບມຸມມາດຕະຖານ', labelEn: 'Saddle Stitch', value: 'saddle_stitch', isDefault: false, extraCostRate: 0, addPrice: 2000 },
        ]
      }
    ]);
    showToast('ໂຫຼດເທມເພລດງານປຶ້ມ & ເຂົ້າເລັ້ມສຳເລັດ', 'info');
  };

  const loadStickerPreset = () => {
    setPricingModel('STANDARD_FLAT');
    setUnit('ແຜ່ນ A3+');
    setFeaturesConfig({
      hasCoverUpload: false,
      hasInnerUpload: false,
      hasSpineCalc: false,
      hasPreflightCheck: true,
      hasCustomDim: false,
    });
    setSpecGroups([
      {
        id: 'group_sticker_mat',
        titleLo: 'ເນື້ອສະຕິກເກີ (Sticker Material)',
        titleEn: 'Sticker Material',
        displayType: 'cards',
        groupType: 'cover_paper',
        options: [
          { optionType: 'material', label: 'PP ຂາວເງົາກັນນ້ຳ 100%', labelLo: 'PP ຂາວເງົາກັນນ້ຳ 100%', labelEn: 'Glossy White PP (Waterproof)', value: 'pp_gloss', materialSku: 'MAT-PP-GLOSS', isDefault: true, extraCostRate: 0, addPrice: 0 },
          { optionType: 'material', label: 'PP ຂາວດ້ານກັນນ້ຳ 100%', labelLo: 'PP ຂາວດ້ານກັນນ້ຳ 100%', labelEn: 'Matte White PP (Waterproof)', value: 'pp_matte', materialSku: 'MAT-PP-MATTE', isDefault: false, extraCostRate: 0, addPrice: 2000 },
          { optionType: 'material', label: 'PP ໃສກັນນ້ຳ 100%', labelLo: 'PP ໃສກັນນ້ຳ 100%', labelEn: 'Clear Transparent PP', value: 'pp_clear', materialSku: 'MAT-PP-CLEAR', isDefault: false, extraCostRate: 0, addPrice: 4000 },
          { optionType: 'material', label: 'ສະຕິກເກີຄຣາຟ Vintage', labelLo: 'ສະຕິກເກີຄຣາຟ Vintage', labelEn: 'Kraft Paper Sticker', value: 'kraft_sticker', materialSku: 'MAT-KRAFT-STK', isDefault: false, extraCostRate: 0, addPrice: 1000 },
        ]
      },
      {
        id: 'group_cutting',
        titleLo: 'ການຕັດ / ໄດຄັດ (Cutting & Die-cut)',
        titleEn: 'Cutting & Die-cut',
        displayType: 'cards',
        groupType: 'cutting',
        options: [
          { optionType: 'cutting', label: 'ໄດຄັດ 50% ເຄິ່ງສຳເລັດ (Kiss Cut)', labelLo: 'ໄດຄັດ 50% ເຄິ່ງສຳເລັດ (Kiss Cut)', labelEn: 'Kiss Cut Sheet', value: 'kiss_cut', isDefault: true, extraCostRate: 0, addPrice: 0 },
          { optionType: 'cutting', label: 'ໄດຄັດ 100% ແຍກຊິ້ນ (Die Cut Single)', labelLo: 'ໄດຄັດ 100% ແຍກຊິ້ນ (Die Cut Single)', labelEn: 'Die Cut Individual', value: 'die_cut_single', isDefault: false, extraCostRate: 0, addPrice: 3000 },
        ]
      }
    ]);
    showToast('ໂຫຼດເທມເພລດສະຕິກເກີ & ສະຫຼາກສິນຄ້າສຳເລັດ', 'info');
  };

  const loadCardPreset = () => {
    setPricingModel('STANDARD_FLAT');
    setUnit('ກ່ອງ (100 ໃບ)');
    setFeaturesConfig({
      hasCoverUpload: false,
      hasInnerUpload: false,
      hasSpineCalc: false,
      hasPreflightCheck: true,
      hasCustomDim: false,
    });
    setTargetMarginPercent(35);
    setSpecGroups([
      {
        id: 'group_card_stock',
        titleLo: 'ເນື້ອກະດາດນາມບັດ (Card Stock)',
        titleEn: 'Card Stock',
        displayType: 'cards',
        groupType: 'cover_paper',
        options: [
          { optionType: 'material', label: 'ອາດກາດ 350g ພຣີມ້ຽມ', labelLo: 'ອາດກາດ 350g ພຣີມ້ຽມ', labelEn: '350gsm Art Card', value: 'artcard_350', materialSku: 'MAT-ART-350', isDefault: true, extraCostRate: 0, addPrice: 0 },
          { optionType: 'material', label: 'ກະດາດຄຣາຟ 300g Eco', labelLo: 'ກະດາດຄຣາຟ 300g Eco', labelEn: '300gsm Kraft Card', value: 'kraft_300', materialSku: 'MAT-KRAFT-300', isDefault: false, extraCostRate: 0, addPrice: 5000 },
          { optionType: 'material', label: 'ບັດ PVC Waterproof', labelLo: 'ບັດ PVC Waterproof', labelEn: 'PVC Plastic Card', value: 'pvc_card', materialSku: 'MAT-PVC-CARD', isDefault: false, extraCostRate: 0, addPrice: 25000 },
        ]
      },
      {
        id: 'group_card_lam',
        titleLo: 'ການເຄືອບ & ປ້ຳຟອຍ (Finishing & Foil)',
        titleEn: 'Finishing & Foil',
        displayType: 'cards',
        groupType: 'cover_lamination',
        options: [
          { optionType: 'finishing', label: 'ເຄືອບດ້ານ Soft-Touch', labelLo: 'ເຄືອບດ້ານ Soft-Touch', labelEn: 'Soft-Touch Matte', value: 'matte_lam', isDefault: true, extraCostRate: 0, addPrice: 0 },
          { optionType: 'finishing', label: 'ປ້ຳຟອຍຄຳ Metallic Gold', labelLo: 'ປ້ຳຟອຍຄຳ Metallic Gold', labelEn: 'Gold Foil Stamping', value: 'gold_foil', isDefault: false, extraCostRate: 0, addPrice: 20000 },
          { optionType: 'finishing', label: 'ຕັດມຸມມົນ (Rounded Corners)', labelLo: 'ຕັດມຸມມົນ', labelEn: 'Rounded Corners', value: 'round_corner', isDefault: false, extraCostRate: 0, addPrice: 5000 },
        ]
      }
    ]);
    showToast('ໂຫຼດເທມເພລດນາມບັດພຣີມ້ຽມສຳເລັດ', 'info');
  };

  const loadColorProcessPreset = () => {
    const colorGroup: SpecGroup = {
      id: `group_color_${Date.now() % 10000}`,
      titleLo: 'ໂໝດສີພິມ (Color Mode)',
      titleEn: 'Color Mode',
      displayType: 'cards',
      groupType: 'process',
      options: [
        { optionType: 'process', label: 'ພິມ 4 ສີ (Full Color CMYK)', labelLo: 'ພິມ 4 ສີ (Full Color CMYK)', labelEn: 'Full Color (CMYK)', value: 'cmyk', isDefault: true, extraCostRate: 0, addPrice: 0 },
        { optionType: 'process', label: 'ພິມຂາວ-ດຳ (Black & White)', labelLo: 'ພິມຂາວ-ດຳ (Black & White)', labelEn: 'Black & White (Grayscale)', value: 'grayscale', isDefault: false, extraCostRate: 0, addPrice: 0 },
      ]
    };
    setSpecGroups(prev => [...prev, colorGroup]);
    showToast('ເພີ່ມກຸ່ມໂໝດສີ (ພິມສີ / ຂາວດຳ) ສຳເລັດ', 'success');
  };

  const loadFinishingPreset = () => {
    const finishingGroup: SpecGroup = {
      id: `group_finishing_${Date.now() % 10000}`,
      titleLo: 'ງານຕັດ & ເຂົ້າເລັ້ມ / ຫຼັງພິມ (Post-Press Finishing)',
      titleEn: 'Post-Press & Finishing',
      displayType: 'cards',
      groupType: 'process',
      options: [
        { 
          optionType: 'process', 
          machineId: 'MAC-CUTTER-920',
          machineName: 'QZYK920 Hydraulic Paper Guillotine',
          label: 'ຕັດຊື່ມາດຕະຖານ (Guillotine Straight Cut)', 
          labelLo: 'ຕັດຊື່ມາດຕະຖານ (Straight Cut)', 
          labelEn: 'Standard Straight Cut', 
          value: 'straight_cut', 
          isDefault: true, 
          addPrice: 0 
        },
        { 
          optionType: 'process', 
          label: 'ຕັດໄດຄັດຕາມຮູບຊົງ (Kiss Cut / Die-cut)', 
          labelLo: 'ຕັດໄດຄັດຕາມຮູບຊົງ (Die-cut Shape)', 
          labelEn: 'Custom Shape Die-cut', 
          value: 'die_cut', 
          isDefault: false, 
          addPrice: 500 
        },
        { 
          optionType: 'process', 
          machineId: 'MAC-BIND-WD50',
          machineName: 'WD-50A Perfect Glue Thermal Binder',
          label: 'ເຂົ້າເລັ້ມສັນກາວ / ເຈາະສັນຫ່ວງ (Binding / Punching)', 
          labelLo: 'ເຂົ້າເລັ້ມສັນກາວ / ເຈາະສັນຫ່ວງ', 
          labelEn: 'Binding & Punching', 
          value: 'binding_punch', 
          isDefault: false, 
          addPrice: 2000 
        },
        { 
          optionType: 'process', 
          machineId: 'MAC-LAM-FM360',
          machineName: 'FM-360 Roll Laminator Hot & Cold',
          label: 'ເຄືອບຟິล์ມກັນຮອຍ ເງົາ/ດ້ານ (Lamination)', 
          labelLo: 'ເຄືອບຟິล์ມກັນຮອຍ (Lamination)', 
          labelEn: 'Film Lamination', 
          value: 'lamination', 
          isDefault: false, 
          addPrice: 1000 
        },
      ]
    };
    setSpecGroups(prev => [...prev, finishingGroup]);
    showToast('ເພີ່ມກຸ່ມງານຕັດ & ຫຼັງພິມ (Finishing) ສຳເລັດ', 'success');
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setCategoryId(categories.length > 0 ? categories[0].id : undefined);
    setNameLo('');
    setNameEn('');
    setName('');
    setSlug('');
    setCategory(categories.length > 0 ? categories[0].slug : 'stickers');
    setDescriptionLo('');
    setDescriptionEn('');
    setDescription('');
    setPricingModel('STANDARD_FLAT');
    setBasePrice(0);
    setUnit('ຊິ້ນ');
    setBestseller(false);
    setFeatures([]);
    setFeatureInput('');
    setThumbnailUrl('');
    setGalleryUrls([]);
    setMinQuantity(1);
    setIsOnDemand(true);
    setLeadTimeDays(2);
    setIsActive(true);
    setSortOrder(products.length + 1);
    setFeaturesConfig({
      hasCoverUpload: false,
      hasInnerUpload: false,
      hasSpineCalc: false,
      hasPreflightCheck: true,
      hasCustomDim: false,
    });
    setTargetMarginPercent(35);
    setDefaultMachineId('MACH-FUJI-REVORIA');
    setDefaultMachineName('Fuji Revoria Press PC1120');
    setSpecGroups([]);
    setDiscountTiers([]);
    setInfoTabs(DEFAULT_INFO_TABS);
    setActiveFormTab('general');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: PublicProduct) => {
    setEditingProduct(p);
    setCategoryId(p.categoryId);
    setNameLo(p.nameLo || p.name);
    setNameEn(p.nameEn || '');
    setName(p.name);
    setSlug(p.slug);
    setCategory(p.category);
    setDescriptionLo(p.descriptionLo || p.description);
    setDescriptionEn(p.descriptionEn || '');
    setDescription(p.description);
    setPricingModel(p.pricingModel || 'STANDARD_FLAT');
    setBasePrice(p.basePrice || 0);
    setUnit(p.unit || 'ຊິ້ນ');
    setBestseller(p.bestseller || false);
    setFeatures(p.features || []);
    setThumbnailUrl(p.thumbnailUrl || '');
    setGalleryUrls(p.galleryUrls || []);
    setInfoTabs(p.infoTabs && p.infoTabs.length > 0 ? p.infoTabs : DEFAULT_INFO_TABS);
    setMinQuantity(p.minQuantity || 1);
    setIsOnDemand(p.isOnDemand || false);
    setLeadTimeDays(p.leadTimeDays || 2);
    setIsActive(p.isActive);
    setSortOrder(p.sortOrder || 0);
    setTargetMarginPercent((p as any).targetMarginPercent ?? 35);
    setDefaultMachineId(p.defaultMachineId || 'MACH-FUJI-REVORIA');
    setDefaultMachineName(p.defaultMachineName || 'Fuji Revoria Press PC1120');
    setFeaturesConfig(p.featuresConfig || {
      hasCoverUpload: p.pricingModel === 'BOOK_MULTIPART',
      hasInnerUpload: p.pricingModel === 'BOOK_MULTIPART',
      hasSpineCalc: p.pricingModel === 'BOOK_MULTIPART',
      hasPreflightCheck: true,
      hasCustomDim: p.pricingModel === 'SQM_CUSTOM',
    });

    if (p.specGroups && p.specGroups.length > 0) {
      setSpecGroups(p.specGroups);
    } else if (p.options && p.options.length > 0) {
      setSpecGroups([
        {
          id: 'group_general',
          titleLo: 'ຕົວເລືອກສະເປັກທົ່ວໄປ',
          titleEn: 'General Options',
          displayType: 'cards',
          groupType: 'custom',
          options: p.options,
        }
      ]);
    } else {
      setSpecGroups([]);
    }

    setDiscountTiers((p.discountTiers || []).map(t => ({
      minQuantity: t.minQuantity,
      discountPercentage: t.discountPercentage,
    })));

    setActiveFormTab('general');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleAddFeature = () => {
    if (featureInput.trim() && !features.includes(featureInput.trim())) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  // Spec Group Management
  const handleAddSpecGroup = () => {
    const newGroup: SpecGroup = {
      id: `group_${Date.now() % 10000}`,
      titleLo: 'ກຸ່ມສະເປັກໃໝ່ (New Group)',
      titleEn: 'New Spec Group',
      displayType: 'cards',
      groupType: 'custom',
      options: [
        {
          optionType: 'material',
          label: 'Option 1',
          labelLo: 'ຕົວເລືອກ 1',
          labelEn: 'Option 1',
          value: `opt_${Date.now() % 1000}`,
          isDefault: true,
          extraCostRate: 0,
          addPrice: 0,
        }
      ]
    };
    setSpecGroups([...specGroups, newGroup]);
  };

  const handleRemoveSpecGroup = (groupIdx: number) => {
    setSpecGroups(specGroups.filter((_, idx) => idx !== groupIdx));
  };

  const handleGroupFieldChange = (groupIdx: number, field: string, val: any) => {
    const next = [...specGroups];
    (next[groupIdx] as any)[field] = val;
    setSpecGroups(next);
  };

  const handleAddOptionToGroup = (groupIdx: number) => {
    const next = [...specGroups];
    next[groupIdx].options.push({
      optionType: next[groupIdx].groupType === 'cover_paper' || next[groupIdx].groupType === 'inner_paper' ? 'material' : 'finishing',
      label: 'Option Item',
      labelLo: 'ຕົວເລືອກໃໝ່',
      labelEn: 'New Option',
      value: `opt_${Date.now() % 10000}`,
      isDefault: false,
      extraCostRate: 0,
      addPrice: 0,
    });
    setSpecGroups(next);
  };

  const handleRemoveOptionFromGroup = (groupIdx: number, optIdx: number) => {
    const next = [...specGroups];
    next[groupIdx].options = next[groupIdx].options.filter((_, idx) => idx !== optIdx);
    setSpecGroups(next);
  };

  const handleGroupOptionChange = (groupIdx: number, optIdx: number, field: string, val: any) => {
    const next = [...specGroups];
    (next[groupIdx].options[optIdx] as any)[field] = val;
    if (field === 'labelLo' && !next[groupIdx].options[optIdx].label) {
      next[groupIdx].options[optIdx].label = val;
    }
    setSpecGroups(next);
  };

  // Connect SKU from inventory materials and auto compute recommended price
  const handleSelectMaterialForOption = (groupIdx: number, optIdx: number, matSku: string) => {
    const next = [...specGroups];
    const targetOpt = next[groupIdx].options[optIdx];
    const mat = materials.find(m => m.sku === matSku);

    if (mat) {
      targetOpt.materialSku = mat.sku;
      (targetOpt as any).materialId = mat.id;
      (targetOpt as any).costPerUnit = mat.cost_per_consumption_unit || 0;
      (targetOpt as any).stockQty = mat.stock_qty || 0;

      if (!targetOpt.labelLo || targetOpt.labelLo === 'ຕົວເລືອກໃໝ່' || targetOpt.labelLo === 'Option Item') {
        targetOpt.labelLo = mat.name;
        targetOpt.label = mat.name;
      }

      // Auto-calculate recommended addition price if it's not the default base and not custom price
      if (!targetOpt.isDefault && !(targetOpt as any).isCustomPrice) {
        const cost = mat.cost_per_consumption_unit || 0;
        const marginMultiplier = 1 - (targetMarginPercent / 100);
        if (marginMultiplier > 0.05 && cost > 0) {
          targetOpt.addPrice = Math.round((cost / marginMultiplier) / 100) * 100;
        }
      }
    } else {
      targetOpt.materialSku = matSku;
      (targetOpt as any).materialId = undefined;
      (targetOpt as any).costPerUnit = 0;
      (targetOpt as any).stockQty = 0;
    }
    setSpecGroups(next);
  };

  const handleSelectMachineForOption = (groupIdx: number, optIdx: number, machineId: string) => {
    const next = [...specGroups];
    const targetOpt = next[groupIdx].options[optIdx];
    const mach = shopMachines.find(m => m.id === machineId);

    if (mach) {
      targetOpt.machineId = mach.id;
      targetOpt.machineName = mach.name;
      (targetOpt as any).clickRate = mach.clickRate;
      targetOpt.materialSku = undefined;

      // Auto-calculate recommended addition price if it's not the default base and not custom price
      if (!targetOpt.isDefault && !(targetOpt as any).isCustomPrice) {
        const cost = mach.clickRate || 0;
        const marginMultiplier = 1 - (targetMarginPercent / 100);
        if (marginMultiplier > 0.05 && cost > 0) {
          targetOpt.addPrice = Math.round((cost / marginMultiplier) / 100) * 100;
        }
      }
    } else {
      targetOpt.machineId = undefined;
      targetOpt.machineName = undefined;
      (targetOpt as any).clickRate = 0;
    }
    setSpecGroups(next);
  };

  const handleAddDiscountTier = () => {
    setDiscountTiers([
      ...discountTiers,
      { minQuantity: 100, discountPercentage: 5 }
    ]);
  };

  const handleRemoveDiscountTier = (idx: number) => {
    setDiscountTiers(discountTiers.filter((_, i) => i !== idx));
  };

  const handleDiscountTierChange = (idx: number, field: 'minQuantity' | 'discountPercentage', val: number) => {
    const next = [...discountTiers];
    next[idx][field] = val;
    setDiscountTiers(next);
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameLo.trim()) {
      showToast('ກະລຸນາລະບຸຊື່ສິນຄ້າພາສາລາວ', 'warning');
      return;
    }
    if (!nameEn.trim()) {
      showToast('ກະລຸນາລະບຸຊື່ສິນຄ້າພາສາອັງກິດ (English Name)', 'warning');
      return;
    }

    // Flatten all options from all spec groups for backward compatibility
    const allFlattenedOptions: any[] = [];
    specGroups.forEach(g => {
      g.options.forEach(o => {
        allFlattenedOptions.push({
          optionType: o.optionType,
          label: o.label || o.labelLo || 'Option',
          labelLo: o.labelLo,
          labelEn: o.labelEn,
          hintLo: o.hintLo,
          hintEn: o.hintEn,
          value: o.value || `opt_${Date.now() % 1000}`,
          materialSku: o.materialSku,
          paperCode: o.paperCode,
          addPrice: Number(o.addPrice) || 0,
          isDefault: o.isDefault,
          extraCostRate: Number(o.extraCostRate) || 0,
          materialId: (o as any).materialId,
          costPerUnit: Number((o as any).costPerUnit) || 0,
          stockQty: Number((o as any).stockQty) || 0,
          isCustomPrice: (o as any).isCustomPrice || false,
        });
      });
    });

    const payload: CreateProductInput & { id?: number; targetMarginPercent?: number } = {
      id: editingProduct?.id,
      categoryId,
      name: `${nameLo.trim()} (${nameEn.trim()})`,
      nameLo: nameLo.trim(),
      nameEn: nameEn.trim(),
      slug: slug.trim(),
      category,
      description: descriptionLo.trim() || description.trim(),
      descriptionLo: descriptionLo.trim(),
      descriptionEn: descriptionEn.trim(),
      pricingModel,
      basePrice: Number(basePrice) || 0,
      unit: unit.trim() || 'ຊິ້ນ',
      bestseller,
      targetMarginPercent: Number(targetMarginPercent) || 35,
      defaultMachineId,
      defaultMachineName,
      specGroups,
      featuresConfig,
      features,
      thumbnailUrl,
      galleryUrls,
      infoTabs,
      minQuantity,
      isOnDemand,
      leadTimeDays,
      isActive,
      sortOrder,
      options: allFlattenedOptions,
      discountTiers,
    };

    saveProductMutation.mutate(payload);
  };

  const handleDeleteProduct = (p: PublicProduct) => {
    askConfirmation(
      `ທ່ານຕ້ອງການຍ້າຍສິນຄ້າ "${p.nameLo || p.name}" ເຂົ້າ Archive ແທ້ຫຼືບໍ່?`,
      () => deleteMutation.mutate(p.id)
    );
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nameLo && p.nameLo.toLowerCase().includes(search.toLowerCase())) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(search.toLowerCase())) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      p.category === selectedCategory || 
      p.categorySlug === selectedCategory ||
      (p.categoryId && String(p.categoryId) === selectedCategory);

    const matchesStatus = 
      filterActiveStatus === 'all' ||
      (filterActiveStatus === 'active' && p.isActive) ||
      (filterActiveStatus === 'hidden' && !p.isActive) ||
      (filterActiveStatus === 'bestseller' && p.bestseller);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isModalOpen) {
    return (
      <ProductStudioPage
        key={editingProduct ? `edit_${editingProduct.id}_${editingProduct.updatedAt || ''}` : 'new_product'}
        editingProduct={editingProduct}
        categories={categories}
        onBack={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={async (payload) => {
          await saveProductMutation.mutateAsync({
            ...payload,
            id: editingProduct ? editingProduct.id : undefined,
          });
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        isSaving={saveProductMutation.isPending}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-800 w-full">
      
      {/* Header Banner - Clean White Design matching other pages */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ຈັດການສິນຄ້າໜ້າເວັບ & ສູດລາຄາ (Web Catalog)
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
            ຄວບຄຸມໝວດໝູ່ສິນຄ້າ 2 ພາສາ (ລາວ-EN), ສ້າງກຸ່ມສະເປັກ (Cards/Dropdown), ເລືອກຟັງຊັນອັບໂຫຼດ ແລະ ຜູກ SKU ຄັງສະຕັອກ
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
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-2xl text-xs sm:text-sm font-extrabold transition active:scale-98 cursor-pointer"
          >
            <FolderCog className="w-4 h-4 text-slate-600" />
            <span>ຈັດການໝວດໝູ່ ({categories.length})</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ເພີ່ມສິນຄ້າໃໝ່</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid (Clean White Cards matching Inbound & Employee pages) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Products */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
              ສິນຄ້າທັງໝົດ (Total Products)
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {products.length}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              ສະແດງຢູ່ {filteredProducts.length} ລາຍການ
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Active Products */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
              ເປີດໃຊ້ງານ (Active Online)
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {products.filter(p => p.isActive).length}
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              ພ້ອມໃຫ້ລູກຄ້າສັ່ງຊື້
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Total Categories */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
              ໝວດໝູ່ທັງໝົດ (Categories)
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {categories.length}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              ໝວດໝູ່ສິນຄ້າຫຼັກ
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Bestsellers */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
              ສິນຄ້າຍອດນິຍົມ (Bestsellers)
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {products.filter(p => p.bestseller).length}
            </h3>
            <p className="text-xs text-amber-600 font-semibold mt-1">
              ຕິດປ້າຍແນະນຳ
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2-Column Main Section: Left Sidebar for Filters & Categories + Right Full-width Product Grid */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT SIDEBAR: Search & Filters Panel */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4 lg:sticky lg:top-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-5">
            
            {/* Search Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                <span>ຄົ້ນຫາສິນຄ້າ (Search)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ຊື່, Slug ຫຼື ພາສາ..."
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Status Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
                <span>ສະຖານະສິນຄ້າ (Status)</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', label: 'ທັງໝົດ' },
                  { id: 'active', label: 'ສະແດງ' },
                  { id: 'hidden', label: 'ເຊື່ອງໄວ້' },
                  { id: 'bestseller', label: 'ຍອດນິຍົມ' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setFilterActiveStatus(st.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      filterActiveStatus === st.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Navigation (Vertical List) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ໝວດໝູ່ສິນຄ້າ (Categories)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>ຈັດການ</span>
                </button>
              </div>

              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
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
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    selectedCategory === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {products.length}
                  </span>
                </button>

                {/* Dynamic Categories */}
                {categories.map((c) => {
                  const count = products.filter(
                    (p) => p.category === c.slug || p.categorySlug === c.slug || (p.categoryId && String(p.categoryId) === String(c.id))
                  ).length;
                  const isSelected = selectedCategory === c.slug || selectedCategory === String(c.id);

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.slug)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate text-left">{c.nameLo || c.nameEn}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ml-2 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT: Product Grid taking full available width */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          
          {/* Header of product grid with count & active filter breadcrumbs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500">
                ສະແດງຜົນ:
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-extrabold">
                {filteredProducts.length} ລາຍການ
              </span>
              {selectedCategory !== 'all' && (
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-100">
                  ໝວດ: {categories.find(c => c.slug === selectedCategory || String(c.id) === selectedCategory)?.nameLo || selectedCategory}
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-indigo-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterActiveStatus !== 'all' && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-200">
                  ສະຖານະ: {filterActiveStatus === 'active' ? 'ສະແດງ' : filterActiveStatus === 'hidden' ? 'ເຊື່ອງ' : 'ຍອດນິຍົມ'}
                  <button onClick={() => setFilterActiveStatus('all')} className="hover:text-slate-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {search && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-200">
                  ຄຳຄົ້ນ: "{search}"
                  <button onClick={() => setSearch('')} className="hover:text-slate-900 cursor-pointer">
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
              <span>ເພີ່ມສິນຄ້າໃໝ່</span>
            </button>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="py-20 text-center text-sm text-slate-400 bg-white rounded-3xl border border-slate-100">
              ກຳລັງໂຫຼດຂໍ້ມູນສິນຄ້າ...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 space-y-3">
              <Layers className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">
                ບໍ່ພົບສິນຄ້າຕາມເງື່ອນໄຂທີ່ເລືອກ
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                ທ່ານສາມາດລອງປ່ຽນໝວດໝູ່, ລຶບຄຳຄົ້ນຫາ ຫຼື ເລີ່ມຕົ້ນເພີ່ມສິນຄ້າໃໝ່ໄດ້ທັນທີ
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                ເພີ່ມສິນຄ້າດຽວນີ້
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map((p) => {
                const cat = categories.find(c => c.id === p.categoryId || c.slug === p.category);
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200 transition-all overflow-hidden flex flex-col group"
                  >
                    {/* Thumbnail — aspect-square เต็มกว้างการ์ด ไม่มีพื้นที่ว่าง */}
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <Layers className="w-12 h-12 mb-2 opacity-40" />
                          <span className="text-xs text-slate-400">ບໍ່ມີຮູບພາບ</span>
                        </div>
                      )}

                      {/* Top-left: Category badge */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-600/90 backdrop-blur-sm text-white shadow-sm">
                          {cat ? cat.nameLo : p.category}
                        </span>
                        {p.bestseller && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/90 backdrop-blur-sm text-white shadow-sm">
                            Bestseller
                          </span>
                        )}
                      </div>

                      {/* Top-right: Active toggle badge */}
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 transition-all cursor-pointer backdrop-blur-sm ${
                            p.isActive
                              ? 'bg-emerald-500/90 text-white hover:bg-emerald-600'
                              : 'bg-slate-700/80 text-slate-200 hover:bg-slate-600'
                          }`}
                        >
                          {p.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {p.isActive ? 'ສະແດງໜ້າເວັບ' : 'ເຊື່ອງໄວ້'}
                        </button>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      {/* Name & Description */}
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                          {p.nameLo || p.name}
                        </h3>
                        {p.nameEn && (
                          <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                            {p.nameEn}
                          </p>
                        )}
                        {(p.descriptionLo || p.description) && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {p.descriptionLo || p.description}
                          </p>
                        )}
                      </div>

                      {/* Pricing & Specs */}
                      <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-indigo-600 font-semibold text-[11px]">
                            <Calculator className="w-3.5 h-3.5" />
                            {p.pricingModel === 'BOOK_MULTIPART' ? 'ງານປຶ້ມ / ເຂົ້າເລັ້ມ' :
                             p.pricingModel === 'SQM_CUSTOM' ? 'ຕາລາງແມັດ' :
                             p.pricingModel === 'FIXED_UNIT' ? 'ລາຄາຄົງທີ່' : 'ແຜ່ນມາດຕະຖານ'}
                          </span>
                          <span className="font-mono font-bold text-slate-800 text-[11px]">
                            {p.basePrice > 0 ? `${p.basePrice.toLocaleString()} LAK / ${p.unit || 'ຊິ້ນ'}` : 'ຄິດຕາມສະເປັກ'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>ກຸ່ມສະເປັກ: {p.specGroups?.length || (p.options?.length ? 1 : 0)} ກຸ່ມ</span>
                          <span>ຂັ້ນຕ່ຳ: {p.minQuantity || 1} {p.unit || 'ຊິ້ນ'}</span>
                        </div>
                      </div>

                      {/* Footer: Slug + Actions */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <span className="text-[10px] font-mono text-slate-300">/{p.slug}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="ແກ້ໄຂສິນຄ້າ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ລຶບສິນຄ້າ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      {/* Material Finder & Category Filter Modal */}
      {materialPickerTarget.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    ຄົ້ນຫາ & ເລືອກວັດສະດຸຈາກຄັງ (Material Finder)
                  </h3>
                  <p className="text-xs text-slate-400">
                    ເລືອກ SKU ວັດສະດຸເພື່ອຜູກກັບຕົວເລືອກ ແລະ ຄຳນວອນຕົ້ນທຶນອັດຕະໂນມັດ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMaterialPickerTarget({ ...materialPickerTarget, isOpen: false })}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
              {/* Live Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={materialPickerTarget.search}
                  onChange={(e) => setMaterialPickerTarget({ ...materialPickerTarget, search: e.target.value })}
                  placeholder="ຄົ້ນຫາ SKU, ຊື່ເຈ້ຍ, ແກຣມ, ຍີ່ຫໍ້ (ເຊັ່ນ: 260g, Art, SCG, Sticker, Matt)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  autoFocus
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {[
                  { id: 'ALL', label: 'ທັງໝົດ', count: materials.length },
                  { id: 'Paper', label: 'ເຈ້ຍ (Paper)', count: categorizedMaterials.Paper.length },
                  { id: 'Sticker', label: 'ສະຕິກເກີ (Sticker)', count: categorizedMaterials.Sticker.length },
                  { id: 'Finishing', label: 'ຟິล์ມເຄືອບ (Finishing)', count: categorizedMaterials.Finishing.length },
                  { id: 'Binding', label: 'ເຂົ້າເລັ້ມ (Binding)', count: categorizedMaterials.Binding.length },
                  { id: 'Ink', label: 'ໝຶກ (Ink)', count: categorizedMaterials.Ink.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMaterialPickerTarget({ ...materialPickerTarget, categoryTab: tab.id })}
                    className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      materialPickerTarget.categoryTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      materialPickerTarget.categoryTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Material List Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
              {(() => {
                const searchQ = (materialPickerTarget.search || '').toLowerCase().trim();
                const catTab = materialPickerTarget.categoryTab;

                const filtered = materials.filter((m) => {
                  if (catTab !== 'ALL') {
                    const matchGroup = (categorizedMaterials as any)[catTab] || [];
                    if (!matchGroup.some((x: any) => x.sku === m.sku)) return false;
                  }
                  if (!searchQ) return true;
                  return (
                    m.sku.toLowerCase().includes(searchQ) ||
                    (m.name || '').toLowerCase().includes(searchQ) ||
                    (m.category || '').toLowerCase().includes(searchQ)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center space-y-2">
                      <Search className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">
                        ບໍ່ພົບວັດສະດຸທີ່ກົງກັບ "{materialPickerTarget.search}"
                      </p>
                      <p className="text-xs text-slate-400">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເລືອກໝວດໝູ່ອື່ນ</p>
                    </div>
                  );
                }

                return filtered.map((mat) => (
                  <div
                    key={mat.id || mat.sku}
                    className="pt-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 p-3 rounded-2xl transition group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                          {mat.sku}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {mat.name}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {mat.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className={`font-semibold text-[11px] ${
                          mat.stock_qty > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          ສະຕັອກ: {mat.stock_qty.toLocaleString()} {mat.consumption_unit}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">
                          ຕົ້ນທຶນ: {mat.cost_per_consumption_unit.toLocaleString()} ₭/{mat.consumption_unit}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleSelectMaterialForOption(
                          materialPickerTarget.groupIdx,
                          materialPickerTarget.optIdx,
                          mat.sku
                        );
                        setMaterialPickerTarget({ ...materialPickerTarget, isOpen: false });
                        showToast(`ເລືອກ [${mat.sku}] ${mat.name} ສຳເລັດ`, 'success');
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs group-hover:scale-105 flex-shrink-0 cursor-pointer"
                    >
                      ເລືອກ
                    </button>
                  </div>
                ));
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-4">
              <span>ກົດ "ເລືອກ" ເພື່ອດຶງ SKU, ຊື່ ແລະ ຕົ້ນທຶນເຂົ້າສູ່ຕົວເລືອກ</span>
              <button
                type="button"
                onClick={() => setMaterialPickerTarget({ ...materialPickerTarget, isOpen: false })}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                ປິດ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
