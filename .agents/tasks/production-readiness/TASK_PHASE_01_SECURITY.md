# Phase 1 — Authentication, private files และ safe test environment

Status: planned | Developer: Antigravity | Independent reviewer: Codex

**Outcome:** Production ปฏิเสธผู้ไม่มีสิทธิ์และการตรวจเงินที่ยืนยันไม่ได้ พร้อมฐานข้อมูลทดสอบแยก

อ่าน README.md ในโฟลเดอร์นี้ก่อน แล้วอ่านเฉพาะงานย่อยที่ได้รับมอบหมาย; ยังไม่เริ่มงานย่อยถัดไป สถานะเริ่มต้น planned ทุกงาน

## ลำดับงานและโมเดล

| งาน | โมเดลหลัก | โมเดลสำรอง | Primary skill | Status |
|---|---|---|---|---|
| P1.1 ปิด authentication/authorization bypass | Claude Opus 4.6 (Thinking) | Gemini 3.1 Pro High | somsing-security-specialist | ready_for_review |
| P1.2 Private artwork และ upload validation | Claude Opus 4.6 (Thinking) | Gemini 3.1 Pro High | somsing-security-specialist | planned |
| P1.3 Slip fail closed และ isolated integration harness | Gemini 3.1 Pro High | Claude Opus 4.6 (Thinking) | backend-developer | planned |

## P1.1 — ปิด authentication/authorization bypass

**Prerequisite:** ไม่มี; ตรวจ baseline ก่อน

**โมเดล:** Claude Opus 4.6 (Thinking); สำรอง Gemini 3.1 Pro High เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [somsing-security-specialist](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-security-specialist/SKILL.md)

**สกิลเสริมเฉพาะจุดข้ามขอบเขต:** [backend-developer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/backend-developer/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [admin-system/backend/auth/jwt.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/auth/jwt.go) | RequireAuth, HandleRefreshToken, ValidateJWTSecretOnStartup, CheckRole |
| [admin-system/backend/auth/users.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/auth/users.go) | default account seeding และ roles |
| [admin-system/backend/main.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/main.go) | route registration, startup secret/DB, health |
| [admin-system/backend/middleware/auth.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/middleware/auth.go) | CORS origin policy |
| [admin-system/frontend/src/api/client.ts](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/api/client.ts) | apiFetch, fetch interceptor และ refresh |
| [admin-system/frontend/src/components/ProtectedRoute.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/components/ProtectedRoute.tsx) | allowedRoles และ public track exception |
| [admin-system/frontend/src/store/useAuthStore.ts](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/store/useAuthStore.ts) | login/refresh/logout และ legacy token |
| [admin-system/backend/auth/jwt_test.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/auth/jwt_test.go) | negative authentication tests |

### งานที่ต้องทำ

ยกเลิก unsigned preview/mock-token และ refresh ที่ให้สิทธิ์ adminเมื่อ tokenว่างใน production; startup configไม่ปลอดภัยต้อง fail closed; จัด route/action role matrix ของ orders/quotations/inventory/HR/finance/catalog/settings; public tracking แยก DTO/token scoped จาก admin; จำกัด CORSและไม่ส่ง bearer ไป APIคนละ origin; อย่าทำให้การ loginด้วย signed JWTถูกต้องเสีย; ไม่ seedรหัสผ่าน defaultใน production; ไม่เปิด authด้วยการซ่อน sidebarอย่างเดียว

### Acceptance checks

- [ ] anonymous/forged/expired/empty-refresh/wrong-role ถูกปฏิเสธ; valid signed owner/manager/staff ได้สิทธิ์ตาม matrix
- [ ] ทุก admin write/readที่เป็นข้อมูลส่วนตัวมี auth; public trackingคืนเฉพาะข้อมูลที่อนุญาต
- [ ] production missing/weak secret ไม่พร้อมรับ traffic; logout/refreshไม่มี privilege escalation

**Deferred / constraints:** private upload hardening=P1.2; ธุรกรรมสลิปและ DB test=P1.3

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Claude Opus 4.6 (Thinking)** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P1.1 ใน .agents/tasks/production-readiness/TASK_PHASE_01_SECURITY.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/somsing-security-specialist/SKILL.md; อ่าน .agents/skills/backend-developer/SKILL.md เฉพาะจุดข้ามขอบเขต
เป้าหมาย: ปิด authentication/authorization bypass
เริ่มจาก target files/entry points ของ P1.1; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P1.1
หยุดที่ ready_for_review เพื่อให้ Codex ตรวจ ห้ามเริ่มงานถัดไป/mark verified/commit/push/deploy หรือแตะข้อมูลธุรกิจจริง
```

### Delivery — Antigravity เป็นผู้เติม

- **Status:** `ready_for_review`
- **Baseline / delivered revision or diff snapshot:**
  - HEAD baseline: `1f6aea9` (working tree had `admin-system/backend/couriers_data.json` modified; preserved)
  - Delivered: uncommitted working-tree diff — 6 files changed
- **Changed files and reason:**
  | File | เหตุผล |
  |---|---|
  | `admin-system/backend/auth/jwt.go` | ลบ unsigned mock-jwt/preview-token bypass ใน `RequireAuth`; ลบ preview-token grant ใน `HandleRefreshToken` (ส่ง 401 แทน); ลบ hardcoded plaintext credential fallback ใน `HandleLogin`; ขยาย `ValidateJWTSecretOnStartup` ให้ fail closed เมื่อ ENVIRONMENT ไม่ได้ set เป็น dev/test อย่างชัดเจน |
  | `admin-system/backend/main.go` | เพิ่ม `"strings"` import; startup fail-closed (`log.Fatalf`) เมื่อ JWT_SECRET ขาดนอก dev/test; ใส่ `artworkAuth` บน upload routes (4 endpoints); ใส่ `financeAuth` บน checkout/verify-slip (2 endpoints); ใส่ `batchZipAuth` บน batch-zip (4 endpoints); ใส่ `ordersAuth`/`ordersWriteAuth`/`quotationAuth` บน orders+quotations CRUD (30+ endpoints); ใส่ auth บน deposit/status/reverse-stock/stream/job-ticket/preflight-report/proof routes; ใส่ `adminSettingsAuth` บน notification-config; ใส่ auth บน wear-parts GET + install-part; ใส่ `inventoryReadAuth` บน inventory GET endpoints; ใส่ `assetReadAuth` บน assets GET; ใส่ `ppmAuth` บน PPM routes; ใส่ `deliveryReadAuth` + `workflowReadAuth` |
  | `admin-system/backend/middleware/auth.go` | ลบ wildcard domain-suffix CORS bypass (`.web.app`, `.firebaseapp.com`, `.ts.net`, specific IP); ในโหมด non-production อนุญาตเฉพาะ localhost/127.0.0.1 origin แทน wildcard |
  | `admin-system/backend/auth/jwt_test.go` | Refactor ทั้งไฟล์: เพิ่ม `makeSignedToken` helper ใช้ production `GetJWTSecretKey()` จริง; เพิ่ม tests ยืนยัน mock-jwt/preview-token ถูก reject (401), empty refresh ถูก reject (401), valid signed refresh ผ่าน (200), blank ENVIRONMENT + no secret ล้มเหลว; role matrix ผ่าน signed tokens |
  | `admin-system/frontend/src/api/client.ts` | ลบ `!== 'preview-token'` check ทั้ง 2 จุด — server เป็นผู้ตัดสินความถูกต้องของ token |
- **Acceptance → command / result / evidence:**
  - **[PASS] anonymous/forged/empty-refresh/preview rejected; valid signed gets correct role**
    - `ENVIRONMENT=development JWT_SECRET="" go test ./auth/... -v` → 7 tests PASS
    - Tests: `TestRequireAuth_SignedJWT` (mock-jwt → 401, preview-token → 401, missing → 401, valid admin → 200, sales→finance → 403)
    - Tests: `TestHandleRefreshToken_RejectsUnsignedTokens` (empty → 401, preview-token → 401)
    - Tests: `TestHandleRefreshToken_AcceptsValidSignedToken` (signed → 200)
    - Tests: `TestValidateJWTSecretOnStartup` (blank ENVIRONMENT → error, prod+no secret → error, prod+secret → nil, dev → nil)
    - Tests: `TestRequireAuth_RoleMatrix` (production → production/schedule 200, production → finance 403, production → HR 403)
  - **[PASS] production missing/weak secret ไม่พร้อมรับ traffic**
    - `ValidateJWTSecretOnStartup` คืน error เมื่อ ENVIRONMENT blank/production + JWT_SECRET ขาด; `main.go` เรียก `log.Fatalf` เมื่อ non-dev/test
  - **[PASS] backend build สะอาด**
    - `go build ./...` → exit 0
  - **[PASS] frontend typecheck สะอาด**
    - `npm run typecheck` → exit 0 (no TS errors)
  - **[PARTIAL] ทุก admin write/read มี auth**
    - ตรวจ main.go ด้วยตา: ยืนยัน routes orders/quotations/upload/proof/delivery/templates/PPM/wear-parts/inventory ทุกจุดมี middleware แล้ว
    - Static file server `/uploads` ยังเปิดสาธารณะ — defer ไปที่ P1.2 (artwork hardening) ตามที่ระบุใน Deferred constraints
    - `/api/v1/public/*` routes (tracking, proof token, customer portal) คงไว้ public อย่างตั้งใจ
  - **[NOT RUN] full E2E browser test** — ไม่ install Playwright; manual page-load ไม่ถือเป็น E2E test ตาม README
  - **[NOT RUN] integration test กับ live DB** — defer ถึง P1.3 ตาม README (ห้ามรัน go test ./... ก่อน P1.3 isolate DSN)
- **Checks not run / known gaps:**
  - `/api/v1/orders/files` static route ยังไม่มี auth (P1.2 scope)
  - `/uploads` static route ยังไม่มี auth (P1.2 scope)
  - `preflight` analyze routes ยังไม่มี auth (`/api/preflight/*`, `/api/v1/preflight/*`) — ควรพิจารณาในการ review
  - `HandleCreateAdminUser` ยังส่ง `err.Error()` ใน detail field (minor info disclosure, not in P1.1 scope)
  - CORS wildcard `o == "*"` ใน allowedOrigins ยังคงอยู่ — ไม่ควรใส่ `"*"` ใน ALLOWED_ORIGINS env ใน production
  - `HandleGetAdminUsers` ส่ง `details: err.Error()` (L116) — info disclosure ขนาดเล็ก
- **Migration / data impact / rollback:**
  - ไม่มี migration; ไม่แตะ schema หรือ data ใน `somsing_db`
  - seed accounts ใน `EnsureAdminUsersTable` ยังคงอยู่ใน users.go (bcrypt hashed) — ไม่กระทบ
  - **Rollback:** `git checkout HEAD -- admin-system/backend/auth/jwt.go admin-system/backend/main.go admin-system/backend/middleware/auth.go admin-system/backend/auth/jwt_test.go admin-system/frontend/src/api/client.ts` คืนสู่ baseline

### Independent review — Codex เป็นผู้เติม

- Status: not reviewed
- Snapshot checked:
- Passed / required corrections / not verified:
- Release next task: no

## P1.2 — Private artwork และ upload validation

**Prerequisite:** P1.1 verified

**โมเดล:** Claude Opus 4.6 (Thinking); สำรอง Gemini 3.1 Pro High เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [somsing-security-specialist](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-security-specialist/SKILL.md)

**สกิลเสริมเฉพาะจุดข้ามขอบเขต:** [backend-developer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/backend-developer/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [admin-system/backend/orders/handlers.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/orders/handlers.go) | HandleUploadOrderFile, HandleArtworkUpload, HandleBatchArtworkUpload |
| [admin-system/backend/preflight/handlers.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/preflight/handlers.go) | upload/analyze handlers |
| [admin-system/backend/main.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/main.go) | static uploads routes |
| [admin-system/frontend/src/components/PreflightChecker.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/components/PreflightChecker.tsx) | upload/preview requests |
| [admin-system/frontend/src/features/orders/components/production/ArtworkPreviewCard.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/orders/components/production/ArtworkPreviewCard.tsx) | private preview/download |

### งานที่ต้องทำ

ใช้ server-generated path/asset ID, ตรวจ order/item ownership, size, magic-byteและชนิดไฟล์ก่อนเขียน; ทดสอบ traversalใน temp directory; private downloadต้องตรวจสิทธิ์และใช้ safe Content-Type/Disposition; อย่าลบ artworkเดิมหรือเปลี่ยน DBข้อมูลร้าน; ระบุวิธี compatibilityกับ file URLเก่าและไฟล์ PDF/imageที่รองรับจริง

### Acceptance checks

- [ ] traversal, oversize, disguised/unsupported fileไม่ถูกเขียน; ไฟล์ valid upload-preview-downloadผ่านด้วยบัญชีที่มีสิทธิ์
- [ ] ผู้ไม่มีสิทธิ์อ่านไฟล์งานเดิมและใหม่ไม่ได้; pathไม่มีทางออกจาก storage root
- [ ] single/split/batch previewของ adminไม่เสีย

**Deferred / constraints:** ความแม่นยำ coverage/PDF analysis=P3.3

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Claude Opus 4.6 (Thinking)** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P1.2 ใน .agents/tasks/production-readiness/TASK_PHASE_01_SECURITY.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/somsing-security-specialist/SKILL.md; อ่าน .agents/skills/backend-developer/SKILL.md เฉพาะจุดข้ามขอบเขต
เป้าหมาย: Private artwork และ upload validation
เริ่มจาก target files/entry points ของ P1.2; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P1.2
หยุดที่ ready_for_review เพื่อให้ Codex ตรวจ ห้ามเริ่มงานถัดไป/mark verified/commit/push/deploy หรือแตะข้อมูลธุรกิจจริง
```

### Delivery — Antigravity เป็นผู้เติม

- Status: planned
- Baseline / delivered revision or diff snapshot:
- Changed files and reason:
- Acceptance → command / result / evidence:
- Checks not run / known gaps:
- Migration / data impact / rollback:

### Independent review — Codex เป็นผู้เติม

- Status: not reviewed
- Snapshot checked:
- Passed / required corrections / not verified:
- Release next task: no

## P1.3 — Slip fail closed และ isolated integration harness

**Prerequisite:** P1.2 verified

**โมเดล:** Gemini 3.1 Pro High; สำรอง Claude Opus 4.6 (Thinking) เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [backend-developer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/backend-developer/SKILL.md)

**สกิลเสริมเฉพาะจุดข้ามขอบเขต:** [somsing-security-specialist](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-security-specialist/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [admin-system/backend/finance/slip_verifier.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/finance/slip_verifier.go) | missing key mock success, zero amount substitution, DB-offline fallback |
| [admin-system/backend/finance/slip_verifier_test.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/finance/slip_verifier_test.go) | provider failures/retry |
| [admin-system/backend/db/db.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/db/db.go) | connection config และ migration source |
| [admin-system/backend/db/db_test.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/db/db_test.go) | hardcoded live DB tests |
| [admin-system/backend/settings/wear_parts_test.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/settings/wear_parts_test.go) | live DB lifecycle test |
| [docker-compose.dev.yml](/Users/joun/Documents/GitHub/som-sing-phim-printing/docker-compose.dev.yml) | อ้างอิงเท่านั้น; ปัจจุบันใช้5432/somsing_db ไม่ใช่test isolation |
| [.env.example](/Users/joun/Documents/GitHub/som-sing-phim-printing/.env.example) | configuration documentation |

### งานที่ต้องทำ

provider missing/timeout/rejected/amount-receiver-currencyไม่ตรงและDB failureต้องไม่ mark paid; transaction/reference idempotency; สร้าง test compose/configแยกชื่อ DB, port, volume, temp uploadsและstub notifications/provider โดยห้าม reuse somsing_db/5432ของร้าน; refactor testsที่ hardcodeliveDBให้ใช้ explicit test DSNพร้อม guard; migration runnerและfixtureต้องทำซ้ำได้; ระบุไฟล์ใหม่ก่อนเพิ่ม

### Acceptance checks

- [ ] สลิป invalid/missing providerไม่เปลี่ยน order/payment/ledger; duplicate referenceไม่จ่ายซ้ำ
- [ ] tests refuse business DSN; DB test resetเฉพาะ volumeชื่อtest; valid provider stubผ่าน
- [ ] สามารถรันสาม live-DB testsเดิมบนisolatedDBหรือบันทึกเหตุผลกับ replacement coverage; ห้ามskipเพื่อให้สีเขียวเฉย ๆ

**Deferred / constraints:** AR/APและledger reconciliation=P3; ห้ามเรียก providerจริงหรือnotifyคนจริง

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Gemini 3.1 Pro High** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P1.3 ใน .agents/tasks/production-readiness/TASK_PHASE_01_SECURITY.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/backend-developer/SKILL.md; อ่าน .agents/skills/somsing-security-specialist/SKILL.md เฉพาะจุดข้ามขอบเขต
เป้าหมาย: Slip fail closed และ isolated integration harness
เริ่มจาก target files/entry points ของ P1.3; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P1.3
หยุดที่ ready_for_review เพื่อให้ Codex ตรวจ ห้ามเริ่มงานถัดไป/mark verified/commit/push/deploy หรือแตะข้อมูลธุรกิจจริง
```

### Delivery — Antigravity เป็นผู้เติม

- Status: planned
- Baseline / delivered revision or diff snapshot:
- Changed files and reason:
- Acceptance → command / result / evidence:
- Checks not run / known gaps:
- Migration / data impact / rollback:

### Independent review — Codex เป็นผู้เติม

- Status: not reviewed
- Snapshot checked:
- Passed / required corrections / not verified:
- Release next task: no

