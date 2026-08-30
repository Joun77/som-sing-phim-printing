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
  notes?: string;
  totalSpentLAK?: number;
  totalOrdersCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

