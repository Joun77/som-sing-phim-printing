export type LookupType =
  | 'paper_type'
  | 'surface_finish'
  | 'standard_dimension'
  | 'unit_of_measure'
  | 'binding_type'
  | string;

export interface SystemLookup {
  id: string;
  lookup_type: LookupType;
  code: string;
  name_lo: string;
  name_en: string;
  name_th?: string;
  attributes: Record<string, any>;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CreateLookupInput = Omit<SystemLookup, 'id' | 'created_at' | 'updated_at'>;
export type UpdateLookupInput = Partial<CreateLookupInput>;

export interface LookupGroupConfig {
  key: LookupType;
  labelLo: string;
  labelEn: string;
  iconName: string;
  descriptionLo: string;
  descriptionEn: string;
  attributeHints?: {
    key: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'json';
    placeholder?: string;
  }[];
}

export const LOOKUP_GROUPS: LookupGroupConfig[] = [
  {
    key: 'paper_type',
    labelLo: 'ປະເພດເນື້ອເຈ້ຍ (Paper Types)',
    labelEn: 'Paper & Media Types',
    iconName: 'FileText',
    descriptionLo: 'ກຳນົດລາຍການເນື້ອເຈ້ຍ ແລະ ວັດສະດຸຫຼັກເຊັ່ນ: ເຈ້ຍອາດ, ປອນ, ຄຣາຟ, ສະຕິກເກີ, ຈົ່ວປັງ',
    descriptionEn: 'Define paper and base substrates: Art paper, woodfree, kraft, greyboard, stickers',
    attributeHints: [
      { key: 'default_gsm', label: 'Default GSM List', type: 'text', placeholder: 'e.g. 70, 80, 100, 120' },
      { key: 'thickness_mm', label: 'Thickness in mm (Greyboard)', type: 'text', placeholder: 'e.g. 1.5, 2.0, 2.5' },
    ],
  },
  {
    key: 'paper_grammage_gsm',
    labelLo: 'ນ້ຳໜັກເຈ້ຍ / ແກຣມ (Paper GSM)',
    labelEn: 'Paper Grammage (GSM)',
    iconName: 'Scale',
    descriptionLo: 'ກຳນົດລາຍການຄວາມໜາແກຣມເຈ້ຍ: 70g, 80g, 100g, 130g, 160g, 210g, 260g, 300g, 350g',
    descriptionEn: 'Standard paper grammage options in GSM (g/m²)',
    attributeHints: [
      { key: 'gsm', label: 'Grammage (GSM) *', type: 'number', placeholder: 'e.g. 80' },
      { key: 'is_cover', label: 'Is Suitable for Cover', type: 'boolean' },
    ],
  },
  {
    key: 'board_thickness_mm',
    labelLo: 'ຄວາມໜາຈົ່ວປັງ & ແຜ່ນແຂງ (Board mm)',
    labelEn: 'Greyboard & Rigid (mm)',
    iconName: 'Layers',
    descriptionLo: 'ກຳນົດຄວາມໜາຈົ່ວປັງເປັນເບີ ແລະ ມິນລິແມັດ: ເບີ 16 (1.2mm), ເບີ 20 (1.6mm), ເບີ 24 (2.0mm)',
    descriptionEn: 'Rigid board and greyboard thickness with standard board numbers and mm caliper',
    attributeHints: [
      { key: 'thickness_mm', label: 'Thickness (mm) *', type: 'number', placeholder: 'e.g. 2.0' },
      { key: 'board_number', label: 'Board Number', type: 'number', placeholder: 'e.g. 24' },
      { key: 'suitable_for', label: 'Recommended Use', type: 'text', placeholder: 'e.g. Hardcover Thesis' },
    ],
  },
  {
    key: 'surface_finish',
    labelLo: 'ຜິວສຳຜັດ ແລະ ການເຄືອບ (Surfaces & Finishes)',
    labelEn: 'Surfaces & Coatings',
    iconName: 'Sparkles',
    descriptionLo: 'ກຳນົດຮູບແບບຜິວ ແລະ ຟີມເຄືອບ: เງົາ, ດ້ານ, ກຳມະຫຍີ່ Soft-Touch, Spot UV 3D, ໂຮໂລແກຣມ',
    descriptionEn: 'Surface treatments: Gloss, matte, soft-touch velvet, sand grain, 3D spot UV',
    attributeHints: [
      { key: 'thickness_micron', label: 'Film Thickness (Microns)', type: 'number', placeholder: 'e.g. 25, 32, 125' },
    ],
  },
  {
    key: 'standard_dimension',
    labelLo: 'ຂະໜາດມາດຕະຖານ (Standard Sizes & Sheets)',
    labelEn: 'Standard Sizes & Sheets',
    iconName: 'Maximize2',
    descriptionLo: 'ກຳນົດຂະໜາດເຈ້ຍມາດຕະຖານ A4, A3, SRA3, ແຜ່ນໃຫຍ່ 31x43", ແລະ ແຜ່ນບອດ 1.22x2.44m',
    descriptionEn: 'Predefined cut-sheets, parent factory sheets (31x43"), and rigid substrates',
    attributeHints: [
      { key: 'width_mm', label: 'Width (mm) *', type: 'number', placeholder: 'e.g. 210' },
      { key: 'height_mm', label: 'Height (mm) *', type: 'number', placeholder: 'e.g. 297' },
      { key: 'category', label: 'Category', type: 'text', placeholder: 'cut_sheet, parent_sheet, rigid_sheet' },
    ],
  },
  {
    key: 'unit_of_measure',
    labelLo: 'ຫົວໜ່ວຍນັບ ແລະ ຈັດຊື້ (Units of Measure - UOM)',
    labelEn: 'Units of Measure (UOM)',
    iconName: 'PackageCheck',
    descriptionLo: 'ກຳນົດຫົວໜ່ວຍນັບສາງ ແລະ ຕົວຄູນແປງໜ່ວຍ: ຣີມ (500 ແຜ່ນ), ມ້ວນ, ແມັດ, ຕາແມັດ, ml, g, ກ່ອງ',
    descriptionEn: 'Stock and procurement units with conversion factors: Ream, roll, sqm, ml, box',
    attributeHints: [
      { key: 'base_unit', label: 'Base Consumption Unit', type: 'text', placeholder: 'SHEET, METER, SQM, ML, GRAM' },
      { key: 'multiplier', label: 'Conversion Multiplier', type: 'number', placeholder: 'e.g. 500 for Ream' },
    ],
  },
  {
    key: 'binding_type',
    labelLo: 'ຮູບແບບການເຂົ້າເຫຼັ້ມ (Binding & Finishing)',
    labelEn: 'Binding & Finishing Methods',
    iconName: 'BookOpen',
    descriptionLo: 'ກຳນົດວິທີການເຂົ້າເຫຼັ້ມ: ສັນກາວຮ້ອນ, ສັນຂົດລວດ Wire-O, ຫຍິບມຸງຫຼັງຄາ, ປົກແຂງ, ສັນຜ້າເທບ',
    descriptionEn: 'Bookbinding workflows: Perfect bind, Wire-O loop, saddle stitch, hardcover, tape',
    attributeHints: [
      { key: 'glue_grams_per_book', label: 'Est. Glue Consumption (g/book)', type: 'number', placeholder: 'e.g. 5' },
      { key: 'pitch', label: 'Spine Loop Pitch', type: 'text', placeholder: '3:1 or 2:1' },
    ],
  },
];
