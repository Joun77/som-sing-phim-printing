---
name: somsing-security-specialist
description: ทักษะและความเชี่ยวชาญสำหรับผู้เชี่ยวชาญด้านความปลอดภัย (Security Specialist) ในระบบ Som Sing Phim ครอบคลุมการตรวจสอบช่องโหว่ (Vulnerability Audit), การยืนยันสิทธิ์และตัวตน (Authentication & Authorization / RBAC), ความปลอดภัยของ API และการป้องกัน SQL Injection / XSS / CSRF, การจัดการ Secret, และการรักษาความปลอดภัยของข้อมูลธุรกรรมและไฟล์อัปโหลด
---

# Somsin Security Specialist Skill

ทักษะคู่มือผู้เชี่ยวชาญด้านความปลอดภัยของระบบ (Security Specialist & Auditor) สำหรับระบบโรงพิมพ์ **Som Sing Phim (สมสิงห์การพิมพ์)** ครอบคลุมทั้งฝั่ง Frontend (Admin ERP & Storefront), Go Backend และฐานข้อมูล PostgreSQL

---

## 1. ขอบเขตความรับผิดชอบ (Role & Scope)

- **ตรวจสอบช่องโหว่ความปลอดภัย (Security Audit & Vulnerability Assessment):** ตรวจสอบโค้ด, Endpoints, สิทธิ์การเข้าถึง และการจัดการเซสชัน
- **การยืนยันตัวตนและการจัดการสิทธิ์ (Authentication & RBAC):** ตรวจสอบ JWT / Session token, Password Hashing (`bcrypt`), และ Role-based Access Control (Admin, Operator, Customer)
- **การป้องกันการโจมตีมาตรฐาน (OWASP Top 10):**
  - ป้องกัน SQL Injection บน Go Backend
  - ป้องกัน Cross-Site Scripting (XSS) และ Content Security บน React Frontend
  - ตรวจสอบ Cross-Origin Resource Sharing (CORS) และ CSRF
- **ความปลอดภัยของไฟล์อัปโหลด (Upload Security):** ตรวจสอบสลิปการโอนเงิน (Payment Slips) และไฟล์งานพิมพ์ (Artwork PDF/AI/PSD) ป้องกัน Malicious File Execution
- **Data Protection & Secret Hygiene:** ตรวจสอบการจัดการ `.env`, API Keys, รหัสผ่านฐานข้อมูล, และข้อมูลส่วนบุคคล (PII) ของลูกค้า

---

## 2. กฎเหล็กด้านความปลอดภัย (Security Guardrails & Hard Rules)

1. **ห้ามฮาร์ดโค้ด Credential หรือ Secret ในซอร์สโค้ด:**
   - ห้ามใส่ Secret Key, DB Password, JWT Secret, Token ลงในโค้ดหรือคอมมิทเข้า Git
   - ต้องอ่านค่าจาก Environment Variables (`os.Getenv` ใน Go หรือ `import.meta.env` ใน Vite)
2. **Parameterized Queries 100% (SQL Injection Zero Tolerance):**
   - คำสั่ง SQL ใน Go Backend ต้องใช้ Prepared Statement หรือ Parameterized Query (`$1`, `$2`) เท่านั้น
   - ห้ามใช้ `fmt.Sprintf` หรือการต่อ String เพื่อสร้าง SQL Query โดยเด็ดขาด
3. **การตรวจสอบสิทธิ์ในระดับ Endpoint (Endpoint Authorization):**
   - ทุก Admin API ต้องผ่าน Middleware ตรวจสอบ Token และ Role อย่างเข้มงวด
   - Customer Storefront ต้องเข้าถึงได้เฉพาะข้อมูลคำสั่งซื้อหรือโปรไฟล์ของตนเองเท่านั้น (ป้องกัน Insecure Direct Object References - IDOR)
4. **การตรวจสอบไฟล์อัปโหลด (File Upload Hardening):**
   - ตรวจสอบ MIME type และ Magic Bytes ที่ฝั่ง Backend (ห้ามเชื่อถือเฉพาะนามสกุลไฟล์จาก Request Header)
   - สลิปการโอน: อนุญาตเฉพาะ `image/jpeg`, `image/png`, `application/pdf` ขนาดไม่เกินที่กำหนด (เช่น 5MB)
   - บันทึกไฟล์ด้วยชื่อสุ่ม (UUID / Hash) เสมอ และเก็บไว้นอก Web Root หรือบน Object Storage
5. **การป้องกัน Information Disclosure:**
   - Backend ต้องไม่ส่งคืน Stack trace, รหัสข้อผิดพลาดของฐานข้อมูล (Database error message), หรือโครงสร้างระบบภายในกลับไปยัง Client

---

## 3. รูปแบบการตรวจสอบและแก้ไข (Security Patterns & Fixes)

### 3.1 การป้องกัน SQL Injection ใน Go Backend

```go
// ❌ ผิดมหันต์: ใช้ string concatenation เสี่ยงต่อ SQL Injection
// query := fmt.Sprintf("SELECT * FROM customers WHERE phone = '%s'", phone)

// ✅ ถูกต้อง: ใช้ Parameterized Query เสมอ
query := `SELECT id, name, phone, balance FROM customers WHERE phone = $1`
row := db.QueryRowContext(ctx, query, phone)
```

### 3.2 การจัดการ Password Hashing ด้วย bcrypt

```go
import "golang.org/x/crypto/bcrypt"

// แฮชรหัสผ่านก่อนบันทึกลงฐานข้อมูล
func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    return string(bytes), err
}

// ตรวจสอบรหัสผ่านเมื่อเข้าสู่ระบบ
func CheckPasswordHash(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}
```

### 3.3 การจำกัดสิทธิ์และการป้องกัน IDOR ใน Handler

```go
// ตรวจสอบว่าคำสั่งซื้อที่เรียกดูเป็นของลูกค้ารายนั้นจริง หรือเป็น Admin
func (h *OrderHandler) GetOrderDetails(c *gin.Context) {
    orderID := c.Param("id")
    currentUser := c.MustGet("currentUser").(*UserClaims)

    order, err := h.service.GetOrder(c.Request.Context(), orderID)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
        return
    }

    if !currentUser.IsAdmin && order.CustomerID != currentUser.CustomerID {
        c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": order})
}
```

---

## 4. Checklist สำหรับ Security Specialist ก่อนปล่อยระบบ (Security DoD)

- [ ] ไม่มี Secret / API Key / Password หลุดอยู่ในซอร์สโค้ดและ Git Commit
- [ ] คำสั่ง SQL ทุกจุดใช้ Parameterized Query (`$1`, `$2`) ปลอดภัยจาก SQL Injection
- [ ] Endpoints มีการเช็ค Role และสิทธิ์ถูกต้อง ป้องกัน IDOR
- [ ] ไฟล์อัปโหลดมี Validation ชนิดและขนาดไฟล์ พร้อมใช้ชื่อไฟล์ที่ปลอดภัย
- [ ] รหัสผ่านถูกเข้ารหัสด้วย bcrypt
- [ ] CORS มีการระบุ Origin ชัดเจน ไม่เปิด `*` บน Endpoint ที่มี Auth
- [ ] ข้อความ Error จากระบบไม่เผยแพร่ Database Internal Error สู่ภายนอก
