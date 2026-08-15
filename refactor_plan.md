# 📐 Refactor Plan: Feature-Sliced Design (FSD) & Pricing Engine Upgrade

แผนการปรับโครงสร้างโฟลเดอร์ `admin-system/frontend/src/` ให้เป็นแบบ **Feature-Sliced Design (FSD)** และอัปเกรดระบบคำนวณราคา **Pricing Engine** ใน Backend

---

## 🛠️ การตั้งค่า Path Aliases (ก่อนเริ่ม Phase 2)
ตั้งค่าใน `tsconfig.json` และ `vite.config.ts` เพื่อป้องกันปัญหา Deep Relative Import (เช่น `../../../../components`)

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@features/*": ["src/features/*"],
      "@components/*": ["src/components/*"],
      "@store/*": ["src/store/*"],
      "@types/*": ["src/types/*"],
      "@lib/*": ["src/lib/*"]
    }
  }
}
```

### `vite.config.ts`
```typescript
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@components': path.resolve(__dirname, './src/components'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },
  // ...
})
```

---

## 🏗️ โครงสร้างโฟลเดอร์เป้าหมาย (Target Structure)

```text
admin-system/frontend/src/
 ├── components/               # Shared / Common UI Components (Button, Modal กลาง, Layout)
 │    ├── common/
 │    │    ├── ConfirmDeleteModal.tsx
 │    │    └── CurrencyRatesModal.tsx
 │    └── Sidebar.tsx
 ├── lib/                      # Config & Shared Utilities กลาง
 ├── types/                    # Shared Types
 │    ├── index.ts
 │    └── generated/           # API generated types
 ├── features/                 # ฟีเจอร์หลักแบ่งตามโดเมนธุรกิจ
 │    ├── inventory/           # จัดการสต็อก วัสดุ กระดาษ หมึกพิมพ์
 │    │    ├── components/
 │    │    ├── types.ts
 │    │    └── index.ts
 │    ├── orders/              # จัดการรายการสั่งซื้อ
 │    │    ├── components/
 │    │    ├── types.ts
 │    │    └── index.ts
 │    ├── pricing/             # จัดการใบเสนอราคาและการคำนวณราคา
 │    │    ├── components/
 │    │    ├── types.ts
 │    │    └── index.ts
 │    ├── customers/           # จัดการข้อมูลลูกค้า
 │    │    ├── components/
 │    │    ├── types.ts
 │    │    └── index.ts
 │    ├── equipment/           # จัดการเครื่องจักรและอุปกรณ์
 │    │    ├── components/
 │    │    ├── types.ts
 │    │    └── index.ts
 │    ├── inbound/             # การนำเข้าสินค้า/วัตถุดิบ
 │    │    ├── components/
 │    │    ├── data/
 │    │    ├── types.ts
 │    │    └── index.ts
 │    ├── hr/                  # จัดการพนักงาน
 │    │    ├── components/
 │    │    ├── types.ts
 │    │    └── index.ts
 │    ├── production/          # กระดานวางแผนการผลิต
 │    │    ├── components/
 │    │    └── index.ts
 │    ├── dashboard/           # แดชบอร์ดรวม
 │    │    ├── components/
 │    │    └── index.ts
 │    └── analytics/           # วิเคราะห์ประวัติและรายงาน
 │         ├── components/
 │         └── index.ts
 ├── store/                    # State Management (เตรียมย้าย AppContext ไปใช้ Zustand)
 │    └── AppContext.tsx
 ├── App.tsx
 └── main.tsx
```

---

## 📋 ตารางสรุปการย้ายไฟล์ (File Migration Mapping)

### 1. Feature: `inventory`
| ไฟล์เดิม (From) | ไฟล์ใหม่ (To) |
| :--- | :--- |
| `src/components/inventory/*` | `src/features/inventory/components/*` |
| `src/types/inventory.ts` | `src/features/inventory/types.ts` |

### 2. Feature: `orders`
| ไฟล์เดิม (From) | ไฟล์ใหม่ (To) |
| :--- | :--- |
| `src/components/orders/*` | `src/features/orders/components/*` |
| `src/types/orders.ts` | `src/features/orders/types.ts` |

### 3. Feature: `pricing`
| ไฟล์เดิม (From) | ไฟล์ใหม่ (To) |
| :--- | :--- |
| `src/components/QuotationManager.tsx` | `src/features/pricing/components/QuotationManager.tsx` |
| `src/types/quotation.ts` | `src/features/pricing/types.ts` |

### 4. Feature: `customers`
| ไฟล์เดิม (From) | ไฟล์ใหม่ (To) |
| :--- | :--- |
| `src/components/customers/*` | `src/features/customers/components/*` |
| `src/types/customers.ts` | `src/features/customers/types.ts` |

### 5. Feature: `equipment`
| ไฟล์เดิม (From) | ไฟล์ใหม่ (To) |
| :--- | :--- |
| `src/components/equipment/*` | `src/features/equipment/components/*` |
| `src/types/equipment.ts` | `src/features/equipment/types.ts` |

### 6. Feature: `inbound`
| ไฟล์เดิม (From) | ไฟล์ใหม่ (To) |
| :--- | :--- |
| `src/components/inbound/*` | `src/features/inbound/components/*` |
| `src/types/inbound.ts` | `src/features/inbound/types.ts` |
| `src/data/sampleInboundData.ts` | `src/features/inbound/data/sampleInboundData.ts` |

### 7. Feature: `hr`
| ไฟล์เดิม (From) | ไฟล์ใหม่ (To) |
| :--- | :--- |
| `src/components/hr/*` | `src/features/hr/components/*` |
| `src/types/hr.ts` | `src/features/hr/types.ts` |

### 8. Feature: `production`
| ไฟล์เดิม (From) | ไฟล์ใหม่ (To) |
| :--- | :--- |
| `src/components/production/*` | `src/features/production/components/*` |

### 9. Feature: `dashboard` & `analytics`
| ไฟล์เดิม (From) | ไฟล์ใหม่ (To) |
| :--- | :--- |
| `src/components/DashboardOverview.tsx` | `src/features/dashboard/components/DashboardOverview.tsx` |
| `src/components/HistoryAnalytics.tsx` | `src/features/analytics/components/HistoryAnalytics.tsx` |

### 10. Store & Shared Components
| ไฟล์เดิม (From) | ไฟล์ใหม่ (To) |
| :--- | :--- |
| `src/context/AppContext.tsx` | `src/store/AppContext.tsx` |
| `src/components/common/*` | `src/components/common/*` (คงไว้เป็น Shared Component) |
| `src/components/Sidebar.tsx` | `src/components/Sidebar.tsx` (Shared Component) |

---

## 🔒 กฎการ Import/Export ตามหลัก FSD (Public API Rule)
- แต่ละ Feature จะมี `index.ts` เพื่อเป็น Public API
- ห้าม Import ไฟล์ภายในของ Feature อื่นโดยตรง (เช่น ไม่ควร `import { ... } from '@/features/inventory/components/modals/...'`)
- ให้ Import ผ่าน Public API เท่านั้น (เช่น `import { InventoryManagement } from '@/features/inventory'`)

---

## 🧪 Unit Tests สำหรับ Go Pricing Engine (Phase 3)
อัปเดตและเพิ่มชุดทดสอบใน `admin-system/backend/pricing/engine_test.go` ครอบคลุม 3 Scenarios หลัก:

1. **Scenario 1 (Single Sheet / Low Volume)**: สั่งพิมพ์ 1 แผ่น
   - ตรวจสอบว่า `SetupCost` ถูกบวกเพิ่มเต็มจำนวนใน Total Cost
   - ตรวจสอบว่ากำไรใช้ `BaseProfitPct` เต็มจำนวน (ไม่มี discount)
2. **Scenario 2 (Volume Discount Step 1)**: สั่งพิมพ์ 500 แผ่น (Quantity >= 500)
   - ตรวจสอบว่า % กำไรลดลง 10% (เช่น จาก 30% เหลือ 27% หรือ 20%)
   - ตรวจสอบ Unit Price และ Selling Price รวม
3. **Scenario 3 (Volume Discount Step 2)**: สั่งพิมพ์ 1,000+ แผ่น (Quantity >= 1000)
   - ตรวจสอบว่า % กำไรลดลง 20% (เช่น จาก 30% เหลือ 24%)
   - ตรวจสอบ Unit Price และ Selling Price รวม
