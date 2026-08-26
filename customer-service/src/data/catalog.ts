// ============================================================
// Som Sing Phim (ສົມສິ່ງພິມ) — Product Catalog & Config Catalog
// 3 Core Categories: Documents & Books, Photo Prints, Stickers & Labels
// ============================================================

export interface SpecOption {
  id: string
  label: string
  labelEn?: string
  hint: string
  hintEn?: string
  add: number
  extraCostRate?: number
  materialSku?: string
  paperCode?: string
}

export interface Category {
  id: string
  slug: string
  name: string
  nameEn: string
  short: string
  shortEn?: string
  tagline: string
  taglineEn?: string
  icon: string
  description: string
  descriptionEn?: string
  sortOrder?: number
}

export interface SpecGroup {
  id: string
  titleLo: string
  titleEn: string
  displayType: 'cards' | 'dropdown'
  groupType: string
  options: SpecOption[]
}

export interface CustomBreakdownRow {
  id: string
  titleLo: string
  titleEn?: string
  includePrintCost: boolean
  includeMaterialCost: boolean
  includeFinishingCost: boolean
  extraFixedCost?: number
}

export interface FeaturesConfig {
  hasGeneralDocUpload?: boolean
  hasCoverUpload?: boolean
  hasInnerUpload?: boolean
  hasSpineCalc?: boolean
  hasPreflightCheck?: boolean
  hasCustomDim?: boolean
  uploadWorkflow?: 'general_document' | 'artwork_preflight' | 'custom'
  allowedFileTypes?: string[]
  breakdownMode?: 'auto' | 'custom'
  customBreakdownRows?: CustomBreakdownRow[]
}

export interface ProductInfoTab {
  id: string
  titleLo: string
  titleEn: string
  icon?: string
  contentLo: string
  contentEn: string
}

export interface Product {
  id: string
  slug: string
  name: string
  nameEn?: string
  title?: string
  unit?: string
  category: 'documents' | 'photos' | 'stickers' | string
  bestseller: boolean
  basePrice: number
  minQuantity?: number
  isOnDemand?: boolean
  image: string
  thumbnailUrl?: string
  galleryUrls?: string[]
  infoTabs?: ProductInfoTab[]
  short: string
  shortEn?: string
  description: string
  descriptionEn?: string
  pricingModel?: 'STANDARD_FLAT' | 'BOOK_MULTIPART' | 'SQM_CUSTOM' | 'FIXED_UNIT' | string
  featuresConfig?: FeaturesConfig
  specGroups?: SpecGroup[]
  features?: string[]
  sizes: SpecOption[]
  materials: SpecOption[]
  finishings: SpecOption[]
  options?: any[]
  discountTiers?: any[]
}

export const CATEGORIES: Category[] = [
  {
    id: 'documents',
    slug: 'documents',
    name: 'ງານເອກະສານ & ປຶ້ມ',
    nameEn: 'Documents & Books',
    short: 'ງານເອກະສານ & ປຶ້ມ',
    shortEn: 'Documents & Books',
    tagline: 'ກັອບປີ້ເອກະສານທົ່ວໄປ, ເຂົ້າເລັ້ມສັນກາວ, ສັນຫ່ວງ, ປຶ້ມ & ລາຍງານ',
    taglineEn: 'Document copying, glue binding, wire-o, books & corporate reports',
    icon: 'doc',
    description:
      'ບໍລິການກັອບປີ້ເອກະສານຂາວດຳ-ສີ, ເຂົ້າເລັ້ມປຶ້ມສັນກາວຮ້ອນ, ສັນຫ່ວງກະດູກງູ, ເຢັບມຸມ, ລາຍງານປະຈຳປີ ແລະ ເອກະສານສຳມະນາຄຸນນະພາບສູງ.',
    descriptionEn:
      'High-speed document printing and copying, perfect glue binding, wire-o booklets, catalogs, and training manuals.',
  },
  {
    id: 'photos',
    slug: 'photos',
    name: 'ງານພິມຮູບພາບພຣີມ້ຽມ',
    nameEn: 'Premium Photo Prints',
    short: 'ງານພິມຮູບພາບ',
    shortEn: 'Photo Prints & Albums',
    tagline: 'ພິມຮູບພາບຄຸນນະພາບສູງ, ໂຟໂຕ້ບຸກ, ອັນບັ້ມຮູບ & ກອບອາຄຣີລິກ',
    taglineEn: 'High-definition photo prints, photobooks, albums & acrylic frames',
    icon: 'photo',
    description:
      'ງານພິມຮູບພາບຄວາມລະອຽດສູງລະດັບແກເລີຣີ, ອັນບັ້ມຮູບປົກແຂງ Layflat 180°, ມິນິໂຟໂຕ້ບຸກ ແລະ ກອບຮູບອາຄຣີລິກຕັ້ງໂຕະຄົມຊັດສີສັນສົດໃສ.',
    descriptionEn:
      'Gallery-grade photo printing, luxury hardcover photobooks, compact mini albums, and crystal clear acrylic photo blocks.',
  },
  {
    id: 'stickers',
    slug: 'stickers',
    name: 'ງານສະຕິກເກີ & ສະຫຼາກສິນຄ້າ',
    nameEn: 'Stickers & Labels',
    short: 'ສະຕິກເກີ & ສະຫຼາກສິນຄ້າ',
    shortEn: 'Stickers & Labels',
    tagline: 'ສະຕິກເກີ PP ກັນນ້ຳ 100%, ໄດຄັດຕາມຮູບຊົງ & ສະຫຼາກສິນຄ້າ',
    taglineEn: '100% waterproof PP vinyl, custom die-cut stickers & product labels',
    icon: 'sticker',
    description:
      'ສະຕິກເກີເນື້ອ PP ຂາວເງົາ/ຂາວດ້ານ, ເນື້ອໃສ ແລະ ເຈ້ຍຄຣາຟ Vintage ກັນນ້ຳ 100% ຕິດແໜ້ນທົນທານ ໄດຄັດຕາມຮູບຊົງໂລໂກ້ພ້ອມລອກຕິດ.',
    descriptionEn:
      'Custom shape die-cut stickers, waterproof PP vinyl, clear labels, and vintage kraft stickers for packaging.',
  },
]

export const PRODUCTS: Product[] = [
  // ==========================================
  // 1. ງານເອກະສານ & ປຶ້ມ (Documents & Books)
  // ==========================================
  {
    id: 'doc-copy-binding',
    slug: 'doc-copy-binding',
    name: 'ກັອບປີ້ເອກະສານ & ເຂົ້າເລັ້ມສັນກາວ/ສັນຫ່ວງ (Document Copy & Binding)',
    nameEn: 'Document Copy & Binding',
    category: 'documents',
    bestseller: true,
    basePrice: 20,
    isOnDemand: true,
    minQuantity: 1,
    image: 'doc',
    short: 'ກັອບປີ້ສີ-ຂາວດຳ ເຂົ້າເລັ້ມສັນກາວຮ້ອນ, ສັນຫ່ວງກະດູກງູ ຫຼື ເຢັບມຸມດ່ວນ',
    shortEn: 'Color and B&W document copying with perfect glue or wire-o binding',
    description:
      'ບໍລິການພິມ ແລະ ກັອບປີ້ເອກະສານທົ່ວໄປ ເອກະສານປະຊຸມ ລາຍງານ ປຶ້ມຄູ່ມື ເລືອກເຂົ້າເລັ້ມສັນກາວຮ້ອນ ສັນຫ່ວງກະດູກງູ ຫຼື ໃສ່ສັນຮູດ ຈັດສົ່ງດ່ວນ.',
    descriptionEn:
      'Fast turnaround document printing and copying with perfect thermal glue, wire-o, or comb binding options.',
    sizes: [
      { id: 'a4', label: 'ຂະໜາດ A4 (21x29.7 cm)', hint: 'ມາດຕະຖານເອກະສານ', add: 0 },
      { id: 'a5', label: 'ຂະໜາດ A5 (14.8x21 cm)', hint: 'ກະທັດຮັດ', add: -5 },
      { id: 'a3', label: 'ຂະໜາດ A3 (29.7x42 cm)', hint: 'ແຜ່ນພັບ/ແບບແປນ', add: 15 },
    ],
    materials: [
      { id: 'bond-80', label: 'ເຈ້ຍຖ່າຍເອກະສານ 80g (ມາດຕະຖານ)', hint: 'ຂາວສະອາດ', add: 0 },
      { id: 'bond-100', label: 'ເຈ້ຍ Smooth Bond 100g (ໜາພິເສດ)', hint: 'ບໍ່ຊຶມ', add: 4 },
      { id: 'art-130', label: 'ເຈ້ຍ Art Paper 130g (ຜິວນຽນ)', hint: 'ສີສົດໃສ', add: 8 },
    ],
    finishings: [
      { id: 'glue-bind', label: 'ເຂົ້າເລັ້ມສັນກາວຮ້ອນ (Perfect Binding)', hint: 'ປົກເຄືອບດ້ານ/ເງົາ', add: 10 },
      { id: 'wire-o', label: 'ເຂົ້າເລັ້ມສັນຫ່ວງກະດູກງູ (Wire-O)', hint: 'ເປີດໄດ້ 360°', add: 12 },
      { id: 'staple', label: 'ເຢັບມຸມມາດຕະຖານ (Saddle Stitch)', hint: 'ເຢັບແມັກ 2 ຈຸດ', add: 0 },
    ],
  },
  {
    id: 'doc-catalog-staple',
    slug: 'doc-catalog-staple',
    name: 'ແຄັດຕາລັອກ & ປຶ້ມເຢັບມຸມ (Saddle Stitch Booklet & Catalog)',
    nameEn: 'Saddle Stitch Booklet & Catalog',
    category: 'documents',
    bestseller: false,
    basePrice: 45,
    minQuantity: 10,
    image: 'doc',
    short: 'ພິມສີຄົມຊັດ ເຢັບມຸມ 2 ຈຸດ ປົກເຄືອບເງົາ/ດ້ານ ສຳລັບເມນູ & ແຄັດຕາລັອກ',
    shortEn: 'Full color brochure booklet with 2-point saddle stitch binding',
    description:
      'ງານພິມແຄັດຕາລັອກສິນຄ້າ ເມນູອາຫານ ຄູ່ມື ພິມສີ CMYK ລະອຽດສູງ ເຢັບມຸມແຂງແຮງ.',
    descriptionEn:
      'Brochure and booklet printing on high-grade silk paper with saddle stitch binding.',
    sizes: [
      { id: 'a4', label: 'ຂະໜາດ A4 (21x29.7 cm)', hint: 'ມາດຕະຖານ', add: 0 },
      { id: 'a5', label: 'ຂະໜາດ A5 (14.8x21 cm)', hint: 'ກະທັດຮັດ', add: -10 },
    ],
    materials: [
      { id: 'art-160', label: 'ເຈ້ຍ Art Paper 160g (ມາດຕະຖານ)', hint: '', add: 0 },
      { id: 'art-200', label: 'ເຈ້ຍ Art Paper 200g (ພຣີມ້ຽມ)', hint: '', add: 8 },
    ],
    finishings: [
      { id: 'staple', label: 'ເຢັບມຸມມາດຕະຖານ (Saddle Stitch)', hint: '', add: 0 },
      { id: 'wire-o', label: 'ສັນຫ່ວງກະດູກງູ (Wire-O)', hint: '', add: 15 },
    ],
  },
  {
    id: 'doc-hardcover-book',
    slug: 'doc-hardcover-book',
    name: 'ປຶ້ມປົກແຂງ & ລາຍງານປະຈຳປີ (Hardcover Corporate Book)',
    nameEn: 'Hardcover Corporate Book',
    category: 'documents',
    bestseller: false,
    basePrice: 75,
    minQuantity: 5,
    image: 'doc',
    short: 'ປົກແຂງຈົ່ວປັງຫຼູຫຼາ ປ້ຳຟອຍຄຳ/ເງິນ ສຳລັບລາຍງານປະຈຳປີ ແລະ ປຶ້ມທີ່ລະນຶກ',
    shortEn: 'Hardcover luxury book with gold foil stamping for annual reports',
    description:
      'ງານພິມປຶ້ມປົກແຂງຄຸນນະພາບສູງ ປົກແຂງຈົ່ວປັງເບີ 24 ເຄືອບດ້ານ Soft-Touch ປ້ຳຟອຍຄຳ ໜ້າໃນພິມສີຄົມຊັດ ເຂົ້າເລັ້ມແຂງແຮງທົນທານ.',
    descriptionEn:
      'Premium hardcover book binding with hot foil stamping, ideal for annual reports and memorial books.',
    sizes: [
      { id: 'a4', label: 'ຂະໜາດ A4 (21x29.7 cm)', hint: 'ມາດຕະຖານ', add: 0 },
      { id: 'b5', label: 'ຂະໜາດ B5 (17.6x25 cm)', hint: 'ຂະໜາດປຶ້ມສາກົນ', add: -5 },
    ],
    materials: [
      { id: 'art-130', label: 'ໜ້າໃນ Art Paper 130g (ມາດຕະຖານ)', hint: '', add: 0 },
      { id: 'green-read-80', label: 'ໜ້າໃນ Green Read 80g (ຖະໜອມສາຍຕາ)', hint: '', add: 2 },
    ],
    finishings: [
      { id: 'foil-gold', label: 'ປົກແຂງປ້ຳຟອຍຄຳ (Gold Foil Stamping)', hint: 'ຫຼູຫຼາ', add: 15 },
      { id: 'matte', label: 'ປົກແຂງເຄືອບດ້ານ (Matte Lamination)', hint: '', add: 0 },
    ],
  },

  // ==========================================
  // 2. ງານພິມຮູບພາບ (Photo Prints & Albums)
  // ==========================================
  {
    id: 'album-classic',
    slug: 'album-classic',
    name: 'ອັນບັ້ມຮູບພາບປົກແຂງພຣີມ້ຽມ (Hardcover Photobook)',
    nameEn: 'Hardcover Photobook',
    category: 'photos',
    bestseller: true,
    basePrice: 50,
    isOnDemand: true,
    minQuantity: 1,
    image: 'album',
    short: 'ປົກແຂງເຄືອບດ່ານ/ເງົາ ພິມສີລະອຽດສູງ ເປີດກາງໄດ້ 180°',
    shortEn: 'Hardcover layflat photobook with premium matte/gloss lamination',
    description:
      'ອັນບັ້ມຮູບພາບລະດັບພຣີມ້ຽມ ເຂົ້າເລັ້ມປົກແຂງຢ່າງດີ ໜ້າໃນໃຊ້ເຈ້ຍ Art Paper 260g ສີສັນສົດໃສ ເປີດກາງຮາບພຽງໄດ້ 180 ອົງສາ.',
    descriptionEn:
      'Luxury photobook with rigid hardcover and layflat 180-degree binding on 260g art paper.',
    sizes: [
      { id: '8x8', label: '8x8 ນິ້ວ (ມາດຕະຖານ)', hint: '20x20 cm', add: 0 },
      { id: '8x10', label: '8x10 ນິ້ວ (ແນວຕັ້ງ)', hint: '20x25 cm', add: 8 },
      { id: '10x10', label: '10x10 ນິ້ວ (ຂະໜາດໃຫຍ່)', hint: '25x25 cm', add: 15 },
      { id: '12x12', label: '12x12 ນິ້ວ (Pro Max)', hint: '30x30 cm', add: 25 },
    ],
    materials: [
      { id: 'art-200', label: 'Art Card 200g (ມາດຕະຖານ)', hint: 'ໜາພໍດີ', add: 0 },
      { id: 'art-260', label: 'Art Card 260g (ພຣີມ້ຽມ)', hint: 'ໜາພິເສດ', add: 6 },
      { id: 'pearl-300', label: 'Pearl Metallic 300g (ຫຼູຫຼາ)', hint: 'ຜິວເຫຼືອບມຸກ', add: 14 },
    ],
    finishings: [
      { id: 'matte', label: 'ເຄືອບດ້ານ (Matte Lamination)', hint: 'ນຽນນຸ່ມ ບໍ່ສະທ້ອນແສງ', add: 0 },
      { id: 'gloss', label: 'ເຄືອບເງົາ (Gloss Lamination)', hint: 'ສີສັນສົດໃສ', add: 0 },
      { id: 'foil-gold', label: 'ປ້ຳຟອຍຄຳ (Gold Foil Stamping)', hint: 'ປ້ຳຄຳປົກໜ້າ', add: 12 },
    ],
  },
  {
    id: 'album-mini',
    slug: 'album-mini',
    name: 'ມິນິໂຟໂຕ້ບຸກ (Pocket Photobook)',
    nameEn: 'Mini Pocket Photobook',
    category: 'photos',
    bestseller: false,
    basePrice: 35,
    isOnDemand: true,
    minQuantity: 1,
    image: 'album',
    short: 'ຂະໜາດກະທັດຮັດ ພົກພາງ່າຍ ເໝາະສຳລັບຂອງຂວັນ',
    shortEn: 'Compact size easy to carry, ideal for personalized gifts',
    description:
      'ອັນບັ້ມຂະໜາດພົກພາ ເຂົ້າເລັ້ມສັນກາວຮ້ອນ ພິມສີຄົມຊັດ ເໝາະສຳລັບຮູບທ່ອງທ່ຽວ ຫຼື ຂອງຂວັນວັນເກີດ.',
    descriptionEn:
      'Compact photobook with softcover glue binding, perfect for travel memories and souvenirs.',
    sizes: [
      { id: '5x5', label: '5x5 ນິ້ວ (Pocket Mini)', hint: '13x13 cm', add: 0 },
      { id: '6x6', label: '6x6 ນິ້ວ (Square)', hint: '15x15 cm', add: 4 },
      { id: '6x8', label: '6x8 ນິ້ວ (A5 Landscape)', hint: '15x20 cm', add: 7 },
    ],
    materials: [
      { id: 'art-200', label: 'Art Paper 200g (ມາດຕະຖານ)', hint: 'ພິມສອງໜ້າ', add: 0 },
      { id: 'art-260', label: 'Art Paper 260g (ພຣີມ້ຽມ)', hint: 'ສີສົດຄົມຊັດ', add: 5 },
    ],
    finishings: [
      { id: 'matte', label: 'ເຄືອບດ້ານ (Matte)', hint: '', add: 0 },
      { id: 'gloss', label: 'ເຄືອບເງົາ (Gloss)', hint: '', add: 0 },
    ],
  },
  {
    id: 'frame-acrylic-block',
    slug: 'frame-acrylic-block',
    name: 'ກອບຮູບອາຄຣີລິກບລັອກພຣີມ້ຽມ (Acrylic Block Frame)',
    nameEn: 'Acrylic Block Frame',
    category: 'photos',
    bestseller: true,
    basePrice: 65,
    isOnDemand: true,
    minQuantity: 1,
    image: 'frame',
    short: 'ອາຄຣີລິກແທ້ໜາ 20mm ຕັ້ງໂຕະໄດ້ ໃສຄືແກ້ວຄຣິສຕັລ',
    shortEn: '20mm thick freestanding crystal clear acrylic photo block',
    description:
      'ກອບຮູບອາຄຣີລິກແທ້ຄວາມໜາ 20mm ຕັ້ງໂຕະໄດ້ໂດຍບໍ່ຕ້ອງໃຊ້ຂາຕັ້ງ ພິມຮູບລະອຽດສູງດ້ານຫຼັງ ເບິ່ງມີມິຕິຫຼູຫຼາ.',
    descriptionEn:
      'Ultra-clear 20mm acrylic photo block with high-definition back UV printing, freestanding and luxury finish.',
    sizes: [
      { id: '4x6', label: '4x6 ນິ້ວ (ມາດຕະຖານຕັ້ງໂຕະ)', hint: '10x15 cm', add: 0 },
      { id: '5x7', label: '5x7 ນິ້ວ (ຂະໜາດຍອດນິຍົມ)', hint: '13x18 cm', add: 12 },
      { id: '6x8', label: '6x8 ນິ້ວ (A5)', hint: '15x20 cm', add: 20 },
      { id: '8x10', label: '8x10 ນິ້ວ (Executive)', hint: '20x25 cm', add: 35 },
    ],
    materials: [
      { id: 'acrylic-clear', label: 'ອາຄຣີລິກໃສ (Crystal Clear)', hint: 'ໃສພິເສດ', add: 0 },
      { id: 'acrylic-magnetic', label: 'ອາຄຣີລິກແມ່ເຫຼັກ 2 ຊັ້ນ (Magnetic)', hint: 'ປ່ຽນຮູບໄດ້', add: 18 },
    ],
    finishings: [
      { id: 'diamond-polish', label: 'ຂັດຂອບ Diamond Polish', hint: 'ຂອບໃສເຫຼືອບມົນ', add: 0 },
    ],
  },
  {
    id: 'photo-print-card',
    slug: 'photo-print-card',
    name: 'ຮູບພາບພຣີມ້ຽມ & ໂປສກາດຮູບ (Premium Photo Card & Postcard)',
    nameEn: 'Premium Photo Card & Postcard',
    category: 'photos',
    bestseller: false,
    basePrice: 15,
    isOnDemand: true,
    minQuantity: 1,
    image: 'card',
    short: 'ພິມຮູບພາບເທິງເຈ້ຍ Art Card 350g ສີສັນສົດໃສ ເຄືອບກັນນ້ຳ',
    shortEn: '350g Art card high definition photo prints with water-resistant lamination',
    description:
      'ພິມຮູບຖ່າຍຄຸນນະພາບສູງ ໂປສກາດຮູບພາບທີ່ລະນຶກ ເຈ້ຍ Art Card 350g ເຄືອບດ້ານ Soft-Touch ຫຼື ເຄືອບເງົາ.',
    descriptionEn:
      'High definition photo printing on 350g heavy cardstock, with matte or gloss protective lamination.',
    sizes: [
      { id: '4x6', label: '4x6 ນິ້ວ (ຈັມໂບ້)', hint: '10x15 cm', add: 0 },
      { id: '5x7', label: '5x7 ນິ້ວ', hint: '13x18 cm', add: 5 },
      { id: 'a4', label: 'A4 (8.3x11.7 ນິ້ວ)', hint: '21x29.7 cm', add: 15 },
    ],
    materials: [
      { id: 'art-350', label: 'Art Card 350g (ມາດຕະຖານ)', hint: '', add: 0 },
      { id: 'pearl-300', label: 'Pearl Metallic 300g (ຫຼູຫຼາ)', hint: 'ເຫຼືອບມຸກ', add: 10 },
    ],
    finishings: [
      { id: 'matte', label: 'ເຄືອບດ້ານ (Matte)', hint: '', add: 0 },
      { id: 'gloss', label: 'ເຄືອບເງົາ (Gloss)', hint: '', add: 0 },
      { id: 'foil-gold', label: 'ປ້ຳຟອຍຄຳ (Gold Foil)', hint: '', add: 10 },
    ],
  },

  // ==========================================
  // 3. ງານສະຕິກເກີ & ສະຫຼາກສິນຄ້າ (Stickers & Labels)
  // ==========================================
  {
    id: 'sticker-pp-waterproof',
    slug: 'sticker-pp-waterproof',
    name: 'ສະຕິກເກີ PP ຂາວເງົາກັນນ້ຳ 100% (Waterproof PP Sticker)',
    nameEn: 'Waterproof PP Sticker',
    category: 'stickers',
    bestseller: true,
    basePrice: 30,
    isOnDemand: true,
    minQuantity: 1,
    image: 'sticker',
    short: 'ກັນນ້ຳ 100% ແຊ່ຕູ້ເຢັນໄດ້ ໄດຄັດຄົມຊັດ ພ້ອມລອກຕິດ',
    shortEn: '100% waterproof and freeze-proof with precision kiss-cut',
    description:
      'ສະຕິກເກີເນື້ອ PP ຂາວເງົາ ກັນນ້ຳ ກັນນ້ຳມັນ ທົນອຸນຫະພູມຕິດລົບ ໄດຄັດຕາມຮູບຊົງໂລໂກ້ ພ້ອມລອກຕິດງ່າຍດາຍ.',
    descriptionEn:
      'High quality PP vinyl sticker, 100% waterproof and freezer safe, precision kiss-cut to any custom shape.',
    sizes: [
      { id: 'a3-plus', label: 'ແຜ່ນ A3+ (32x48 cm)', hint: 'ໄດ້ສະຕິກເກີ 30-100 ດວງ/ແຜ່ນ', add: 0 },
      { id: 'a4', label: 'ແຜ່ນ A4 (21x29.7 cm)', hint: 'ໄດ້ສະຕິກເກີ 15-40 ດວງ/ແຜ່ນ', add: -10 },
      { id: 'diecut-single', label: 'ໄດຄັດແຍກດວງ (Single Die-Cut)', hint: 'ຕັດຂາດເປັນດວງໆ', add: 15 },
    ],
    materials: [
      { id: 'pp-gloss', label: 'PP ຂາວເງົາ (Glossy PP)', hint: 'ສີສົດເງົາງາມ', add: 0 },
      { id: 'pp-matte', label: 'PP ຂາວດ້ານ (Matte PP)', hint: 'ຫຼູຫຼາ ນຽນມື', add: 3 },
      { id: 'pp-clear', label: 'PP ໃສ (Transparent PP)', hint: 'ໂປ່ງໃສເຫັນສິນຄ້າ', add: 6 },
    ],
    finishings: [
      { id: 'kiss-cut', label: 'ໄດຄັດ 50% ພ້ອມລອກ (Kiss-cut Sheet)', hint: 'ລອກຕິດງ່າຍ', add: 0 },
      { id: 'die-cut-100', label: 'ໄດຄັດ 100% ຕັດຂາດ (Die-cut Single)', hint: 'ແຈກເປັນດວງ', add: 5 },
      { id: 'foil-gold', label: 'ປ້ຳຟອຍຄຳ (Gold Foil Stamping)', hint: 'ຫຼູຫຼາພຣີມ້ຽມ', add: 15 },
    ],
  },
  {
    id: 'sticker-kraft',
    slug: 'sticker-kraft',
    name: 'ສະຕິກເກີເຈ້ຍຄຣາຟ Vintage (Kraft Paper Sticker)',
    nameEn: 'Kraft Paper Sticker',
    category: 'stickers',
    bestseller: false,
    basePrice: 28,
    isOnDemand: true,
    minQuantity: 1,
    image: 'sticker',
    short: 'ສະຕິກເກີສີນ້ຳຕານຄຣາຟ ສາຍ Eco-Friendly ທຳມະຊາດ',
    shortEn: 'Brown rustic kraft paper stickers for eco-friendly branding',
    description:
      'ສະຕິກເກີເນື້ອເຈ້ຍຄຣາຟສີນ້ຳຕານ Vintage ໃຫ້ຄວາມຮູ້ສຶກແບບທຳມະຊາດ ອໍແກນິກ ເໝາະສຳລັບຮ້ານກາເຟ ແລະ ເບເກີຣີ່.',
    descriptionEn:
      'Rustic eco-friendly brown kraft sticker sheets with strong adhesive, perfect for bakery and cafe packaging.',
    sizes: [
      { id: 'a3-plus', label: 'ແຜ່ນ A3+ (32x48 cm)', hint: 'ມາດຕະຖານ', add: 0 },
      { id: 'a4', label: 'ແຜ່ນ A4 (21x29.7 cm)', hint: '', add: -8 },
    ],
    materials: [
      { id: 'kraft-brown', label: 'ເຈ້ຍຄຣາຟສີນ້ຳຕານ (Kraft Brown)', hint: '', add: 0 },
    ],
    finishings: [
      { id: 'kiss-cut', label: 'ໄດຄັດ 50% (Kiss-cut)', hint: 'ມາດຕະຖານ', add: 0 },
    ],
  },
  {
    id: 'sticker-diecut-single',
    slug: 'sticker-diecut-single',
    name: 'ສະຕິກເກີ PVC ໄດຄັດແຍກດວງ (Single Die-Cut Vinyl Sticker)',
    nameEn: 'Single Die-Cut Vinyl Sticker',
    category: 'stickers',
    bestseller: false,
    basePrice: 35,
    isOnDemand: true,
    minQuantity: 1,
    image: 'sticker',
    short: 'ຕັດຂາດເປັນດວງໆ ເນື້ອ PVC ໜາພິເສດ ທົນແດດ ທົນຝົນ ແຈກງ່າຍ',
    shortEn: 'Individually cut outdoor vinyl stickers, UV and weatherproof',
    description:
      'ສະຕິກເກີ PVC ຕັດຂາດ 100% ແຍກດວງ ເໝາະສຳລັບແຈກໃນງານອີເວັ້ນ ຕິດລົດ ຕິດແລັບທັອບ ທົນທານກາງແຈ້ງ 3-5 ປີ.',
    descriptionEn:
      'Heavy-duty vinyl stickers individually die-cut to shape, outdoor weather-resistant and UV protected.',
    sizes: [
      { id: '5x5cm', label: '5x5 cm (ດວງນ້ອຍ)', hint: '', add: 0 },
      { id: '7x7cm', label: '7x7 cm (ດວງກາງ)', hint: '', add: 5 },
      { id: '10x10cm', label: '10x10 cm (ດວງໃຫຍ່)', hint: '', add: 10 },
    ],
    materials: [
      { id: 'pvc-heavy', label: 'PVC Vinyl Heavy Duty (ທົນທານສູງ)', hint: '', add: 0 },
      { id: 'hologram', label: 'Hologram Laser (ເຫຼືອບສາຍຮຸ້ງ)', hint: 'ຫຼູຫຼາ', add: 15 },
    ],
    finishings: [
      { id: 'matte', label: 'ເຄືອບດ້ານ (Matte Outdoor)', hint: '', add: 0 },
      { id: 'gloss', label: 'ເຄືອບເງົາ (Gloss Outdoor)', hint: '', add: 0 },
    ],
  },
]

export const getCategory = (slug?: string) => CATEGORIES.find((c) => c.slug === slug)
export const getProduct = (slug?: string) => PRODUCTS.find((p) => p.slug === slug)
export const getBestsellers = () => PRODUCTS.filter((p) => p.bestseller)
export const getProductsByCategory = (catSlug?: string) =>
  PRODUCTS.filter((p) => p.category === catSlug)
