export interface PublicProductOption {
  id?: number;
  productId?: number;
  optionType: 'material' | 'size' | 'finishing' | 'cutting' | 'binding' | string;
  label: string;
  value: string;
  isDefault?: boolean;
  extraCostRate?: number;
  createdAt?: string;
}

export interface ProductDiscountTier {
  id?: number;
  productId?: number;
  minQuantity: number;
  discountPercentage: number;
  createdAt?: string;
}

export interface PublicProduct {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  features: string[];
  thumbnailUrl: string;
  galleryUrls: string[];
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
  name: string;
  slug?: string;
  category: string;
  description: string;
  features: string[];
  thumbnailUrl: string;
  galleryUrls: string[];
  minQuantity: number;
  isOnDemand?: boolean;
  leadTimeDays: number;
  isActive: boolean;
  sortOrder: number;
  options: {
    optionType: string;
    label: string;
    value: string;
    isDefault: boolean;
    extraCostRate: number;
  }[];
  discountTiers: {
    minQuantity: number;
    discountPercentage: number;
  }[];
}
