[Task Context & Reference Document]
ฉันได้แนบไฟล์ Implementation Plan (.md) ล่าสุดมาด้วย โปรดใช้เอกสารนี้เป็นเกณฑ์มาตรฐาน (Baseline) ในการตรวจสอบและพัฒนาโค้ดในโปรเจกต์ปัจจุบัน (`som-sing-phim-printing`)

[Instruction & Workflow]

1. ตรวจสอบและเปรียบเทียบ (Audit & Gap Analysis):
   - อ่านไฟล์ ที่แนบมา 
   /Users/joun/Documents/GitHub/som-sing-phim-printing/som-sing-phim/.agents/rules/som_sing_phim_frontend_spec.md
   /Users/joun/Documents/GitHub/som-sing-phim-printing/som-sing-phim/.agents/rules/Update034.md
   - สรุปให้ฉันทราบสั้นๆ ว่า:
     - ฟีเจอร์ไหนในแผนที่ทำเสร็จแล้วบ้าง?
     - ฟีเจอร์ไหนที่ยังตกค้าง ทำไม่เสร็จ หรือยังไม่ตรงตามแผน? 

2. ดำเนินการพัฒนาส่วนที่เหลือ (Complete Implementation):
   - ลงมือแก้ไขและเขียนโค้ดเพิ่มเติมในส่วนที่ยังไม่เสร็จหรือยังไม่สมบูรณ์ให้ตรงตามแผนงานในไฟล์ .md ทุกประการ

3. ทดสอบและแก้ไขวนลูปจนกว่าจะผ่าน (Iterative Testing & Fixing):
   - เมื่อปรับปรุงโค้ดเสร็จแล้ว ให้รันการทดสอบ Go Backend ด้วยคำสั่ง:
     `cd admin-system/backend && go test ./...`
   - หากพบ Bug, Test Fail หรือข้อผิดพลาดใดๆ ให้แก้ไขโค้ดและรันการทดสอบซ้ำอย่างต่อเนื่อง จนกว่าการทดสอบทั้งหมดจะผ่าน 100% และไม่มี Error ใดๆ เหลืออยู่

4. สรุปผลการทำงาน (Final Report):
   - เมื่อทุกอย่างสำเร็จและใช้งานได้จริงแล้ว ให้สรุปรายการที่ได้ปรับปรุงไปทั้งหมด พร้อมแสดงผลการทดสอบ (Test Results) เพื่อยืนยันความถูกต้อง