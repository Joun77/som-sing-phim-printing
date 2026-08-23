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
  Star
} from 'lucide-react';
import { PublicProduct, CreateProductInput, PublicProductOption, ProductDiscountTier, PublicCategory, PricingModel, SpecGroup, FeaturesConfig, ProductInfoTab } from './types';
import { CategoryManagerModal } from './CategoryManagerModal';
import { useApp } from '@store/AppContext';

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
    icon: '📜',
    contentLo: '• Art Card 260g - 350g: ເຈ້ຍເນື້ອແໜ້ນ ຜິວລຽບ ເໝາະສຳລັບໂປສເຕີ, ນາມບັດ, ປົກປຶ້ມ\n• Greenread 75g: ເຈ້ຍຖະໜອມສາຍຕາ ນ້ຳໜັກເບົາ\n• Sticker PP / PVC: ກັນນ້ຳ 100% ຕິດແໜ້ນ ທົນທານ',
    contentEn: 'Premium grade paper and synthetic materials for professional printing.',
  },
  {
    id: 'bleed',
    titleLo: 'ໄລຍະຕັດຕົກ & ມາດຕະຖານຟາຍ',
    titleEn: 'Bleed & File Specs',
    icon: '📐',
    contentLo: '• ເຜື່ອໄລຍະຕັດຕົກ (Bleed) +3mm ຮອບດ້ານ\n• ຄວາມລະອຽດແນະນຳ 300 DPI ຂຶ້ນໄປ\n• ໂໝດສີແນະນຳ CMYK Process Color',
    contentEn: 'Add +3mm bleed margin. Resolution at 300 DPI minimum. CMYK color profile recommended.',
  },
  {
    id: 'shipping',
    titleLo: 'ໄລຍະເວລາຜະລິດ & ການຈັດສົ່ງ',
    titleEn: 'Production & Delivery',
    icon: '🚚',
    contentLo: '• ໄລຍະເວລາຜະລິດ: 1 - 2 ວັນລັດຖະການ\n• ຈັດສົ່ງທົ່ວປະເທດລາວຜ່ານ Anousith, HAL, Express\n• ນະຄອນຫຼວງວຽງຈັນ ສົ່ງດ່ວນເຖິງທີ່ພາຍໃນມື້',
    contentEn: 'Production time: 1-2 business days. Nationwide express shipping.',
  },
];

export function WebCatalogPage() {
  const { showToast, askConfirmation } = useApp();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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
      // Group flat options into a single custom group
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
        });
      });
    });

    const payload: CreateProductInput & { id?: number } = {
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

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight">
              ຈັດການສິນຄ້າໜ້າເວັບ & ສູດລາຄາ (Web Catalog & Form Builder)
            </h1>
          </div>
          <p className="text-indigo-200 text-xs md:text-sm max-w-2xl">
            ຄວບຄຸມໝວດໝູ່ສິນຄ້າ 2 ພາສາ (ລາວ-EN), ສ້າງກຸ່ມສະເປັກ (Cards/Dropdown), ເລືອກຟັງຊັນອັບໂຫຼດປົກ/ເນື້ອໃນ ແລະ ຜູກ Material SKU ຄັງສະຕັອກ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-sm font-semibold transition-all backdrop-blur-sm"
          >
            <FolderCog className="w-4 h-4 text-indigo-300" />
            ຈັດການໝວດໝູ່ ({categories.length})
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            ເພີ່ມສິນຄ້າໃໝ່
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ຄົ້ນຫາຕາມຊື່, Slug ຫຼື ພາສາ..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Dynamic Category Badges */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            ທັງໝົດ ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.slug
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {c.nameLo} ({c.nameEn})
            </button>
          ))}
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="ໂຫຼດຂໍ້ມູນໃໝ່"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-sm text-slate-400">
          ກຳລັງໂຫຼດຂໍ້ມູນສິນຄ້າ...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Layers className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            ບໍ່ພົບສິນຄ້າໃນໝວດໝູ່ນີ້
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            ທ່ານສາມາດເລີ່ມຕົ້ນເພີ່ມສິນຄ້າໃໝ່ ພ້ອມກຳນົດສະເປັກ ແລະ ຮູບແບບການຄິດໄລ່ລາຄາໄດ້ທັນທີ
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            ເພີ່ມສິນຄ້າດຽວນີ້
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const cat = categories.find(c => c.id === p.categoryId || c.slug === p.category);
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Thumbnail Header */}
                <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {p.thumbnailUrl ? (
                    <img
                      src={p.thumbnailUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <Layers className="w-10 h-10 mb-1 opacity-50" />
                      <span className="text-xs">ບໍ່ມີຮູບພາບ</span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-600/90 text-white backdrop-blur-md shadow-sm">
                      {cat ? cat.nameLo : p.category}
                    </span>
                    {p.bestseller && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white backdrop-blur-md shadow-sm">
                        ★ Bestseller
                      </span>
                    )}
                  </div>

                  {/* Active Status Badge */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md shadow-sm flex items-center gap-1 transition-all ${
                        p.isActive 
                          ? 'bg-emerald-500/90 text-white hover:bg-emerald-600'
                          : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {p.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {p.isActive ? 'ສະແດງໜ້າເວັບ' : 'ເຊື່ອງໄວ້'}
                    </button>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                        {p.nameLo || p.name}
                      </h3>
                    </div>
                    {p.nameEn && (
                      <p className="text-xs text-slate-400 font-medium line-clamp-1">
                        {p.nameEn}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {p.descriptionLo || p.description || '—'}
                    </p>
                  </div>

                  {/* Meta Specs & Pricing Model */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                        <Calculator className="w-3.5 h-3.5" />
                        {p.pricingModel === 'BOOK_MULTIPART' ? 'ງານປຶ້ມ / ເຂົ້າເລັ້ມ' :
                         p.pricingModel === 'SQM_CUSTOM' ? 'ຄິດໄລ່ຕາມ ຕາລາງແມັດ' :
                         p.pricingModel === 'FIXED_UNIT' ? 'ລາຄາຕໍ່ຊິ້ນຄົງທີ່' : 'ງານແຜ່ນມາດຕະຖານ'}
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {p.basePrice > 0 ? `${p.basePrice.toLocaleString()} LAK / ${p.unit || 'ຊິ້ນ'}` : 'ຄິດໄລ່ຕາມສະເປັກ'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>ກຸ່ມສະເປັກ: {p.specGroups?.length || (p.options?.length ? 1 : 0)} ກຸ່ມ</span>
                      <span>ຂັ້ນຕ່ຳ: {p.minQuantity || 1} {p.unit || 'ຊິ້ນ'}</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400">
                      /{p.slug}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="ແກ້ໄຂສິນຄ້າ"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="ລຶບສິນຄ້າ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      {/* Product Add / Edit Modal with Form Builder */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingProduct ? `ແກ້ໄຂສິນຄ້າ: ${editingProduct.nameLo || editingProduct.name}` : 'ເພີ່ມສິນຄ້າໃໝ່ (Product Form Builder)'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ກຳນົດຂໍ້ມູນ 2 ພາສາ, ຈັດການກຸ່ມສະເປັກ (Cards/Dropdown) ແລະ ຜູກສະຕັອກວັດສະດຸ
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveFormTab('general')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeFormTab === 'general'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  1. ຂໍ້ມູນ & ຟັງຊັນ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('groups')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeFormTab === 'groups'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  2. ສ້າງກຸ່ມສະເປັກ ({specGroups.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('discounts')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeFormTab === 'discounts'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  3. ສ່ວນຫຼຸດ ({discountTiers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('infotabs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeFormTab === 'infotabs'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  4. ແຖບຂໍ້ມູນດ້ານລຸ່ມ ({infoTabs.length})
                </button>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Quick Template Presets Bar */}
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  <Wand2 className="w-4 h-4 text-indigo-500" />
                  <span>ໂຫຼດເທມເພລດສຳເລັດຮູບ (Quick Presets):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={loadBookPreset}
                    className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    📚 ງານປຶ້ມ & ເຂົ້າເລັ້ມ
                  </button>
                  <button
                    type="button"
                    onClick={loadStickerPreset}
                    className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    🏷️ ສະຕິກເກີ & ສະຫຼາກ
                  </button>
                  <button
                    type="button"
                    onClick={loadCardPreset}
                    className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    💳 ນາມບັດພຣີມ້ຽມ
                  </button>
                </div>
              </div>

              {/* Tab 1: General Info & Feature Workflows */}
              {activeFormTab === 'general' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Category & Pricing Model */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ໝວດໝູ່ສິນຄ້າ (Category) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          const matched = categories.find(c => c.slug === e.target.value);
                          if (matched) setCategoryId(matched.id);
                        }}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.nameLo} ({c.nameEn})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ຮູບແບບການຄິດໄລ່ລາຄາ (Pricing Engine Model) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={pricingModel}
                        onChange={(e) => setPricingModel(e.target.value as PricingModel)}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-semibold text-indigo-600 dark:text-indigo-400"
                      >
                        {PRICING_MODELS.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Feature Module Toggles & Dynamic File Upload Configuration */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                        <Settings2 className="w-4 h-4 text-indigo-500" />
                        ຮູບແບບການອັບໂຫຼດ & ຟັງຊັນຂອງສິນຄ້າ (Upload Workflow & Feature Engine)
                      </span>
                    </div>

                    {/* 1. Upload Workflow Mode Presets */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        ຮູບແບບການອັບໂຫຼດຂອງສິນຄ້ານີ້ (Upload Mode):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div
                          onClick={() => {
                            setFeaturesConfig({
                              ...featuresConfig,
                              uploadWorkflow: 'artwork_preflight',
                              hasPreflightCheck: true,
                              allowedFileTypes: ['pdf', 'ai', 'psd', 'png', 'jpg'],
                            });
                          }}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-1.5 ${
                            featuresConfig.uploadWorkflow === 'artwork_preflight' || !featuresConfig.uploadWorkflow
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              🎨 Artwork Preflight
                            </span>
                            {(featuresConfig.uploadWorkflow === 'artwork_preflight' || !featuresConfig.uploadWorkflow) && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 leading-tight">
                            ສຳລັບສະຕິກເກີ, ໂປສເຕີ, ນາມບັດ (PDF, AI, PSD, 300 DPI, Bleed)
                          </span>
                        </div>

                        <div
                          onClick={() => {
                            setFeaturesConfig({
                              ...featuresConfig,
                              uploadWorkflow: 'general_document',
                              hasPreflightCheck: false,
                              allowedFileTypes: ['pdf', 'docx', 'xlsx', 'pptx', 'png', 'jpg'],
                            });
                          }}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-1.5 ${
                            featuresConfig.uploadWorkflow === 'general_document'
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              📁 ເອກະສານ & ກັອບປີ້
                            </span>
                            {featuresConfig.uploadWorkflow === 'general_document' && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 leading-tight">
                            ສຳລັບກັອບປີ້ເອກະສານ, ລາຍງານ, ປຶ້ມ (PDF, Word, Excel, PPT, ຮູບ)
                          </span>
                        </div>

                        <div
                          onClick={() => {
                            setFeaturesConfig({
                              ...featuresConfig,
                              uploadWorkflow: 'custom',
                            });
                          }}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-1.5 ${
                            featuresConfig.uploadWorkflow === 'custom'
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              ⚙️ ກຳນົດເອງ (Custom)
                            </span>
                            {featuresConfig.uploadWorkflow === 'custom' && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 leading-tight">
                            ເລືອກປະເພດຟາຍ ແລະ ເປີດ/ປິດຟັງຊັນໄດ້ຕາມຕ້ອງການ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Allowed File Types Checklist */}
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          ປະເພດຟາຍທີ່ອະນຸຍາດໃຫ້ລູກຄ້າອັບໂຫຼດ (Allowed File Formats):
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {(featuresConfig.allowedFileTypes || ['pdf', 'ai', 'psd', 'png', 'jpg']).length} ປະເພດທີ່ເລືອກ
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {[
                          { key: 'pdf', label: 'PDF (.pdf)', icon: '📄' },
                          { key: 'ai', label: 'Illustrator (.ai)', icon: '🎨' },
                          { key: 'psd', label: 'Photoshop (.psd)', icon: '🖼️' },
                          { key: 'png', label: 'PNG Image (.png)', icon: '📷' },
                          { key: 'jpg', label: 'JPEG / JPG (.jpg)', icon: '🌅' },
                          { key: 'docx', label: 'Word (.docx, .doc)', icon: '📑' },
                          { key: 'xlsx', label: 'Excel (.xlsx, .xls)', icon: '📊' },
                          { key: 'pptx', label: 'PowerPoint (.pptx)', icon: '📽️' },
                          { key: 'zip', label: 'ZIP / RAR (.zip)', icon: '📦' },
                        ].map((fmt) => {
                          const currentList = featuresConfig.allowedFileTypes || ['pdf', 'ai', 'psd', 'png', 'jpg'];
                          const isChecked = currentList.includes(fmt.key);
                          return (
                            <label
                              key={fmt.key}
                              className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer text-xs transition ${
                                isChecked
                                  ? 'bg-white dark:bg-slate-900 border-indigo-500 font-bold text-slate-900 dark:text-white shadow-xs'
                                  : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  let next = [...currentList];
                                  if (e.target.checked) {
                                    if (!next.includes(fmt.key)) next.push(fmt.key);
                                  } else {
                                    next = next.filter((k) => k !== fmt.key);
                                  }
                                  setFeaturesConfig({
                                    ...featuresConfig,
                                    allowedFileTypes: next,
                                    uploadWorkflow: 'custom',
                                  });
                                }}
                                className="w-3.5 h-3.5 text-indigo-600 rounded"
                              />
                              <span>{fmt.icon} {fmt.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Advanced Workflow Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(featuresConfig.hasGeneralDocUpload || featuresConfig.uploadWorkflow === 'general_document')}
                          onChange={(e) =>
                            setFeaturesConfig({
                              ...featuresConfig,
                              hasGeneralDocUpload: e.target.checked,
                              uploadWorkflow: e.target.checked ? 'general_document' : 'artwork_preflight',
                              hasPreflightCheck: !e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          📁 ອັບໂຫຼດເອກະສານທົ່ວໄປ (General Doc)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featuresConfig.hasCoverUpload}
                          onChange={(e) => setFeaturesConfig({ ...featuresConfig, hasCoverUpload: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          ແຍກອັບໂຫຼດຟາຍປົກ (Cover)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featuresConfig.hasInnerUpload}
                          onChange={(e) => setFeaturesConfig({ ...featuresConfig, hasInnerUpload: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          ອັບໂຫຼດຟາຍເນື້ອໃນ (Inner)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featuresConfig.hasSpineCalc}
                          onChange={(e) => setFeaturesConfig({ ...featuresConfig, hasSpineCalc: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          ຄຳນວນສັນປົກ (Spine Calc)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featuresConfig.hasPreflightCheck}
                          onChange={(e) => setFeaturesConfig({ ...featuresConfig, hasPreflightCheck: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          ກວດ Preflight 300 DPI/CMYK
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featuresConfig.hasCustomDim}
                          onChange={(e) => setFeaturesConfig({ ...featuresConfig, hasCustomDim: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          ລະບຸຂະໜາດ ກວ້າງ×ຍາວ ເອງ
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Bilingual Names */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ຊື່ສິນຄ້າ (ພາສາລາວ) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={nameLo}
                        onChange={(e) => setNameLo(e.target.value)}
                        placeholder="ຕົວຢ່າງ: ປຶ້ມເຂົ້າເລັ້ມສັນກາວຮ້ອນ"
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Product Name (English) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder="e.g. Perfect Glue Binding Book"
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Slug, Base Price & Unit */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        URL Slug
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="auto-generated-slug"
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ລາຄາເລີ່ມຕົ້ນ (Base Price LAK)
                      </label>
                      <input
                        type="number"
                        value={basePrice}
                        onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ຫົວໜ່ວຍ (Unit)
                      </label>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="ຊິ້ນ / ແຜ່ນ / ເຫຼັ້ມ"
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Bilingual Descriptions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ລາຍລະອຽດສິນຄ້າ (ພາສາລາວ)
                      </label>
                      <textarea
                        rows={3}
                        value={descriptionLo}
                        onChange={(e) => setDescriptionLo(e.target.value)}
                        placeholder="ອະທິບາຍຄຸນສົມບັດສິນຄ້າ, ວັດສະດຸ, ການນຳໃຊ້..."
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Product Description (English)
                      </label>
                      <textarea
                        rows={3}
                        value={descriptionEn}
                        onChange={(e) => setDescriptionEn(e.target.value)}
                        placeholder="Description for English-speaking clients..."
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Hidden File Inputs for Direct Local Uploads */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/gif"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleUploadFiles(e.target.files, 'cover');
                        e.target.value = '';
                      }
                    }}
                  />
                  <input
                    type="file"
                    ref={galleryInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/gif"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleUploadFiles(e.target.files, 'gallery');
                        e.target.value = '';
                      }
                    }}
                  />

                  {/* Dynamic Product Visuals & Multi-Image Gallery Studio */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          ຮູບພາບສິນຄ້າ (Cover & Gallery Photos)
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {1 + galleryUrls.length} ຮູບທັງໝົດ
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isUploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{isUploadingImage ? uploadProgress || 'ກຳລັງອັບໂຫຼດ...' : 'ອັບໂຫຼດຮູບປົກ (Cover)'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isUploadingImage}
                          onClick={() => galleryInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>ເພີ່ມຫຼາຍຮູບ (Add Multiple)</span>
                        </button>
                      </div>
                    </div>

                    {/* Image Cards Grid: Cover (Slot 1) + Dynamic Gallery Items */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                      {/* Primary Cover Image Box */}
                      <div className="relative group aspect-square rounded-2xl border-2 border-indigo-500/50 bg-white dark:bg-slate-900 overflow-hidden shadow-md flex flex-col items-center justify-center">
                        {thumbnailUrl ? (
                          <>
                            <img
                              src={thumbnailUrl}
                              alt="Cover Thumbnail"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold"
                              >
                                ປ່ຽນຮູບປົກ
                              </button>
                              <button
                                type="button"
                                onClick={() => setThumbnailUrl('')}
                                className="w-full py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold"
                              >
                                ລຶບ
                              </button>
                            </div>
                          </>
                        ) : (
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-full flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
                          >
                            <UploadCloud className="w-6 h-6 text-indigo-400 mb-1" />
                            <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">
                              + ອັບໂຫຼດຮູບປົກ
                            </span>
                            <span className="text-[9px] text-slate-400">
                              (JPG, PNG, WebP)
                            </span>
                          </div>
                        )}
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>ໜ້າປົກ (Cover)</span>
                        </div>
                      </div>

                      {/* Dynamic Gallery List */}
                      {galleryUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative group aspect-square rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col items-center justify-center"
                        >
                          <img
                            src={url}
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                            <button
                              type="button"
                              onClick={() => {
                                // Swap this gallery image with Cover
                                const oldCover = thumbnailUrl;
                                setThumbnailUrl(url);
                                setGalleryUrls((prev) => {
                                  const next = [...prev];
                                  if (oldCover) {
                                    next[idx] = oldCover;
                                  } else {
                                    next.splice(idx, 1);
                                  }
                                  return next;
                                });
                                showToast('ຕັ້ງຮູບນີ້ເປັນໜ້າປົກແລ້ວ', 'success');
                              }}
                              className="w-full py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black flex items-center justify-center gap-1 shadow"
                            >
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>ຕັ້ງເປັນປົກ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGalleryUrls((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="w-full py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>ລຶບຮູບນີ້</span>
                            </button>
                          </div>
                          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-slate-900/80 text-slate-200 text-[9px] font-bold">
                            #{idx + 1}
                          </div>
                        </div>
                      ))}

                      {/* Add Extra Button Card */}
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-white/50 dark:bg-slate-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition flex flex-col items-center justify-center p-3 text-center cursor-pointer group"
                      >
                        <Plus className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 mb-1 transition" />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          + ເພີ່ມຮູບອີກ
                        </span>
                        <span className="text-[9px] text-slate-400">
                          ເລືອກໄດ້ຫຼາຍຮູບ
                        </span>
                      </button>
                    </div>

                    {/* Quick URL Fallback Input */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={customGalleryUrl}
                          onChange={(e) => setCustomGalleryUrl(e.target.value)}
                          placeholder="ຫຼື ວາງ URL ຮູບພາບໂດຍກົງ (https://... ຫຼື /images/...)"
                          className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
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
                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold"
                        >
                          ເພີ່ມ URL
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bestseller & Active Status Switches */}
                  <div className="flex flex-wrap items-center gap-6 py-2 px-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bestseller}
                        onChange={(e) => setBestseller(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                      />
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        ★ ສິນຄ້າຍອດນິຍົມ (Bestseller)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        ເປີດສະແດງໜ້າເວັບ (Active on Web)
                      </span>
                    </label>
                  </div>

                  {/* Features Tag Builder */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ຈຸດເດັ່ນຂອງສິນຄ້າ (Key Highlights)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFeature();
                          }
                        }}
                        placeholder="ພິມຈຸດເດັ່ນ ແລ້ວກົດ Enter..."
                        className="flex-1 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                      >
                        ເພີ່ມ
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {features.map((f, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40 rounded-full text-xs font-medium"
                        >
                          {f}
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 2: Dynamic Spec Groups Builder (Cards vs Dropdown) */}
              {activeFormTab === 'groups' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ກຸ່ມສະເປັກສິນຄ້າ & ຕົວເລືອກ (Dynamic Spec Groups Builder)
                      </h4>
                      <p className="text-xs text-slate-500">
                        ສ້າງກຸ່ມສະເປັກເຊັ່ນ: ກະດາດປົກ, ການເຄືອບ, ເນື້ອໃນ, ເຂົ້າເລັ້ມ — ເລືອກຮູບແບບການສະແດງ (Cards / Dropdown) ໄດ້ອິດສະຫຼະ
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSpecGroup}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      ເພີ່ມກຸ່ມສະເປັກໃໝ່
                    </button>
                  </div>

                  {specGroups.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-2">
                      <Sliders className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">ຍັງບໍ່ມີກຸ່ມສະເປັກໃນສິນຄ້ານີ້</p>
                      <p className="text-xs text-slate-400">ກົດເລືອກໂຫຼດເທມເພລດດ້ານເທິງ ຫຼື ກົດປຸ່ມເພີ່ມກຸ່ມສະເປັກ</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {specGroups.map((group, gIdx) => (
                        <div
                          key={group.id || gIdx}
                          className="p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-3xl space-y-4 shadow-sm"
                        >
                          {/* Group Header Info */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                                {gIdx + 1}
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                                <input
                                  type="text"
                                  value={group.titleLo}
                                  onChange={(e) => handleGroupFieldChange(gIdx, 'titleLo', e.target.value)}
                                  placeholder="ຊື່ກຸ່ມ (ພາສາລາວ) ເຊັ່ນ: ກະດາດປົກ"
                                  className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                                />
                                <input
                                  type="text"
                                  value={group.titleEn}
                                  onChange={(e) => handleGroupFieldChange(gIdx, 'titleEn', e.target.value)}
                                  placeholder="Group Title (EN) e.g. Cover Paper"
                                  className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>

                            {/* Display Type & Group Actions */}
                            <div className="flex items-center gap-2">
                              {/* Display Type: Cards vs Dropdown */}
                              <div className="flex items-center bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleGroupFieldChange(gIdx, 'displayType', 'cards')}
                                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-all ${
                                    group.displayType === 'cards'
                                      ? 'bg-indigo-600 text-white shadow-sm'
                                      : 'text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <LayoutGrid className="w-3.5 h-3.5" />
                                  Cards
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleGroupFieldChange(gIdx, 'displayType', 'dropdown')}
                                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-all ${
                                    group.displayType === 'dropdown'
                                      ? 'bg-indigo-600 text-white shadow-sm'
                                      : 'text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <ListFilter className="w-3.5 h-3.5" />
                                  Dropdown
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveSpecGroup(gIdx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-900 rounded-xl transition-colors"
                                title="ລຶບກຸ່ມນີ້"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Options List inside Group */}
                          <div className="space-y-2.5 pl-2">
                            {group.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="grid grid-cols-1 sm:grid-cols-6 gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl items-center"
                              >
                                <div className="sm:col-span-2">
                                  <input
                                    type="text"
                                    value={opt.labelLo || ''}
                                    onChange={(e) => handleGroupOptionChange(gIdx, oIdx, 'labelLo', e.target.value)}
                                    placeholder="ຊື່ຕົວເລືອກ (ລາວ) ເຊັ່ນ: ອາດກາດ 260g"
                                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                                  />
                                </div>

                                <div>
                                  <input
                                    type="text"
                                    value={opt.labelEn || ''}
                                    onChange={(e) => handleGroupOptionChange(gIdx, oIdx, 'labelEn', e.target.value)}
                                    placeholder="Label (EN)"
                                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                                  />
                                </div>

                                <div>
                                  <input
                                    type="text"
                                    value={opt.materialSku || ''}
                                    onChange={(e) => handleGroupOptionChange(gIdx, oIdx, 'materialSku', e.target.value)}
                                    placeholder="Material SKU คัง"
                                    className="w-full px-2.5 py-1.5 text-xs bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl font-mono text-indigo-900 dark:text-indigo-300"
                                  />
                                </div>

                                <div>
                                  <input
                                    type="number"
                                    value={opt.addPrice || 0}
                                    onChange={(e) => handleGroupOptionChange(gIdx, oIdx, 'addPrice', parseFloat(e.target.value) || 0)}
                                    placeholder="+ LAK"
                                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                                  />
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-2">
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={opt.isDefault}
                                      onChange={(e) => handleGroupOptionChange(gIdx, oIdx, 'isDefault', e.target.checked)}
                                      className="w-3.5 h-3.5 text-indigo-600 rounded dark:bg-slate-800"
                                    />
                                    <span className="text-[10px] text-slate-500">Default</span>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOptionFromGroup(gIdx, oIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => handleAddOptionToGroup(gIdx)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200/60 dark:bg-slate-700/60 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors mt-2"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              ເພີ່ມລາຍການຕົວເລືອກໃນກຸ່ມນີ້
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Discount Tiers */}
              {activeFormTab === 'discounts' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        ສ່ວນຫຼຸດຕາມຈຳນວນສັ່ງຜະລິດ (Volume Discount Tiers)
                      </h4>
                      <p className="text-xs text-slate-500">
                        ກຳນົດສ່ວນຫຼຸດ % ອັດຕະໂນມັດເມື່ອລູກຄ້າສັ່ງຜະລິດຮອດຈຳນວນທີ່ກຳນົດ
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDiscountTier}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      ເພີ່ມຂັ້ນສ່ວນຫຼຸດ
                    </button>
                  </div>

                  {discountTiers.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs text-slate-400">ຍັງບໍ່ມີການຕັ້ງຄ່າສ່ວນຫຼຸດຕາມຈຳນວນ</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {discountTiers.map((tier, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl"
                        >
                          <div className="flex-1">
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              ຈຳນວນສັ່ງຂັ້ນຕ່ຳ (Min Qty)
                            </label>
                            <input
                              type="number"
                              value={tier.minQuantity}
                              onChange={(e) => handleDiscountTierChange(idx, 'minQuantity', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="flex-1">
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              ສ່ວນຫຼຸດ % (Discount Percentage)
                            </label>
                            <input
                              type="number"
                              value={tier.discountPercentage}
                              onChange={(e) => handleDiscountTierChange(idx, 'discountPercentage', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold text-emerald-600 dark:text-emerald-400"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveDiscountTier(idx)}
                            className="mt-4 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Dynamic Info Tabs & Guides Builder (Product Bottom Tabs) */}
              {activeFormTab === 'infotabs' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ແຖບຂໍ້ມູນ & ຄູ່ມືເພີ່ມເຕີມດ້ານລຸ່ມ (Dynamic Product Info Tabs)
                      </h4>
                      <p className="text-xs text-slate-500">
                        ກຳນົດຫົວຂໍ້, ໄອຄອນ, ຄູ່ມືເຈ້ຍ, ໄລຍະຕັດຕົກ, ການຮັບປະກັນ ຫຼື ຂໍ້ມູນອື່ນໆ ທີ່ຈະສະແດງໃນ 4 ແຖບລຸ່ມສຸດຂອງໜ້າສິນຄ້າ
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `tab_${Date.now()}`;
                        setInfoTabs((prev) => [
                          ...prev,
                          {
                            id: newId,
                            titleLo: 'ຫົວຂໍ້ໃໝ່',
                            titleEn: 'New Section',
                            icon: '💡',
                            contentLo: '',
                            contentEn: '',
                          },
                        ]);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + ເພີ່ມແຖບຂໍ້ມູນໃໝ່
                    </button>
                  </div>

                  {infoTabs.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs text-slate-400">ຍັງບໍ່ມີແຖບຂໍ້ມູນເພີ່ມເຕີມ (ຄລິກປຸ່ມດ້ານເທິງເພື່ອເພີ່ມ)</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {infoTabs.map((tab, idx) => (
                        <div
                          key={tab.id || idx}
                          className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-black">
                                #{idx + 1}
                              </span>
                              <input
                                type="text"
                                value={tab.icon || '📝'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setInfoTabs((prev) =>
                                    prev.map((t, i) => (i === idx ? { ...t, icon: val } : t))
                                  );
                                }}
                                placeholder="ໄອຄອນ (e.g. 📜, 📐, 🚚, 💡)"
                                className="w-16 px-2 py-1 text-center text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                                title="Icon / Emoji"
                              />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {tab.titleLo || `ແຖບທີ ${idx + 1}`}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setInfoTabs((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="ລຶບແຖບນີ້"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                ຊື່ແຖບ (ພາສາລາວ) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={tab.titleLo}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setInfoTabs((prev) =>
                                    prev.map((t, i) => (i === idx ? { ...t, titleLo: val } : t))
                                  );
                                }}
                                placeholder="ຕົວຢ່າງ: ຄູ່ມືວັດສະດຸ & ເຈ້ຍ"
                                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Tab Title (English)
                              </label>
                              <input
                                type="text"
                                value={tab.titleEn}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setInfoTabs((prev) =>
                                    prev.map((t, i) => (i === idx ? { ...t, titleEn: val } : t))
                                  );
                                }}
                                placeholder="e.g. Materials & Paper Specs"
                                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                ເນື້ອໃນລາຍລະອຽດ (ພາສາລາວ)
                              </label>
                              <textarea
                                rows={3}
                                value={tab.contentLo}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setInfoTabs((prev) =>
                                    prev.map((t, i) => (i === idx ? { ...t, contentLo: val } : t))
                                  );
                                }}
                                placeholder="ພິມລາຍລະອຽດ ຫຼື ຈຸດເດັ່ນຂອງແຖບນີ້..."
                                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Content (English)
                              </label>
                              <textarea
                                rows={3}
                                value={tab.contentEn}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setInfoTabs((prev) =>
                                    prev.map((t, i) => (i === idx ? { ...t, contentEn: val } : t))
                                  );
                                }}
                                placeholder="Content description in English..."
                                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-400">
                  {specGroups.length} ກຸ່ມສະເປັກພ້ອມສົ່ງຕໍ່ໄປຍັງໜ້າຮ້ານ Customer Service
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    ຍົກເລີກ
                  </button>
                  <button
                    type="submit"
                    disabled={saveProductMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {saveProductMutation.isPending ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກສິນຄ້າ'}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
