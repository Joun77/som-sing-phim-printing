# Task 9: 2D Interactive Canvas Artwork Visualizer

## Objective
สร้าง React Component สำหรับจำลองชิ้นงานพิมพ์ (Print-on-Demand Visualizer) แสดงสัดส่วน Aspect Ratio, รูป Artwork Preview, และจุดตอกตาไก่/เส้นพับขอบแบบ Interactive 2D

## Target File
- `frontend/src/features/customer/components/PrintArtworkVisualizer.tsx`

## Technical Requirements
1. รองรับ Props:
   - `widthCm: number`
   - `heightCm: number`
   - `artworkUrl?: string`
   - `grommetPositions?: 'NONE' | 'FOUR_CORNERS' | 'EVERY_50CM'`
   - `hasHemming?: boolean`
2. ใช้ HTML5 `<canvas>` เรนเดอร์อัตราส่วนแบบ Dynamic Scale ให้พอดีกับกรอบ
3. ซ้อน Layer จุดตอกตาไก่ (วงแหวนโลหะ) ตามตำแหน่งที่ผู้ใช้เลือก
4. มีเส้นประจำลอง Safe Zone / Bleed Line รอบขอบชิ้นงาน