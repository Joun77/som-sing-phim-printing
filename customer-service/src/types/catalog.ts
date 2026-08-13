export interface SpecOption {
  value: string;
  label: string;
  priceDeltaThb: number;
}

export interface SpecGroup {
  key: string;
  name: string;
  required?: boolean;
  options: SpecOption[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  subtitle: string;
  description: string;
  basePriceThb: number;
  minQty: number;
  turnaroundDays: number;
  specs: SpecGroup[];
  popular?: boolean;
}

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
}
