// ============================================================
// ส้มสิ่งพิมพ์ SOM SING PHIM — Product Catalog & Config Catalog
// Base prices are in THB (฿). LAK is derived from backend rates.
// ============================================================

export interface SpecOption {
  id: string
  label: string
  hint: string
  add: number
}

export interface Category {
  id: string
  slug: string
  name: string
  nameEn: string
  short: string
  tagline: string
  icon: string
  description: string
}

export interface Product {
  id: string
  slug: string
  name: string
  category: string
  bestseller: boolean
  basePrice: number
  image: string
  short: string
  description: string
  sizes: SpecOption[]
  materials: SpecOption[]
  finishings: SpecOption[]
}

export const CATEGORIES: Category[] = [
  {
    id: 'albums',
    slug: 'albums',
    name: 'อัลบั้มรูปภาพพรีเมียม',
    nameEn: 'Photo Albums',
    short: 'อัลบั้มรูปภาพพรีเมียม',
    tagline: 'พิมพ์อัลบั้มรูปคุณภาพสูง ตัวเลือกปกพรีเมียม ครบทุกสไตล์',
    icon: 'album',
    description:
      'อัลบั้มรูปภาพพรีเมียม พิมพ์ด้วยเครื่องพิมพ์สีคุณภาพสูง กระดาษอาร์ตการ์ด ตัวเลือกปกหลากหลาย (ปกแข็ง, ปกสันกาว, ปกไดคัท) เหมาะสำหรับเก็บภาพความทรงจำ โชว์ผลงาน และของขวัญสุดพิเศษ',
  },
  {
    id: 'frames',
    slug: 'frames',
    name: 'กรอบรูปอะคริลิก & ตกแต่งบ้าน',
    nameEn: 'Acrylic Frames',
    short: 'กรอบรูปอะคริลิก & ตกแต่งบ้าน',
    tagline: 'กรอบอะคริลิกใสระดับพรีเมียม ตกแต่งบ้านให้ดูหรู',
    icon: 'frame',
    description:
      'กรอบรูปอะคริลิกโปร่งใสสวยงาม ทนทาน กันรอย กันน้ำ พิมพ์ภาพสีคมชัดด้านหลังแผ่นอะคริลิกให้ความรู้สึกหรูหรา เหมาะเป็นของขวัญหรือประดับตกแต่งบ้านและสำนักงาน',
  },
  {
    id: 'stickers',
    slug: 'stickers',
    name: 'สติ๊กเกอร์ไดคัท / ฉลากสินค้า',
    nameEn: 'Cutout Stickers',
    short: 'สติ๊กเกอร์ไดคัท / ฉลากสินค้า',
    tagline: 'สติ๊กเกอร์ไดคัท กันน้ำ ติดทน ฉลากสินค้าครบสเปก',
    icon: 'sticker',
    description:
      'สติ๊กเกอร์ไดคัทรูปทรงตามต้องการ วัสดุ PP กันน้ำมัน กันน้ำ ทนทานต่อแสงแดด เหมาะสำหรับฉลากสินค้า สติ๊กเกอร์แบรนด์ และของแจกโปรโมชัน ตัดแม่พิมพ์ได้ทุกรูปทรง',
  },
  {
    id: 'cards',
    slug: 'cards',
    name: 'การ์ดเชิญ / โปสการ์ดที่ระลึก',
    nameEn: 'Greeting Cards',
    short: 'การ์ดเชิญ / โปสการ์ดที่ระลึก',
    tagline: 'การ์ดเชิญงานแต่ง โปสการ์ด ปั๊มเคทองหรูหรา',
    icon: 'card',
    description:
      'การ์ดเชิญและโปสการ์ดที่ระลึก พิมพ์บนกระดาษอาร์ตการ์ด 300-350g ตัวเลือกเทคนิคพิเศษอย่างปั๊มเคทอง (Foil Gold) เคลือบ UV เฉพาะจุด ให้ชิ้นงานดูแพง สวย และน่าจดจำ',
  },
  {
    id: 'documents',
    slug: 'documents',
    name: 'งานพิมพ์หนังสือ / สมุด / เอกสาร',
    nameEn: 'Booklets & Documents',
    short: 'หนังสือ / สมุด / เอกสาร',
    tagline: 'พิมพ์หนังสือ สมุด เอกสาร ครบวงจร ส่งด่วนได้',
    icon: 'book',
    description:
      'งานพิมพ์หนังสือ สมุดบันทึก เอกสารประกอบการเรียนและเอกสารองค์กร พร้อมตัวเลือกการเย็บมุม เย็บกี่ ห่วง และไสสันกาว แถมมีบริการจัดส่งรวดเร็วทั่วประเทศ',
  },
]

export const PRODUCTS: Product[] = [
  // ---------- Albums ----------
  {
    id: 'album-classic',
    slug: 'album-classic',
    name: 'อัลบั้มภาพพิมพ์ 4x6 นิ้ว พรีเมียม',
    category: 'albums',
    bestseller: true,
    basePrice: 49,
    image: 'album',
    short:
      'อัลบั้มภาพขนาด 4x6 นิ้ว พิมพ์ภาพสีคมชัด ครบ 40 รูป พร้อมปกแข็ง',
    description:
      'อัลบั้มภาพถ่ายสไตล์คลาสสิก พิมพ์ด้วยหมึกคุณภาพสูง สีสดติดทนนาน ปกแข็งลายผ้า หนาแน่น เก็บภาพความทรงจำได้อย่างสวยงาม',
    sizes: [
      { id: '4x6', label: '4x6 นิ้ว', hint: 'มาตรฐานภาพถ่าย', add: 0 },
      { id: '5x7', label: '5x7 นิ้ว', hint: 'ใหญ่ขึ้น 1 ขนาด', add: 20 },
      { id: '8x8', label: '8x8 นิ้ว', hint: 'รูปสี่เหลี่ยมสวย', add: 65 },
    ],
    materials: [
      { id: 'art300', label: 'กระดาษอาร์ตการ์ด 300g', hint: 'หนาแน่นมาตรฐาน', add: 0 },
      { id: 'art350', label: 'กระดาษอาร์ตการ์ด 350g', hint: 'หนาพิเศษคงทน', add: 8 },
      { id: 'photo', label: 'กระดาษภาพถ่ายมันเงา', hint: 'เหมือนสตูดิโอถ่ายรูป', add: 25 },
    ],
    finishings: [
      { id: 'none', label: 'ไม่เคลือบ', hint: 'ลดต้นทุน', add: 0 },
      { id: 'matte', label: 'เคลือบด้าน (Matte)', hint: 'ไม่สะท้อนแสง', add: 6 },
      { id: 'glossy', label: 'เคลือบเงา (Glossy)', hint: 'สีสดสะดุดตา', add: 6 },
    ],
  },
  {
    id: 'album-preview',
    slug: 'album-preview',
    name: 'อัลบั้มพรีวิวงานก่อสร้าง / ผลงาน',
    category: 'albums',
    bestseller: true,
    basePrice: 320,
    image: 'album-preview',
    short:
      'อัลบั้มพรีวิวผลงาน A4 ปกแข็ง พิมพ์ 30 หน้า เหมาะนำเสนอลูกค้า',
    description:
      'อัลบั้มพรีวิวผลงานขนาด A4 เหมาะสำหรับนำเสนอลูกค้า โชว์ผลงานก่อสร้าง สินค้า และบริการ หน้าละ 2 รูป พร้อมปกแข็งพิมพ์สีลวดลายแบรนด์',
    sizes: [
      { id: 'a4', label: 'A4 (8.3x11.7 นิ้ว)', hint: 'ขนาดมาตรฐาน', add: 0 },
      { id: 'a3', label: 'A3 (11.7x16.5 นิ้ว)', hint: 'ใหญ่พิเศษ', add: 240 },
    ],
    materials: [
      { id: 'art250', label: 'กระดาษอาร์ตการ์ด 250g', hint: 'บางเบา', add: 0 },
      { id: 'art300', label: 'กระดาษอาร์ตการ์ด 300g', hint: 'หนาแน่นมาตรฐาน', add: 30 },
    ],
    finishings: [
      { id: 'none', label: 'ไม่เคลือบ', hint: 'ลดต้นทุน', add: 0 },
      { id: 'matte', label: 'เคลือบด้าน (Matte)', hint: 'ไม่สะท้อนแสง', add: 45 },
      { id: 'glossy', label: 'เคลือบเงา (Glossy)', hint: 'สีสดสะดุดตา', add: 45 },
    ],
  },

  // ---------- Frames ----------
  {
    id: 'acrylic-frame',
    slug: 'acrylic-frame',
    name: 'กรอบรูปอะคริลิกใสพรีเมียม',
    category: 'frames',
    bestseller: true,
    basePrice: 199,
    image: 'frame',
    short:
      'กรอบอะคริลิกใสคุณภาพสูง พิมพ์ภาพด้านหลังแผ่น เห็นชัดทั้งสองด้าน',
    description:
      'กรอบรูปอะคริลิกโปร่งใสหนา 3 มม. พิมพ์ภาพสีคมชัดลงบนด้านหลังแผ่นอะคริลิก ให้เอฟเฟกต์ลอยตัวสวยงาม ทนทานต่อรอยขีดข่วน เหมาะเป็นของขวัญและของตกแต่งบ้าน',
    sizes: [
      { id: '5x7', label: '5x7 นิ้ว', hint: 'ขนาดพกพา', add: 0 },
      { id: '8x10', label: '8x10 นิ้ว', hint: 'ขนาดนิยม', add: 60 },
      { id: 'a4', label: 'A4 (8.3x11.7 นิ้ว)', hint: 'ขนาดเอกสาร', add: 90 },
    ],
    materials: [
      { id: 'acrylic3', label: 'อะคริลิกใส 3 มม.', hint: 'มาตรฐาน', add: 0 },
      { id: 'acrylic5', label: 'อะคริลิกใส 5 มม.', hint: 'หนาพิเศษ', add: 80 },
    ],
    finishings: [
      { id: 'none', label: 'ขอบตรงเรียบ', hint: 'มาตรฐาน', add: 0 },
      { id: 'edge-gold', label: 'ขอบตัดมุมทอง', hint: 'หรูหรา', add: 45 },
      { id: 'stand', label: 'ติดขาตั้งไม้', hint: 'ตั้งโต๊ะได้', add: 30 },
    ],
  },
  {
    id: 'acrylic-sign',
    slug: 'acrylic-sign',
    name: 'ป้ายอะคริลิกติดผนัง / โลโก้',
    category: 'frames',
    bestseller: false,
    basePrice: 450,
    image: 'sign',
    short:
      'ป้ายโลโก้อะคริลิกติดผนัง พิมพ์สี หรือสีขอบทอง ดูหรูหราแพง',
    description:
      'ป้ายโลโก้อะคริลิกสำหรับติดผนังหน้าร้านและสำนักงาน พิมพ์สีสดใสหรือสีขอบทอง ดูหรูหราและเป็นมืออาชีพ เหมาะสำหรับโลโก้แบรนด์ ป้ายชื่อ และป้ายต้อนรับ',
    sizes: [
      { id: 'a4', label: 'A4 (8.3x11.7 นิ้ว)', hint: 'ขนาดเริ่มต้น', add: 0 },
      { id: 'a3', label: 'A3 (11.7x16.5 นิ้ว)', hint: 'ขนาดกลาง', add: 250 },
      { id: '50x40', label: '50x40 ซม.', hint: 'ติดหน้าร้าน', add: 550 },
    ],
    materials: [
      { id: 'acrylic3', label: 'อะคริลิกใส 3 มม.', hint: 'มาตรฐาน', add: 0 },
      { id: 'acrylic5', label: 'อะคริลิกหนา 5 มม.', hint: 'แข็งแรงขึ้น', add: 120 },
    ],
    finishings: [
      { id: 'none', label: 'พิมพ์สีปกติ', hint: 'สีสันสดใส', add: 0 },
      { id: 'foil-gold', label: 'สีขอบทอง (Foil Gold)', hint: 'หรูหราแพง', add: 150 },
    ],
  },

  // ---------- Stickers ----------
  {
    id: 'sticker-diecut',
    slug: 'sticker-diecut',
    name: 'สติ๊กเกอร์ไดคัท กันน้ำ',
    category: 'stickers',
    bestseller: true,
    basePrice: 15,
    image: 'sticker',
    short:
      'สติ๊กเกอร์ไดคัททุกรูปทรง วัสดุ PP กันน้ำ ใช้ทำฉลากสินค้าและของแจก',
    description:
      'สติ๊กเกอร์ไดคัทพิมพ์เต็มสี ตัดแม่พิมพ์ตามรูปทรงที่ออกแบบ วัสดุ PP กันน้ำ ทนต่อรอยขีดข่วน เหมาะกับฉลากสินค้า สติ๊กเกอร์แบรนด์ และสติ๊กเกอร์ตกแต่ง',
    sizes: [
      { id: 's', label: 'ขนาด S (4x6 ซม.)', hint: 'ฉลากขนาดเล็ก', add: 0 },
      { id: 'm', label: 'ขนาด M (6x8 ซม.)', hint: 'ขนาดกลาง', add: 5 },
      { id: 'l', label: 'ขนาด L (8x10 ซม.)', hint: 'ขนาดใหญ่', add: 10 },
    ],
    materials: [
      { id: 'pp', label: 'สติ๊กเกอร์ PP กันน้ำ', hint: 'กันน้ำกันมัน', add: 0 },
      { id: 'vinyl', label: 'ไวนิลกันน้ำ', hint: 'ติดทนภายนอก', add: 3 },
      { id: 'transparent', label: 'ฟิล์มใส', hint: 'ลายโปร่งใส', add: 6 },
    ],
    finishings: [
      { id: 'none', label: 'ไม่เคลือบ', hint: 'ลดต้นทุน', add: 0 },
      { id: 'glossy', label: 'เคลือบเงา (Glossy)', hint: 'สีสด', add: 2 },
      { id: 'matte', label: 'เคลือบด้าน (Matte)', hint: 'ไม่สะท้อนแสง', add: 2 },
    ],
  },

  // ---------- Cards ----------
  {
    id: 'wedding-card',
    slug: 'wedding-card',
    name: 'การ์ดเชิญงานแต่ง ปั๊มเคทอง',
    category: 'cards',
    bestseller: true,
    basePrice: 35,
    image: 'card',
    short:
      'การ์ดเชิญงานแต่งพิมพ์อาร์ตการ์ด 350g พร้อมตัวเลือกปั๊มเคทองหรูหรา',
    description:
      'การ์ดเชิญงานแต่งสุดหรู พิมพ์บนกระดาษอาร์ตการ์ด 350g ผิวหนาแน่น ตัวเลือกเทคนิคปั๊มเคทอง (Foil Gold) และเคลือบ UV เฉพาะจุด มาพร้อมซองจดหมาย',
    sizes: [
      { id: 'a6', label: 'การ์ด A6', hint: 'ขนาดมาตรฐาน', add: 0 },
      { id: 'dl', label: 'การ์ด DL', hint: 'รูปสามเหลี่ยมยาว', add: 3 },
      { id: 'square', label: 'การ์ดสี่เหลี่ยมจัตุรัส', hint: 'ดูโมเดิร์น', add: 5 },
    ],
    materials: [
      { id: 'art300', label: 'อาร์ตการ์ด 300g', hint: 'มาตรฐาน', add: 0 },
      { id: 'art350', label: 'อาร์ตการ์ด 350g', hint: 'หนาพิเศษ', add: 5 },
      { id: 'texture', label: 'กระดาษลายลินิน', hint: 'สัมผัสสวย', add: 12 },
    ],
    finishings: [
      { id: 'none', label: 'พิมพ์ปกติ', hint: 'มาตรฐาน', add: 0 },
      { id: 'foil-gold', label: 'ปั๊มเคทอง (Foil Gold)', hint: 'หรูหรา', add: 18 },
      { id: 'uv-spot', label: 'เคลือบ UV เฉพาะจุด', hint: 'เงางามเฉพาะลาย', add: 12 },
    ],
  },
  {
    id: 'postcard',
    slug: 'postcard',
    name: 'โปสการ์ดที่ระลึก พิมพ์สองหน้า',
    category: 'cards',
    bestseller: false,
    basePrice: 12,
    image: 'postcard',
    short:
      'โปสการ์ดที่ระลึกพิมพ์สองหน้าสีเต็ม เหมาะแจกทริปและงานอีเวนต์',
    description:
      'โปสการ์ดที่ระลึกพิมพ์สองหน้าสีเต็มรูปแบบ พิมพ์บนอาร์ตการ์ดหนา 300g เหมาะสำหรับของที่ระลึกในทริป งานอีเวนต์ และโปรโมชันแบรนด์',
    sizes: [
      { id: '10x15', label: '10x15 ซม.', hint: 'ขนาดมาตรฐาน', add: 0 },
      { id: 'a5', label: 'A5 (5.8x8.3 นิ้ว)', hint: 'ใหญ่ขึ้น', add: 6 },
    ],
    materials: [
      { id: 'art300', label: 'อาร์ตการ์ด 300g', hint: 'มาตรฐาน', add: 0 },
      { id: 'art350', label: 'อาร์ตการ์ด 350g', hint: 'หนาพิเศษ', add: 3 },
    ],
    finishings: [
      { id: 'none', label: 'ไม่เคลือบ', hint: 'ลดต้นทุน', add: 0 },
      { id: 'glossy', label: 'เคลือบเงา (Glossy)', hint: 'สีสด', add: 3 },
      { id: 'matte', label: 'เคลือบด้าน (Matte)', hint: 'นุ่มนวล', add: 3 },
    ],
  },

  // ---------- Documents ----------
  {
    id: 'booklet',
    slug: 'booklet',
    name: 'พิมพ์หนังสือ / สมุดเล่มเล็ก',
    category: 'documents',
    bestseller: true,
    basePrice: 25,
    image: 'book',
    short:
      'พิมพ์หนังสือ สมุด เอกสารหลายหน้า เลือกเย็บมุม เย็บกี่ หรือไสสันกาว',
    description:
      'งานพิมพ์หนังสือและสมุดเล่มเล็กครบวงจร ตั้งแต่เอกสารประกอบการเรียน ใบปลิวหลายหน้า ไปจนถึงหนังสือเล่มเต็ม พร้อมตัวเลือกการเข้าเล่มเย็บมุม เย็บกี่ ห่วง และไสสันกาว',
    sizes: [
      { id: 'a4', label: 'A4 (8.3x11.7 นิ้ว)', hint: 'ขนาดเอกสาร', add: 0 },
      { id: 'a5', label: 'A5 (5.8x8.3 นิ้ว)', hint: 'ขนาดสมุด', add: -8 },
      { id: 'a3', label: 'A3+ (11.7x16.5 นิ้ว)', hint: 'ขนาดใหญ่', add: 20 },
    ],
    materials: [
      { id: 'art120', label: 'กระดาษอาร์ตมัน 120g', hint: 'สีสวยน้ำหนักเบา', add: 0 },
      { id: 'art200', label: 'กระดาษอาร์ตการ์ด 200g', hint: 'หนาแน่น', add: 15 },
      { id: 'pp60', label: 'กระดาษถนอมสายตา 60g', hint: 'อ่านสบายตา', add: -5 },
    ],
    finishings: [
      { id: 'saddle', label: 'เย็บมุม / เย็บกี่', hint: 'เล่มบาง', add: 0 },
      { id: 'spiral', label: 'เย็บห่วง (Wire-O)', hint: 'เปิดแบนได้', add: 30 },
      { id: 'perfect', label: 'ไสสันกาว', hint: 'เล่มหนา', add: 25 },
    ],
  },
]

export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug)
export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug)
export const getProductsByCategory = (slug: string) =>
  PRODUCTS.filter((p) => p.category === slug)
export const getBestsellers = () => PRODUCTS.filter((p) => p.bestseller)

// All best sellers receive an automated "sales ranking" from the backend.
// When the API is reachable this ranking is merged over the static data.
export const BESTSELLER_SALES: { productId: string; sold: number }[] = [
  { productId: 'album-classic', sold: 1284 },
  { productId: 'album-preview', sold: 862 },
  { productId: 'acrylic-frame', sold: 940 },
  { productId: 'sticker-diecut', sold: 2510 },
  { productId: 'wedding-card', sold: 1130 },
  { productId: 'booklet', sold: 672 },
]
