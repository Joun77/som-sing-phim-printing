# Phase 3: Production Workflow Setup Modal & Interactive Tracking

## 1\. Role & Identity

You are an expert Frontend & UI/UX Engineer specializing in React, TypeScript, and Shop Floor ERP Systems for the Som Sing Phim Printing ERP.

## 2\. Objective

1. Standardize the "Workflow Setup Modal" (`ກຳນົດສາຍງານການຜະລິດ & ມອບໝາຍຊ່າງ`) to the full-width Universal Form design.  
2. Add a search bar for workflow templates.  
3. Clean up UI glitches (duplicate `+` icons and duplicate `<<` return arrows).  
4. Make Job Ticket specifications conditional (hide unused coating and binding fields).  
5. Convert the Interactive Workflow Tracker from a static 8-step booklet pipeline into an itemized, dynamic tracker supporting per-job and all-in-one views with technician completion audit logs.

---

## 3\. Target Files to Modify

- `admin-system/frontend/src/features/orders/components/production/ProductionWorkflowSetupModal.tsx`  
- `admin-system/frontend/src/features/orders/components/production/ProductionProcessFlowCard.tsx`  
- `admin-system/frontend/src/features/orders/components/production/PrintJobItemsCard.tsx` (or `JobTicketSpecsCard.tsx`)  
- `admin-system/frontend/src/features/orders/components/production/InteractiveWorkflowTracker.tsx`

---

## 4\. STRICT CONSTRAINTS (DO NOT TOUCH)

- **DO NOT MODIFY** real-time WebSocket listeners or push notification events sent to shop floor tablets.  
- **DO NOT TOUCH** printer hardware integration profiles or queue drivers.  
- Ensure that marking an item or step complete does not prematurely mark uncompleted sibling jobs as complete.

---

## 5\. Detailed Tasks & Implementation Instructions

### Task 3.1: Universal Form Modal Design & Search Bar

- In `ProductionWorkflowSetupModal.tsx`:  
  - Change modal container class to full-width Universal Form standard: `className="w-[96vw] max-w-7xl h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"`  
  - In section "1. ເລືອກ TEMPLATE ຂະບວນການຜະລິດມາດຕະຖານ", add a template search input:  
    - Placeholder: `"ຄົ້ນຫາ Template ຂະບວນການຜະລິດ (ເຊັ່ນ: ສະຕິກເກີ, ປຶ້ມ, ໂປສເຕີ)..."`  
    - Filter standard templates by name/keywords dynamically as the user types.

### Task 3.2: Remove Duplicate UI Elements

- In the pipeline step rows:  
  - Remove redundant `+` icons inside the technician assign input. Keep only one explicit Assign button/dropdown per row, and use `+` only for "Insert New Step".  
  - Locate table back navigation arrows and remove duplicate double arrows (`<<`), replacing with a clean single arrow `← ກັບຄືນ`.

### Task 3.3: Conditional Specs Rendering in Job Ticket

- In `JobTicketSpecsCard.tsx` (or `PrintJobItemsCard.tsx`):  
  - **Coating (ການເຄືອບ):** If `!item.specifications.coating || item.specifications.coating === 'none'`, DO NOT render the coating badge.  
  - **Binding (ການເຂົ້າເລ่ม):** If `!item.specifications.binding || item.specifications.binding === 'none'`, DO NOT render the binding badge.  
  - Display only active specs: Printer name, Paper type/GSM, Size, Print color mode, and actual finishing options.

### Task 3.4: Dynamic Itemized Workflow Tracker & Audit Trail

- In `InteractiveWorkflowTracker.tsx`:  
  - Add a Job Selector tab at the top: `[ ພາບລວມທັງໝົດ ]` `[ Job 1: ເອກະສານ... ]` `[ Job 2: ຮູບພາບ Presentation ]`  
  - Each job must generate its own pipeline based on its specific template (e.g. Photo/Flyer has only Print $\\rightarrow$ Trim $\\rightarrow$ QC, whereas Booklets have 8 full stages).  
  - **Step Completion & Audit Trail:**  
    - Any authorized user (technician, floor operator, admin) can click to complete a step.  
    - When clicked, record:  
        
      {  
        
        status: 'completed',  
        
        completed\_by\_id: currentUser.id,  
        
        completed\_by\_name: currentUser.name,  
        
        completed\_by\_role: currentUser.role,  
        
        completed\_at: new Date().toISOString()  
        
      }  
        
    - Display on the card: `✓ ສຳເລັດແລ້ວ ໂດຍ: [ຊື່ຜູ້ກົດ] ([ຕຳແໜ່ງ]) - [ເວລາ]`

---

## 6\. Verification & Acceptance Criteria

1. Workflow setup modal opens wide across the screen with zero horizontal overflow issues.  
2. Typing into the template search bar filters templates instantly.  
3. Job Ticket hides binding/coating badges when an item has no binding or coating.  
4. Completing a step displays the exact user name and timestamp of the person who clicked it.

