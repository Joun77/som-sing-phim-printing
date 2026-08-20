import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FileTextIcon,
  LayersIcon,
  SparkleIcon,
  PrinterIcon,
  PackageIcon,
  CheckIcon,
  ArrowRightIcon,
  SearchIcon,
  EyeIcon,
  XIcon,
} from '../components/icons.tsx'
import { useShop } from '../context/ShopContext.tsx'

interface PaperItem {
  id: string
  name: string
  nameEn: string
  category: 'art' | 'uncoated' | 'kraft' | 'specialty' | 'sticker'
  categoryName: string
  categoryNameEn: string
  gsm: number
  finish: string
  finishEn: string
  textureClass: string
  description: string
  descriptionEn: string
  pros: string
  prosEn: string
  cons: string
  consEn: string
  finishingCompat: string
  finishingCompatEn: string
  suitableFor: string[]
  suitableForEn: string[]
  productLink: string
  productTitle: string
}

const PAPER_DATA: PaperItem[] = [
  {
    id: '1',
    name: 'ເຈ້ຍອາດກາດ 2 ໜ້າ (Art Card)',
    nameEn: 'Double-Sided Coated Art Card',
    category: 'art',
    categoryName: 'Art Paper (ເຈ້ຍອາດ)',
    categoryNameEn: 'Art Paper & Card',
    gsm: 300,
    finish: 'ຜິວກຶ່ງມັນກຶ່ງດ້ານ ລຽບນຽນພິເສດ',
    finishEn: 'Semi-matte ultra-smooth multi-coated stock',
    textureClass: 'texture-artcard',
    description: 'ເນື້ອເຈ້ຍແໜ້ນ ໜາແຂງແຮງ ພິມສີສັນສົດໃສຄົມຊັດສູງສຸດ ນິຍົມເຄືອບ PVC ເງົາ ຫຼື ດ້ານ ເພື່ອເພີ່ມຄວາມຫຼູຫຼາ',
    descriptionEn: 'Rigid, high-density art board engineered for vibrant color reproduction and luxury finishes.',
    pros: 'ຮອງຮັບການປ້ຳນູນ (Emboss), ປ້ຳຟອຍຄຳ (Hot Foil), ເຄືອບ Spot UV ແລະ ບໍ່ຫັກແຕກເມື່ອກົດຮອຍພັບ (Creasing)',
    prosEn: 'Supports Embossing, Gold Foil, Spot UV, and creasing lines for crack-free folding.',
    cons: 'ຕ້ອງເຮັດຮອຍພັບ (Crease) ກ່ອນດັດພັບ ເພື່ອປ້ອງກັນຮອຍແຕກທີ່ສັນພັບ',
    consEn: 'Requires creasing line before folding to avoid cracking on the spine.',
    finishingCompat: 'ເຄືອບ PVC ເງົາ/ດ້ານ, Spot UV 3D, ປ້ຳຟອຍຄຳ/ເງິນ, ໄດຄັດຕາມຊົງ',
    finishingCompatEn: 'Gloss/Matte PVC, 3D Spot UV, Hot Foil Stamping, Custom Die-cut',
    suitableFor: ['ນາມບັດ VIP', 'ກ່ອງບັນຈຸພັນ', 'ປົກປຶ້ມ/ລາຍງານ', 'ບັດເຊີນງານດອງ'],
    suitableForEn: ['VIP Business Cards', 'Packaging Boxes', 'Book Covers', 'Wedding Invitations'],
    productLink: '/product/photo-print-card?paper=art-350',
    productTitle: 'ງານນາມບັດ & ການ໌ດ',
  },
  {
    id: '2',
    name: 'ເຈ້ຍອາດເງົາ (Glossy Art Paper)',
    nameEn: 'Glossy Art Paper',
    category: 'art',
    categoryName: 'Art Paper (ເຈ້ຍອາດ)',
    categoryNameEn: 'Art Paper & Card',
    gsm: 130,
    finish: 'ຜິວເງົາສະທ້ອນແສງ ສີສົດໃສ',
    finishEn: 'High-gloss dual coated sheen for radiant color depth',
    textureClass: 'texture-glossy',
    description: 'ເຈ້ຍເນື້ອລຽບເງົາ ສະທ້ອນແສງໄດ້ດີ ຊຶມຊັບນ້ຳມຶກຕ່ຳ ເຮັດໃຫ້ງານພິມສີສົດ ຄົມຊັດ ລາຄາຄຸ້ມຄ່າ',
    descriptionEn: 'High-gloss coated paper reflecting ambient light brilliantly, delivering saturated colors and sharp details.',
    pros: 'ສີສັນສົດໃສ ລາຄາປະຢັດ ນ້ຳໜັກເບົາ ເໝາະສຳລັບແຈກຈ່າຍຈຳນວນຫຼາຍ',
    prosEn: 'Vibrant graphics, economical for bulk printing, lightweight for easy distribution.',
    cons: 'ຂຽນທັບດ້ວຍບິກລູກລື່ນຍາກ ເນື່ອງຈາກຜິວເຄືອບມັນລື່ນ',
    consEn: 'Difficult to write on with ballpoint pens due to smooth glossy surface.',
    finishingCompat: 'ພັບແຜ່ນພັບ 2-3 ຕອນ, ເຄືອບວານິດເງົາ, ເຢັບແມັກເລັ້ມ',
    finishingCompatEn: 'Bi-fold / Tri-fold, Gloss Varnish, Saddle Stitch',
    suitableFor: ['ໃບປິວໂຄສະນາ', 'ໂບຣຊົວ', 'ແຜ່ນພັບ 3 ຕອນ', 'ແຄັດຕາລັອກ'],
    suitableForEn: ['Flyers', 'Brochures', 'Tri-fold Leaflets', 'Catalogs'],
    productLink: '/product/doc-copy-binding?paper=art-130',
    productTitle: 'ງານໃບປິວ & ແຜ່ນພັບ',
  },
  {
    id: '2b',
    name: 'ເຈ້ຍອາດດ້ານ (Matte Art Paper)',
    nameEn: 'Matte Art Paper',
    category: 'art',
    categoryName: 'Art Paper (ເຈ້ຍອາດ)',
    categoryNameEn: 'Art Paper & Card',
    gsm: 160,
    finish: 'ຜິວດ້ານນຽນນຸ່ມ ບໍ່ສະທ້ອນແສງ',
    finishEn: 'Silky glare-free matte texture with high print contrast',
    textureClass: 'texture-matte',
    description: 'ເນື້ອເຈ້ຍນຽນນຸ່ມ ສະບາຍຕາ ຫຼຸດແສງສະທ້ອນ ເໝາະກັບງານພິມທີ່ເນັ້ນການອ່ານງ່າຍ ແລະ ລຸກພຣີມ້ຽມ',
    descriptionEn: 'Gentle on the eyes with reduced glare, delivering high clarity and contemporary aesthetic appeal.',
    pros: 'ອ່ານສະບາຍຕາ ຜິວສຳຜັດລະມຸນ ໃຫ້ຄວາມຮູ້ສຶກທັນສະໄໝ ເບິ່ງເປັນມືອາຊີບ',
    prosEn: 'Comfortable to read, premium soft touch, modern professional appearance.',
    cons: 'ຄວາມສົດຂອງສີຈະດູຊອບກວ່າອາດເງົາເລັກນ້ອຍ',
    consEn: 'Color saturation is slightly softer than high-gloss finishes.',
    finishingCompat: 'ເຄືອບ PVC ດ້ານ, Spot UV, ເຢັບແມັກເລັ້ມ, ສັນກາວ',
    finishingCompatEn: 'Matte PVC, Spot UV, Saddle Stitch, Perfect Binding',
    suitableFor: ['ແຄັດຕາລັອກພຣີມ້ຽມ', 'ເມນູອາຫານ', 'ໂບຣຊົວອົງກອນ', 'ວາລະສານ'],
    suitableForEn: ['Luxury Catalogs', 'Restaurant Menus', 'Corporate Brochures', 'Magazines'],
    productLink: '/product/doc-catalog-staple?paper=art-160',
    productTitle: 'ງານແຄັດຕາລັອກ & ເອກະສານ',
  },
  {
    id: '3',
    name: 'ເຈ້ຍປອນຂາວ 80g (A4 Standard Bond)',
    nameEn: 'Standard White Bond Woodfree 80 GSM',
    category: 'uncoated',
    categoryName: 'Woodfree (ເຈ້ຍປອນ/A4)',
    categoryNameEn: 'Woodfree & Uncoated',
    gsm: 80,
    finish: 'ຜິວດ້ານ ລຽບນຽນທຳມະຊາດ (A4 ມາດຕະຖານ)',
    finishEn: 'Smooth uncoated natural matte surface',
    textureClass: 'texture-woodfree',
    description: 'ເຈ້ຍບໍ່ເຄືອບສານເຄມີ ເນື້ອຂາວສະອາດ ດູດຊຶມນ້ຳມຶກໄດ້ດີ ຂຽນງ່າຍ ມາດຕະຖານເອກະສານສາກົນ',
    descriptionEn: 'Pure white uncoated stock with high ink absorbency, perfect for writing, stamping, and photocopying.',
    pros: 'ຂຽນທັບດ້ວຍປາກກາ ຫຼື ປ້ຳຕາປະທັບໄດ້ງ່າຍ ອ່ານສະບາຍຕາ ຄຸ້ມຄ່າທີ່ສຸດ',
    prosEn: 'Superb writability with fountain pens and official stamps; unbeatable value.',
    cons: 'ຫາກພິມສີເຂັ້ມຫຼາຍໆ ສີອາດຈະດູດຊຶມລົງເນື້ອເຈ້ຍ ເຮັດໃຫ້ສີດຣັອບລົງເລັກນ້ອຍ',
    consEn: 'Heavy ink coverage can penetrate slightly into the fibers.',
    finishingCompat: 'ເຢັບແມັກ, ເຂົ້າເລັ້ມໄສ້ໃນ, ເຂົ້າເລັ້ມສັນຫ່ວງ',
    finishingCompatEn: 'Saddle Stitch, Perfect Glue, Wire-O Spiral',
    suitableFor: ['ຫົວຈົດໝາຍ', 'ໄສ້ໃນປຶ້ມ', 'ໃບຮັບເງິນ & ແບບຟອມ', 'ເອກະສານ A4 ທົ່ວໄປ'],
    suitableForEn: ['Letterheads', 'Book Pages & Syllabi', 'Invoices & Receipts', 'Office Documents'],
    productLink: '/product/doc-copy-binding?paper=bond-80',
    productTitle: 'ງານເອກະສານ & ປອນຂາວ',
  },
  {
    id: '3b',
    name: 'ເຈ້ຍປອນພຣີມ້ຽມ 120g (Premium Woodfree)',
    nameEn: 'Premium Woodfree 120 GSM',
    category: 'uncoated',
    categoryName: 'Woodfree (ເຈ້ຍປອນ/A4)',
    categoryNameEn: 'Woodfree & Uncoated',
    gsm: 120,
    finish: 'ຜິວດ້ານ ໜາແໜ້ນນຸ່ມມື',
    finishEn: 'Heavyweight smooth uncoated matte finish',
    textureClass: 'texture-woodfree',
    description: 'ເຈ້ຍປອນຄວາມໜາພິເສດ ໃຫ້ຄວາມຕຶງ ແລະ ແຂງແຮງກວ່າເຈ້ຍ A4 ທົ່ວໄປ ເໝາະກັບເອກະສານສຳຄັນ',
    descriptionEn: 'Heavyweight uncoated stock with excellent rigidity and formal presence.',
    pros: 'ນ້ຳມຶກບໍ່ຊຶມທະລຸຫຼັງງ່າຍ ໃຫ້ຄວາມໜ້າເຊື່ອຖືສູງ',
    prosEn: 'Prevents ink bleed-through; projects prestige and authenticity.',
    cons: 'ລາຄາສູງກວ່າປອນ 80g ເລັກນ້ອຍ',
    consEn: 'Slightly higher cost than standard 80g paper.',
    finishingCompat: 'ພັບແຜ່ນພັບ, ປ້ຳຈົມ, ພິມຕາປະທັບ',
    finishingCompatEn: 'Folding, Debossing, Rubber Stamping',
    suitableFor: ['ເອກະສານສັນຍາສຳຄັນ', 'ຊອງຈົດໝາຍພຣີມ້ຽມ', 'ໃບປະກາດສະນີຍະບັດ'],
    suitableForEn: ['Legal Contracts', 'Premium Envelopes', 'Certificates of Merit'],
    productLink: '/product/doc-copy-binding?paper=bond-100',
    productTitle: 'ງານເອກະສານພຣີມ້ຽມ & ໃບປະກາດ',
  },
  {
    id: '4',
    name: 'ເຈ້ຍຄຣາຟສີນ້ຳຕານ (Eco Brown Kraft)',
    nameEn: 'Eco Brown Kraft Stock',
    category: 'kraft',
    categoryName: 'Kraft (ເຈ້ຍຄຣາຟ)',
    categoryNameEn: 'Kraft Eco Stock',
    gsm: 250,
    finish: 'ຜິວສາກສີນ້ຳຕານ ເສັ້ນໃຍໄມ້ທຳມະຊາດ (Vintage Look)',
    finishEn: 'Textured earthy brown recycled wood fiber',
    textureClass: 'texture-kraft',
    description: 'ເຈ້ຍຣີໄຊເຄິລเหนຽວພິເສດ ໃຫ້ລຸກຮັກສິ່ງແວດລ້ອມ (Eco-friendly) ສາຍຄາເຟ ແລະ ແບຣນອໍແກນິກ',
    descriptionEn: 'High-tensile organic wood fiber sheet providing an authentic rustic, eco-conscious presentation.',
    pros: 'ທົນທານ เหนຽວ ໃຫ້ຄວາມຮູ້ສຶກວິນເທຈ ຮັກໂລກ ມີເອກະລັກ',
    prosEn: 'High tear resistance, organic vintage charm, biodegradable.',
    cons: 'ພິມສີພາດສະເທລຍາກ ເນື່ອງຈາກພື້ນເຈ້ຍເປັນສີນ້ຳຕານ',
    consEn: 'Pastel and light tints may shift hue due to brown substrate.',
    finishingCompat: 'ປ້ຳຈົມ, ປ້ຳຟອຍສີດຳ/ສີທອງ, ໄດຄັດເຈາະຮູ',
    finishingCompatEn: 'Deboss, Black/Gold Foil, Die-cut Hole Punching',
    suitableFor: ['ຖົງເຈ້ຍ', 'ປ້າຍແທັກສິນຄ້າ', 'ກ່ອງສິນຄ້າອໍແກນິກ', 'ເມນູຄາເຟ'],
    suitableForEn: ['Apparel Hangtags', 'Eco Shopping Bags', 'Cafe Menus', 'Organic Packaging'],
    productLink: '/product/sticker-kraft?paper=kraft',
    productTitle: 'ງານປ້າຍແທັກ & ຄຣາຟ',
  },
  {
    id: '5',
    name: 'ອາດກາດເຄືອບກຳມະຫຍີ່ Soft-Touch (Velvet)',
    nameEn: 'Velvet Soft-Touch Luxury Card',
    category: 'specialty',
    categoryName: 'Specialty Card (ເຈ້ຍພິເສດ)',
    categoryNameEn: 'Specialty & Luxury Cards',
    gsm: 350,
    finish: 'ຜິວດ້ານນຸ່ມນວນຄືກຳມະຫຍີ່ (Ultra Luxury)',
    finishEn: 'Ultra-plush velvet suede texture with zero reflection',
    textureClass: 'texture-velvet',
    description: 'ເຈ້ຍອາດກາດໜາພິເສດ ເຄືອບຟີມ Soft-Touch ສຳຜັດນຸ່ມເລິກ ບໍ່ສະທ້ອນແສງ ໃຫ້ຄວາມຮູ້ສຶກຫຼູຫຼາລະດັບໄຮເອນ',
    descriptionEn: 'Heavyweight art card wrapped in soft-touch velvet film for an unforgettable tactile impression.',
    pros: 'ສຳຜັດພຣີມ້ຽມ ນຸ່ມນວນ ໂດດເດັ່ນສູງສຸດເມື່ອເຮັດ Spot UV 3D ຫຼື ປ້ຳຟອຍທອງ',
    prosEn: 'Unrivaled suede tactile feel, breathtaking contrast when paired with 3D Spot UV and gold stamping.',
    cons: 'ຕົ້ນທຶນສູງກວ່າການເຄືອບ PVC ດ້ານທົ່ວໄປ',
    consEn: 'Higher production cost compared to standard matte laminations.',
    finishingCompat: 'Spot UV 3D, ປ້ຳຟອຍທອງ/ເງິນ/Rose Gold, ໄດຄັດມຸມມົນ',
    finishingCompatEn: '3D Spot UV, Hot Foil (Gold/Silver/Rose), Rounded Corners',
    suitableFor: ['ນາມບັດ VIP ຜູ້ບໍລິຫານ', 'ບັດເຊີນຫຼູ', 'ກ່ອງນ້ຳຫອມ/ເຄື່ອງສຳອາງ'],
    suitableForEn: ['Executive VIP Cards', 'Gala Invitations', 'Luxury Perfume Boxes'],
    productLink: '/product/photo-print-card?paper=art-350',
    productTitle: 'ງານນາມບັດ VIP & ກ່ອງຫຼູ',
  },
  {
    id: '6',
    name: 'ສະຕິກເກີ PP Vinyl ຂາວເງົາ/ດ້ານ (PP Sticker)',
    nameEn: '100% Waterproof PP Vinyl Sticker',
    category: 'sticker',
    categoryName: 'Sticker (ສະຕິກເກີ)',
    categoryNameEn: 'Stickers & Labels',
    gsm: 120,
    finish: 'ຜິວພລາສຕິກກັນນ້ຳ 100% ທົນທານສູງ',
    finishEn: '100% waterproof tear-proof synthetic PP vinyl film',
    textureClass: 'texture-sticker',
    description: 'ສະຕິກເກີເນື້ອພລາສຕິກ PP ສີຂາວເງົາ/ດ້ານ ຫຼື ເນື້ອໃສ (Clear) ສີບໍ່ຫຼຸດລອກ ແຊ່ຕູ້ເຢັນ ແລະ ແຊ່ນ້ຳກ້ອນໄດ້',
    descriptionEn: 'Tear-proof waterproof synthetic film with food-grade industrial adhesive, freezer, oil, and microwave proof.',
    pros: 'ກັນນ້ຳ 100% ແຊ່ເຢັນ/ນ້ຳກ້ອນໄດ້ ກາວຕິດແໜ້ນ ໄດຄັດລອກງ່າຍ',
    prosEn: '100% Waterproof, freezer & ice safe, peel-and-stick die-cut precision.',
    cons: 'ລາຄາສູງກວ່າສະຕິກເກີເຈ້ຍທົ່ວໄປ',
    consEn: 'Slightly higher cost than standard paper labels.',
    finishingCompat: 'ໄດຄັດຕາມຊົງ 100%, ເຄືອບກັນຮອຍຂູດຂີດ',
    finishingCompatEn: 'Custom Shape Kiss-cut, Scratch-resistant Lamination',
    suitableFor: ['ສະຫຼາກສິນຄ້າຕິດແກ້ວ/ຂວດ', 'ອາຫານແຊ່ເຢັນ & ເຄື່ອງດື່ມ', 'ສະຕິກເກີຕິດແກ້ວກາເຟ'],
    suitableForEn: ['Cosmetic & Bottle Labels', 'Frozen Foods & Cold Drinks', 'Cafe Tumbler Decals'],
    productLink: '/product/sticker-pp-waterproof?paper=pp-gloss',
    productTitle: 'ງານສະຕິກເກີ & ສະຫຼາກສິນຄ້າ',
  },
  {
    id: '7',
    name: 'ເຈ້ຍກາດເດີນລາຍຜ້າ (Linen Textured Card)',
    nameEn: 'Linen Classic Fabric Texture Card',
    category: 'specialty',
    categoryName: 'Specialty Card (ເຈ້ຍພິເສດ)',
    categoryNameEn: 'Specialty & Luxury Cards',
    gsm: 260,
    finish: 'ຜິວເດີນລາຍເສັ້ນຜ້າບາງໆ ຊົງຄຸນຄ່າ',
    finishEn: 'Embossed woven linen texture with timeless elegance',
    textureClass: 'texture-linen',
    description: 'ເຈ້ຍກາດນຳເຂົ້າທີ່ມີ Texture ລາຍເສັ້ນຜ້າຄລາສສິກ ໃຫ້ສຳຜັດມີເອກະລັກ ບໍ່ລື່ນມື',
    descriptionEn: 'Imported fine art card featuring subtle woven fabric embossing for sophisticated tactile appeal.',
    pros: 'ໃຫ້ຄວາມຮູ້ສຶກເປັນທາງການ ຫຼູຫຼາ ມີມິຕິ ບໍ່ຕ້ອງເຄືອບຟີມ',
    prosEn: 'Formal prestige feel, distinctive woven depth without needing plastic film coating.',
    cons: 'ບໍ່ເໝາະກັບການເຄືອບຟີມ PVC ທັບ ເພາະຈະບັງລາຍເສັ້ນຜ້າ',
    consEn: 'Not recommended for film lamination as it masks the delicate linen texture.',
    finishingCompat: 'ປ້ຳທອງ (Hot Foil), ປ້ຳນູນ (Emboss), ໄດຄັດ',
    finishingCompatEn: 'Hot Foil Stamping, Blind Embossing, Die-cut',
    suitableFor: ['ກາດແຕ່ງດອງ', 'ໃບປະກາດສະນີຍະບັດ', 'ນາມບັດຜູ້ບໍລິຫານ', 'ບັດເຊີນ'],
    suitableForEn: ['Wedding Invitations', 'Certificates of Merit', 'Doctor/Attorney Cards'],
    productLink: '/product/photo-print-card?paper=art-350',
    productTitle: 'ງານກາດລາຍຜ້າ & ບັດເຊີນ',
  },
  {
    id: '8',
    name: 'ເຈ້ຍກາດເຫຼືອບມຸກ (Pearl Metallic Card)',
    nameEn: 'Pearl Metallic Card',
    category: 'specialty',
    categoryName: 'Specialty Card (ເຈ້ຍພິເສດ)',
    categoryNameEn: 'Specialty & Luxury Cards',
    gsm: 280,
    finish: 'ປະກາຍມຸກແວວວາວ ສະທ້ອນແສງລະຍິບລະຍັບ',
    finishEn: 'Iridescent pearl luster shifting elegantly under light',
    textureClass: 'texture-pearl',
    description: 'ເຈ້ຍກາດເຄືອບຜິວມຸກລະຍິບລະຍັບ ເພີ່ມຄວາມໂດດເດັ່ນສະດຸດຕາເມື່ອຖືກແສງໄຟ ຫຼື ແສງແດດ',
    descriptionEn: 'Shimmering metallic mica coating that catches ambient illumination with ethereal multi-tone shine.',
    pros: 'ສະທ້ອນແສງສວຍງາມ ເພີ່ມມູນຄ່າໃຫ້ຊິ້ນງານ ຫຼູຫຼາ',
    prosEn: 'Captivating luster, boosts product prestige and emotional value.',
    cons: 'ແຫ້ງຊ້າກວ່າເຈ້ຍທົ່ວໄປເລັກນ້ອຍ (ອົບແຫ້ງດ້ວຍລະບົບ UV)',
    consEn: 'Requires specialized UV curing for fastest drying speed.',
    finishingCompat: 'ປ້ຳຟອຍ, ປ້ຳຈົມ, ໄດຄັດມຸມມົນ',
    finishingCompatEn: 'Hot Foil (Gold/Rose), Debossing, Die-cut',
    suitableFor: ['ກາດເຊີນ VIP', 'ຄູປອງສ່ວນຫຼຸດພິເສດ', 'ປ້າຍສິນຄ້າພຣີມ້ຽມ'],
    suitableForEn: ['VIP Wedding Invitations', 'Exclusive Gift Vouchers', 'Jewelry Tags'],
    productLink: '/product/photo-print-card?paper=pearl-300',
    productTitle: 'ງານກາດມຸກ & ບັດເຊີນ VIP',
  },
]

const PRODUCT_PRESETS = [
  { id: 'card', name: 'ນາມບັດ / ກາດ', category: 'art', paperId: '1', icon: '💳' },
  { id: 'flyer', name: 'ໃບປິວ / ແຜ່ນພັບ', category: 'art', paperId: '2', icon: '📄' },
  { id: 'letter', name: 'ເຈ້ຍ A4 / ເອກະສານ', category: 'uncoated', paperId: '3', icon: '✉️' },
  { id: 'box', name: 'ກ່ອງບັນຈຸພັນ', category: 'art', paperId: '1', icon: '📦' },
  { id: 'sticker', name: 'ສະຫຼາກສິນຄ້າກັນນ້ຳ', category: 'sticker', paperId: '6', icon: '🏷️' },
  { id: 'eco', name: 'ງານຄຣາຟ ວິນເທຈ', category: 'kraft', paperId: '4', icon: '🌿' },
]

export default function PrintGuidePage() {
  const { language } = useShop()
  const isLao = language === 'lo'

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedPreset, setSelectedPreset] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'catalog' | 'simulator' | 'matrix' | 'finishing'>('catalog')
  const [gsmSimValue, setGsmSimValue] = useState<number>(250)
  const [compareList, setCompareList] = useState<string[]>([])
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)

  // Accordion state
  const [accordions, setAccordions] = useState<Record<string, boolean>>({
    art: true,
    uncoated: true,
    kraft: true,
    specialty: true,
    sticker: true,
  })

  const toggleAccordion = (cat: string) => {
    setAccordions((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const selectedPaper = useMemo(() => {
    if (!selectedPaperId) return null
    return PAPER_DATA.find((p) => p.id === selectedPaperId) || null
  }, [selectedPaperId])

  const filteredPapers = useMemo(() => {
    return PAPER_DATA.filter((paper) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        paper.name.toLowerCase().includes(q) ||
        paper.nameEn.toLowerCase().includes(q) ||
        paper.finish.toLowerCase().includes(q) ||
        paper.description.toLowerCase().includes(q) ||
        paper.suitableFor.some((s) => s.toLowerCase().includes(q)) ||
        paper.suitableForEn.some((s) => s.toLowerCase().includes(q))

      const matchesCat = selectedCategory === 'all' || paper.category === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [searchQuery, selectedCategory])

  const compareItems = useMemo(() => {
    return PAPER_DATA.filter((p) => compareList.includes(p.id))
  }, [compareList])

  const toggleCompare = (id: string) => {
    if (compareList.includes(id)) {
      setCompareList(compareList.filter((item) => item !== id))
    } else {
      if (compareList.length >= 3) {
        alert('ທ່ານສາມາດເລືອກສົມທຽບໄດ້ສູງສຸດ 3 ລາຍການພ້ອມກັນ')
        return
      }
      setCompareList([...compareList, id])
    }
  }

  const isInCompare = (id: string) => compareList.includes(id)

  const getPapersByCategory = (catId: string) => {
    return PAPER_DATA.filter((p) => p.category === catId)
  }

  const getThicknessLabel = (gsm: number) => {
    if (gsm < 90) return isLao ? 'ບາງເບົາ (Lightweight)' : 'Lightweight'
    if (gsm <= 160) return isLao ? 'ຄວາມໜາມາດຕະຖານ (Medium)' : 'Standard'
    if (gsm <= 260) return isLao ? 'ໜາປານກາງ (Semi-Rigid)' : 'Semi-Rigid'
    return isLao ? 'ໜາພິເສດ/ກາດແຂງ (Heavy Card)' : 'Heavy Card'
  }

  const selectPaper = (paper: PaperItem) => {
    setSelectedPaperId(paper.id)
    setActiveTab('catalog')
  }

  const applyPreset = (preset: typeof PRODUCT_PRESETS[0]) => {
    setSelectedPreset(preset.id)
    setSelectedCategory(preset.category)
    setSelectedPaperId(preset.paperId)
    setSearchQuery('')
    setActiveTab('catalog')
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedPreset('all')
    setSelectedPaperId(null)
    setActiveTab('catalog')
  }

  const simulatedRecommendation = useMemo(() => {
    const gsm = gsmSimValue
    if (gsm < 100) {
      return {
        category: isLao ? 'ບາງເບົາ (Lightweight Paper)' : 'Lightweight Document Paper',
        feelDescription: isLao
          ? 'ເນື້ອເຈ້ຍບາງ ພັບງ່າຍ ເໝາະສຳລັບເນື້ອຫາຫຼາຍໆ ໜ້າ ຫຼື ເອກະສານຫ້ອງການ A4'
          : 'Thin, flexible, and effortless to fold. Ideal for multi-page documents and office printing.',
        recommendedItems: isLao
          ? ['ເຈ້ຍປອນ 80g', 'ຫົວຈົດໝາຍ', 'ໄສ້ໃນປຶ້ມ', 'ໃບຮັບເງິນ']
          : ['White Bond 80g', 'Letterheads', 'Book Pages', 'Receipts'],
      }
    } else if (gsm <= 180) {
      return {
        category: isLao ? 'ຄວາມໜາມາດຕະຖານ (Standard Flyer/Brochure)' : 'Standard Flyer/Brochure',
        feelDescription: isLao
          ? 'ເຈ້ຍໜາກຳລັງດີ ພິມສີສັນສົດໃສ ບໍ່ໜາຕຶງເກີນໄປ ພັບແລ້ວຮາບລຽບສວຍງາມ'
          : 'Optimal thickness for double-sided vibrant marketing materials with smooth folding lines.',
        recommendedItems: isLao
          ? ['ເຈ້ຍອາດເງົາ 130g', 'ໂບຣຊົວ', 'ແຜ່ນພັບ 3 ຕອນ', 'ແຄັດຕາລັອກ']
          : ['Gloss Art 130g', 'Brochures', 'Tri-fold Leaflets', 'Catalogs'],
      }
    } else if (gsm <= 260) {
      return {
        category: isLao ? 'ໜາປານກາງ / ກາດອ່ອນ (Semi-Rigid Card)' : 'Semi-Rigid Cover Card',
        feelDescription: isLao
          ? 'ເຈ້ຍເລີ່ມມີຄວາມແຂງແຮງ ຕັ້ງຊົງໄດ້ດີ ໃຫ້ຄວາມຮູ້ສຶກຫຼູຫຼາ'
          : 'Sturdy, holds its form well. Perfect for book covers, merchandise tags, and invitations.',
        recommendedItems: isLao
          ? ['ເຈ້ຍຄຣາຟ 250g', 'ກາດເດີນລາຍຜ້າ', 'ປ້າຍແທັກເສື້ອຜ້າ', 'ຖົງເຈ້ຍ']
          : ['Kraft 250g', 'Linen Card 260g', 'Apparel Hangtags', 'Shopping Bags'],
      }
    } else {
      return {
        category: isLao ? 'ໜາພິເສດ / ກາດແຂງ (Heavy Duty Cardboard)' : 'Heavyweight Card & Rigid Stock',
        feelDescription: isLao
          ? 'ເຈ້ຍໜາແໜ້ນສູງ ແຂງແຮງທົນທານ ບໍ່ໂຄ້ງງໍງ່າຍ ຕ້ອງເຮັດຮອຍພັບກ່ອນດັດ'
          : 'Substantial rigidity and luxury weight. Built for executive cards, boxes, and foil stamping.',
        recommendedItems: isLao
          ? ['ອາດກາດ 300g', 'ນາມບັດ VIP', 'ກ່ອງບັນຈຸພັນ', 'ປົກປຶ້ມ']
          : ['Art Card 300g', 'VIP Cards', 'Packaging Boxes', 'Hardcover Books'],
      }
    }
  }, [gsmSimValue, isLao])

  return (
    <div className="pg-page">
      <div className="pg-container">
        
        {/* Compact & Clean Header Bar */}
        <div className="pg-compact-header">
          <div className="pg-header-left">
            <div className="pg-header-icon">
              <LayersIcon size={20} />
            </div>
            <div>
              <h1 className="pg-header-title">
                {isLao ? 'ຄູ່ມືເຈ້ຍ & ວັດສະດຸສິ່ງພິມ' : 'Paper & Material Spec Guide'}
              </h1>
              <p className="pg-header-subtitle">
                {isLao
                  ? 'ເລືອກສະເປັກ, ຄວາມໜາ GSM, ຜິວສຳຜັດ ແລະ ເຕັກນິກການເຄືອບທີ່ເໝາະສົມ'
                  : 'Select paper stock, GSM thickness, finishes, and finishing techniques'}
              </p>
            </div>
          </div>

          <div className="pg-header-actions">
            <button onClick={() => setIsCompareModalOpen(true)} className="pg-btn-compare-top">
              <span style={{ color: 'var(--gold)' }}>⚖️</span>
              <span>{isLao ? 'ສົມທຽບສະເປັກ' : 'Compare Specs'}</span>
              {compareList.length > 0 && (
                <span className="pg-badge-count">{compareList.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Two-Column Integrated Layout */}
        <div className="pg-layout-grid">
          
          {/* Left Column: Sidebar Filter Panel */}
          <aside className="pg-sidebar-panel">
            {/* Search Input */}
            <div className="pg-search-wrapper">
              <span className="pg-search-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedPaperId(null)
                  setActiveTab('catalog')
                }}
                placeholder={isLao ? 'ຄົ້ນຫາເຈ້ຍ, GSM...' : 'Search paper, GSM...'}
                className="pg-search-input"
              />
            </div>

            {/* Paper Category Accordions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div className="pg-nav-group-title">
                {isLao ? 'ໝວດໝູ່ເຈ້ຍ (Paper Types)' : 'Paper Types'}
              </div>

              {/* All Papers */}
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedPaperId(null)
                  setActiveTab('catalog')
                }}
                className={`pg-nav-btn ${
                  selectedCategory === 'all' && !selectedPaperId && activeTab === 'catalog'
                    ? 'is-active'
                    : ''
                }`}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <FileTextIcon size={15} />
                  <span>{isLao ? 'ເຈ້ຍທັງໝົດ' : 'All Papers'}</span>
                </span>
                <span className="pg-badge-count" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                  {PAPER_DATA.length}
                </span>
              </button>

              {/* Category: Art Paper */}
              <div className="pg-accordion-item">
                <button
                  onClick={() => {
                    toggleAccordion('art')
                    setSelectedCategory('art')
                    setSelectedPaperId(null)
                    setActiveTab('catalog')
                  }}
                  className="pg-nav-btn"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span>🖼️</span>
                    <span>{isLao ? 'ເຈ້ຍອາດ (Art Paper)' : 'Art Paper'}</span>
                  </span>
                  <span style={{ fontSize: '8.5px', transform: accordions.art ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </button>
                {accordions.art && (
                  <div className="pg-subitem-list">
                    {getPapersByCategory('art').map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPaper(p)}
                        className={`pg-subitem-btn ${selectedPaperId === p.id ? 'is-active' : ''}`}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isLao ? p.name : p.nameEn}
                        </span>
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>{p.gsm}g</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category: Woodfree */}
              <div className="pg-accordion-item">
                <button
                  onClick={() => {
                    toggleAccordion('uncoated')
                    setSelectedCategory('uncoated')
                    setSelectedPaperId(null)
                    setActiveTab('catalog')
                  }}
                  className="pg-nav-btn"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span>📄</span>
                    <span>{isLao ? 'ເຈ້ຍປອນ / A4 (Woodfree)' : 'Woodfree / Bond'}</span>
                  </span>
                  <span style={{ fontSize: '8.5px', transform: accordions.uncoated ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </button>
                {accordions.uncoated && (
                  <div className="pg-subitem-list">
                    {getPapersByCategory('uncoated').map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPaper(p)}
                        className={`pg-subitem-btn ${selectedPaperId === p.id ? 'is-active' : ''}`}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isLao ? p.name : p.nameEn}
                        </span>
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>{p.gsm}g</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category: Kraft */}
              <div className="pg-accordion-item">
                <button
                  onClick={() => {
                    toggleAccordion('kraft')
                    setSelectedCategory('kraft')
                    setSelectedPaperId(null)
                    setActiveTab('catalog')
                  }}
                  className="pg-nav-btn"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span>🌿</span>
                    <span>{isLao ? 'ເຈ້ຍຄຣາຟ (Kraft Vintage)' : 'Kraft Paper'}</span>
                  </span>
                  <span style={{ fontSize: '8.5px', transform: accordions.kraft ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </button>
                {accordions.kraft && (
                  <div className="pg-subitem-list">
                    {getPapersByCategory('kraft').map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPaper(p)}
                        className={`pg-subitem-btn ${selectedPaperId === p.id ? 'is-active' : ''}`}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isLao ? p.name : p.nameEn}
                        </span>
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>{p.gsm}g</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category: Specialty */}
              <div className="pg-accordion-item">
                <button
                  onClick={() => {
                    toggleAccordion('specialty')
                    setSelectedCategory('specialty')
                    setSelectedPaperId(null)
                    setActiveTab('catalog')
                  }}
                  className="pg-nav-btn"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span>👑</span>
                    <span>{isLao ? 'ເຈ້ຍພິເສດ / ການ໌ດຫຼູ' : 'Specialty & Luxury'}</span>
                  </span>
                  <span style={{ fontSize: '8.5px', transform: accordions.specialty ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </button>
                {accordions.specialty && (
                  <div className="pg-subitem-list">
                    {getPapersByCategory('specialty').map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPaper(p)}
                        className={`pg-subitem-btn ${selectedPaperId === p.id ? 'is-active' : ''}`}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isLao ? p.name : p.nameEn}
                        </span>
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>{p.gsm}g</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category: Sticker */}
              <div className="pg-accordion-item">
                <button
                  onClick={() => {
                    toggleAccordion('sticker')
                    setSelectedCategory('sticker')
                    setSelectedPaperId(null)
                    setActiveTab('catalog')
                  }}
                  className="pg-nav-btn"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span>🏷️</span>
                    <span>{isLao ? 'ສະຕິກເກີ / ສະຫຼາກ' : 'Stickers & Labels'}</span>
                  </span>
                  <span style={{ fontSize: '8.5px', transform: accordions.sticker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </button>
                {accordions.sticker && (
                  <div className="pg-subitem-list">
                    {getPapersByCategory('sticker').map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPaper(p)}
                        className={`pg-subitem-btn ${selectedPaperId === p.id ? 'is-active' : ''}`}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isLao ? p.name : p.nameEn}
                        </span>
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>{p.gsm}g</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tools Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
              <div className="pg-nav-group-title">{isLao ? 'ເຄື່ອງມື & ຄັງຄວາມຮູ້' : 'Interactive Tools'}</div>

              <button
                onClick={() => {
                  setActiveTab('finishing')
                  setSelectedPaperId(null)
                }}
                className={`pg-nav-btn ${activeTab === 'finishing' ? 'is-active' : ''}`}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span>✂️</span>
                  <span>{isLao ? 'ເຕັກນິກການເຄືອບ & ພັບ' : 'Finishing & Creasing'}</span>
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('simulator')
                  setSelectedPaperId(null)
                }}
                className={`pg-nav-btn ${activeTab === 'simulator' ? 'is-active' : ''}`}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span>🎚️</span>
                  <span>{isLao ? 'ທົດລອງແກຣມ (GSM)' : 'GSM Simulator'}</span>
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('matrix')
                  setSelectedPaperId(null)
                }}
                className={`pg-nav-btn ${activeTab === 'matrix' ? 'is-active' : ''}`}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span>📊</span>
                  <span>{isLao ? 'ຕາຕະລາງສົມທຽບສະເປັກ' : 'Spec Matrix Table'}</span>
                </span>
              </button>
            </div>
          </aside>

          {/* Right Column: Main Showcase */}
          <main className="pg-content-area">
            
            {/* VIEW 1: SINGLE PAPER SPEC DETAIL */}
            {selectedPaper && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <button
                  onClick={() => setSelectedPaperId(null)}
                  className="pg-preset-button"
                  style={{ width: 'fit-content' }}
                >
                  <span>←</span>
                  <span>{isLao ? 'ກັບຄືນໜ້າລາຍການທັງໝົດ' : 'Back to Catalog'}</span>
                </button>

                <div className="pg-single-detail-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.15rem' }}>
                    <div>
                      <span className="pg-tag-cat" style={{ marginBottom: '0.35rem', display: 'inline-block' }}>
                        {isLao ? selectedPaper.categoryName : selectedPaper.categoryNameEn} • #{selectedPaper.id}
                      </span>
                      <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0' }}>
                        {isLao ? selectedPaper.name : selectedPaper.nameEn}
                      </h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className="pg-tag-gsm" style={{ fontSize: '13.5px', padding: '0.35rem 0.75rem' }}>
                        {selectedPaper.gsm} GSM
                      </span>
                      <button
                        onClick={() => toggleCompare(selectedPaper.id)}
                        className={`pg-btn-pin ${isInCompare(selectedPaper.id) ? 'is-active' : ''}`}
                        style={{ padding: '0.45rem 0.8rem', fontSize: '12px', fontWeight: 700, gap: '0.35rem', display: 'inline-flex' }}
                      >
                        <span>⚖️</span>
                        <span>
                          {isInCompare(selectedPaper.id)
                            ? isLao ? 'ຢູ່ໃນລາຍການສົມທຽບ' : 'In Comparison'
                            : isLao ? '+ ເພີ່ມໃນການສົມທຽບ' : '+ Add to Compare'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Large Simulated Texture Banner */}
                  <div className={`pg-large-texture ${selectedPaper.textureClass}`}>
                    <div>
                      <span className="pg-tag-cat">
                        {isLao ? 'ຜິວສຳຜັດຈຳລອງ (Simulated Texture)' : 'Simulated Texture'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span className="pg-tag-finish">
                        {isLao ? 'ລັກສະນະຜິວ:' : 'Finish:'} <strong>{isLao ? selectedPaper.finish : selectedPaper.finishEn}</strong>
                      </span>
                      <span className="pg-tag-finish" style={{ color: 'var(--gold)' }}>
                        {isLao ? 'ລະດັບຄວາມໜາ:' : 'Rigidity:'} {getThicknessLabel(selectedPaper.gsm)}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Specs Grid */}
                  <div className="pg-detail-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <h4 className="pg-nav-group-title" style={{ padding: 0 }}>
                          {isLao ? 'ຄຳອະທິບາຍ & ຄຸນລັກສະນະ' : 'Description'}
                        </h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.6, margin: '0.35rem 0 0 0' }}>
                          {isLao ? selectedPaper.description : selectedPaper.descriptionEn}
                        </p>
                      </div>

                      <div className="pg-box-block" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10B981', fontWeight: 700, fontSize: '12px' }}>
                          <CheckIcon size={14} color="#10B981" />
                          <span>{isLao ? 'ຈຸດເດັ່ນສຳຄັນ' : 'Key Advantages'}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                          {isLao ? selectedPaper.pros : selectedPaper.prosEn}
                        </p>
                      </div>

                      <div className="pg-box-block" style={{ background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#F59E0B', fontWeight: 700, fontSize: '12px' }}>
                          <span>⚠️</span>
                          <span>{isLao ? 'ຂໍ້ຄວນລະວັງ / ເຕັກນິກການພິມ' : 'Technical Note'}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                          {isLao ? selectedPaper.cons : selectedPaper.consEn}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="pg-box-block">
                        <h4 className="pg-nav-group-title" style={{ padding: 0, color: 'var(--gold)' }}>
                          {isLao ? 'ການຮອງຮັບງານຫຼັງພິມ (Finishing)' : 'Finishing Support'}
                        </h4>
                        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                          {isLao ? selectedPaper.finishingCompat : selectedPaper.finishingCompatEn}
                        </p>
                      </div>

                      <div className="pg-box-block">
                        <h4 className="pg-nav-group-title" style={{ padding: 0, color: 'var(--gold)' }}>
                          {isLao ? 'ເໝາະສຳລັບງານພິມ' : 'Best For'}
                        </h4>
                        <div className="pg-tags-wrap" style={{ marginTop: '0.25rem' }}>
                          {(isLao ? selectedPaper.suitableFor : selectedPaper.suitableForEn).map((use, i) => (
                            <span key={i} className="pg-tag-item">
                              {use}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Link to={selectedPaper.productLink} className="pg-order-cta-btn">
                        <PrinterIcon size={17} />
                        <span>{isLao ? `ສັ່ງຜະລິດ: ${selectedPaper.productTitle}` : `Order: ${selectedPaper.productTitle}`}</span>
                        <ArrowRightIcon size={15} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: CATALOG GRID */}
            {!selectedPaperId && activeTab === 'catalog' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Presets Chips Bar */}
                <div className="pg-presets-wrapper">
                  <div className="pg-presets-grid">
                    {PRODUCT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className={`pg-preset-button ${selectedPreset === preset.id ? 'is-active' : ''}`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  {(selectedPreset !== 'all' || selectedCategory !== 'all' || searchQuery) && (
                    <button
                      onClick={resetFilters}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      {isLao ? 'ລ້າງຕົວກອງ' : 'Reset'}
                    </button>
                  )}
                </div>

                {/* Material Cards Grid */}
                <div className="pg-materials-grid">
                  {filteredPapers.map((paper) => (
                    <div key={paper.id} className="pg-material-card">
                      <div>
                        {/* Texture Box */}
                        <div className={`pg-texture-box ${paper.textureClass}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span className="pg-tag-cat">
                              {isLao ? paper.categoryName : paper.categoryNameEn}
                            </span>
                            <span className="pg-tag-gsm">{paper.gsm} GSM</span>
                          </div>
                          <div>
                            <span className="pg-tag-finish">
                              <SparkleIcon size={11} />
                              <span>{isLao ? paper.finish : paper.finishEn}</span>
                            </span>
                          </div>
                        </div>

                        {/* Title & Desc */}
                        <h3 onClick={() => selectPaper(paper)} className="pg-card-h3">
                          {isLao ? paper.name : paper.nameEn}
                        </h3>
                        <p className="pg-card-p">
                          {isLao ? paper.description : paper.descriptionEn}
                        </p>

                        {/* Rigidity Bar */}
                        <div className="pg-rigidity-wrapper">
                          <div className="pg-rigidity-header">
                            <span style={{ color: 'var(--text-muted)' }}>
                              {isLao ? 'ລະດັບຄວາມແຂງແຮງ' : 'Rigidity'}
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--gold)' }}>
                              {getThicknessLabel(paper.gsm)}
                            </span>
                          </div>
                          <div className="pg-meter-track">
                            <div
                              className="pg-meter-bar"
                              style={{ width: `${Math.min((paper.gsm / 400) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Pros */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '11.5px', marginBottom: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, color: '#10B981' }}>
                            <CheckIcon size={12} color="#10B981" />
                            <span>{isLao ? 'ຈຸດເດັ່ນ' : 'Advantage'}</span>
                          </div>
                          <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {isLao ? paper.pros : paper.prosEn}
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pg-card-actions">
                        <div className="pg-tags-wrap">
                          {(isLao ? paper.suitableFor : paper.suitableForEn).slice(0, 3).map((use, i) => (
                            <span key={i} className="pg-tag-item">
                              {use}
                            </span>
                          ))}
                        </div>

                        <div className="pg-btn-row">
                          <button onClick={() => selectPaper(paper)} className="pg-btn-primary">
                            <EyeIcon size={14} />
                            <span>{isLao ? 'ເບິ່ງລາຍລະອຽດ' : 'View Specs'}</span>
                          </button>
                          <button
                            onClick={() => toggleCompare(paper.id)}
                            className={`pg-btn-pin ${isInCompare(paper.id) ? 'is-active' : ''}`}
                            title={isInCompare(paper.id) ? 'Remove' : 'Add to compare'}
                          >
                            ⚖️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPapers.length === 0 && (
                  <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg, 20px)', border: '1px dashed var(--border-subtle)' }}>
                    <p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>📄</p>
                    <h3 style={{ fontSize: '15px', color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
                      {isLao ? 'ບໍ່ພົບເຈ້ຍທີ່ກົງກັບເງື່ອນໄຂ' : 'No matching materials found'}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
                      {isLao ? 'ລອງປ່ຽນໝວດໝູ່ ຫຼື ຄົ້ນຫາຄຳອື່ນ' : 'Try searching other terms or change categories.'}
                    </p>
                    <button onClick={resetFilters} className="pg-preset-button" style={{ margin: '0 auto' }}>
                      {isLao ? 'ລ້າງຕົວກອງທັງໝົດ' : 'Reset All Filters'}
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* VIEW 3: GSM SIMULATOR */}
            {!selectedPaperId && activeTab === 'simulator' && (
              <div className="pg-simulator-card">
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
                    {isLao ? 'ທົດລອງປັບລະດັບນ້ຳໜັກແກຣມ (GSM)' : 'Interactive GSM Weight & Thickness Simulator'}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    {isLao
                      ? 'GSM (Gram per Square Meter) ຄືນ້ຳໜັກຂອງເຈ້ຍຕໍ່ຕາຕະລາງແມັດ. ຍິ່ງແກຣມສູງ ເຈ້ຍຈະຍິ່ງໜາ ແລະ ແຂງແຮງ.'
                      : 'GSM indicates paper mass per square meter. Higher GSM corresponds to greater thickness.'}
                  </p>
                </div>

                <div className="pg-box-block" style={{ gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {isLao ? 'ລະດັບແກຣມປັດຈຸບັນ:' : 'Current GSM Weight:'}
                    </span>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--gold)' }}>
                      {gsmSimValue} GSM
                    </span>
                  </div>

                  <input
                    type="range"
                    min="70"
                    max="400"
                    step="10"
                    value={gsmSimValue}
                    onChange={(e) => setGsmSimValue(Number(e.target.value))}
                    className="pg-range-slider"
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <span>70g ({isLao ? 'ບາງເບົາ' : 'Light'})</span>
                    <span>130g ({isLao ? 'ມາດຕະຖານ' : 'Standard'})</span>
                    <span>250g ({isLao ? 'ໜາປານກາງ' : 'Semi-Rigid'})</span>
                    <span>350g+ ({isLao ? 'ກາດໜາ VIP' : 'Heavy Card'})</span>
                  </div>

                  <div className="pg-box-block" style={{ background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {isLao ? 'ສຳຜັດ & ການນຳໃຊ້:' : 'Tactile Feel & Applications:'}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gold)' }}>
                        {simulatedRecommendation.category}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                      {simulatedRecommendation.feelDescription}
                    </p>
                    <div className="pg-tags-wrap" style={{ marginTop: '0.45rem' }}>
                      {simulatedRecommendation.recommendedItems.map((item, i) => (
                        <span key={i} className="pg-tag-item" style={{ background: 'rgba(197, 160, 89, 0.15)', color: 'var(--gold)', borderColor: 'var(--border-gold)', fontWeight: 700 }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 4: SPEC MATRIX TABLE */}
            {!selectedPaperId && activeTab === 'matrix' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {isLao ? 'ຕາຕະລາງສົມທຽບສະເປັກເຈ້ຍທັງໝົດ' : 'Full Paper & Material Spec Matrix'}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                    {isLao
                      ? 'ສົມທຽບສະເປັກ ຄວາມໜາ ຜິວສຳຜັດ ການຮອງຮັບງານຫຼັງພິມ ແລະ ຄວາມເໝາະສົມແບບ Side-by-Side'
                      : 'Compare thickness, GSM, finishes, and finishing support across all materials.'}
                  </p>
                </div>

                <div className="pg-matrix-table-wrap">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="pg-matrix-table">
                      <thead>
                        <tr>
                          <th>{isLao ? 'ຊະນິດເຈ້ຍ' : 'Material Name'}</th>
                          <th>{isLao ? 'ໝວດໝູ່' : 'Category'}</th>
                          <th>{isLao ? 'ຄວາມໜາ (GSM)' : 'GSM'}</th>
                          <th>{isLao ? 'ຜິວສຳຜັດ' : 'Finish'}</th>
                          <th>{isLao ? 'ງານພິມທີ່ເໝາະສົມ' : 'Best Products'}</th>
                          <th>{isLao ? 'ການເຄືອບ (Finishing)' : 'Finishing'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PAPER_DATA.map((paper) => (
                          <tr key={paper.id} onClick={() => selectPaper(paper)}>
                            <td style={{ fontWeight: 700 }}>{isLao ? paper.name : paper.nameEn}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{isLao ? paper.categoryName : paper.categoryNameEn}</td>
                            <td>
                              <span className="pg-tag-gsm" style={{ fontSize: '10.5px', padding: '0.15rem 0.45rem' }}>
                                {paper.gsm} GSM
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>{isLao ? paper.finish : paper.finishEn}</td>
                            <td>
                              <div className="pg-tags-wrap">
                                {(isLao ? paper.suitableFor : paper.suitableForEn).map((use, i) => (
                                  <span key={i} className="pg-tag-item" style={{ fontSize: '9.5px' }}>
                                    {use}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>{isLao ? paper.finishingCompat : paper.finishingCompatEn}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: FINISHING KNOWLEDGE GUIDE */}
            {!selectedPaperId && activeTab === 'finishing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {isLao ? 'ເຕັກນິກການເຄືອບຜິວ & ປຸງແຕ່ງຫຼັງພິມ (Finishing Guide)' : 'Finishing & Post-Press Knowledge'}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                    {isLao
                      ? 'ເກຣັດຄວາມຮູ້ໃນການເລືອກຟີມເຄືອບ, ການປ້ຳນູນ/ປ້ຳທອງ, ການກົດຮອຍພັບ ແລະ Spot UV'
                      : 'Expert guide on choosing laminations, hot foil stamping, and creasing lines.'}
                  </p>
                </div>

                <div className="pg-finishing-grid">
                  <div className="pg-finish-card">
                    <div style={{ fontSize: '1.75rem' }}>✨</div>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {isLao ? 'PVC ເງົາ vs ດ້ານ vs Soft-Touch' : 'Gloss vs Matte vs Soft-Touch'}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {isLao ? (
                        <>
                          <strong>PVC ເງົາ (Gloss):</strong> ຂັບສີສັນໃຫ້ສົດໃສ ເງົາງາມ ກັນນ້ຳ.<br />
                          <strong>PVC ດ້ານ (Matte):</strong> ລຸກຮຽບຫຼູ ຫຼຸດແສງສະທ້ອນ.<br />
                          <strong>Soft-Touch (ກຳມະຫຍີ່):</strong> ສຳຜັດນຸ່ມນວນລະດັບໄຮເອນ ນິຍົມຄູ່ກັບ Spot UV.
                        </>
                      ) : (
                        <>
                          <strong>Gloss:</strong> Amplifies color vibrancy and water resistance.<br />
                          <strong>Matte:</strong> Subtle anti-reflective luxury look.<br />
                          <strong>Soft-Touch Velvet:</strong> Ultra-premium suede feel, ideal with Spot UV.
                        </>
                      )}
                    </p>
                  </div>

                  <div className="pg-finish-card">
                    <div style={{ fontSize: '1.75rem' }}>✂️</div>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {isLao ? 'ປ້ອງກັນສັນພັບແຕກດ້ວຍ Creasing' : 'Creasing Line Prevents Cracking'}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {isLao
                        ? 'ເຈ້ຍທີ່ມີຄວາມໜາຕັ້ງແຕ່ 200 GSM ຂຶ້ນໄປ ຫາກພັບທັນທີ ສັນພັບຈະເກີດຮອຍແຕກຂອງເນື້ອເຈ້ຍ. ການກົດຮອຍພັບ (Creasing Line) ກ່ອນ ຈະຊ່ວຍໃຫ້ສັນພັບຄົມສວຍງາມ ບໍ່ເສຍຫາຍ.'
                        : 'Heavy cardstock (200+ GSM) will crack on the fold without prepress creasing lines.'}
                    </p>
                  </div>

                  <div className="pg-finish-card">
                    <div style={{ fontSize: '1.75rem' }}>💧</div>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {isLao ? 'Coated vs Uncoated ກັບການຊຶມໝຶກ' : 'Coated vs Uncoated Ink Absorption'}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {isLao
                        ? 'Coated (ເຈ້ຍອາດ) ໝຶກບໍ່ຊຶມລົງເນື້ອເຈ້ຍ ສີສົດ ຄົມຊັດ. Uncoated (ເຈ້ຍປອນ/ຄຣາຟ) ໝຶກຊຶມລົງເນື້ອເຈ້ຍ ສີນຸ່ມຕາ ແລະ ຂຽນທັບ/ປ້ຳຕາປະທັບງ່າຍ.'
                        : 'Coated stocks keep ink on surface for crisp saturation. Uncoated stocks absorb ink smoothly for comfortable reading.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

      </div>

      {/* Comparison Modal */}
      {isCompareModalOpen && (
        <div className="pg-modal-overlay" onClick={() => setIsCompareModalOpen(false)}>
          <div className="pg-modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  ⚖️ {isLao ? 'ສົມທຽບເຈ້ຍ & ວັດສະດຸ (Side-by-Side)' : 'Side-by-Side Material Comparison'}
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                  {isLao ? 'ປຽບທຽບສະເປັກເຈ້ຍທີ່ທ່ານເລືອກໄວ້ເພື່ອການຕັດສິນໃຈທີ່ຖືກຕ້ອງ' : 'Compare selected paper specs side-by-side.'}
                </p>
              </div>
              <button onClick={() => setIsCompareModalOpen(false)} className="pg-btn-pin">
                <XIcon size={17} />
              </button>
            </div>

            {compareItems.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                {compareItems.map((paper) => (
                  <div key={paper.id} className="pg-material-card" style={{ background: 'var(--bg-surface)', position: 'relative' }}>
                    <button
                      onClick={() => toggleCompare(paper.id)}
                      style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      ✕
                    </button>

                    <span className="pg-tag-cat" style={{ width: 'fit-content' }}>
                      {isLao ? paper.categoryName : paper.categoryNameEn}
                    </span>
                    <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-main)', margin: '0.45rem 0' }}>
                      {isLao ? paper.name : paper.nameEn}
                    </h4>

                    <div style={{ fontSize: '11px', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>GSM:</span>
                        <span style={{ fontWeight: 800, color: 'var(--gold)', marginLeft: '4px' }}>{paper.gsm} GSM</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>{isLao ? 'ຜິວສຳຜັດ:' : 'Finish:'}</span>
                        <span style={{ marginLeft: '4px' }}>{isLao ? paper.finish : paper.finishEn}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>{isLao ? 'ຈຸດເດັ່ນ:' : 'Advantage:'}</span>
                        <p style={{ margin: '2px 0 0 0', color: 'var(--text-main)', fontSize: '10.5px' }}>{isLao ? paper.pros : paper.prosEn}</p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>{isLao ? 'ການເຄືອບ:' : 'Finishing:'}</span>
                        <p style={{ margin: '2px 0 0 0', color: 'var(--text-main)', fontSize: '10.5px' }}>{isLao ? paper.finishingCompat : paper.finishingCompatEn}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                {isLao ? 'ຍັງບໍ່ມີລາຍການເຈ້ຍທີ່ເລືອກ. ກົດປຸ່ມ ⚖️ ເທິງກາດເຈ້ຍເພື່ອເພີ່ມໃນການສົມທຽບ.' : 'No materials selected. Click ⚖️ on paper cards to compare.'}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              {compareList.length > 0 && (
                <button onClick={() => setCompareList([])} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '11.5px', cursor: 'pointer', textDecoration: 'underline' }}>
                  {isLao ? 'ລ້າງລາຍການສົມທຽບທັງໝົດ' : 'Clear All Comparison'}
                </button>
              )}
              <button onClick={() => setIsCompareModalOpen(false)} className="pg-btn-primary" style={{ marginLeft: 'auto', padding: '0.45rem 1.1rem' }}>
                {isLao ? 'ປິດໜ້າຕ່າງ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
