import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import {
  FileTextIcon,
  LayersIcon,
  SparkleIcon,
  PrinterIcon,
  PackageIcon,
  CheckIcon,
  ArrowRightIcon,
  SearchIcon,
  DownloadIcon,
  EyeIcon,
} from '../components/icons.tsx'

interface PaperItem {
  id: string
  name: string
  nameEn: string
  gsm: string
  thicknessMM: number
  thicknessText: string
  finishType: string
  surfaceDescription: string
  surfaceDescriptionEn: string
  tactileSensation: string
  tactileSensationEn: string
  opacityRating: string
  swatchGradient: string
  borderAccent: string
  badgeTags: string[]
  suitableApplications: string[]
  suitableApplicationsEn: string[]
  bestProductLink: string
  bestProductTitle: string
}

interface BindingItem {
  id: string
  name: string
  nameEn: string
  icon: string
  pageCapacityText: string
  minPages: number
  maxPages: number
  spineThicknessRange: string
  bestSuitedFor: string
  bestSuitedForEn: string
  keyAdvantages: string[]
  keyAdvantagesEn: string[]
  prepressCaution: string
  prepressCautionEn: string
  badge: string
  diagramStyle: 'glue' | 'wire' | 'staple' | 'hardcover'
}

const PAPER_SWATCHES: PaperItem[] = [
  {
    id: 'bond',
    name: 'ເຈ້ຍຖ່າຍເອກະສານມາດຕະຖານ (White Bond Paper)',
    nameEn: 'Standard White Bond Paper',
    gsm: '80 - 100 GSM',
    thicknessMM: 0.10,
    thicknessText: '0.10 - 0.12 mm',
    finishType: 'Smooth Uncoated Matte',
    surfaceDescription: 'ຜິວດ້ານທຳມະຊາດ ຂາວສະອາດ ຂຽນງ່າຍ ດູດຊຶມນ້ຳມຶກດີ ບໍ່ຊຶມທະລຸດ້ານຫຼັງ',
    surfaceDescriptionEn: 'Smooth uncoated natural matte surface, smudge-free and ideal for fountain pens and laser printing.',
    tactileSensation: 'ຜິວລຽບນຽນດ້ານ ທຳມະຊາດ ບໍ່ລື່ນມື (Natural Uncoated)',
    tactileSensationEn: 'Natural tactile uncoated feel, lightweight and easy to fold.',
    opacityRating: '94% Opacity',
    swatchGradient: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 45%, #E2E8F0 100%)',
    borderAccent: '#3B82F6',
    badgeTags: ['✍️ ຂຽນງ່າຍບໍ່ຊຶມ', '⚡ ພິມໄວລາຄາປະຢັດ', '📄 ມາດຕະຖານເອກະສານ'],
    suitableApplications: [
      'ເອກະສານປະຊຸມ & ລາຍງານທົ່ວໄປ',
      'ຊີດຮຽນ, ແບບຮຽນ & ປຶ້ມຄູ່ມື',
      'ໃບສຳເລັດການສຶກສາ & ແບບຟອມທຸລະກິດ',
    ],
    suitableApplicationsEn: ['Meeting handouts & office reports', 'Training handbooks & syllabi', 'Business forms & certificates'],
    bestProductLink: '/category/documents',
    bestProductTitle: 'ງານພິມເອກະສານ & ປຶ້ມ',
  },
  {
    id: 'green-read',
    name: 'ເຈ້ຍຖະໜອມສາຍຕາ (Green Read Eye-Care)',
    nameEn: 'Green Read Eye-Care Paper',
    gsm: '80 GSM',
    thicknessMM: 0.11,
    thicknessText: '0.11 mm',
    finishType: 'Warm Cream Anti-Glare',
    surfaceDescription: 'ສີຄຣີມນວນທຳມະຊາດ ຊ່ວຍກະຈາຍແສງສະທ້ອນ ຫຼຸດອາການເມື່ອຍລ້າຂອງສາຍຕາ',
    surfaceDescriptionEn: 'Warm cream-tinted paper designed to diffuse harsh light reflections and prevent eye fatigue.',
    tactileSensation: 'ຜິວນຽນນຸ່ມ ໂທນອຸ່ນ ສະບາຍມື (Velvety Warm Cream)',
    tactileSensationEn: 'Soft cream velvet texture for premium reading comfort.',
    opacityRating: '92% Opacity',
    swatchGradient: 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
    borderAccent: '#10B981',
    badgeTags: ['👁️ ຖະໜອມສາຍຕາ', '🌿 100% Eco-Friendly', '📖 ເໝາະກັບປຶ້ມອ່ານດົນ'],
    suitableApplications: [
      'ປຶ້ມນິຍາຍ, ປຶ້ມອ່ານຫຼິ້ນ & ວັນນະກຳ',
      'ປຶ້ມທຳມະ & ປຶ້ມບົດກະວີ',
      'ຄູ່ມືທີ່ຕ້ອງອ່ານເປັນເວລາດົນ',
    ],
    suitableApplicationsEn: ['Novels & literature publications', 'Spiritual books & poetry', 'Long-reading corporate manuals'],
    bestProductLink: '/category/documents',
    bestProductTitle: 'ປຶ້ມນິຍາຍ & ເອກະສານ',
  },
  {
    id: 'art-card',
    name: 'ເຈ້ຍອາດການ & ອາດເປເປີ (Coated Art Card / Paper)',
    nameEn: 'Premium Coated Art Paper & Card',
    gsm: '130, 160, 200, 260, 300, 350 GSM',
    thicknessMM: 0.35,
    thicknessText: '0.15 - 0.42 mm (ໜາພິເສດ)',
    finishType: 'Silky Matte & High Gloss',
    surfaceDescription: 'ເຄືອບຜິວລຽບນຽນລະດັບໄຮເອນ ມີທັງຜິວເງົາ (Gloss) ສີສົດໃສ ແລະ ຜິວດ່ານ (Matte) ຫຼູຫຼາ',
    surfaceDescriptionEn: 'Ultra-smooth multi-coated stock engineered for gallery-grade photo fidelity and CMYK vibrance.',
    tactileSensation: 'ລຽບນຽນລະດັບໄຮເອນ ແໜ້ນໜາພິເສດ (Premium Silk Touch)',
    tactileSensationEn: 'Rigid, silk-smooth touch that conveys luxury and precision.',
    opacityRating: '99% Maximum Opacity',
    swatchGradient: 'linear-gradient(145deg, #1E293B 0%, #0F172A 50%, #020617 100%)',
    borderAccent: '#C5A059',
    badgeTags: ['🎨 ສີ CMYK ສົດໃສສູງສຸດ', '✨ ຮອງຮັບປ້ຳຟອຍ/Spot UV', '👑 ມາດຕະຖານໂຟໂຕ້ບຸກ'],
    suitableApplications: [
      'ອັນບັ້ມຮູບພາບປົກແຂງ & ໂຟໂຕ້ບຸກ',
      'ແຄັດຕາລັອກສິນຄ້າ & ໂປສເຕີ',
      'ບັດເຊີນງານດອງ & ນາມບັດພຣີມ້ຽມ',
    ],
    suitableApplicationsEn: ['Hardcover photobooks & luxury albums', 'Product catalogs & posters', 'Gala invitation cards & business cards'],
    bestProductLink: '/category/photos',
    bestProductTitle: 'ງານພິມຮູບພາບ & ໂຟໂຕ້ບຸກ',
  },
  {
    id: 'kraft',
    name: 'ເຈ້ຍຄຣາຟສີນ້ຳຕານ Vintage (Brown Kraft Paper)',
    nameEn: 'Rustic Brown Kraft Eco Paper',
    gsm: '125, 250, 350 GSM',
    thicknessMM: 0.30,
    thicknessText: '0.20 - 0.45 mm',
    finishType: 'Natural Tactile Wood Grain',
    surfaceDescription: 'ສີນ້ຳຕານອໍແກນິກ ໂຊລວດລາຍເສັ້ນໃຍໄມ້ທຳມະຊາດ ສາຍ Eco-Friendly & Vintage',
    surfaceDescriptionEn: 'Unbleached natural wood fiber stock delivering rustic, eco-conscious aesthetic with high tensile strength.',
    tactileSensation: 'ຜິວສຳຜັດເສັ້ນໃຍໄມ້ທຳມະຊາດ ອົບອຸ່ນ (Natural Fiber Texture)',
    tactileSensationEn: 'Authentic organic wood fiber grain, sturdy and fibrous.',
    opacityRating: '100% Solid Opacity',
    swatchGradient: 'linear-gradient(145deg, #B45309 0%, #78350F 50%, #451A03 100%)',
    borderAccent: '#D97706',
    badgeTags: ['🌿 100% Biodegradable', '☕ ສາຍ Vintage & Cafe', '📦 ເນື້ອเหนียวທົນທານ'],
    suitableApplications: [
      'ສະຕິກເກີເຈ້ຍຄຣາຟຕິດແພັກເກັດ',
      'ປ້າຍຫ້ອຍສິນຄ້າ (Apparel Tags)',
      'ປົກເມນູຮ້ານກາເຟ & ຖົງເຈ້ຍ Eco',
    ],
    suitableApplicationsEn: ['Kraft packaging stickers', 'Apparel & merchandise hangtags', 'Rustic cafe menus & eco bags'],
    bestProductLink: '/category/stickers',
    bestProductTitle: 'ງານສະຕິກເກີ & ສະຫຼາກ',
  },
  {
    id: 'pearl-metallic',
    name: 'ເຈ້ຍພິເສດເຫຼືອບມຸກ (Pearl Metallic Paper)',
    nameEn: 'Pearl Metallic Luxury Shimmer',
    gsm: '300 GSM',
    thicknessMM: 0.36,
    thicknessText: '0.36 mm (ໜາພຣີມ້ຽມ)',
    finishType: 'Iridescent Shimmering Pearl',
    surfaceDescription: 'ຜິວເຫຼືອບປະServerາຍມຸກ ຫຼູຫຼາ ສະທ້ອນແສງລະຍິບລະຍັບເມື່ອຖືກແສງ',
    surfaceDescriptionEn: 'Iridescent pearl metallic coating that creates an enchanting shimmer under room and natural lighting.',
    tactileSensation: 'ຜິວເຫຼືອບມຸກລຽບນຽນ ຫຼູຫຼາລະດັບພຣີມ້ຽມ (Shimmering Pearl Silk)',
    tactileSensationEn: 'Silky shimmer surface with delicate metallic luster.',
    opacityRating: '98% Opacity',
    swatchGradient: 'linear-gradient(145deg, #FDE047 0%, #F472B6 40%, #A855F7 80%, #3B82F6 100%)',
    borderAccent: '#EC4899',
    badgeTags: ['💎 ຫຼູຫຼາລະດັບ VIP', '✨ ສະທ້ອນແສງລະຍິບລະຍັບ', '💍 ຍອດນິຍົມງານແຕ່ງ'],
    suitableApplications: [
      'ບັດເຊີນງານດອງ & ບັດອວຍພອນ VIP',
      'ໃບປະກາດສະນີຍະບັດລະດັບສູງ',
      'ໂປສກາດຮູບພາບທີ່ລະນຶກພິເສດ',
    ],
    suitableApplicationsEn: ['Wedding invitations & VIP cards', 'Prestigious award certificates', 'Commemorative fine art postcards'],
    bestProductLink: '/category/photos',
    bestProductTitle: 'ງານບັດເຊີນ & ຮູບພາບ VIP',
  },
  {
    id: 'pp-vinyl',
    name: 'ສະຕິກເກີ PP Vinyl ກັນນ້ຳ 100% (Waterproof PP/PVC)',
    nameEn: '100% Waterproof PP Vinyl Sticker',
    gsm: '120 - 150 Micron',
    thicknessMM: 0.14,
    thicknessText: '0.12 - 0.15 mm',
    finishType: 'Waterproof Synthetic Film',
    surfaceDescription: 'ເນື້ອພລາສຕິກ PP ຂາວເງົາ, ຂາວດ້ານ ຫຼື ເນື້ອໃສ (Clear) ພິມດ້ວຍໝຶກກັນນ້ຳ ແລະ UV ໄດຄັດພ້ອມລອກຕິດ',
    surfaceDescriptionEn: 'Synthetic weatherproof PP film with strong industrial adhesive backing, freezer and microwave safe.',
    tactileSensation: 'ພລາສຕິກລຽບນຽນ ທົນທານ ກັນນ້ຳ 100% (Waterproof Vinyl Sheet)',
    tactileSensationEn: 'Flexible synthetic vinyl film with strong adhesive back.',
    opacityRating: '100% White / 0% Clear',
    swatchGradient: 'linear-gradient(145deg, #0284C7 0%, #0369A1 50%, #075985 100%)',
    borderAccent: '#0EA5E9',
    badgeTags: ['💧 ກັນນ້ຳ 100% ແຊ່ເຢັນໄດ້', '☀️ ທົນແດດ UV ບໍ່ລອກ', '✂️ ໄດຄັດຕາມຮູບຊົງ'],
    suitableApplications: [
      'ສະຫຼາກສິນຄ້າຕິດແກ້ວ & ກ່ອງອາຫານ',
      'ອາຫານແຊ່ເຢັນ & ເຄື່ອງດື່ມ',
      'ສະຕິກເກີຕິດລົດ & ແກ້ວກາເຟ',
    ],
    suitableApplicationsEn: ['Glass jar labels & food containers', 'Frozen beverage labels', 'Outdoor car decals & tumbler stickers'],
    bestProductLink: '/category/stickers',
    bestProductTitle: 'ງານສະຕິກເກີ & ສະຫຼາກ',
  },
]

const BINDING_METHODS: BindingItem[] = [
  {
    id: 'bind-perfect',
    name: 'ເຂົ້າເລັ້ມສັນກາວຮ້ອນ (Perfect Hot Glue Binding)',
    nameEn: 'Perfect Hot Glue Binding',
    icon: '📖',
    pageCapacityText: '40 - 500+ ໜ້າ (ສັນໜາ 3 - 35 mm)',
    minPages: 40,
    maxPages: 500,
    spineThicknessRange: '3.0 mm - 35.0 mm',
    bestSuitedFor: 'ປຶ້ມພັອກເກັດບຸກ, ລາຍງານປະຈຳປີ (Annual Report), ປຶ້ມຄູ່ມືອົງກອນ, ວາລະສານ, ວິທະຍານິພົນ, ປຶ້ມແບບຮຽນ',
    bestSuitedForEn: 'Pocket books, annual corporate reports, university thesis, published magazines, product manuals',
    keyAdvantages: [
      'ສັນປຶ້ມຮາບລຽບ ສວຍງາມ ເປັນມືອາຊີບ ຄືປຶ້ມວາງຂາຍຕາມຮ້ານໜັງສືຊັ້ນນຳ',
      'ສາມາດພິມຊື່ປຶ້ມ, ໂລໂກ້ ແລະ ຊື່ຜູ້ແຕ່ງລົງເທິງສັນປຶ້ມໄດ້ຢ່າງສວຍງາມ',
      'ກາວຮ້ອນຄຸນນະພາບສູງ ຍຶດຕິດແໜ້ນ ໜ້າເຈ້ຍບໍ່ຫຼຸດລອກຕະຫຼອດອາຍຸການໃຊ້ງານ',
    ],
    keyAdvantagesEn: [
      'Clean squared spine with professional bookshop aesthetic',
      'Printable spine for title, author, and edition volume numbers',
      'Industrial hot melt PUR glue ensures sheets never fall out',
    ],
    prepressCaution: 'ບໍ່ເໝາະສຳລັບປຶ້ມທີ່ມີຈຳນວນໜ້າໜ້ອຍກວ່າ 40 ໜ້າ ເພາະສັນປຶ້ມຈະບາງເກີນໄປສຳລັບການປາດກາວ.',
    prepressCautionEn: 'Requires at least 40 pages for the hot glue milling and application process to adhere securely.',
    badge: '👑 ມາດຕະຖານປຶ້ມ & ລາຍງານສາກົນ',
    diagramStyle: 'glue',
  },
  {
    id: 'bind-wire-o',
    name: 'ເຂົ້າເລັ້ມສັນຫ່ວງກະດູກງູ / ຂົດລວດ (Wire-O Binding)',
    nameEn: 'Wire-O & Double-Loop Spiral Binding',
    icon: '📑',
    pageCapacityText: '10 - 250 ໜ້າ (ຫ່ວງ 6 - 32 mm)',
    minPages: 10,
    maxPages: 250,
    spineThicknessRange: '6.0 mm - 32.0 mm (ຂະໜາດຫ່ວງ)',
    bestSuitedFor: 'ປຶ້ມບັນທຶກ (Notebook), ປະຕິທິນຕັ້ງໂຕະ, ເມນູຮ້ານອາຫານ, ເອກະສານຝຶກອົບຮົມ, ປຶ້ມສະເກັດພາບ',
    bestSuitedForEn: 'Desk calendars, wirebound notepads, restaurant menus, training workbooks, sketchbooks',
    keyAdvantages: [
      'ເປີດກາງໄດ້ 360 ອົງສາ ພັບໄປດ້ານຫຼັງໄດ້ ສະດວກຕໍ່ການຈົດຂຽນ ແລະ ວາງເທິງໂຕະ',
      'ເປີດອ່ານງ່າຍ ໜ້າປຶ້ມຮາບພຽງ 100% ບໍ່ມີບັນຫາຕິດສັນປຶ້ມ',
      'ມີສີຫ່ວງໃຫ້ເລືອກ: ສີທອງຫຼູຫຼາ (Gold), ສີຂາວ (White), ສີດຳ (Black)',
    ],
    keyAdvantagesEn: [
      'Full 360-degree rotation allows easy handwriting and desktop presentation',
      'Lays 100% flat on any surface without spring-back',
      'Available in Gold, White, and Black metallic loops',
    ],
    prepressCaution: 'ຕ້ອງເວັ້ນໄລຍະຂອບເຈ້ຍ (Inner Margin) ດ້ານສັນຢ່າງໜ້ອຍ 10-12 mm ເພື່ອບໍ່ໃຫ້ຮູເຈາະກິນເນື້ອຫາ.',
    prepressCautionEn: 'Keep 10-12mm inner margin clear from text and artwork to accommodate wire punch holes.',
    badge: '⚡ ສະດວກຈົດຂຽນ & ເປີດ 360°',
    diagramStyle: 'wire',
  },
  {
    id: 'bind-saddle-stitch',
    name: 'ເຂົ້າເລັ້ມເຢັບມຸມ / ມຸງຫຼັງຄາ (Saddle Stitch)',
    nameEn: 'Saddle Stitch Booklet Binding',
    icon: '📰',
    pageCapacityText: '8 - 64 ໜ້າ (ຈຳນວນໜ້າຕ້ອງຫານ 4 ລົງຕົວ)',
    minPages: 8,
    maxPages: 64,
    spineThicknessRange: 'ພັບເຄິ່ງເຢັບແມັກ 2 ຈຸດກາງ',
    bestSuitedFor: 'ແຄັດຕາລັອກສິນຄ້າ, ໂບຣຊົວຫຼາຍໜ້າ, ປຶ້ມຄູ່ມືກະທັດຮັດ, ວາລະສານລາຍເດືອນ, ເມນູເຄື່ອງດື່ມ',
    bestSuitedForEn: 'Product catalogs, multi-page brochures, compact manuals, monthly newsletters',
    keyAdvantages: [
      'ລາຄາປະຢັດທີ່ສຸດ ຜະລິດໄດ້ວ່ອງໄວທັນໃຈພາຍໃນ 24 ຊົ່ວໂມງ',
      'ນ້ຳໜັກເບົາ ພົກພາງ່າຍ ເປີດອ່ານຮາບພຽງສະດວກ',
      'ຮອງຮັບທັງຂະໜາດ A4, A5, ແລະ ຂະໜາດຕັດພິເສດ',
    ],
    keyAdvantagesEn: [
      'Most economical binding solution with rapid 24-hour turnaround',
      'Lightweight, compact, and easy to mail or distribute',
      'Supports standard A4, A5, and custom bespoke sizes',
    ],
    prepressCaution: 'ຈຳນວນໜ້າທັງໝົດຕ້ອງເປັນເລກຄູນ 4 (ເຊັ່ນ: 8, 12, 16, 20, 24, 28, 32... ໜ້າ).',
    prepressCautionEn: 'Total page count must be a multiple of 4 as each folded sheet creates 4 booklet pages.',
    badge: '💰 ລາຄາປະຢັດ & ຜະລິດໄວທັນໃຈ',
    diagramStyle: 'staple',
  },
  {
    id: 'bind-hardcover',
    name: 'ເຂົ້າເລັ້ມປົກແຂງພຣີມ້ຽມ (Hardcover Layflat 180°)',
    nameEn: 'Luxury Hardcover Layflat 180°',
    icon: '💎',
    pageCapacityText: '20 - 400 ໜ້າ (ຈົ່ວປັງໜາ 2.5 - 3.0 mm)',
    minPages: 20,
    maxPages: 400,
    spineThicknessRange: '2.5 mm - 3.0 mm (ຄວາມໜາປົກແຂງ)',
    bestSuitedFor: 'ໂຟໂຕ້ບຸກງານແຕ່ງດອງ, ອັນບັ້ມຄອບຄົວ, ປຶ້ມທີ່ລະນຶກ VIP, ລາຍງານປະຈຳປີລະດັບບໍລິຫານ',
    bestSuitedForEn: 'Wedding photobooks, family heirloom albums, VIP commemorative books, executive portfolios',
    keyAdvantages: [
      'ຫຼູຫຼາ ແລະ ທົນທານທີ່ສຸດ ເກັບຮັກສາໄດ້ຍາວນານຫຼາຍສິບປີ ປົກປ້ອງເນື້ອໃນສົມບູນ',
      'ເປີດກາງຮາບພຽງ 180° ຮູບພາບພາໂນຣາມາບໍ່ຂາດຕອນກາງໜ້າ',
      'ຮອງຮັບການປ້ຳຟອຍຄຳ, ປ້ຳນູນ, ເຄືອບ Soft-Touch ປົກໜ້າຢ່າງຫຼູຫຼາ',
    ],
    keyAdvantagesEn: [
      'Unsurpassed durability lasting decades with rigid board protection',
      'Seamless 180-degree layflat panorama without gutter split',
      'Supports luxury gold foil stamping and velvet soft-touch covers',
    ],
    prepressCaution: 'ໃຊ້ເວລາຜະລິດ 2-4 ວັນ ເນື່ອງຈາກຕ້ອງລໍຖ້າກາວ ແລະ ຈົ່ວປັງເຊັດຕົວຢ່າງສົມບູນ.',
    prepressCautionEn: 'Requires 2-4 days production time to ensure solid board curing and layflat binding integrity.',
    badge: '🏆 Ultra-Luxury ລະດັບສູງສຸດ',
    diagramStyle: 'hardcover',
  },
]

export default function PrintGuidePage() {
  const { language } = useShop()
  const isLao = language !== 'en'

  // Active Category State
  const [activeCategoryTab, setActiveCategoryTab] = useState<'paper' | 'binding' | 'preflight' | 'finishing'>('paper')
  const [selectedPaperId, setSelectedPaperId] = useState<string>('bond')
  const [selectedBindingId, setSelectedBindingId] = useState<string>('bind-perfect')

  // Live Spine Estimator Calculator
  const [calcPages, setCalcPages] = useState(100)
  const [calcGsm, setCalcGsm] = useState(80)

  const selectedPaper = useMemo(() => {
    return PAPER_SWATCHES.find((p) => p.id === selectedPaperId) || PAPER_SWATCHES[0]
  }, [selectedPaperId])

  const selectedBinding = useMemo(() => {
    return BINDING_METHODS.find((b) => b.id === selectedBindingId) || BINDING_METHODS[0]
  }, [selectedBindingId])

  // Calculated spine width in mm
  const calculatedSpineMM = useMemo(() => {
    const sheets = Math.ceil(calcPages / 2)
    const sheetThickness = calcGsm <= 80 ? 0.10 : calcGsm <= 100 ? 0.12 : calcGsm <= 130 ? 0.15 : 0.20
    const rawSpine = sheets * sheetThickness
    return Math.max(2.5, Math.round((rawSpine + 0.5) * 10) / 10)
  }, [calcPages, calcGsm])

  return (
    <div className="section section--alt print-guide-atelier" style={{ paddingTop: '32px', paddingBottom: '90px' }}>
      <div className="container max-w-7xl px-4 sm:px-6">
        
        {/* Luxury Header Showcase */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 font-extrabold text-xs mb-3 border border-amber-500/30">
            <SparkleIcon size={14} />
            <span>{isLao ? 'ສູນຄວາມຮູ້ & ຄູ່ມືວັດສະດຸງານພິມ' : 'PRINT & MATERIAL ATELIER GUIDE'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-main tracking-tight mb-3">
            {isLao ? 'ຄູ່ມືວັດສະດຸ, ເຈ້ຍ & ວິທີເຂົ້າເລັ້ມປຶ້ມ' : 'Paper Stocks, Book Binding & Luxury Finishes'}
          </h1>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            {isLao
              ? 'ສຳຫຼວດຕົວຢ່າງເນື້ອເຈ້ຍ, ຄວາມໜາ GSM, ຄວາມຈຸໜ້າປຶ້ມແຕ່ລະຮູບແບບ ແລະ ມາດຕະຖານໄຟລ໌ 300 DPI ເພື່ອໃຫ້ງານພິມຂອງທ່ານສົມບູນແບບທີ່ສຸດ.'
              : 'Explore tactile paper swatches, GSM thickness metrics, book binding capacities, and 300 DPI prepress standards.'}
          </p>
        </div>

        {/* 4 Main Category Cards (Header Tabs) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <button
            type="button"
            onClick={() => setActiveCategoryTab('paper')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              activeCategoryTab === 'paper'
                ? 'bg-card border-amber-400 text-main shadow-lg ring-2 ring-amber-400/40 scale-[1.02]'
                : 'bg-card/70 border-border-subtle text-muted hover:bg-card hover:border-amber-400/50 hover:text-main'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20 text-xl">
              📄
            </div>
            <div>
              <strong className="text-xs sm:text-sm font-extrabold text-main block">
                {isLao ? '1. ຊະນິດເຈ້ຍ & ວັດສະດຸ' : '1. Paper Stocks'}
              </strong>
              <span className="text-[11px] text-muted">{PAPER_SWATCHES.length} {isLao ? 'ຕົວຢ່າງເຈ້ຍ' : 'swatches'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryTab('binding')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              activeCategoryTab === 'binding'
                ? 'bg-card border-amber-400 text-main shadow-lg ring-2 ring-amber-400/40 scale-[1.02]'
                : 'bg-card/70 border-border-subtle text-muted hover:bg-card hover:border-amber-400/50 hover:text-main'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20 text-xl">
              📚
            </div>
            <div>
              <strong className="text-xs sm:text-sm font-extrabold text-main block">
                {isLao ? '2. ວິທີເຂົ້າເລັ້ມປຶ້ມ' : '2. Book Binding'}
              </strong>
              <span className="text-[11px] text-muted">{BINDING_METHODS.length} {isLao ? 'ຮູບແບບສັນປຶ້ມ' : 'methods'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryTab('preflight')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              activeCategoryTab === 'preflight'
                ? 'bg-card border-amber-400 text-main shadow-lg ring-2 ring-amber-400/40 scale-[1.02]'
                : 'bg-card/70 border-border-subtle text-muted hover:bg-card hover:border-amber-400/50 hover:text-main'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20 text-xl">
              🎨
            </div>
            <div>
              <strong className="text-xs sm:text-sm font-extrabold text-main block">
                {isLao ? '3. ໄຟລ໌ 300 DPI' : '3. Preflight 300 DPI'}
              </strong>
              <span className="text-[11px] text-muted">{isLao ? 'ມາດຕະຖານສີ CMYK' : 'Color standards'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryTab('finishing')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              activeCategoryTab === 'finishing'
                ? 'bg-card border-amber-400 text-main shadow-lg ring-2 ring-amber-400/40 scale-[1.02]'
                : 'bg-card/70 border-border-subtle text-muted hover:bg-card hover:border-amber-400/50 hover:text-main'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0 border border-pink-500/20 text-xl">
              ✨
            </div>
            <div>
              <strong className="text-xs sm:text-sm font-extrabold text-main block">
                {isLao ? '4. ເຄືອບ & ປ້ຳຟອຍ' : '4. Luxury Finishes'}
              </strong>
              <span className="text-[11px] text-muted">{isLao ? 'Matte, Gloss, Foil' : 'Tactile effects'}</span>
            </div>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: PAPER STOCKS (Left Swatch Deck + Right Detailed Swatch Card)      */}
        {/* ========================================================================= */}
        {activeCategoryTab === 'paper' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Material Selection Deck */}
            <div className="lg:col-span-4 space-y-2.5">
              <div className="text-xs font-black text-amber-600 dark:text-amber-300 uppercase tracking-wider mb-2 px-1">
                {isLao ? 'ເລືອກຊະນິດເຈ້ຍເພື່ອເບິ່ງຕົວຢ່າງ:' : 'Select Paper Swatch:'}
              </div>

              {PAPER_SWATCHES.map((paper) => {
                const isSelected = selectedPaperId === paper.id
                return (
                  <button
                    key={paper.id}
                    type="button"
                    onClick={() => setSelectedPaperId(paper.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-card border-amber-400 text-main shadow-xl ring-2 ring-amber-400/40 scale-[1.02]'
                        : 'bg-card/60 border-border-subtle text-muted hover:bg-card hover:border-border-gold hover:text-main'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Realistic Swatch Thumbnail Dot */}
                      <span
                        className="w-7 h-7 rounded-xl border border-white/30 shrink-0 shadow-sm"
                        style={{ background: paper.swatchGradient }}
                      />
                      <div>
                        <strong className={`text-xs sm:text-sm font-bold block ${isSelected ? 'text-amber-500 font-black' : 'text-main'}`}>
                          {isLao ? paper.name.split('(')[0] : paper.nameEn.split('(')[0]}
                        </strong>
                        <span className="text-[11px] text-muted font-medium">{paper.gsm}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-surface border border-border-subtle text-muted shrink-0">
                      {paper.thicknessText}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Right Column: Luxury Paper Swatch Card */}
            <div className="lg:col-span-8 bg-card rounded-3xl p-6 sm:p-10 border border-border-gold shadow-2xl space-y-6">
              {/* Paper Swatch Visual Sheet Simulation */}
              <div
                className="h-44 sm:h-52 rounded-3xl p-6 flex flex-col justify-between border border-border-subtle relative overflow-hidden shadow-inner"
                style={{ background: selectedPaper.swatchGradient }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

                {/* Top Specs on Swatch */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-slate-950/90 text-white border border-white/20 shadow-md">
                    {selectedPaper.gsm}
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-white/90 dark:bg-black/70 text-slate-900 dark:text-white backdrop-blur-md border border-white/30 shadow-xs">
                    {selectedPaper.thicknessText}
                  </span>
                </div>

                {/* Swatch Title */}
                <div className="relative z-10">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-300 drop-shadow-md block mb-1">
                    {selectedPaper.finishType}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                    {isLao ? selectedPaper.name : selectedPaper.nameEn}
                  </h2>
                </div>
              </div>

              {/* Surface & Tactile Feel Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-surface border border-border-subtle">
                  <strong className="text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-300 block mb-1">
                    ✨ {isLao ? 'ລັກສະນະຜິວສຳຜັດ (Tactile Sensation):' : 'Tactile Sensation:'}
                  </strong>
                  <p className="text-xs sm:text-sm text-main font-semibold leading-relaxed">
                    {isLao ? selectedPaper.tactileSensation : selectedPaper.tactileSensationEn}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface border border-border-subtle">
                  <strong className="text-[11px] uppercase tracking-wider text-blue-500 block mb-1">
                    👁️ {isLao ? 'ຄວາມທຶບແສງ & ຄວາມໜາ (Opacity & Caliper):' : 'Opacity & Caliper:'}
                  </strong>
                  <p className="text-xs sm:text-sm text-main font-semibold leading-relaxed">
                    {selectedPaper.opacityRating} · {selectedPaper.thicknessText}
                  </p>
                </div>
              </div>

              {/* Feature Badges */}
              <div className="flex flex-wrap gap-2">
                {selectedPaper.badgeTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Suitable Applications */}
              <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
                <strong className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-300 block mb-2 font-black">
                  🎯 {isLao ? 'ເໝາະສຳລັບງານພິມປະເພດໃດ:' : 'Best Suited For:'}
                </strong>
                <ul className="space-y-2">
                  {(isLao ? selectedPaper.suitableApplications : selectedPaper.suitableApplicationsEn).map((app, idx) => (
                    <li key={idx} className="text-xs text-main font-medium flex items-center gap-2.5">
                      <CheckIcon size={16} color="#10B981" />
                      <span>{app}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Order CTA */}
              <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-muted">
                  <span>{isLao ? 'ສິນຄ້າແນະນຳ: ' : 'Recommended Product: '}</span>
                  <strong className="text-main">{selectedPaper.bestProductTitle}</strong>
                </div>

                <Link
                  to={selectedPaper.bestProductLink}
                  className="btn btn--gold btn--sm shadow-glow shrink-0 flex items-center gap-2"
                  style={{ color: '#020B1A', fontWeight: 900 }}
                >
                  <span>{isLao ? 'ເລີ່ມສັ່ງພິມດ້ວຍເຈ້ຍນີ້' : 'Order With This Paper'}</span>
                  <ArrowRightIcon size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: BOOK BINDING (Left Methods + Right Capacity & Live Estimator)     */}
        {/* ========================================================================= */}
        {activeCategoryTab === 'binding' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Binding Methods List */}
            <div className="lg:col-span-4 space-y-2.5">
              <div className="text-xs font-black text-amber-600 dark:text-amber-300 uppercase tracking-wider mb-2 px-1">
                {isLao ? 'ເລືອກຮູບແບບການເຂົ້າເລັ້ມ:' : 'Select Binding Method:'}
              </div>

              {BINDING_METHODS.map((method) => {
                const isSelected = selectedBindingId === method.id
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedBindingId(method.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-card border-amber-400 text-main shadow-xl ring-2 ring-amber-400/40 scale-[1.02]'
                        : 'bg-card/60 border-border-subtle text-muted hover:bg-card hover:border-border-gold hover:text-main'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-surface border border-border-subtle shrink-0">
                        {method.icon}
                      </span>
                      <div>
                        <strong className={`text-xs sm:text-sm font-bold block ${isSelected ? 'text-amber-500 font-black' : 'text-main'}`}>
                          {isLao ? method.name.split('(')[0] : method.nameEn.split('(')[0]}
                        </strong>
                        <span className="text-[11px] text-muted font-medium">{method.pageCapacityText}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Right Column: Binding Details & Live Spine Estimator */}
            <div className="lg:col-span-8 bg-card rounded-3xl p-6 sm:p-10 border border-border-gold shadow-2xl space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
                <div className="flex items-center gap-3.5">
                  <span className="text-4xl p-3 rounded-2xl bg-surface border border-border-subtle shadow-sm">
                    {selectedBinding.icon}
                  </span>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-main">
                      {isLao ? selectedBinding.name : selectedBinding.nameEn}
                    </h2>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-300">
                      📄 {isLao ? 'ຄວາມຈຸໜ້າ:' : 'Capacity:'} {selectedBinding.pageCapacityText}
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 self-start sm:self-auto">
                  {selectedBinding.badge}
                </span>
              </div>

              {/* Best Suited For Box */}
              <div className="p-4 rounded-2xl bg-surface border border-border-subtle">
                <strong className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-300 block mb-1 font-bold">
                  🎯 {isLao ? 'ເໝາະສຳລັບປຶ້ມປະເພດໃດ:' : 'Best Suited For:'}
                </strong>
                <p className="text-xs sm:text-sm text-main font-bold leading-relaxed">
                  {isLao ? selectedBinding.bestSuitedFor : selectedBinding.bestSuitedForEn}
                </p>
              </div>

              {/* Advantages List */}
              <div className="space-y-2.5">
                <strong className="text-xs font-bold text-main block uppercase tracking-wider">
                  {isLao ? 'ຈຸດເດັ່ນ & ຂໍ້ໄດ້ປຽບ:' : 'Key Advantages:'}
                </strong>
                <div className="space-y-2">
                  {(isLao ? selectedBinding.keyAdvantages : selectedBinding.keyAdvantagesEn).map((adv, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-surface border border-border-subtle text-xs text-main font-medium flex items-start gap-2.5">
                      <CheckIcon size={16} color="#10B981" />
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caution Box */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
                <strong className="font-bold">⚠️ {isLao ? 'ຂໍ້ຄວນລະວັງໃນການກຽມໄຟລ໌:' : 'Prepress Caution:'}</strong>
                <p className="mt-1 leading-relaxed">{isLao ? selectedBinding.prepressCaution : selectedBinding.prepressCautionEn}</p>
              </div>

              {/* Live Interactive Spine Width Calculator */}
              <div className="pt-4 border-t border-border-subtle">
                <div className="p-6 rounded-2xl bg-surface border border-border-gold">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-300 uppercase tracking-wider mb-4">
                    <SparkleIcon size={16} />
                    <span>{isLao ? 'ເຄື່ອງມືຄຳນວນຄວາມໜາສັນປຶ້ມ (Live Spine Calculator):' : 'Spine Thickness Estimator:'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                    <div>
                      <span className="text-xs text-muted block mb-1">
                        {isLao ? 'ຈຳນວນໜ້າ:' : 'Pages:'} <strong className="text-main">{calcPages} ໜ້າ</strong>
                      </span>
                      <input
                        type="range"
                        min={20}
                        max={500}
                        step={10}
                        value={calcPages}
                        onChange={(e) => setCalcPages(Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <span className="text-xs text-muted block mb-1">
                        {isLao ? 'ເຈ້ຍໜ້າໃນ:' : 'Paper Stock:'}
                      </span>
                      <select
                        value={calcGsm}
                        onChange={(e) => setCalcGsm(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-card text-main border border-border-subtle text-xs font-bold"
                      >
                        <option value={80}>Bond 80g / Green Read 80g</option>
                        <option value={100}>Bond 100g (ໜາພິເສດ)</option>
                        <option value={130}>Art Paper 130g</option>
                        <option value={160}>Art Paper 160g</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border-gold flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-[10px] text-muted block">{isLao ? 'ຄວາມໜາສັນປຶ້ມ:' : 'Spine Width:'}</span>
                        <span className="text-2xl font-black text-amber-500">{calculatedSpineMM} mm</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {calcPages >= 40 ? '✓ ສັນກາວໄດ້ດີ' : '⚠️ ໜ້ອຍກວ່າ 40 ໜ້າ'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: PREFLIGHT & CMYK (Visual Card Comparisons)                       */}
        {/* ========================================================================= */}
        {activeCategoryTab === 'preflight' && (
          <div className="bg-card rounded-3xl p-6 sm:p-12 border border-border-gold shadow-2xl space-y-8">
            <div className="max-w-3xl">
              <span className="text-xs font-black text-amber-600 dark:text-amber-300 uppercase tracking-wider block mb-1">
                PREPRESS TECHNICAL STANDARDS
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-main mb-2">
                {isLao ? '3 ມາດຕະຖານຫຼັກໃນການກຽມໄຟລ໌ງານພິມ' : '3 Core Standards for Flawless Printing'}
              </h2>
              <p className="text-muted text-xs sm:text-sm leading-relaxed">
                {isLao
                  ? 'ກະລຸນາກວດສອບ 3 ຈຸດສຳຄັນນີ້ກ່ອນສົ່ງໄຟລ໌ ເພື່ອໃຫ້ງານພິມອອກມາສວຍງາມ ສີສັນກົງປົກ ແລະ ບໍ່ຖືກຕັດໂດນຂໍ້ຄວາມ:'
                  : 'Ensure your design meets these 3 specifications to prevent blurriness, color shift, or cutoff margins:'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-surface border border-border-subtle flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl font-black mb-4 border border-blue-500/20">
                    300
                  </div>
                  <h3 className="text-base font-bold text-main mb-2">1. ຄວາມລະອຽດ 300 DPI</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {isLao
                      ? 'ໄຟລ໌ຮູບພາບຕ້ອງມີຄວາມລະອຽດຢ່າງໜ້ອຍ 300 DPI ທີ່ຂະໜາດຈິງ 100% ຫາກໃຊ້ຮູບ 72 DPI ຈາກເວັບໄຊ ງານພິມຈະແຕກມົວ.'
                      : 'Bitmaps must be 300 DPI at actual print dimensions. Web graphics (72 DPI) will print blurry and pixelated.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border-subtle text-[11px] font-bold text-emerald-500">
                  ✓ ລະບົບມີ Preflight Scanner ກວດໃຫ້ອັດຕະໂນມັດ
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-surface border border-border-subtle flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg font-black mb-4 border border-amber-500/20">
                    CMYK
                  </div>
                  <h3 className="text-base font-bold text-main mb-2">2. ໂໝດສີ CMYK (FOGRA39)</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {isLao
                      ? 'ຕັ້ງຄ່າໂໝດສີເປັນ CMYK ສະເໝີ ເນື່ອງຈາກຈໍພາບສະແດງຜົນເປັນ RGB ແຕ່ເຄື່ອງພິມໃຊ້ແມ່ສີ CMYK 4 ສີ ຫາກບໍ່ປ່ຽນ ສີພິມຈິງອາດຈະດູດລົງ.'
                      : 'Convert artwork to CMYK color profile. RGB glow cannot be reproduced accurately with physical process inks.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border-subtle text-[11px] font-bold text-amber-500">
                  ⚡ ຫຼີກລ້ຽງການໃຊ້ສີ Neon RGB ທີ່ເກີນຂອບເຂດ CMYK
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-surface border border-border-subtle flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-lg font-black mb-4 border border-purple-500/20">
                    3 mm
                  </div>
                  <h3 className="text-base font-bold text-main mb-2">3. ໄລຍະຕັດຕົກ (Bleed 3mm) & Safe Zone</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {isLao
                      ? 'ເພີ່ມຂອບຕັດຕົກ (Bleed) ອອກໄປ 3 mm ທຸກດ້ານ ແລະ ວາງຂໍ້ຄວາມສຳຄັນໃຫ້ຫ່າງຈາກຂອບຕັດ (Safe Zone) ຢ່າງໜ້ອຍ 3-5 mm ເພື່ອປ້ອງກັນການຕັດໂດນເນື້ອຫາ.'
                      : 'Extend backgrounds 3mm beyond the trim line. Keep essential text inside 3-5mm safe margin to prevent cutoff.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border-subtle text-[11px] font-bold text-purple-500">
                  📐 ຕັ້ງຄ່າ Bleed 3mm ໃນ Illustrator / Canva
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: LUXURY FINISHES & FOIL (Tactile Coating Cards)                    */}
        {/* ========================================================================= */}
        {activeCategoryTab === 'finishing' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card rounded-3xl p-6 border border-border-subtle hover:border-gold transition-all shadow-md flex flex-col justify-between">
              <div>
                <span className="text-3xl mb-3 block">🛡️</span>
                <h3 className="text-base font-bold text-main mb-1">
                  {isLao ? 'ເຄືອບດ້ານ (Matte)' : 'Matte Lamination'}
                </h3>
                <p className="text-xs text-muted leading-relaxed my-2">
                  {isLao
                    ? 'ຜິວສຳຜັດນຽນນຸ່ມ ບໍ່ສະທ້ອນແສງ ໃຫ້ຄວາມຮູ້ສຶກຫຼູຫຼາ ມາດຕະຖານສາກົນ ສຳລັບປົກປຶ້ມ ແລະ ນາມບັດ.'
                    : 'Smooth anti-reflective matte finish offering subtle luxury and protection.'}
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-500 pt-3 border-t border-border-subtle">
                ✓ ປົກປ້ອງຮອຍຂູດຂີດ
              </span>
            </div>

            <div className="bg-card rounded-3xl p-6 border border-border-subtle hover:border-gold transition-all shadow-md flex flex-col justify-between">
              <div>
                <span className="text-3xl mb-3 block">✨</span>
                <h3 className="text-base font-bold text-main mb-1">
                  {isLao ? 'ເຄືອບເງົາ (Gloss)' : 'Gloss Lamination'}
                </h3>
                <p className="text-xs text-muted leading-relaxed my-2">
                  {isLao
                    ? 'ຂັບສີສັນໃຫ້ສົດໃສ ເງົາງາມ ກັນນ້ຳ ແລະ ຮອຍຂູດຂີດ ເໝາະສຳລັບແຄັດຕາລັອກ ແລະ ໂຟໂຕ້ບຸກ.'
                    : 'High-shine lamination amplifying vibrant colors and maximum water resistance.'}
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-500 pt-3 border-t border-border-subtle">
                ✓ ຂັບສີໃຫ້ສົດໃສເງົາງາມ
              </span>
            </div>

            <div className="bg-card rounded-3xl p-6 border border-border-subtle hover:border-gold transition-all shadow-md flex flex-col justify-between">
              <div>
                <span className="text-3xl mb-3 block">👑</span>
                <h3 className="text-base font-bold text-main mb-1">
                  {isLao ? 'ປ້ຳຟອຍຄຳ (Hot Foil)' : 'Hot Foil Stamping'}
                </h3>
                <p className="text-xs text-muted leading-relaxed my-2">
                  {isLao
                    ? 'ປ້ຳຟອຍໂລຫະຮ້ອນ ສະທ້ອນແສງແວວວາວ (ສີທອງ Gold, ສີເງິນ Silver, Rose Gold, Hologram).'
                    : 'Thermal foil stamping creating brilliant metallic reflections on logos and headers.'}
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-500 pt-3 border-t border-border-subtle">
                ✓ ຫຼູຫຼາລະດັບພຣີມ້ຽມ
              </span>
            </div>

            <div className="bg-card rounded-3xl p-6 border border-border-subtle hover:border-gold transition-all shadow-md flex flex-col justify-between">
              <div>
                <span className="text-3xl mb-3 block">💎</span>
                <h3 className="text-base font-bold text-main mb-1">
                  {isLao ? 'Spot UV ນູນ 3D' : 'Raised 3D Spot UV'}
                </h3>
                <p className="text-xs text-muted leading-relaxed my-2">
                  {isLao
                    ? 'ເຄືອບວານິດເງົາສະເພາະຈຸດແບບນູນ ສຳຜັດມີມິຕິ ສ້າງຄວາມແຕກຕ່າງລະຫວ່າງພື້ນດ້ານ ແລະ ຕົວໜັງສື.'
                    : 'Dimensional tactile gloss lacquer providing high contrast against matte backgrounds.'}
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-500 pt-3 border-t border-border-subtle">
                ✓ ສຳຜັດມີມິຕິນູນເງົາ
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
