// ============================================================
// Som Sing Phim (ສົມສິ່ງພິມ) — Product Catalog & Config Catalog
// Pure Lao & English specifications. No emojis.
// ============================================================

export interface SpecOption {
  id: string
  label: string
  labelEn?: string
  hint: string
  hintEn?: string
  add: number
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
}

export interface Product {
  id: string
  slug: string
  name: string
  nameEn?: string
  category: string
  bestseller: boolean
  basePrice: number
  image: string
  short: string
  shortEn?: string
  description: string
  descriptionEn?: string
  sizes: SpecOption[]
  materials: SpecOption[]
  finishings: SpecOption[]
}

export const CATEGORIES: Category[] = [
  {
    id: 'albums',
    slug: 'albums',
    name: 'ອັນບັ້ມຮູບພາບພຣີມ້ຽມ',
    nameEn: 'Photo Albums',
    short: 'ອັນບັ້ມຮູບພາບພຣີມ້ຽມ',
    shortEn: 'Premium Photo Albums',
    tagline: 'ພິມອັນບັ້ມຮູບຄຸນນະພາບສູງ ຫຼາກຫຼາຍຮູບແບບປົກ',
    taglineEn: 'High quality photo albums with diverse cover finishes',
    icon: 'album',
    description:
      'ອັນບັ້ມຮູບພາບພຣີມ້ຽມ ພິມດ້ວຍເຄື່ອງພິມດິຈິຕອນມາດຕະຖານສູງ ເຈ້ຍ Art Card ປົກແຂງ/ປົກສັນກາວ ຄົມຊັດສີສັນສົດໃສ.',
    descriptionEn:
      'Premium photo albums printed on high quality art card paper with hardcover and softcover options.',
  },
  {
    id: 'frames',
    slug: 'frames',
    name: 'ກອບຮູບອາຄຣີລິກ & ຕົກແຕ່ງ',
    nameEn: 'Acrylic Frames',
    short: 'ກອບຮູບອາຄຣີລິກ & ຕົກແຕ່ງ',
    shortEn: 'Acrylic Frames & Decor',
    tagline: 'ກອບອາຄຣີລິກໃສລະດັບພຣີມ້ຽມ ຕົກແຕ່ງບ້ານ & ສຳນັກງານ',
    taglineEn: 'Crystal clear luxury acrylic frames for gifts and home decor',
    icon: 'frame',
    description:
      'ກອບຮູບອາຄຣີລິກໂປ່ງໃສ ພິມລະອຽດສູງດ້ານຫຼັງແຜ່ນອາຄຣີລິກ ທົນທານ ກັນຮອຍ ກັນນ້ຳ 100%.',
    descriptionEn:
      'High-grade acrylic photo frames with direct reverse UV printing, water and scratch resistant.',
  },
  {
    id: 'stickers',
    slug: 'stickers',
    name: 'ສະຕິກເກີໄດຄັດ & ສະຫຼາກສິນຄ້າ',
    nameEn: 'Cutout Stickers & Labels',
    short: 'ສະຕິກເກີໄດຄັດ & ສະຫຼາກສິນຄ້າ',
    shortEn: 'Custom Die-cut Stickers',
    tagline: 'ສະຕິກເກີ PP ກັນນ້ຳ ໄດຄັດຄົມຊັດ ຕິດແໜ້ນທົນທານ',
    taglineEn: 'Waterproof PP stickers, precision die-cut and strong adhesive',
    icon: 'sticker',
    description:
      'ສະຕິກເກີໄດຄັດຕາມຮູບຊົງ ວັດສະດຸ PP ຂາວເງົາ/ຂາວດ້ານ ກັນນ້ຳ ແຊ່ຕູ້ເຢັນໄດ້ ຕັດແຍກແຜ່ນ ຫຼື ແຜ່ນໃຫຍ່.',
    descriptionEn:
      'Custom shape stickers printed on waterproof PP vinyl, freezer-safe, precision kiss-cut and die-cut.',
  },
  {
    id: 'cards',
    slug: 'cards',
    name: 'ບັດເຊີນ & ໂປສກາດທີ່ລະນຶກ',
    nameEn: 'Cards & Postcards',
    short: 'ບັດເຊີນ & ໂປສກາດທີ່ລະນຶກ',
    shortEn: 'Invitation & Postcards',
    tagline: 'ບັດເຊີນງານດອງ ງານບຸນ ໂປສກາດ ປ້ຳຟອຍຄຳຫຼູຫຼາ',
    taglineEn: 'Wedding invitations and memorial postcards with gold foil stamping',
    icon: 'card',
    description:
      'ບັດເຊີນ ແລະ ໂປສກາດທີ່ລະນຶກ ພິມເທິງເຈ້ຍ Art Card 300-350g ເຄືອບ Matte/Gloss ປ້ຳຟອຍຄຳ Foil Gold.',
    descriptionEn:
      'Invitation cards and postcards printed on premium 350g art board with optional hot gold stamping.',
  },
  {
    id: 'documents',
    slug: 'documents',
    name: 'ປຶ້ມ, ວາລະສານ & ເອກະສານ',
    nameEn: 'Booklets & Documents',
    short: 'ປຶ້ມ, ວາລະສານ & ເອກະສານ',
    shortEn: 'Books & Catalogs',
    tagline: 'ພິມປຶ້ມ ເອກະສານອົງກອນ ເຂົ້າເລົ່ມສັນກາວ/ສັນຫ່ວງ',
    taglineEn: 'Corporate catalogs, books and training materials with fast delivery',
    icon: 'book',
    description:
      'ງານພິມປຶ້ມ ວາລະສານ ລາຍງານປະຈຳປີ ເຂົ້າເລົ່ມສັນກາວ ເຢັບມຸມ ຫຼື ສັນຫ່ວງກະດູກງູ ຈັດສົ່ງດ່ວນ.',
    descriptionEn:
      'Catalog and magazine printing with perfect glue binding, saddle stitching or wire-o binding.',
  },
]

export const PRODUCTS: Product[] = [
  // ---------- Albums ----------
  {
    id: 'album-classic',
    slug: 'album-classic',
    name: 'ອັນບັ້ມຮູບພາບປົກແຂງພຣີມ້ຽມ (Hardcover Photobook)',
    nameEn: 'Hardcover Photobook',
    category: 'albums',
    bestseller: true,
    basePrice: 50,
    image: 'album',
    short: 'ປົກແຂງເຄືອບດ່ານ/ເງົາ ພິມສີລະອຽດສູງ ເປີດກາງໄດ້ 180°',
    shortEn: 'Hardcover layflat photobook with premium matte/gloss lamination',
    description:
      'ອັນບັ້ມຮູບພາບລະດັບພຣີມ້ຽມ ເຂົ້າເລົ່ມປົກແຂງຢ່າງດີ ໜ້າໃນໃຊ້ເຈ້ຍ Art Paper 260g ສີສັນສົດໃສ ເປີດກາງຮາບພຽງໄດ້ 180 ອົງສາ.',
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
    category: 'albums',
    bestseller: false,
    basePrice: 35,
    image: 'album',
    short: 'ຂະໜາດກະທັດຮັດ ພົກພາງ່າຍ ເໝາະສຳລັບຂອງຂວັນ',
    shortEn: 'Compact size easy to carry, ideal for personalized gifts',
    description:
      'ອັນບັ້ມຂະໜາດພົກພາ ເຂົ້າເລົ່ມສັນກາວຮ້ອນ ພິມສີຄົມຊັດ ເໝາະສຳລັບຮູບທ່ອງທ່ຽວ ຫຼື ຂອງຂວັນວັນເກີດ.',
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

  // ---------- Stickers ----------
  {
    id: 'sticker-pp-waterproof',
    slug: 'sticker-pp-waterproof',
    name: 'ສະຕິກເກີ PP ຂາວເງົາກັນນ້ຳ 100% (Waterproof PP Sticker)',
    nameEn: 'Waterproof PP Sticker',
    category: 'stickers',
    bestseller: true,
    basePrice: 30,
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

  // ---------- Frames ----------
  {
    id: 'frame-acrylic-block',
    slug: 'frame-acrylic-block',
    name: 'ກອບຮູບອາຄຣີລິກບລັອກພຣີມ້ຽມ (Acrylic Block Frame)',
    nameEn: 'Acrylic Block Frame',
    category: 'frames',
    bestseller: true,
    basePrice: 65,
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

  // ---------- Cards ----------
  {
    id: 'card-gold-foil',
    slug: 'card-gold-foil',
    name: 'ບັດເຊີນປ້ຳຟອຍຄຳພຣີມ້ຽມ (Gold Foil Invitation Card)',
    nameEn: 'Gold Foil Invitation Card',
    category: 'cards',
    bestseller: true,
    basePrice: 40,
    image: 'card',
    short: 'ເຈ້ຍ Art Card 350g ປ້ຳຟອຍຄຳຫຼູຫຼາ ພ້ອມຊອງໃສ່',
    shortEn: '350g Art card with metallic gold foil stamping and envelopes',
    description:
      'ບັດເຊີນງານດອງ ງານບຸນ ບັດອວຍພອນ ພິມເທິງເຈ້ຍ Art Card 350g ເຄືອບດ້ານ Soft-Touch ປ້ຳຟອຍຄຳຄົມຊັດ.',
    descriptionEn:
      'Luxury invitation cards printed on 350g heavy board with soft-touch matte lamination and hot gold foil stamping.',
    sizes: [
      { id: '4x6', label: '4x6 ນິ້ວ (ມາດຕະຖານ)', hint: '10x15 cm', add: 0 },
      { id: '5x7', label: '5x7 ນິ້ວ (ຂະໜາດຫຼູຫຼາ)', hint: '13x18 cm', add: 8 },
    ],
    materials: [
      { id: 'art-350', label: 'Art Card 350g (ມາດຕະຖານ)', hint: '', add: 0 },
      { id: 'cotton-pearl', label: 'Cotton Pearl 320g (ຫຼູຫຼາ)', hint: 'ຜິວສຳຜັດພິເສດ', add: 12 },
    ],
    finishings: [
      { id: 'foil-gold', label: 'ປ້ຳຟອຍຄຳ (Gold Foil)', hint: 'ສີທອງອະລ່າມ', add: 0 },
      { id: 'foil-rosegold', label: 'ປ້ຳຟອຍ Rose Gold', hint: 'ສີທອງຊົມພູ', add: 5 },
      { id: 'spot-uv', label: 'Spot UV ເງົາສະເພາະຈຸດ', hint: 'ເງົາສະເພາະຈຸດ', add: 8 },
    ],
  },

  // ---------- Documents ----------
  {
    id: 'doc-catalog-staple',
    slug: 'doc-catalog-staple',
    name: 'ແຄັດຕາລັອກ & ປຶ້ມເຢັບມຸມ (Saddle Stitch Catalog)',
    nameEn: 'Saddle Stitch Catalog',
    category: 'documents',
    bestseller: false,
    basePrice: 45,
    image: 'doc',
    short: 'ພິມສີຄົມຊັດ ເຢັບມຸມ 2 ຈຸດ ປົກເຄືອບເງົາ/ດ້ານ',
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
]

export const getCategory = (slug?: string) => CATEGORIES.find((c) => c.slug === slug)
export const getProduct = (slug?: string) => PRODUCTS.find((p) => p.slug === slug)
export const getBestsellers = () => PRODUCTS.filter((p) => p.bestseller)
export const getProductsByCategory = (catSlug?: string) =>
  PRODUCTS.filter((p) => p.category === catSlug)
