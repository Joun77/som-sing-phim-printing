# Report: Equipment Printer Type Integrity & Inbound Sync Fix

## 1. Summary of Problem & Root Causes Identified
When importing printing equipment (Epson EcoTank L15150 and Fuji Xerox AltaLink C8055) from the Inbound Procurement page:
1. **Wear Parts Leakage (`ImportForm.tsx`):** `wearDrumUnitCost: 1500000` (default from `initialItem`) was embedded into `specs` for all machines, including Inkjet.
2. **False Laser Categorization (`AppContext.tsx`):**
   `isLaserPrn` checked `(p.specs?.wearDrumUnitCost !== undefined && Number(p.specs?.wearDrumUnitCost) > 0)`, which evaluated to `true` for Epson EcoTank, overriding Inkjet intent, setting `printerCategory: 'Laser'`, and assigning 5 laser wear parts (Drum, Fuser, ITB, Pickup Roller, Waste Toner Box).
3. **Precedence Inversion in Calculator (`machineCostCalculator.ts` & `EquipmentDetailsPage.tsx`):**
   `isLaser = isPrinter && (isExplicitLaser || !isExplicitInkjet)` allowed `isExplicitLaser` (triggered by drum unit presence) to override `isExplicitInkjet` (Epson, EcoTank, L15150), adding laser toner fallback costs (+220 LAK).
4. **Category Overwrite on Inbound Import (`InboundManagement.tsx`):**
   Importing under `type === 'MACHINERY'` forcefully set `category: 'Processing Tools'`, stripping `'Printer'` and causing `EquipmentTable.tsx` to treat the machine as a post-press tool (`isPostPress = eq.category !== 'Printer'`), rendering `Post-Press Tool` and `A3+ format` instead of color specs and ink links.
5. **Asset ID Duplication (`InboundManagement.tsx` & `AppContext.tsx`):**
   `addEquipment` used `MAC-...` while inbound logs used `INB-...`, resulting in duplicate equipment rows for the same printer.

---

## 2. Changes Implemented

### 1. `ImportForm.tsx`
- **Isolated Wear Parts by Type:** Laser wear parts (`wearDrumUnitCost`, `wearFuserUnitCost`, `wearTransferBeltCost`, `wearWasteTonerBoxCost`) are strictly `undefined` for `machineType === 'inkjet'`. Inkjet wear parts (`wearMaintBoxCost`, `wearPrintheadCost`, `wearCarriageBeltCost`) are strictly `undefined` for `machineType === 'laser'`.
- **Preserved Explicit Categories:** Explicitly set `printerCategory` (`Inkjet Printer` vs `Laser Printer`), `machineryTypeCategory`, and `postPressSubtype` in both `specs` and top-level item payload.

### 2. `InboundManagement.tsx`
- **Preserved Equipment Category:** Set `category: data.category || (type === 'PRINTER' ? 'Printer' : 'Processing Tools')` so printers imported through machinery workspace stay categorized as `Printer`.
- **Aligned Asset ID:** Used `logId` (`INB-...`) for `addEquipment` and `addPrinterColorLink`, ensuring the equipment entry ID directly mirrors the inbound log ID.

### 3. `AppContext.tsx`
- **Strict Precedence for Inkjet:** Defined `explicitInkjet` checking `ecotank`, `epson`, `l15150`, `inkjet`, `ink tank`, and `maxify`. If true, `isLaserPrn` is strictly `false`.
- **Dynamic Post-Press Subtype:** Dynamically sets `postPressSubtype: isLaserPrn ? 'laser' : 'inkjet'` instead of hardcoding `'laser'`.
- **Intelligent Deduplication:** Enhanced `setEquipment` merge loop to check matching `item.sku`, `serialNumber`, and `item.specs?.serialNumber` to merge duplicate `MAC-...` and `INB-...` entries into a single authoritative equipment record.
- **Inkjet Initial Components:** Configured default components for inkjet printers (Maintenance Box, Printhead, Feed Roller, Carriage Belt) instead of laser Drum/Fuser.

### 4. `machineCostCalculator.ts` & `EquipmentDetailsPage.tsx`
- Guaranteed that `isExplicitLaser = !isExplicitInkjet && ...`. An inkjet printer is never categorized as Laser.
- In `machineCostCalculator.ts`, exposed `isLaser` and `isInkjet` on `getEquipmentAccurateCost` and utilized them in `calculateEquipmentPrintCost`.

### 5. `EquipmentTable.tsx`
- **Robust Printer Recognition:** Evaluates `isPrinter` considering `isExplicitInkjet`, `isExplicitLaser`, `eq.printerCategory`, and keywords, ensuring inbound machines with category `MACHINERY` or `Processing Tools` are accurately identified as printers.
- **Badge Styling:** Displays `INKJET PRINTER` in sky blue (`bg-sky-50 text-sky-700 border-sky-200`) and `LASER` in purple (`bg-purple-50 text-purple-700 border-purple-200`).
- **Operational Specs Integrity:** Key operational specs column (Column 4) always renders the color system and linked inks for printers, and never `Post-Press Tool`.

---

## 3. Verification Results
- **TypeScript Type Check:** `npx tsc --noEmit` passed with 0 errors.
- **Frontend Unit Tests:** 37 of 37 tests passed (`npm test`).
- **Backend Tests:** All Go packages passed (`go test ./...`).
