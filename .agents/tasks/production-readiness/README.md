# Production Readiness — Antigravity task pack

วันที่: 2026-10-01 (Asia/Vientiane) | Status: planned
Repository root: `/Users/joun/Documents/GitHub/som-sing-phim-printing`
ติดตั้งไฟล์ชุดนี้ที่ `.agents/tasks/production-readiness/` ใน repository
เอกสารนี้เป็น master ledger; ไฟล์ Phase เก็บรายละเอียดและ delivery/review ของงานย่อย

## เป้าหมาย

ร้านทำงานตั้งแต่ประเมินราคา → รับเงิน/ยืนยันไฟล์ → ผลิต/ตัด stock → ส่งมอบ → ตรวจต้นทุน/บัญชีได้ พร้อมจัดซื้อ → รับสินค้า → stock/AP โดยข้อมูลจริง บันทึกได้ ตรวจย้อนหลังได้ และปลอดภัย

Baseline audit: [BASELINE_ADMIN_AUDIT.md](BASELINE_ADMIN_AUDIT.md), revision `1f6aea9` ตรวจวันที่ 2026-10-01 ไม่ใช่การรับรองโค้ดในอนาคต
ตอนเตรียมชุดงาน working tree มี `admin-system/backend/couriers_data.json` modified; รักษาไว้ และตรวจ git status/diff ใหม่ก่อน implementation ทุกงาน
รายการเป้าหมายจากผลตรวจ ไม่ใช่ข้ออ้างว่าพบ bug ครบทั้งหมด; unresolved checks ต้องทดสอบเพิ่ม

## วิธีใช้ — ส่งทีละงาน

1. เปิด Phase ที่ต้องการ เลือกโมเดลหลักของงานย่อยใน Antigravity UI ก่อนส่ง
2. คัดลอก block “คำสั่งคัดลอกไป Antigravity” ของงานนั้น; เริ่ม **P1.1**
3. Antigravity ทำงานถึง `ready_for_review` เติม delivery พร้อมหลักฐาน แล้วหยุด
4. นำ task path + delivery กลับให้ Codex ตรวจ diff/behavior จริง; ถ้า `changes_requested` แก้เฉพาะงานปัจจุบัน
5. Codex `verified` แล้วจึงส่งงานย่อยถัดไป งานที่ blocked ต้องบันทึก dependency analysis ก่อนเปลี่ยนลำดับ
6. หนึ่ง implementation active ต่อครั้ง โดยเฉพาะ AppContext/main.go/migrations ที่หลายเฟสแตะร่วมกัน

ไฟล์ไม่ได้ส่งข้อความ เริ่ม agent หรือเปลี่ยนโมเดลเอง ผู้ใช้เป็นผู้คัดลอกส่ง
Antigravity พัฒนา; Codex ตรวจรับ ไม่ต้อง spawn ทีมเพิ่มหรือโหลดทุกสกิล

## แผนและ dependency ledger

| เฟส | งานย่อยตามลำดับ | Outcome | Status |
|---|---|---|---|
| [Phase 1](TASK_PHASE_01_SECURITY.md) | P1.1 → P1.2 → P1.3 | Production ปฏิเสธผู้ไม่มีสิทธิ์และการตรวจเงินที่ยืนยันไม่ได้ พร้อมฐานข้อมูลทดสอบแยก | planned |
| [Phase 2](TASK_PHASE_02_DATA_PERSISTENCE.md) | P2.1 → P2.2 → P2.3 | UI แสดงข้อมูล authoritative และ success เฉพาะเมื่อเซิร์ฟเวอร์บันทึกแล้ว | planned |
| [Phase 3](TASK_PHASE_03_BUSINESS_FLOWS.md) | P3.1 → P3.2 → P3.3 | สอง business flows ทำงานแบบ atomic/idempotent และรายงานตรงรายการต้นทาง | planned |
| [Phase 4](TASK_PHASE_04_UNIVERSAL_UX.md) | P4.1 → P4.2 | Daily Plan ใช้ฟอร์มร่วม วัน/ขั้นงาน/ข้อความตรงความจริงทุกหน้า | planned |
| [Phase 5](TASK_PHASE_05_RELEASE_GATE.md) | P5.1 → P5.2 → P5.3 | มีหลักฐานทั้ง17โมดูล พร้อมการกู้คืนและrollbackก่อนเปิดใช้จริง | planned |

**Suggested first handoff in this pack:** P1.1 เท่านั้น; เอกสารเฟสหลังเป็นแผน ไม่ใช่คำสั่งรันพร้อมกัน

## โมเดลและเหตุผล

คำแนะนำนี้เป็นการจัดตามความเสี่ยง/ขอบเขต ไม่ใช่ benchmark ของ repository หรือการรับประกันค่าใช้จ่าย
รายชื่อยึดรายการที่ผู้ใช้ให้และ [Antigravity model documentation](https://www.antigravity.google/docs/models/) ตรวจ 2026-10-01

| โมเดล | งานที่จัดให้ | เหตุผลในการเลือก |
|---|---|---|
| Claude Opus 4.6 (Thinking) | P1.1/P1.2/P3.2 | security boundaries, หลายสถานะ/บทบาท, cross-module reasoning |
| Gemini 3.1 Pro High | P1.3/P2.3/P3.1/P3.3/P5.1/P5.2 | transactions, database integrity, formulas, integration evidence |
| Claude Sonnet 4.6 (Thinking) | P2.1/P2.2/P4.1/P4.2 | bounded React/API wiring, persistence fixes, common forms |
| Gemini 3.8 Flash Medium | P5.3 | รวบรวมหลักฐานและเอกสารจากผลที่มีแล้ว |
| Gemini 3.8 Flash High | สำรอง P4.2 | UI correction ที่ scope/acceptance ชัด |
| Gemini 3.7/3.6 Flash, GPT-OSS 120B Medium | ไม่จำเป็นใน critical path | ลดการสลับ context; ใช้รวบรวมเอกสารได้แต่ไม่แทนผู้ตัดสิน security/stock/เงิน |

ถ้าสำรองที่ระบุไม่มี quota ให้หยุด checkpoint และบอกโมเดลที่มี ไม่ลด acceptance หรือแกล้งผ่าน
ใช้ Flash/Low เฉพาะงานอ่านผล/เอกสารที่ไม่ตัดสินข้อมูลธุรกิจ; ไม่ต้องเปิด Opus เพื่อทุกการแก้ CSS
ตอนเปลี่ยนโมเดลใช้ delivery/state ของ task เดิม ไม่ให้โมเดลใหม่เริ่มค้นทั้ง repo ซ้ำ

## สกิลและกติกาที่ต้องอ่าน

อ่านครั้งเดียวต่อ context:
- [development coordinator](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-dev-coordinator/SKILL.md)
- [project coordinator](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/rules/somsing-coordinator/SKILL.md)
- [admin architecture guard](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/rules/admin-architecture-guard.md)
- pricing slice เท่านั้น: [pricing guard](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/rules/pricing-engine-guard.md)
- ตรวจรับ: [QA verifier](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/rules/task-qa-verifier.md), [QA orchestrator](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-qa-orchestrator/SKILL.md)

อ่าน primary skill ของงานก่อนลงมือ; secondary เฉพาะจุดที่ข้ามขอบเขต สกิลโฟลเดอร์ backend-developer/frontend-developer/db-analyst มี frontmatter ชื่อ somsing-* ให้ยึด **path ที่ระบุ** ไม่ค้นชื่อใหม่
Optional `.agents/skills/ponytail/SKILL.md` ระดับ lite: reuse และไม่ overengineer แต่ห้ามลด behavior/tests
ใช้ task นี้เป็น planning ledger ไม่สร้าง root task_plan ที่ขัดกันหรือสกิลใหม่เพื่อ routine bug

## ขอบเขตและการประหยัด token

- เริ่ม target files + entry point แล้ว `rg -n 'symbol' file`; read เฉพาะ surrounding function ไม่ dump ทั้ง AppContext
- Entry point บางอันเป็นคำอธิบาย logic ไม่ใช่ชื่อ symbol ตรงตัว ตรวจชื่อปัจจุบันก่อนแก้
- Target files เป็นจุดเริ่ม ไม่ใช่ห้ามแตะ dependency ที่จำเป็น: บันทึกไฟล์เพิ่มและเหตุผลก่อนขยาย; หากหลายผลลัพธ์ให้แยกงานรักษา scope
- ห้าม rewrite ระบบทั้งก้อน เปลี่ยน framework เพิ่ม service/dependency หรือสำเนาสูตรเพื่อให้ testผ่าน
- ทดสอบ import production code จริง; ไม่เขียน logic clone ใน tests
- Model checkpoint: baseline, changed files, acceptance passed/failed/not run, next exact action; ไม่เล่าประวัติสนทนายาว
- ถ้า policy เช่น VAT/cancel/earnings/credit terms ยังไม่ชัด ให้ถามข้อที่จำเป็น ไม่ invent financial policy; ทำงานที่ไม่ขึ้นกับคำตอบต่อ
- ไม่แก้ Storefront ทั้งระบบ; public consumer ที่กระทบ auth/API compatibility ต้องตรวจและบันทึกเฉพาะจุด ไม่ปล่อยให้เสีย
- ไม่ commit/push/deploy/message task อื่น/notifyคนจริงโดยไม่มีคำสั่งเฉพาะ

## การรันทดสอบ

Frontend working directory: `/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend`
```sh
npm run typecheck
npm test
npm run build
npm run lint
```
ปัจจุบัน npm test ใช้ tsx + node test จาก package.json ไม่ใช่ Vitest แม้ QA ruleพูดถึง Vitest: บันทึก actual runner/results ชัด ไม่อ้าง Vitest ผ่าน
ห้ามเปลี่ยน test runner เพื่อเลี่ยง test; new test placement ต้องเข้าคำสั่งที่รันจริง

Backend working directory: `/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend`
```sh
go build ./...
go test ./...
```
**Full go test รันหลัง P1.3 เปลี่ยน hardcoded live DSN และตรวจ isolation แล้วเท่านั้น** อ่าน testsก่อน DB-changing commands; ก่อนนั้นใช้ pure/httptest packages เฉพาะที่ปลอดภัยพร้อมรายงานช่องว่าง
Tests ที่ต้องแก้ connection: TestVerifyLegacyBaseline_Evaluation, TestRunMigrations_LiveDB_CleanNoPending, TestWearPartsDatabaseLifecycleAndWrongAsset
Test DB ต้องชื่อเฉพาะ เช่น somsing_test, portไม่ชน5432, volumeแยก และ guardปฏิเสธbusiness DSN
Test provider/notification ใช้ stub; temp uploads; ห้ามทำธุรกรรม/ลบหรือ migrate somsing_db ปัจจุบัน
Browser E2E อยู่ใน scope ที่ผู้ใช้ขอ; ใช้ tooling ที่มี ไม่ install Playwright default ไม่ถือ manual page-load เป็น write E2E

## Delivery contract / Stop condition

ทุกงานต้องเติมใน Phase file:
- baseline HEAD + pre-existing diff; delivered revision/diff snapshot
- changed files + behaviorที่แก้
- acceptanceแต่ละข้อ → test command/request/UI scenario → expected/actual → evidence path
- checks not run/limitations, migration/rollback/data effects และ fixture role
- status `ready_for_review`; stop ห้ามเริ่มงานย่อยถัดไป
- ถ้ามี failure ให้ `changes_requested`/gapชัด ไม่ข้ามแล้วประกาศครบ

Codex เป็นผู้เติม independent review และ mark `verified` จากหลักฐานจริง Antigravity ห้าม overwrite review
Archive หลังทุกงาน required verified ตามกติกา; production deployment ยังต้องคำสั่งผู้ใช้แยก

## คำสั่งเริ่มงานแรก

เลือก **Claude Opus 4.6 (Thinking)** แล้วคัดลอกคำสั่ง P1.1 ใน [Phase 1](TASK_PHASE_01_SECURITY.md)
ชุดนี้ยังไม่ได้ส่งให้ Antigravity และยังไม่มี implementation ใดถูกรับรอง

