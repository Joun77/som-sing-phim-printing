---
name: somsing-backend-developer
description: ทักษะและความเชี่ยวชาญสำหรับนักพัฒนา Backend ในระบบ Som Sing Phim ครอบคลุมภาษา Go, Gin/Fiber, สถาปัตยกรรม Layered Architecture, การจัดการ Transaction ทางการเงินและสต็อก, RESTful APIs, และการเชื่อมต่อ PostgreSQL โดยไม่ใช้ ORM
---

# Somsin Backend Developer Skill

ทักษะคู่มือนักพัฒนา Backend ประจำระบบโรงพิมพ์ **Som Sing Phim (สมสิงห์การพิมพ์)** พัฒนาด้วยภาษา **Go (Golang)** ทำงานร่วมกับฐานข้อมูล **PostgreSQL** โดยใช้ไลบรารีมาตรฐาน `database/sql` ร่วมกับไดรเวอร์ `lib/pq` หรือ `pgx`

---

## 1. บทบาทและขอบเขตความรับผิดชอบ (Role & Scope)

- **Entry Points:** `cmd/server/main.go`
- **โครงสร้างสถาปัตยกรรม (Layered Architecture):**
  - **Handler Layer (`server/handler/` หรือ `internal/handler/`):** รับ HTTP Request, ตรวจสอบ Payload (Validation), คืนค่า JSON Response และ HTTP Status Code
  - **Service Layer (`internal/service/`):** จัดการ Business Logic, คำนวณสูตรราคา, สเตตัสคำสั่งซื้อ, กฎการตัดสต็อก
  - **Repository / Data Access Layer (`internal/repository/`):** จัดการคำสั่ง SQL ดิบ, Transaction Management (`tx.Begin()`)
- **Domain Models (`internal/model/` หรือ `types/`):** โครงสร้าง Struct แทนตารางฐานข้อมูลและ Request/Response

---

## 2. กฎเหล็กสำคัญทาง Backend (Universal Backend Rules)

1. **ห้ามใช้ `float64` ในการคำนวณเงินและต้นทุนโดยเด็ดขาด:**
   - ใช้ `github.com/shopspring/decimal` หรือ Fixed-point integer (cent/satang) เพื่อป้องกันปัญหา Floating Point Precision
2. **การตัดสต็อกสินค้า (Inventory Stock Deduction):**
   - ต้องเกิดขึ้นเมื่อสถานะเปลี่ยนเป็น `IN_PRODUCTION` เท่านั้น
   - ต้องทำงานภายใต้ Transaction (`tx.Begin()`) เสมอ หากมีข้อผิดพลาดต้อง `tx.Rollback()` ทันที
3. **การจัดการข้อผิดพลาด (Error Handling):**
   - ห้ามละเลยการตรวจสอบ `if err != nil`
   - คืนค่า HTTP Status Code ให้ถูกต้องตามหลัก REST (เช่น `400 Bad Request`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`)
   - ไม่ควรเปิดเผย Raw Database Error ไปยังภายนอก (Log ภายใน แล้วส่งข้อความที่ผู้ใช้เข้าใจได้)
4. **การจัดการ Type และ Array ใน PostgreSQL:**
   - เมื่อต้องการบันทึกหรือดึงข้อมูล `TEXT[]` หรือ `VARCHAR[]` ให้ใช้ `pq.Array(&slice)` จาก `github.com/lib/pq`
   - สำหรับข้อมูล JSONB ให้ใช้ `json.RawMessage` หรือ `[]byte` พร้อม marshal/unmarshal อย่างรัดกุม

---

## 3. รูปแบบโค้ดมาตรฐาน (Standard Code Patterns)

### 3.1 รูปแบบ Handler และ Route Registration

```go
package handler

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type MaterialHandler struct {
    service MaterialService
}

func NewMaterialHandler(service MaterialService) *MaterialHandler {
    return &MaterialHandler{service: service}
}

func (h *MaterialHandler) RegisterRoutes(r *gin.RouterGroup) {
    materials := r.Group("/materials")
    {
        materials.GET("", h.ListMaterials)
        materials.GET("/:id", h.GetMaterial)
        materials.POST("", h.CreateMaterial)
        materials.PUT("/:id", h.UpdateMaterial)
        materials.DELETE("/:id", h.DeleteMaterial)
    }
}

func (h *MaterialHandler) ListMaterials(c *gin.Context) {
    category := c.Query("category")
    items, err := h.service.GetMaterials(c.Request.Context(), category)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch materials"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": items})
}
```

### 3.2 รูปแบบ Transaction สำหรับงานสต็อก/การเงิน

```go
func (r *MaterialRepository) DeductStockWithTx(ctx context.Context, tx *sql.Tx, materialID string, qty int) error {
    query := `
        UPDATE materials
        SET current_stock = current_stock - $1,
            updated_at = NOW()
        WHERE id = $2 AND current_stock >= $1
    `
    res, err := tx.ExecContext(ctx, query, qty, materialID)
    if err != nil {
        return err
    }
    rows, err := res.RowsAffected()
    if err != nil {
        return err
    }
    if rows == 0 {
        return ErrInsufficientStock
    }
    return nil
}
```

---

## 4. สูตรการคำนวณราคาและต้นทุน (Pricing Engine Reference)

เมื่อทำงานในส่วน Pricing Service ให้ยึดสูตรมาตรฐานของระบบ:
- **ต้นทุนกระดาษต่อแผ่น:**
  $$\text{Unit Cost} = \frac{\text{Total Import Cost}}{\text{Pack Count} \times \text{Sheets Per Pack}}$$
- **ต้นทุนหมึกพิมพ์:**
  $$\text{Ink Cost} = \text{Coverage \%} \times 0.007 \times \text{Ink Cost per ml} \times \text{Total Sheets}$$
- **ค่าเสื่อมและบำรุงรักษาเครื่องจักรต่อแผ่น:**
  $$\text{Depreciation} = \frac{\text{Purchase Price}}{\text{Expected Lifetime Pages}}$$
  $$\text{Maintenance} = \text{Depreciation} \times \left(\frac{\text{Maintenance Rate \%}}{100}\right)$$

---

## 5. Checklist สำหรับ Backend ก่อนส่งมอบงาน (Definition of Done)

- [ ] ทุกฟังก์ชันมี Error Handling รัดกุม (`if err != nil`)
- [ ] ตัวเลขเงินและราคาใช้ `decimal.Decimal` ไม่ใช้ `float64`
- [ ] การแก้ไขสต็อกและการเงินรันผ่าน Database Transaction (`tx.Begin()`)
- [ ] Query ใช้ Parameterized Query เสมอ ($1, $2) ปราศจาก SQL Injection
- [ ] ปลายทาง Endpoint มีการตรวจสอบ Validation ของ Request Payload
- [ ] Unit/Integration Tests ผ่าน และคอมไพล์ผ่าน (`go build ./...`)
