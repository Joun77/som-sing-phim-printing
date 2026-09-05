export interface FinishingMaterialItem {
  id: string;
  name: string;
  unitCost: number; // cost per piece/unit (e.g. 50 LAK per staple)
  qtyPerItem: number; // quantity used per finished item (e.g. 2 staples per booklet)
  materialId?: string;
  category?: string;
  calcMode?: 'unit' | 'box'; // 'unit' = direct unit cost, 'box' = package price / units per box
  packagePrice?: number; // e.g. 50000 LAK per box
  unitsPerPackage?: number; // e.g. 1000 staples per box
  unitName?: string; // e.g. 'ໂຕ', 'ຂໍ້', 'ກ່ອງ', 'ແຜ່ນ'
}

export interface PricingTemplatePreset {
  id: string;
  nameLao: string;
  nameEn: string;
  category: 'book' | 'stationery' | 'sticker' | 'marketing' | 'custom' | string;
  description: string;
  iconName: string;
  activeModules: {
    paper: boolean;
    printEngine: boolean;
    postPressMachinery: boolean;
    finishingMaterials: boolean;
    laborAndSetup: boolean;
    packagingDelivery: boolean;
  };
  defaultMaterials?: FinishingMaterialItem[];
  defaultLaborPercent?: number;
}

export const DEFAULT_PRICING_TEMPLATES: PricingTemplatePreset[] = [
  {
    id: 'TPL_PERFECT_BIND_BOOK',
    nameLao: 'ປຶ້ມເຂົ້າເຫຼັ້ມສັນກາວຮ້ອນ (Perfect Binding Book)',
    nameEn: 'Perfect Binding Book',
    category: 'book',
    description: 'ປຶ້ມສັນກາວ: ປົກ Art Card 260g ເຄືອບດ້ານ, ເນື້ອໃນ 80g, ເຄື່ອງກາວຮ້ອນ Horizon BQ, ກາວ EVA',
    iconName: 'Book',
    activeModules: {
      paper: true,
      printEngine: true,
      postPressMachinery: true,
      finishingMaterials: true,
      laborAndSetup: true,
      packagingDelivery: false,
    },
    defaultMaterials: [
      {
        id: 'mat-glue-1',
        name: 'ເມັດກາວຮ້ອນ EVA Hot-Melt Adhesive',
        calcMode: 'unit',
        unitCost: 350,
        qtyPerItem: 1,
        unitName: 'ເລັ້ມ',
        category: 'glue',
      },
      {
        id: 'mat-lam-cover',
        name: 'ຟິມເຄືອບດ້ານໜ້າປົກ BOPP Matte Thermal Lamination',
        calcMode: 'unit',
        unitCost: 1200,
        qtyPerItem: 1,
        unitName: 'ແຜ່ນ',
        category: 'film',
      },
    ],
    defaultLaborPercent: 15,
  },
  {
    id: 'TPL_HARDCOVER_BOOK',
    nameLao: 'ປຶ້ມເຂົ້າເຫຼັ້ມປົກແຂງຈົ່ວປັງ (Hardcover / Case Binding)',
    nameEn: 'Case Bound Hardcover Book',
    category: 'book',
    description: 'ປຶ້ມປົກແຂງພຣີມຽມ: ແຜ່ນຈົ່ວປັງເບີ 24 (2mm), ໃບຫໍ່ປົກ Art 130g ເຄືອບດ້ານ, ໃບຮອງປົກ, ກາວປະກົບປົກ',
    iconName: 'Bookmark',
    activeModules: {
      paper: true,
      printEngine: true,
      postPressMachinery: true,
      finishingMaterials: true,
      laborAndSetup: true,
      packagingDelivery: true,
    },
    defaultMaterials: [
      {
        id: 'mat-greyboard-1',
        name: 'ແຜ່ນແຂງຈົ່ວປັງ No.24 (Greyboard 2.0mm)',
        calcMode: 'unit',
        unitCost: 6500,
        qtyPerItem: 1,
        unitName: 'ຊຸດ',
        category: 'board',
      },
      {
        id: 'mat-endpaper-1',
        name: 'ເຈ້ຍໃບຮອງປົກໜ້າ-ຫຼັງ (Endpapers 140g)',
        calcMode: 'unit',
        unitCost: 2000,
        qtyPerItem: 2,
        unitName: 'ຊຸດ',
        category: 'paper',
      },
      {
        id: 'mat-case-glue-1',
        name: 'ກາວປະກົບປົກແຂງ PVA Case-Making Adhesive',
        calcMode: 'unit',
        unitCost: 2500,
        qtyPerItem: 1,
        unitName: 'ເລັ້ມ',
        category: 'glue',
      },
    ],
    defaultLaborPercent: 25,
  },
  {
    id: 'TPL_PHOTO_PRINT',
    nameLao: 'ພິມຮູບພາບ / ກາດຮູບຖ່າຍ (High-Res Photo Prints)',
    nameEn: 'Photo Print & Gallery Cards',
    category: 'marketing',
    description: 'ງານພິມຮູບພາບຄົມຊັດສູງ: ເຈ້ຍ Photo Glossy 230g, ພິມລະບົບດິຈິຕອລ 4 ສີ 300 DPI, ຕັດຊອຍຂອບສາກ',
    iconName: 'Sparkles',
    activeModules: {
      paper: true,
      printEngine: true,
      postPressMachinery: true,
      finishingMaterials: false,
      laborAndSetup: true,
      packagingDelivery: false,
    },
    defaultMaterials: [],
    defaultLaborPercent: 10,
  },
  {
    id: 'TPL_BOOKLET_STAPLE',
    nameLao: 'ປຶ້ມ / ວາລະສານ ມຸງຫຼັງຄາ (Saddle-Stitch)',
    nameEn: 'Saddle-Stitch Booklet',
    category: 'book',
    description: 'ງານປຶ້ມເຢັບແມັກມຸງຫຼັງຄາ: ຄິດໄລ່ເຈ້ຍ, ພິມ 4 ສີ/ຂາວດຳ, ເຄື່ອງພັບ, ລວດເຢັບແມັກ',
    iconName: 'BookOpen',
    activeModules: {
      paper: true,
      printEngine: true,
      postPressMachinery: true,
      finishingMaterials: true,
      laborAndSetup: true,
      packagingDelivery: false,
    },
    defaultMaterials: [
      { 
        id: 'mat-staple-1', 
        name: 'ລວດເຢັບແມັກມຸງຫຼັງຄາ (Staple Wire #10)', 
        calcMode: 'box',
        packagePrice: 50000,
        unitsPerPackage: 1000,
        unitCost: 50, 
        qtyPerItem: 2, 
        unitName: 'ໂຕ',
        category: 'staple' 
      }
    ],
    defaultLaborPercent: 15,
  },
  {
    id: 'TPL_DESK_CALENDAR',
    nameLao: 'ປະຕິທິນຕັ້ງໂຕະສັນຫ່ວງ (Desk Calendar)',
    nameEn: 'Desk Calendar (Wire-O)',
    category: 'stationery',
    description: 'ປະຕິທິນຕັ້ງໂຕະ: ເຈ້ຍອາດມັນ 260g, ພິມ 2 ໜ້າ, ເຄືອບ, ເຈາະຮູ, ຫ່ວງກະດູກງູ, ຂາຕັ້ງ',
    iconName: 'Calendar',
    activeModules: {
      paper: true,
      printEngine: true,
      postPressMachinery: true,
      finishingMaterials: true,
      laborAndSetup: true,
      packagingDelivery: true,
    },
    defaultMaterials: [
      { 
        id: 'mat-wire-1', 
        name: 'ຫ່ວງກະດູກງູ Wire-O (Twin Loop 5/16")', 
        calcMode: 'box',
        packagePrice: 180000,
        unitsPerPackage: 100,
        unitCost: 1800, 
        qtyPerItem: 1, 
        unitName: 'ຂໍ້',
        category: 'wire' 
      },
      { 
        id: 'mat-stand-1', 
        name: 'ຂາຕັ້ງປະຕິທິນແຂງສຳເລັດຮູບ', 
        calcMode: 'unit',
        unitCost: 4500, 
        qtyPerItem: 1, 
        unitName: 'ອັນ',
        category: 'other' 
      }
    ],
    defaultLaborPercent: 20,
  },
  {
    id: 'TPL_STICKER_DIECUT',
    nameLao: 'ສະຕິກເກີໄດຄັດ + ເຄືອບຟິມ (Die-Cut Sticker)',
    nameEn: 'Die-Cut Sticker & Lamination',
    category: 'sticker',
    description: 'ສະຕິກເກີ PP/PVC ກັນນ້ຳ, ພິມ 4 ສີ, ເຄືອບຟິມເງົາ/ດ້ານ, ເຄື່ອງໄດຄັດຕາມຮູບ',
    iconName: 'Sparkles',
    activeModules: {
      paper: true,
      printEngine: true,
      postPressMachinery: true,
      finishingMaterials: true,
      laborAndSetup: true,
      packagingDelivery: false,
    },
    defaultMaterials: [
      { id: 'mat-film-1', name: 'ຟິມເຄືອບເງົາ BOPP Thermal Lamination', unitCost: 800, qtyPerItem: 1, category: 'film' }
    ],
    defaultLaborPercent: 15,
  },
  {
    id: 'TPL_FLYER_BROCHURE',
    nameLao: 'ໃບປິວ / ແຜ່ນພັບ 4 ສີ (Flyer & Brochure)',
    nameEn: 'Flyer & Brochure A4',
    category: 'marketing',
    description: 'ໃບປິວໂຄສະນາ: ເຈ້ຍອາດ 130-160g, ພິມ 4 ສີ, ຕັດເຈຽນ/ພັບ 2-3 ຕອນ',
    iconName: 'FileText',
    activeModules: {
      paper: true,
      printEngine: true,
      postPressMachinery: true,
      finishingMaterials: false,
      laborAndSetup: true,
      packagingDelivery: false,
    },
    defaultMaterials: [],
    defaultLaborPercent: 10,
  },
  {
    id: 'TPL_BUSINESS_CARD',
    nameLao: 'ນາມບັດມາດຕະຖານ + ກ່ອງໃສ່ (Business Card)',
    nameEn: 'Business Card + Box',
    category: 'stationery',
    description: 'ນາມບັດ Art Card 300g, ພິມ 4 ສີ 2 ໜ້າ, ເຄືອບດ້ານ, ຕັດມຸມ, ກ່ອງອະຄຣິລິກ',
    iconName: 'CreditCard',
    activeModules: {
      paper: true,
      printEngine: true,
      postPressMachinery: true,
      finishingMaterials: true,
      laborAndSetup: true,
      packagingDelivery: true,
    },
    defaultMaterials: [
      { id: 'mat-box-1', name: 'ກ່ອງໃສ່ນາມບັດອະຄຣິລິກໃສ (ບັນຈຸ 100 ໃບ)', unitCost: 3500, qtyPerItem: 1, category: 'box' }
    ],
    defaultLaborPercent: 15,
  },
  {
    id: 'TPL_CUSTOM',
    nameLao: 'ກຳນົດເອງແບບອິດສະຫຼະ (Custom Spec)',
    nameEn: 'Custom Modular Spec',
    category: 'custom',
    description: 'ເລືອກເປີດ-ປິດ ແລະ ປັບແຕ່ງທຸກໂມດູນໄດ້ຕາມໃຈ',
    iconName: 'Sliders',
    activeModules: {
      paper: true,
      printEngine: true,
      postPressMachinery: true,
      finishingMaterials: true,
      laborAndSetup: true,
      packagingDelivery: true,
    },
    defaultMaterials: [],
    defaultLaborPercent: 15,
  }
];
