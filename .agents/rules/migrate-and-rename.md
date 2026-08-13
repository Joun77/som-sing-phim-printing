---
trigger: manual
description: Rename project folders and migrate both systems to TypeScript (TSX).
---

# Project Renaming and TypeScript Migration

I want to restructure and modernize my workspace. Please perform the following steps to rename folders and convert the frontend/admin systems to TypeScript (TSX).

## 1. Folder Renaming
Please rename the existing folders under the root directory `Som-sing-phim/` as follows:
- Rename `som-sing-phim/` to `admin-system/`.
- Rename `som-sing-phim-frontend/` to `customer-service/`.

## 2. TypeScript (TSX) Migration
Once the folders are renamed, please migrate both applications to **TypeScript (TSX)**:
- **`admin-system/`**: Convert all frontend UI files (if applicable) to `.tsx`. (Leave Go `backend/` files untouched).
- **`customer-service/`**: Convert all frontend/UI files to `.tsx`.

## Execution Instructions for IDE Agent:
1. **Rename:** Carefully rename the folders as specified above. Update any internal file references or import paths if necessary to maintain project integrity.
2. **Setup:** Ensure `tsconfig.json` and necessary TypeScript dependencies are configured in both `admin-system/` and `customer-service/`.
3. **Migrate:** Rename JS/JSX files to `.tsx` and implement TypeScript interfaces/types for components and data models.
4. **Validation:** 
   - Ensure the Go `backend/` inside `admin-system/` is still functional and connected correctly.
   - Run a build check on both `admin-system/` and `customer-service/` to ensure no errors were introduced during renaming or migration.

---
# Note:
- The Go backend files must remain in their original state. 
- Please prioritize maintaining the functionality of the existing systems while performing this restructure.