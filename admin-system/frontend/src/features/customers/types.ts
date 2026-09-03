export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  creditLimit: number;
  paymentTerms?: string;
  instagram?: string;
  line?: string;
  facebook?: string;
  whatsapp?: string;
  province?: string;
  district?: string;
  village?: string;
  branchCode?: string;
  taxId?: string;
  tier?: string;
  preferredCourier?: string;
  notes?: string;
  totalSpentLAK?: number;
  totalOrdersCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerCategory {
  id: string;
  name: string;
  description?: string;
  color?: string; // sky, violet, emerald, amber, rose, indigo, slate
  isDefault?: boolean;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CustomerTier = string;

