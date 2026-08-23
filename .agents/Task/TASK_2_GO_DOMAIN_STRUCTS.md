# Task 2: Go Domain Structs for Materials & Inbound Records

## Objective
สร้างและอัปเดต Go Domain Structs ให้แมปกับ Database Schema ใน Task 1 โดยใช้ `shopspring/decimal` สำหรับตัวเลขการเงินและปริมาณ

## Target Files
- `backend/internal/domain/material.go`
- `backend/internal/domain/inbound.go`

## Technical Requirements
1. อัปเดต `backend/internal/domain/material.go`:
   - เพิ่มฟิลด์ `IsActive bool`, `MinStockAlert decimal.Decimal`, `StockStatus string`
   - กำหนด JSON และ DB tags ให้ถูกต้อง
2. สร้าง `backend/internal/domain/inbound.go`:
   - กำหนด Struct `StockInboundRecord` ครบทุกฟิลด์จากตาราง `stock_inbound_records`
   - ใช้ `uuid.UUID`, `decimal.Decimal`, และ `time.Time`
   - สร้าง Payload Structs: `CreateInboundPayload`, `CancelInboundPayload`, `UpdateMaterialPayload`