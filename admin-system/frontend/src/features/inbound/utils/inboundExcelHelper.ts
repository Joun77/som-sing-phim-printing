import * as XLSX from 'xlsx';
import { InboundItemFormData, createDefaultItem } from '../components/forms/types';

export interface CategoryTemplateDef {
  id: string;
  nameLo: string;
  nameEn: string;
  fileName: string;
  headers: { key: string; labelLo: string; labelEn: string; width: number }[];
  sampleRows: Record<string, any>[];
}

export const TEMPLATE_DEFINITIONS: Record<string, CategoryTemplateDef> = {
  PAPER: {
    id: 'PAPER',
    nameLo: 'ເຈ້ຍ & ສື່ພິມ (Paper & Media)',
    nameEn: 'Paper & Media Catalog',
    fileName: 'Template_Inbound_Paper.xlsx',
    headers: [
      { key: 'sku', labelLo: 'ລະຫັດ SKU (ປະຫວ່າງໄວ້ເພື່ອ Auto)', labelEn: 'SKU Code (Blank for Auto)', width: 22 },
      { key: 'name', labelLo: 'ຊື່ເຈ້ຍ (Paper Name) *', labelEn: 'Paper Name *', width: 28 },
      { key: 'brand', labelLo: 'ແບຣນ (Brand)', labelEn: 'Brand', width: 16 },
      { key: 'paperType', labelLo: 'ປະເພດເຈ້ຍ (Plain Paper / Art Paper / Photo / Sticker / Kraft)', labelEn: 'Paper Type', width: 26 },
      { key: 'paperFormat', labelLo: 'ຮູບແບບ (cut_sheet / parent_sheet / roll)', labelEn: 'Format (cut_sheet/parent_sheet/roll)', width: 24 },
      { key: 'size', labelLo: 'ຂະໜາດ (A4 / A3 / A3+ / SRA3 / Custom)', labelEn: 'Size Preset', width: 18 },
      { key: 'grammage', labelLo: 'ແກຣມ (GSM: 70, 80, 100, 120, 260...)', labelEn: 'Grammage (GSM)', width: 18 },
      { key: 'packagingType', labelLo: 'ປະເພດຫໍ່ (Ream / Pack / Box / Sheet / Roll)', labelEn: 'Packaging Type', width: 20 },
      { key: 'sheetsPerPack', labelLo: 'ຈຳນວນແຜ່ນຕໍ່ຫໍ່ (Sheets/Pack)', labelEn: 'Sheets Per Pack', width: 18 },
      { key: 'quantity', labelLo: 'ຈຳນວນທີ່ນຳເຂົ້າ (Quantity) *', labelEn: 'Quantity *', width: 16 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ຫໍ່ (Unit Cost) *', labelEn: 'Unit Cost *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ (Supplier Name)', labelEn: 'Supplier Name', width: 22 },
      { key: 'surfaceFinish', labelLo: 'ຜິວສຳຜັດ (Glossy / Matte / Uncoated)', labelEn: 'Surface Finish', width: 18 }
    ],
    sampleRows: [
      {
        sku: '',
        name: 'Double A 80g A4 (ແຜ່ນຕັດສຳເລັດ)',
        brand: 'Double A',
        paperType: 'Plain Paper',
        paperFormat: 'cut_sheet',
        size: 'A4',
        grammage: 80,
        packagingType: 'Ream',
        sheetsPerPack: 500,
        quantity: 10,
        unitPrice: 65000,
        currency: 'LAK',
        supplier: 'Double A Laos',
        surfaceFinish: 'Uncoated'
      },
      {
        sku: '',
        name: 'ເຈ້ຍອາດກາດ 260g (A3+)',
        brand: 'SCG Paper',
        paperType: 'Art Paper',
        paperFormat: 'cut_sheet',
        size: 'A3+',
        grammage: 260,
        packagingType: 'Pack',
        sheetsPerPack: 100,
        quantity: 5,
        unitPrice: 135000,
        currency: 'LAK',
        supplier: 'Thai Paper Distributor',
        surfaceFinish: 'Glossy'
      }
    ]
  },
  INK: {
    id: 'INK',
    nameLo: 'ໝຶກພິມ (Ink & Toner)',
    nameEn: 'Ink & Toner',
    fileName: 'Template_Inbound_Ink.xlsx',
    headers: [
      { key: 'sku', labelLo: 'ລະຫັດ SKU (ປະຫວ່າງໄວ້ເພື່ອ Auto)', labelEn: 'SKU Code', width: 22 },
      { key: 'name', labelLo: 'ຊື່ໝຶກພິມ (Ink Name) *', labelEn: 'Ink Name *', width: 28 },
      { key: 'colorGroup', labelLo: 'ກຸ່ມສີ (Cyan / Magenta / Yellow / Black)', labelEn: 'Color Group', width: 20 },
      { key: 'inkKind', labelLo: 'ປະເພດເຄື່ອງ (inkjet / laser_toner)', labelEn: 'Ink Kind', width: 18 },
      { key: 'inkBaseType', labelLo: 'ເນື້ອໝຶກ (Dye / Pigment / Sublimation / Eco-Solvent / Toner)', labelEn: 'Base Type', width: 24 },
      { key: 'inkGrade', labelLo: 'ເກຣດ (genuine / compatible)', labelEn: 'Grade (genuine/compatible)', width: 20 },
      { key: 'volume', labelLo: 'ປະລິມານ (ml ຫຼື g)', labelEn: 'Volume (ml/g)', width: 16 },
      { key: 'quantity', labelLo: 'ຈຳນວນທີ່ນຳເຂົ້າ (Quantity) *', labelEn: 'Quantity *', width: 16 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ຂວດ/ກ່ອງ *', labelEn: 'Unit Cost *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ (Supplier Name)', labelEn: 'Supplier Name', width: 22 },
      { key: 'targetPrinter', labelLo: 'ເຄື່ອງພິມທີ່ຮອງຮັບ (Target Machine)', labelEn: 'Target Machine', width: 22 }
    ],
    sampleRows: [
      {
        sku: '',
        name: 'Epson 003 Black Ink (Dye)',
        colorGroup: 'Black',
        inkKind: 'inkjet',
        inkBaseType: 'Dye',
        inkGrade: 'genuine',
        volume: 65,
        quantity: 12,
        unitPrice: 85000,
        currency: 'LAK',
        supplier: 'Epson Official Distributor',
        targetPrinter: 'Epson L3150 / L3250'
      },
      {
        sku: '',
        name: 'Fuji Xerox DocuPrint C5005d Toner Cyan',
        colorGroup: 'Cyan',
        inkKind: 'laser_toner',
        inkBaseType: 'Toner',
        inkGrade: 'genuine',
        volume: 350,
        quantity: 4,
        unitPrice: 1250000,
        currency: 'LAK',
        supplier: 'Fuji Xerox Vientiane',
        targetPrinter: 'DocuPrint C5005d'
      }
    ]
  },
  LAMINATION: {
    id: 'LAMINATION',
    nameLo: 'ຟີມເຄືອບ (Lamination)',
    nameEn: 'Lamination',
    fileName: 'Template_Inbound_Lamination.xlsx',
    headers: [
      { key: 'sku', labelLo: 'ລະຫັດ SKU', labelEn: 'SKU Code', width: 20 },
      { key: 'name', labelLo: 'ຊື່ຟີມເຄືອບ (Lamination Name) *', labelEn: 'Lamination Name *', width: 28 },
      { key: 'laminationFormat', labelLo: 'ຮູບແບບ (Roll / Pouch / Sheet)', labelEn: 'Format', width: 18 },
      { key: 'laminationThickness', labelLo: 'ຄວາມໜາ (25μm / 32μm / 100μm / 125μm)', labelEn: 'Thickness', width: 20 },
      { key: 'laminationFinish', labelLo: 'ຜິວເຄືອບ (GLOSS_PVC / MATTE_PVC / SOFT_TOUCH)', labelEn: 'Finish Finish', width: 22 },
      { key: 'widthMm', labelLo: 'ຄວາມກວ້າງມ້ວນ (mm)', labelEn: 'Width (mm)', width: 16 },
      { key: 'lengthM', labelLo: 'ຄວາມຍາວກິໂລແມັດ/ແມັດ (m)', labelEn: 'Length (m)', width: 16 },
      { key: 'quantity', labelLo: 'ຈຳນວນທີ່ນຳເຂົ້າ *', labelEn: 'Quantity *', width: 16 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ມ້ວນ/ຊອງ *', labelEn: 'Unit Cost *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ', labelEn: 'Supplier', width: 22 }
    ],
    sampleRows: [
      {
        sku: '',
        name: 'ຟີມເຄືອບຮ້ອນ BOPP ດ້ານ (Matte)',
        laminationFormat: 'Roll',
        laminationThickness: '25μm',
        laminationFinish: 'MATTE_PVC',
        widthMm: 330,
        lengthM: 200,
        quantity: 6,
        unitPrice: 180000,
        currency: 'LAK',
        supplier: 'Laminating Tech Supplies'
      }
    ]
  },
  BINDING: {
    id: 'BINDING',
    nameLo: 'ອຸປະກອນເຂົ້າເຫຼັ້ມ (Binding & Finishing)',
    nameEn: 'Binding & Finishing',
    fileName: 'Template_Inbound_Binding.xlsx',
    headers: [
      { key: 'sku', labelLo: 'ລະຫັດ SKU', labelEn: 'SKU Code', width: 20 },
      { key: 'name', labelLo: 'ຊື່ອຸປະກອນເຂົ້າເຫຼັ້ມ *', labelEn: 'Binding Item Name *', width: 28 },
      { key: 'bindingType', labelLo: 'ປະເພດ (PERFECT_BIND / WIRE_O / STAPLE / TAPE)', labelEn: 'Binding Type', width: 22 },
      { key: 'diameter', labelLo: 'ຂະໜາດ/ເສັ້ນຜ່າສູນກາງ (6mm, 10mm, 12mm...)', labelEn: 'Diameter/Size', width: 20 },
      { key: 'spineColor', labelLo: 'ສີສັນ/ສັນຮູດ (Black / White / Silver / Gold)', labelEn: 'Spine Color', width: 18 },
      { key: 'quantity', labelLo: 'ຈຳນວນທີ່ນຳເຂົ້າ (ກ່ອງ/ມ້ວນ/ອັນ) *', labelEn: 'Quantity *', width: 18 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ຫົວໜ່ວຍ *', labelEn: 'Unit Cost *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ', labelEn: 'Supplier', width: 22 }
    ],
    sampleRows: [
      {
        sku: '',
        name: 'ສັນຂົດລວດດຳ Wire-O 3:1 (10mm)',
        bindingType: 'WIRE_O',
        diameter: '10mm',
        spineColor: 'Black',
        quantity: 10,
        unitPrice: 95000,
        currency: 'LAK',
        supplier: 'Binding Mart'
      }
    ]
  },
  SPARE_PARTS: {
    id: 'SPARE_PARTS',
    nameLo: 'ອະໄຫຼ່ຊ້ອມບຳລຸງ (Spare Parts Restock)',
    nameEn: 'Spare Parts Restock',
    fileName: 'Template_Inbound_SpareParts.xlsx',
    headers: [
      { key: 'sku', labelLo: 'ລະຫັດ SKU / OEM Part Number', labelEn: 'SKU / OEM Part No', width: 22 },
      { key: 'name', labelLo: 'ຊື່ອະໄຫຼ່ (Spare Part Name) *', labelEn: 'Part Name *', width: 28 },
      { key: 'category', labelLo: 'ໝວດອະໄຫຼ່ (drum / fuser / blade / roller / printhead / waste_box)', labelEn: 'Part Category', width: 22 },
      { key: 'modelRef', labelLo: 'ລະຫັດລຸ້ນ OEM (Model Ref)', labelEn: 'Model Ref', width: 18 },
      { key: 'assignedMachine', labelLo: 'ໃຊ້ກັບເຄື່ອງຈັກໃດ (Assigned Machine)', labelEn: 'Assigned Machine', width: 22 },
      { key: 'expectedLife', labelLo: 'ອາຍຸການໃຊ້ງານ (Yield/Pages/Hours)', labelEn: 'Expected Lifespan Units', width: 20 },
      { key: 'quantity', labelLo: 'ຈຳນວນທີ່ນຳເຂົ້າ (ອັນ) *', labelEn: 'Quantity *', width: 16 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ອັນ *', labelEn: 'Unit Cost *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ', labelEn: 'Supplier', width: 22 }
    ],
    sampleRows: [
      {
        sku: 'PART-C5005-DRUM',
        name: 'Fuji Xerox C5005d Drum Unit (BK/Color)',
        category: 'drum',
        modelRef: 'CT350894',
        assignedMachine: 'Fuji Xerox DocuPrint C5005d',
        expectedLife: 50000,
        quantity: 2,
        unitPrice: 1800000,
        currency: 'LAK',
        supplier: 'Fuji Xerox Official'
      },
      {
        sku: 'PART-EPSON-MAINT',
        name: 'Epson Maintenance Box (C12C934591)',
        category: 'waste_box',
        modelRef: 'C9345',
        assignedMachine: 'Epson L15150',
        expectedLife: 25000,
        quantity: 5,
        unitPrice: 280000,
        currency: 'LAK',
        supplier: 'Epson Laos'
      }
    ]
  },
  PACKAGING: {
    id: 'PACKAGING',
    nameLo: 'ບັນຈຸພັນ (Packaging Consumables)',
    nameEn: 'Packaging Consumables',
    fileName: 'Template_Inbound_Packaging.xlsx',
    headers: [
      { key: 'sku', labelLo: 'ລະຫັດ SKU', labelEn: 'SKU Code', width: 20 },
      { key: 'name', labelLo: 'ຊື່ບັນຈຸພັນ (Packaging Name) *', labelEn: 'Packaging Name *', width: 28 },
      { key: 'category', labelLo: 'ປະເພດ (box_card / box_a4 / bubble_wrap / opp_bag / tape)', labelEn: 'Category', width: 22 },
      { key: 'dimensions', labelLo: 'ຂະໜາດ/ລາຍລະອຽດ', labelEn: 'Dimensions', width: 20 },
      { key: 'quantity', labelLo: 'ຈຳນວນທີ່ນຳເຂົ້າ (ແພັກ/ລັງ/ມ້ວນ) *', labelEn: 'Quantity *', width: 18 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ຫົວໜ່ວຍ *', labelEn: 'Unit Cost *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ', labelEn: 'Supplier', width: 22 }
    ],
    sampleRows: [
      {
        sku: '',
        name: 'ກ່ອງນາມບັດພລາສຕິກໃສ (100 ໃບ)',
        category: 'box_card',
        dimensions: '9.5 x 6 x 3.5 cm',
        quantity: 200,
        unitPrice: 3500,
        currency: 'LAK',
        supplier: 'Packaging Box Vientiane'
      }
    ]
  },
  RIGID_SUBSTRATES: {
    id: 'RIGID_SUBSTRATES',
    nameLo: 'ແຜ່ນບອດ & ແຂງ (Rigid Substrates)',
    nameEn: 'Rigid Substrates',
    fileName: 'Template_Inbound_RigidSubstrates.xlsx',
    headers: [
      { key: 'sku', labelLo: 'ລະຫັດ SKU', labelEn: 'SKU Code', width: 20 },
      { key: 'name', labelLo: 'ຊື່ແຜ່ນບອດ (Substrate Name) *', labelEn: 'Substrate Name *', width: 28 },
      { key: 'type', labelLo: 'ປະເພດ (foam_board / future_board / plaswood / acrylic)', labelEn: 'Board Type', width: 22 },
      { key: 'thickness', labelLo: 'ຄວາມໜາ (mm: 3, 5, 10...)', labelEn: 'Thickness (mm)', width: 18 },
      { key: 'widthMm', labelLo: 'ຄວາມກວ້າງ (mm: 1220...)', labelEn: 'Width (mm)', width: 18 },
      { key: 'heightMm', labelLo: 'ຄວາມຍາວ (mm: 2440...)', labelEn: 'Height (mm)', width: 18 },
      { key: 'quantity', labelLo: 'ຈຳນວນແຜ່ນທີ່ນຳເຂົ້າ *', labelEn: 'Quantity *', width: 16 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ແຜ່ນ *', labelEn: 'Unit Cost *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ', labelEn: 'Supplier', width: 22 }
    ],
    sampleRows: [
      {
        sku: '',
        name: 'ແຜ່ນໂຟມບອດສີຂາວ 5mm (1.22x2.44m)',
        type: 'foam_board',
        thickness: 5,
        widthMm: 1220,
        heightMm: 2440,
        quantity: 30,
        unitPrice: 110000,
        currency: 'LAK',
        supplier: 'Signage Material Supply'
      }
    ]
  },
  CUTTING_SUPPLIES: {
    id: 'CUTTING_SUPPLIES',
    nameLo: 'ວັດສະດຸຊ່ວຍຕັດ (Cutting & Application)',
    nameEn: 'Cutting & Application',
    fileName: 'Template_Inbound_CuttingSupplies.xlsx',
    headers: [
      { key: 'sku', labelLo: 'ລະຫັດ SKU', labelEn: 'SKU Code', width: 20 },
      { key: 'name', labelLo: 'ຊື່ອຸປະກອນຊ່ວຍຕັດ *', labelEn: 'Cutting Item Name *', width: 28 },
      { key: 'type', labelLo: 'ປະເພດ (transfer_tape / cutting_mat / blade)', labelEn: 'Type', width: 22 },
      { key: 'quantity', labelLo: 'ຈຳນວນທີ່ນຳເຂົ້າ *', labelEn: 'Quantity *', width: 16 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ຫົວໜ່ວຍ *', labelEn: 'Unit Cost *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ', labelEn: 'Supplier', width: 22 }
    ],
    sampleRows: [
      {
        sku: '',
        name: 'ເທບຍົກສະຕິກເກີເນື້ອເຈ້ຍ 60cm x 50m',
        type: 'transfer_tape',
        quantity: 4,
        unitPrice: 240000,
        currency: 'LAK',
        supplier: 'Sticker Tools'
      }
    ]
  },
  MACHINERY: {
    id: 'MACHINERY',
    nameLo: 'ເຄື່ອງຈັກ & ເຄື່ອງພິມ (Machines & Equipment)',
    nameEn: 'Machines & Equipment',
    fileName: 'Template_Inbound_Machinery.xlsx',
    headers: [
      { key: 'name', labelLo: 'ຊື່ເຄື່ອງຈັກ/ເຄື່ອງພິມ *', labelEn: 'Machine Name *', width: 28 },
      { key: 'brand', labelLo: 'ແບຣນ (Brand)', labelEn: 'Brand', width: 18 },
      { key: 'model', labelLo: 'ລຸ້ນເຄື່ອງ (Model)', labelEn: 'Model', width: 18 },
      { key: 'sn', labelLo: 'ເລກ Serial Number', labelEn: 'Serial Number', width: 20 },
      { key: 'category', labelLo: 'ປະເພດ (laser / inkjet / guillotine / laminator / binder)', labelEn: 'Category', width: 22 },
      { key: 'expectedLife', labelLo: 'ອາຍຸງານຄາດຄະເນ (Expected Pages/Hours)', labelEn: 'Expected Lifespan', width: 20 },
      { key: 'operatingWatts', labelLo: 'ກຳລັງໄຟ (Watts)', labelEn: 'Watts', width: 14 },
      { key: 'quantity', labelLo: 'ຈຳນວນເຄື່ອງ *', labelEn: 'Quantity *', width: 14 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ເຄື່ອງ *', labelEn: 'Purchase Price *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ', labelEn: 'Supplier', width: 20 }
    ],
    sampleRows: [
      {
        name: 'Fuji Xerox DocuPrint C5005d',
        brand: 'Fuji Xerox',
        model: 'C5005d',
        sn: 'SN-FX-5005',
        category: 'laser',
        expectedLife: 200000,
        operatingWatts: 1400,
        quantity: 1,
        unitPrice: 38000000,
        currency: 'LAK',
        supplier: 'Fuji Xerox Lao'
      }
    ]
  },
  MACHINERY_LASER: {
    id: 'MACHINERY_LASER',
    nameLo: 'ເຄື່ອງພິມເລເຊີ (Laser Production Press)',
    nameEn: 'Laser Production Printer',
    fileName: 'Template_Inbound_LaserPrinter.xlsx',
    headers: [
      { key: 'name', labelLo: 'ຊື່ເຄື່ອງພິມ *', labelEn: 'Printer Name *', width: 28 },
      { key: 'brand', labelLo: 'ແບຣນ (Fuji Xerox, Canon, Ricoh, Konica)', labelEn: 'Brand', width: 20 },
      { key: 'model', labelLo: 'ລຸ້ນເຄື່ອງ (Model) *', labelEn: 'Model *', width: 20 },
      { key: 'sn', labelLo: 'Serial Number', labelEn: 'Serial Number', width: 20 },
      { key: 'colorScheme', labelLo: 'ລະບົບສີ (CMYK / Monochrome / CMYK+White)', labelEn: 'Color Scheme', width: 22 },
      { key: 'maxPaperSize', labelLo: 'ຂະໜາດເຈ້ຍສູງສຸດ (A3 / A3+ / SRA3)', labelEn: 'Max Paper Size', width: 20 },
      { key: 'maxGsm', labelLo: 'ແກຣມເຈ້ຍສູງສຸດ (Max GSM: 300, 350...)', labelEn: 'Max GSM', width: 18 },
      { key: 'speedPpm', labelLo: 'ຄວາມໄວພິມ (PPM)', labelEn: 'Speed (PPM)', width: 16 },
      { key: 'drumLife', labelLo: 'ອາຍຸດຣຳ (Drum Life Pages)', labelEn: 'Drum Lifespan (Pages)', width: 20 },
      { key: 'drumCost', labelLo: 'ລາຄາດຣຳ (Drum Cost LAK)', labelEn: 'Drum Cost (LAK)', width: 18 },
      { key: 'fuserLife', labelLo: 'ອາຍຸຊຸດຄວາມຮ້ອນ (Fuser Life Pages)', labelEn: 'Fuser Lifespan (Pages)', width: 20 },
      { key: 'fuserCost', labelLo: 'ລາຄາຊຸດຄວາມຮ້ອນ (Fuser Cost LAK)', labelEn: 'Fuser Cost (LAK)', width: 20 },
      { key: 'expectedLife', labelLo: 'ອາຍຸງານທັງໝົດຂອງເຄື່ອງ (Pages)', labelEn: 'Total Expected Life (Pages)', width: 22 },
      { key: 'operatingWatts', labelLo: 'ກຳລັງໄຟຟ້າ (Watts)', labelEn: 'Operating Watts', width: 16 },
      { key: 'warmUpMins', labelLo: 'ເວລາອຸ່ນເຄື່ອງ (Warm-up Mins)', labelEn: 'Warm-up (Mins)', width: 18 },
      { key: 'quantity', labelLo: 'ຈຳນວນເຄື່ອງ *', labelEn: 'Quantity *', width: 14 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ເຄື່ອງ *', labelEn: 'Purchase Price *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ (Supplier)', labelEn: 'Supplier', width: 20 }
    ],
    sampleRows: [
      {
        name: 'Fuji Xerox DocuPrint C5005d Color Laser',
        brand: 'Fuji Xerox',
        model: 'DocuPrint C5005d',
        sn: 'FX-C5005-0912',
        colorScheme: 'CMYK',
        maxPaperSize: 'SRA3',
        maxGsm: 300,
        speedPpm: 50,
        drumLife: 70000,
        drumCost: 2800000,
        fuserLife: 100000,
        fuserCost: 4500000,
        expectedLife: 300000,
        operatingWatts: 1500,
        warmUpMins: 5,
        quantity: 1,
        unitPrice: 42000000,
        currency: 'LAK',
        supplier: 'Fuji Xerox Vientiane'
      }
    ]
  },
  MACHINERY_INKJET: {
    id: 'MACHINERY_INKJET',
    nameLo: 'ເຄື່ອງພິມອິ້ງເຈັດ (Inkjet & Large Format)',
    nameEn: 'Inkjet & Large Format Printer',
    fileName: 'Template_Inbound_InkjetPrinter.xlsx',
    headers: [
      { key: 'name', labelLo: 'ຊື່ເຄື່ອງພິມ *', labelEn: 'Printer Name *', width: 28 },
      { key: 'brand', labelLo: 'ແບຣນ (Epson, Canon, Roland, Mimaki)', labelEn: 'Brand', width: 20 },
      { key: 'model', labelLo: 'ລຸ້ນເຄື່ອງ (Model) *', labelEn: 'Model *', width: 20 },
      { key: 'sn', labelLo: 'Serial Number', labelEn: 'Serial Number', width: 20 },
      { key: 'colorScheme', labelLo: 'ລະບົບສີ (CMYK / 6 Colors / Dye / Pigment)', labelEn: 'Color Scheme', width: 24 },
      { key: 'feedType', labelLo: 'ຮູບແບບປ້ອນ (cut_sheet / roll / both)', labelEn: 'Feed Type', width: 20 },
      { key: 'maxPaperSize', labelLo: 'ຂະໜາດສູງສຸດ (A3+ / Roll 24" / Roll 64")', labelEn: 'Max Media Size', width: 22 },
      { key: 'headLife', labelLo: 'ອາຍຸຫົວພິມ (Printhead Life Pages/Sqm)', labelEn: 'Printhead Lifespan', width: 22 },
      { key: 'headCost', labelLo: 'ລາຄາຫົວພິມ (Head Cost LAK)', labelEn: 'Printhead Cost (LAK)', width: 20 },
      { key: 'wasteBoxLife', labelLo: 'ອາຍຸກ່ອງຊັບໝຶກ (Maintenance Box Pages)', labelEn: 'Waste Box Lifespan', width: 22 },
      { key: 'wasteBoxCost', labelLo: 'ລາຄາກ່ອງຊັບໝຶກ (Maintenance Box Cost)', labelEn: 'Waste Box Cost (LAK)', width: 20 },
      { key: 'expectedLife', labelLo: 'ອາຍຸງານທັງໝົດຂອງເຄື່ອງ (Pages/Hours)', labelEn: 'Expected Lifespan Pages', width: 22 },
      { key: 'operatingWatts', labelLo: 'ກຳລັງໄຟຟ້າ (Watts)', labelEn: 'Watts', width: 14 },
      { key: 'quantity', labelLo: 'ຈຳນວນເຄື່ອງ *', labelEn: 'Quantity *', width: 14 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ເຄື່ອງ *', labelEn: 'Purchase Price *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ (Supplier)', labelEn: 'Supplier', width: 20 }
    ],
    sampleRows: [
      {
        name: 'Epson EcoTank L15150 A3+ Inktank',
        brand: 'Epson',
        model: 'EcoTank L15150',
        sn: 'EP-15150-7711',
        colorScheme: 'CMYK',
        feedType: 'cut_sheet',
        maxPaperSize: 'A3+',
        headLife: 100000,
        headCost: 3500000,
        wasteBoxLife: 25000,
        wasteBoxCost: 350000,
        expectedLife: 150000,
        operatingWatts: 54,
        quantity: 1,
        unitPrice: 18500000,
        currency: 'LAK',
        supplier: 'Epson Laos Official'
      }
    ]
  },
  MACHINERY_CUTTER: {
    id: 'MACHINERY_CUTTER',
    nameLo: 'ເຄື່ອງຕັດເຈ້ຍ & ພລັອດເຕີ (Cutter & Guillotine)',
    nameEn: 'Cutter & Guillotine',
    fileName: 'Template_Inbound_Cutter.xlsx',
    headers: [
      { key: 'name', labelLo: 'ຊື່ເຄື່ອງຕັດ *', labelEn: 'Cutter Name *', width: 28 },
      { key: 'brand', labelLo: 'ແບຣນ (Boway, Polar, Graphtec, Roland)', labelEn: 'Brand', width: 20 },
      { key: 'model', labelLo: 'ລຸ້ນເຄື່ອງ (Model) *', labelEn: 'Model *', width: 20 },
      { key: 'sn', labelLo: 'Serial Number', labelEn: 'Serial Number', width: 20 },
      { key: 'cutterType', labelLo: 'ປະເພດເຄື່ອງຕັດ (guillotine / vinyl_plotter)', labelEn: 'Cutter Subtype', width: 22 },
      { key: 'maxCuttingWidthMm', labelLo: 'ໜ້າກວ້າງຕັດສູງສຸດ (Width mm: 450, 670, 920)', labelEn: 'Max Cutting Width (mm)', width: 24 },
      { key: 'maxCuttingThicknessMm', labelLo: 'ຄວາມໜາຕັດສູງສຸດ (Thickness mm)', labelEn: 'Max Thickness (mm)', width: 20 },
      { key: 'bladeLifeCuts', labelLo: 'ອາຍຸໃບມີດ (Blade Life Cuts: 5,000, 10,000)', labelEn: 'Blade Lifespan (Cuts)', width: 22 },
      { key: 'bladeCost', labelLo: 'ລາຄາປ່ຽນ/ລັບໃບມີດ (Blade Cost LAK)', labelEn: 'Blade Cost (LAK)', width: 20 },
      { key: 'stickLifeCuts', labelLo: 'ອາຍຸເຂຽງຮອງຕັດ (Cutting Stick Life Cuts)', labelEn: 'Stick Lifespan (Cuts)', width: 22 },
      { key: 'stickCost', labelLo: 'ລາຄາເຂຽງຮອງຕັດ (Stick Cost LAK)', labelEn: 'Stick Cost (LAK)', width: 20 },
      { key: 'expectedLife', labelLo: 'ອາຍຸງານທັງໝົດຂອງເຄື່ອງ (Total Cuts)', labelEn: 'Total Expected Cuts', width: 22 },
      { key: 'operatingWatts', labelLo: 'ກຳລັງໄຟຟ້າ (Watts)', labelEn: 'Operating Watts', width: 16 },
      { key: 'quantity', labelLo: 'ຈຳນວນເຄື່ອງ *', labelEn: 'Quantity *', width: 14 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ເຄື່ອງ *', labelEn: 'Purchase Price *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ (Supplier)', labelEn: 'Supplier', width: 20 }
    ],
    sampleRows: [
      {
        name: 'Boway 450V+ ໄຟຟ້າຕັດເຈ້ຍລະບົບດິຈິຕອນ',
        brand: 'Boway',
        model: 'BW-450V+',
        sn: 'BW-450-8821',
        cutterType: 'guillotine',
        maxCuttingWidthMm: 450,
        maxCuttingThicknessMm: 40,
        bladeLifeCuts: 10000,
        bladeCost: 850000,
        stickLifeCuts: 5000,
        stickCost: 150000,
        expectedLife: 200000,
        operatingWatts: 800,
        quantity: 1,
        unitPrice: 22000000,
        currency: 'LAK',
        supplier: 'PrintTech Vientiane'
      }
    ]
  },
  MACHINERY_LAMINATOR: {
    id: 'MACHINERY_LAMINATOR',
    nameLo: 'ເຄື່ອງເຄືອບຟີມ (Roll & Pouch Laminator)',
    nameEn: 'Lamination Machine',
    fileName: 'Template_Inbound_Laminator.xlsx',
    headers: [
      { key: 'name', labelLo: 'ຊື່ເຄື່ອງເຄືອບ *', labelEn: 'Laminator Name *', width: 28 },
      { key: 'brand', labelLo: 'ແບຣນ (Brand: Boway, Royal Sovereign)', labelEn: 'Brand', width: 20 },
      { key: 'model', labelLo: 'ລຸ້ນເຄື່ອງ (Model) *', labelEn: 'Model *', width: 20 },
      { key: 'sn', labelLo: 'Serial Number', labelEn: 'Serial Number', width: 20 },
      { key: 'laminatorType', labelLo: 'ຮູບແບບ (roll_hot / roll_cold / pouch)', labelEn: 'Laminator Type', width: 22 },
      { key: 'maxWidthMm', labelLo: 'ໜ້າກວ້າງສູງສຸດ (Roll Width mm: 350, 650, 1600)', labelEn: 'Max Width (mm)', width: 22 },
      { key: 'maxTempC', labelLo: 'ອຸນຫະພູມສູງສຸດ (°C: 140, 160)', labelEn: 'Max Temp (°C)', width: 18 },
      { key: 'warmUpMins', labelLo: 'ເວລາອຸ່ນເຄື່ອງ (Warm-up Mins)', labelEn: 'Warm-up Time (Mins)', width: 18 },
      { key: 'rollerLifeMeters', labelLo: 'ອາຍຸລູກກິ້ງຄວາມຮ້ອນ (Roller Life Meters)', labelEn: 'Roller Lifespan (Meters)', width: 22 },
      { key: 'rollerCost', labelLo: 'ລາຄາລູກກິ້ງຄວາມຮ້ອນ (Roller Cost LAK)', labelEn: 'Roller Cost (LAK)', width: 20 },
      { key: 'expectedLife', labelLo: 'ອາຍຸງານທັງໝົດຂອງເຄື່ອງ (Total Meters)', labelEn: 'Total Lifespan (Meters)', width: 22 },
      { key: 'operatingWatts', labelLo: 'ກຳລັງໄຟຟ້າ (Watts)', labelEn: 'Operating Watts', width: 16 },
      { key: 'quantity', labelLo: 'ຈຳນວນເຄື່ອງ *', labelEn: 'Quantity *', width: 14 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ເຄື່ອງ *', labelEn: 'Purchase Price *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ (Supplier)', labelEn: 'Supplier', width: 20 }
    ],
    sampleRows: [
      {
        name: 'Boway F350 Roll Hot Laminator',
        brand: 'Boway',
        model: 'F350',
        sn: 'BW-F350-093',
        laminatorType: 'roll_hot',
        maxWidthMm: 350,
        maxTempC: 160,
        warmUpMins: 8,
        rollerLifeMeters: 50000,
        rollerCost: 1500000,
        expectedLife: 100000,
        operatingWatts: 1200,
        quantity: 1,
        unitPrice: 12500000,
        currency: 'LAK',
        supplier: 'PrintTech Vientiane'
      }
    ]
  },
  MACHINERY_BINDER: {
    id: 'MACHINERY_BINDER',
    nameLo: 'ເຄື່ອງເຂົ້າເຫຼັ້ມ (Book Binder & Wire-O)',
    nameEn: 'Book Binding Machine',
    fileName: 'Template_Inbound_Binder.xlsx',
    headers: [
      { key: 'name', labelLo: 'ຊື່ເຄື່ອງເຂົ້າເຫຼັ້ມ *', labelEn: 'Binder Name *', width: 28 },
      { key: 'brand', labelLo: 'ແບຣນ (Brand: Boway, Fastbind)', labelEn: 'Brand', width: 20 },
      { key: 'model', labelLo: 'ລຸ້ນເຄື່ອງ (Model) *', labelEn: 'Model *', width: 20 },
      { key: 'sn', labelLo: 'Serial Number', labelEn: 'Serial Number', width: 20 },
      { key: 'bindingMethod', labelLo: 'ວິທີເຂົ້າເຫຼັ້ມ (perfect_glue / wire_o / staple)', labelEn: 'Binding Method', width: 22 },
      { key: 'maxBookLengthMm', labelLo: 'ຄວາມຍາວສັນສູງສຸດ (Max Spine mm: 320, 420)', labelEn: 'Max Spine Length (mm)', width: 22 },
      { key: 'maxSpineThicknessMm', labelLo: 'ຄວາມໜາສັນສູງສຸດ (Spine Thickness mm: 40, 50)', labelEn: 'Max Spine Thickness (mm)', width: 22 },
      { key: 'glueType', labelLo: 'ປະເພດກາວ (EVA / PUR)', labelEn: 'Glue Type', width: 16 },
      { key: 'millingBladeLifeBooks', labelLo: 'ອາຍຸໃບກີດສັນ (Milling Blade Life Books)', labelEn: 'Milling Blade Lifespan', width: 22 },
      { key: 'millingBladeCost', labelLo: 'ລາຄາໃບກີດສັນ (Blade Cost LAK)', labelEn: 'Blade Cost (LAK)', width: 20 },
      { key: 'expectedLife', labelLo: 'ອາຍຸງານທັງໝົດຂອງເຄື່ອງ (Total Books)', labelEn: 'Total Expected Books', width: 22 },
      { key: 'operatingWatts', labelLo: 'ກຳລັງໄຟຟ້າ (Watts)', labelEn: 'Operating Watts', width: 16 },
      { key: 'quantity', labelLo: 'ຈຳນວນເຄື່ອງ *', labelEn: 'Quantity *', width: 14 },
      { key: 'unitPrice', labelLo: 'ລາຄາຊື້ຕໍ່ເຄື່ອງ *', labelEn: 'Purchase Price *', width: 18 },
      { key: 'currency', labelLo: 'ສະກຸນເງິນ (LAK / THB / USD)', labelEn: 'Currency', width: 14 },
      { key: 'supplier', labelLo: 'ຜູ້ສະໜອງ (Supplier)', labelEn: 'Supplier', width: 20 }
    ],
    sampleRows: [
      {
        name: 'Boway 950Z+ ກາວຮ້ອນດິຈິຕອນລະບົບອັດຕະໂນມັດ',
        brand: 'Boway',
        model: 'BW-950Z+',
        sn: 'BW-950Z-101',
        bindingMethod: 'perfect_glue',
        maxBookLengthMm: 330,
        maxSpineThicknessMm: 50,
        glueType: 'EVA',
        millingBladeLifeBooks: 20000,
        millingBladeCost: 1200000,
        expectedLife: 100000,
        operatingWatts: 1600,
        quantity: 1,
        unitPrice: 28000000,
        currency: 'LAK',
        supplier: 'PrintTech Vientiane'
      }
    ]
  }
};

/**
 * Generates and triggers browser download of an Inbound Excel Template for the selected category.
 */
export function downloadInboundCategoryTemplate(categoryId: string = 'PAPER', isLao: boolean = true) {
  const def = TEMPLATE_DEFINITIONS[categoryId] || TEMPLATE_DEFINITIONS.PAPER;
  
  // 1. Prepare Header and Data rows
  // Row 1: Bilingual Header Labels
  const headerLabels = def.headers.map(h => isLao ? h.labelLo : h.labelEn);
  
  // Row 2+: Sample rows formatted to header keys
  const dataRows = def.sampleRows.map(row => {
    return def.headers.map(h => row[h.key] ?? '');
  });

  const sheetData = [headerLabels, ...dataRows];

  // 2. Build Worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set Column Widths
  ws['!cols'] = def.headers.map(h => ({ wch: h.width }));

  // 3. Build Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, def.nameEn.slice(0, 31));

  // 4. Download
  XLSX.writeFile(wb, def.fileName);
}

/**
 * Parses an uploaded Excel file and converts rows into InboundItemFormData array.
 */
export async function parseInboundExcel(
  file: File,
  targetCategory: string = 'PAPER'
): Promise<{ items: InboundItemFormData[]; category: string; totalCount: number }> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  if (!ws) {
    throw new Error('No worksheets found in the uploaded file');
  }

  // Convert to JSON (header: 1 returns array of arrays)
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (!rows || rows.length < 2) {
    throw new Error('Excel file must contain at least 1 header row and 1 data row');
  }

  const def = TEMPLATE_DEFINITIONS[targetCategory] || TEMPLATE_DEFINITIONS.PAPER;
  const headerRow = rows[0].map((c: any) => String(c || '').trim().toLowerCase());
  const dataRows = rows.slice(1);

  // Find column index for each key based on partial label match
  const colIndexMap: Record<string, number> = {};
  def.headers.forEach(h => {
    const keyLower = h.key.toLowerCase();
    const loLower = h.labelLo.toLowerCase();
    const enLower = h.labelEn.toLowerCase();

    const idx = headerRow.findIndex((colText: string) => {
      return (
        colText.includes(keyLower) ||
        colText.includes(loLower.slice(0, 6)) ||
        colText.includes(enLower.slice(0, 6))
      );
    });
    if (idx !== -1) {
      colIndexMap[h.key] = idx;
    }
  });

  const parsedItems: InboundItemFormData[] = [];

  dataRows.forEach((row, rowIdx) => {
    if (!row || row.length === 0 || row.every((c: any) => c === undefined || c === null || c === '')) {
      return; // skip completely empty rows
    }

    const getValue = (key: string, fallback: any = '') => {
      const colIdx = colIndexMap[key];
      if (colIdx !== undefined && row[colIdx] !== undefined && row[colIdx] !== null) {
        return row[colIdx];
      }
      // fallback by positional index if mapping failed
      const defIdx = def.headers.findIndex(h => h.key === key);
      if (defIdx !== -1 && row[defIdx] !== undefined && row[defIdx] !== null) {
        return row[defIdx];
      }
      return fallback;
    };

    const item = createDefaultItem(targetCategory);
    const rand = Math.floor(100 + Math.random() * 900);
    item.id = `ITEM-XLS-${Date.now()}-${rowIdx + 1}-${rand}`;
    item.importType = targetCategory;

    // Common fields
    item.importQty = Math.max(1, Number(getValue('quantity', 1)) || 1);
    item.importCost = String(getValue('unitPrice', '0'));
    item.importCurrency = String(getValue('currency', 'LAK')).toUpperCase();
    if (!['LAK', 'THB', 'USD'].includes(item.importCurrency)) item.importCurrency = 'LAK';
    item.importVendor = String(getValue('supplier', ''));

    // Category-specific mapping
    if (targetCategory === 'PAPER') {
      const pName = String(getValue('name', `Paper Item #${rowIdx + 1}`));
      item.paperName = pName;
      item.paperBrand = String(getValue('brand', ''));
      item.paperType = String(getValue('paperType', 'Plain Paper'));
      item.paperFormat = String(getValue('paperFormat', 'cut_sheet')).toLowerCase();
      item.paperSize = String(getValue('size', 'A4'));
      item.grammage = String(getValue('grammage', '80'));
      item.packagingType = String(getValue('packagingType', 'Ream'));
      item.sheetsPerPack = Number(getValue('sheetsPerPack', 500)) || 500;
      item.surfaceFinish = String(getValue('surfaceFinish', 'Uncoated'));
      item.importUnit = item.packagingType === 'Ream' ? 'ຣີມ' : (item.packagingType === 'Pack' ? 'ແພັກ' : 'ແຜ່ນ');
      const customSku = String(getValue('sku', '')).trim();
      item.paperCode = customSku || `PAP-${item.paperSize}-${item.grammage}-${Date.now().toString().slice(-4)}-${rowIdx + 1}`;
    } else if (targetCategory === 'INK') {
      item.inkColorName = String(getValue('name', `Ink #${rowIdx + 1}`));
      item.inkColorGroup = String(getValue('colorGroup', 'Black'));
      const parsedKind = String(getValue('inkKind', 'inkjet')).toLowerCase();
      item.inkKind = parsedKind === 'laser_toner' ? 'laser' : (parsedKind as any);
      item.inkBaseType = String(getValue('inkBaseType', 'Dye'));
      const parsedGrade = String(getValue('inkGrade', 'genuine')).toLowerCase();
      item.inkGrade = (parsedGrade === 'compatible' ? 'compatible' : 'genuine') as 'genuine' | 'compatible';
      item.inkVolume = String(getValue('volume', '100'));
      item.inkTargetPrinter = String(getValue('targetPrinter', ''));
      item.importUnit = 'ຂວດ';
      const customSku = String(getValue('sku', '')).trim();
      item.inkCode = customSku || `INK-${item.inkColorGroup.slice(0, 1)}-${Date.now().toString().slice(-4)}-${rowIdx + 1}`;
    } else if (targetCategory === 'LAMINATION') {
      item.laminationName = String(getValue('name', `Lamination #${rowIdx + 1}`));
      item.laminationFormat = String(getValue('laminationFormat', 'Roll'));
      item.laminationThickness = String(getValue('laminationThickness', '25μm'));
      item.laminationFinish = String(getValue('laminationFinish', 'GLOSS_PVC'));
      item.laminationWidthMm = Number(getValue('widthMm', 330)) || 330;
      item.laminationLengthM = Number(getValue('lengthM', 200)) || 200;
      item.importUnit = 'ມ້ວນ';
    } else if (targetCategory === 'BINDING') {
      item.bindingName = String(getValue('name', `Binding #${rowIdx + 1}`));
      item.bindingType = String(getValue('bindingType', 'WIRE_O'));
      item.bindingDiameter = String(getValue('diameter', '10mm'));
      item.bindingSpineColor = String(getValue('spineColor', 'Black'));
      item.importUnit = 'ກ່ອງ';
    } else if (targetCategory === 'SPARE_PARTS') {
      item.sparePartName = String(getValue('name', `Part #${rowIdx + 1}`));
      item.sparePartCategory = String(getValue('category', 'drum'));
      item.sparePartModelRef = String(getValue('modelRef', ''));
      item.assignedPrinterId = String(getValue('assignedMachine', ''));
      item.sparePartExpectedLife = Number(getValue('expectedLife', 50000)) || 50000;
      item.importUnit = 'ອັນ';
    } else if (targetCategory === 'PACKAGING') {
      item.packagingCategory = String(getValue('category', 'box_card'));
      item.packagingDimensions = String(getValue('dimensions', 'Standard'));
      item.importUnit = 'ແພັກ';
    } else if (targetCategory === 'RIGID_SUBSTRATES') {
      item.rigidSubstrateType = String(getValue('type', 'foam_board'));
      item.rigidBoardThicknessMm = Number(getValue('thickness', 5)) || 5;
      item.rigidSheetWidthMm = Number(getValue('widthMm', 1220)) || 1220;
      item.rigidSheetHeightMm = Number(getValue('heightMm', 2440)) || 2440;
      item.importUnit = 'ແຜ່ນ';
    } else if (targetCategory === 'CUTTING_SUPPLIES') {
      item.cuttingSupplyType = String(getValue('type', 'transfer_tape'));
      item.importUnit = 'ມ້ວນ';
    } else if (targetCategory === 'MACHINERY' || targetCategory.startsWith('MACHINERY_')) {
      item.importType = 'MACHINERY';
      item.importUnit = 'ເຄື່ອງ';
      item.machineBrand = String(getValue('brand', ''));
      item.machineModel = String(getValue('model', ''));
      item.machineSn = String(getValue('sn', ''));

      if (targetCategory === 'MACHINERY_LASER') {
        item.machineryTypeCategory = 'laser';
        item.colorSchemeType = String(getValue('colorScheme', 'CMYK'));
        item.printerMaxPaperSize = String(getValue('maxPaperSize', 'SRA3'));
        item.printerSupportedGsmMax = Number(getValue('maxGsm', 300)) || 300;
        item.printerSpeedColorPpm = Number(getValue('speedPpm', 50)) || 50;
        item.machineOperatingWatts = Number(getValue('operatingWatts', 1500)) || 1500;
        item.warmUpTimeMins = Number(getValue('warmUpMins', 5)) || 5;
        item.machineExpectedLife = Number(getValue('expectedLife', 300000)) || 300000;
        item.machineLifeUnit = 'pages';

        // Custom fields for wear parts
        const drumLife = Number(getValue('drumLife', 70000)) || 70000;
        const drumCost = Number(getValue('drumCost', 2800000)) || 2800000;
        const fuserLife = Number(getValue('fuserLife', 100000)) || 100000;
        const fuserCost = Number(getValue('fuserCost', 4500000)) || 4500000;

        item.customFields = [
          { key: 'drum_expected_life', value: String(drumLife) },
          { key: 'drum_cost_lak', value: String(drumCost) },
          { key: 'fuser_expected_life', value: String(fuserLife) },
          { key: 'fuser_cost_lak', value: String(fuserCost) },
        ];
      } else if (targetCategory === 'MACHINERY_INKJET') {
        item.machineryTypeCategory = 'inkjet';
        item.colorSchemeType = String(getValue('colorScheme', 'CMYK'));
        item.printerFeedType = String(getValue('feedType', 'cut_sheet')) as any;
        item.printerMaxPaperSize = String(getValue('maxPaperSize', 'A3+'));
        item.machineOperatingWatts = Number(getValue('operatingWatts', 54)) || 54;
        item.machineExpectedLife = Number(getValue('expectedLife', 150000)) || 150000;
        item.machineLifeUnit = 'pages';

        const headLife = Number(getValue('headLife', 100000)) || 100000;
        const headCost = Number(getValue('headCost', 3500000)) || 3500000;
        const wasteBoxLife = Number(getValue('wasteBoxLife', 25000)) || 25000;
        const wasteBoxCost = Number(getValue('wasteBoxCost', 350000)) || 350000;

        item.customFields = [
          { key: 'printhead_expected_life', value: String(headLife) },
          { key: 'printhead_cost_lak', value: String(headCost) },
          { key: 'waste_box_life', value: String(wasteBoxLife) },
          { key: 'waste_box_cost_lak', value: String(wasteBoxCost) },
        ];
      } else if (targetCategory === 'MACHINERY_CUTTER') {
        const cType = String(getValue('cutterType', 'guillotine')).toLowerCase();
        item.machineryTypeCategory = (cType.includes('plotter') ? 'plotter' : 'guillotine') as any;
        item.machineLifeUnit = 'cuts';
        item.machineOperatingWatts = Number(getValue('operatingWatts', 800)) || 800;
        item.machineExpectedLife = Number(getValue('expectedLife', 200000)) || 200000;

        const maxCutWidth = Number(getValue('maxCuttingWidthMm', 450)) || 450;
        const maxCutThick = Number(getValue('maxCuttingThicknessMm', 40)) || 40;
        const bladeLife = Number(getValue('bladeLifeCuts', 10000)) || 10000;
        const bladeCost = Number(getValue('bladeCost', 850000)) || 850000;
        const stickLife = Number(getValue('stickLifeCuts', 5000)) || 5000;
        const stickCost = Number(getValue('stickCost', 150000)) || 150000;

        item.customFields = [
          { key: 'max_cutting_width_mm', value: String(maxCutWidth) },
          { key: 'max_cutting_thickness_mm', value: String(maxCutThick) },
          { key: 'blade_life_cuts', value: String(bladeLife) },
          { key: 'blade_cost_lak', value: String(bladeCost) },
          { key: 'stick_life_cuts', value: String(stickLife) },
          { key: 'stick_cost_lak', value: String(stickCost) },
        ];
      } else if (targetCategory === 'MACHINERY_LAMINATOR') {
        item.machineryTypeCategory = 'laminator';
        item.machineLifeUnit = 'meters';
        item.machineOperatingWatts = Number(getValue('operatingWatts', 1200)) || 1200;
        item.warmUpTimeMins = Number(getValue('warmUpMins', 8)) || 8;
        item.machineExpectedLife = Number(getValue('expectedLife', 100000)) || 100000;

        const maxWidth = Number(getValue('maxWidthMm', 350)) || 350;
        const maxTemp = Number(getValue('maxTempC', 160)) || 160;
        const rollerLife = Number(getValue('rollerLifeMeters', 50000)) || 50000;
        const rollerCost = Number(getValue('rollerCost', 1500000)) || 1500000;

        item.customFields = [
          { key: 'max_laminating_width_mm', value: String(maxWidth) },
          { key: 'max_temp_c', value: String(maxTemp) },
          { key: 'roller_life_meters', value: String(rollerLife) },
          { key: 'roller_cost_lak', value: String(rollerCost) },
        ];
      } else if (targetCategory === 'MACHINERY_BINDER') {
        item.machineryTypeCategory = 'binder';
        item.machineLifeUnit = 'books';
        item.machineOperatingWatts = Number(getValue('operatingWatts', 1600)) || 1600;
        item.machineExpectedLife = Number(getValue('expectedLife', 100000)) || 100000;

        const maxSpineLength = Number(getValue('maxBookLengthMm', 330)) || 330;
        const maxSpineThick = Number(getValue('maxSpineThicknessMm', 50)) || 50;
        const millingBladeLife = Number(getValue('millingBladeLifeBooks', 20000)) || 20000;
        const millingBladeCost = Number(getValue('millingBladeCost', 1200000)) || 1200000;

        item.customFields = [
          { key: 'max_spine_length_mm', value: String(maxSpineLength) },
          { key: 'max_spine_thickness_mm', value: String(maxSpineThick) },
          { key: 'milling_blade_life_books', value: String(millingBladeLife) },
          { key: 'milling_blade_cost_lak', value: String(millingBladeCost) },
        ];
      } else {
        const parsedCat = String(getValue('category', 'laser')).toLowerCase();
        const validCats = ['laser', 'inkjet', 'guillotine', 'plotter', 'laminator', 'binder'];
        item.machineryTypeCategory = (validCats.includes(parsedCat) ? parsedCat : 'laser') as any;
        item.machineExpectedLife = Number(getValue('expectedLife', 150000)) || 150000;
        item.machineOperatingWatts = Number(getValue('operatingWatts', 1200)) || 1200;
      }
    }

    parsedItems.push(item);
  });

  return {
    items: parsedItems,
    category: targetCategory,
    totalCount: parsedItems.length
  };
}
