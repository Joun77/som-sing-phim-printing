export interface PublicCategory {
  id: number;
  slug: string;
  nameLo: string;
  nameEn: string;
  taglineLo?: string;
  taglineEn?: string;
  descriptionLo?: string;
  descriptionEn?: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryInput {
  slug?: string;
  nameLo: string;
  nameEn: string;
  taglineLo?: string;
  taglineEn?: string;
  descriptionLo?: string;
  descriptionEn?: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

export interface PublicProductOption {
  id?: number;
  productId?: number;
  optionType: 'material' | 'size' | 'finishing' | 'cutting' | 'binding' | string;
  label: string;
  labelLo?: string;
  labelEn?: string;
  hintLo?: string;
  hintEn?: string;
  value: string;
  materialSku?: string;
  paperCode?: string;
  addPrice?: number;
  isDefault?: boolean;
  extraCostRate?: number;
  createdAt?: string;
}

export interface SpecGroup {
  id: string;
  titleLo: string;
  titleEn: string;
  displayType: 'cards' | 'dropdown';
  groupType: 'cover_paper' | 'inner_paper' | 'cover_lamination' | 'binding' | 'size' | 'cutting' | 'custom' | string;
  options: PublicProductOption[];
}

export interface FeaturesConfig {
  hasGeneralDocUpload?: boolean;
  hasCoverUpload: boolean;
  hasInnerUpload: boolean;
  hasSpineCalc: boolean;
  hasPreflightCheck: boolean;
  hasCustomDim: boolean;
  uploadWorkflow?: 'general_document' | 'artwork_preflight' | 'custom';
  allowedFileTypes?: string[];
}

export interface ProductDiscountTier {
  id?: number;
  productId?: number;
  minQuantity: number;
  discountPercentage: number;
  createdAt?: string;
}

export type PricingModel = 'STANDARD_FLAT' | 'BOOK_MULTIPART' | 'SQM_CUSTOM' | 'FIXED_UNIT';

export interface ProductInfoTab {
  id: string;
  titleLo: string;
  titleEn: string;
  icon?: string;
  contentLo: string;
  contentEn: string;
}

export interface PublicProduct {
  id: number;
  categoryId?: number;
  categorySlug?: string;
  name: string;
  nameLo?: string;
  nameEn?: string;
  slug: string;
  category: string;
  description: string;
  descriptionLo?: string;
  descriptionEn?: string;
  pricingModel: PricingModel;
  basePrice: number;
  unit: string;
  bestseller: boolean;
  specGroups?: SpecGroup[];
  featuresConfig?: FeaturesConfig;
  features: string[];
  thumbnailUrl: string;
  galleryUrls: string[];
  infoTabs?: ProductInfoTab[];
  minQuantity: number;
  isOnDemand?: boolean;
  leadTimeDays: number;
  isActive: boolean;
  isArchived?: boolean;
  deletedAt?: string | null;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  options?: PublicProductOption[];
  discountTiers?: ProductDiscountTier[];
}

export interface CreateProductInput {
  categoryId?: number;
  name: string;
  nameLo?: string;
  nameEn?: string;
  slug?: string;
  category: string;
  description: string;
  descriptionLo?: string;
  descriptionEn?: string;
  pricingModel: PricingModel;
  basePrice: number;
  unit: string;
  bestseller: boolean;
  specGroups?: SpecGroup[];
  featuresConfig?: FeaturesConfig;
  features: string[];
  thumbnailUrl: string;
  galleryUrls: string[];
  infoTabs?: ProductInfoTab[];
  minQuantity: number;
  isOnDemand?: boolean;
  leadTimeDays: number;
  isActive: boolean;
  sortOrder: number;
  options: {
    optionType: string;
    label: string;
    labelLo?: string;
    labelEn?: string;
    hintLo?: string;
    hintEn?: string;
    value: string;
    materialSku?: string;
    paperCode?: string;
    addPrice?: number;
    isDefault: boolean;
    extraCostRate: number;
  }[];
  discountTiers: {
    minQuantity: number;
    discountPercentage: number;
  }[];
}
