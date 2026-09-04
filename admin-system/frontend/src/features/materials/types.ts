export interface ProductMaterial {
  id: string;
  category: 'art' | 'uncoated' | 'kraft' | 'specialty' | 'sticker' | string;
  categoryNameLo: string;
  categoryNameEn: string;
  nameLo: string;
  nameEn: string;
  gsm: number;
  finishLo: string;
  finishEn: string;
  textureClass: string;
  descriptionLo: string;
  descriptionEn: string;
  prosLo: string;
  prosEn: string;
  consLo: string;
  consEn: string;
  finishingCompatLo: string;
  finishingCompatEn: string;
  suitableForLo: string[];
  suitableForEn: string[];
  productLink: string;
  productTitle: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateMaterialInput = Omit<ProductMaterial, 'id' | 'createdAt' | 'updatedAt'>;

export interface ProductFAQ {
  id: string;
  questionLo: string;
  questionEn: string;
  answerLo: string;
  answerEn: string;
  sortOrder: number;
  isActive: boolean;
}

export type CreateFAQInput = Omit<ProductFAQ, 'id'>;

export interface MaterialCategory {
  id: string;
  key: string;
  nameLo: string;
  nameEn: string;
  icon: string;
  descriptionLo?: string;
  descriptionEn?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateMaterialCategoryInput = Omit<MaterialCategory, 'id' | 'createdAt' | 'updatedAt'>;

export const DEFAULT_MATERIAL_CATEGORIES = [
  { id: 'art', labelLo: 'Art Paper (ເຈ້ຍອາດ)', labelEn: 'Art Paper & Card' },
  { id: 'uncoated', labelLo: 'Woodfree (ເຈ້ຍປອນ/A4)', labelEn: 'Woodfree & Uncoated' },
  { id: 'kraft', labelLo: 'Kraft (ເຈ້ຍຄຣາຟ)', labelEn: 'Kraft Eco Stock' },
  { id: 'specialty', labelLo: 'Specialty Card (ເຈ້ຍພິເສດ)', labelEn: 'Specialty & Luxury' },
  { id: 'sticker', labelLo: 'Sticker (ສະຕິກເກີ)', labelEn: 'Stickers & Labels' },
] as const;
