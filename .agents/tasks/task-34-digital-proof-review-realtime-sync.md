# Task 34: Digital Proof Review Real-Time Synchronization

## Mission & Context

Implement an end-to-end digital proofing pipeline connecting Admin ERP Prepress operators with Customer Service clients. When prepress generates a proof, it must be dispatched to the customer with an interactive preview. When the customer approves or rejects with change requests, the order state machine must advance or rewind in real-time across both systems.

---

## Target Layer & Affected Files

- **Admin Prepress**:  
  - `admin-system/frontend/src/features/orders/ProductionTrackingPage.tsx`  
  - `admin-system/frontend/src/components/admin/PreFlightVerificationCard.tsx`  
  - `admin-system/frontend/src/features/production/PreflightPage.tsx`  
- **Customer Service Proofing**:  
  - `customer-service/src/pages/ProofReviewPage.tsx`  
  - `customer-service/src/components/ArtworkDocumentViewer.tsx`  
- **Backend**:  
  - `admin-system/backend/orders/handlers.go`  
  - `admin-system/backend/orders/proof.go` (new)  
  - `admin-system/migrations/027_digital_proof_tracking.sql` (new)

---

## Technical Specifications & Requirements

### 1\. Database Schema for Proof History

- Add columns to `orders`:  
  - `digital_proof_url`: URL / Cloud Storage link to proof image/PDF.  
  - `proof_version`: Integer (increments on new revision).  
  - `proof_status`: Enum (`NOT_SUBMITTED`, `PENDING_CUSTOMER`, `APPROVED`, `REJECTED`).  
  - `proof_feedback`: Text for customer revision comments.  
  - `proof_action_at`: Timestamp.

### 2\. Prepress Proof Dispatch Endpoint

- Endpoint: `POST /api/orders/:id/send-proof`  
  - Payload: `{ proofUrl: string, prepressNotes: string }`  
  - Actions:  
    - Set `order.status = 'WAITING_APPROVAL'`  
    - Set `order.proof_status = 'PENDING_CUSTOMER'`  
    - Increment `proof_version`  
    - Trigger customer notification (SMS / WhatsApp link / Email).

### 3\. Customer Proof Decision Endpoint

- Endpoint: `POST /api/orders/:id/proof-action` (Accessible via public proof token or order ID \+ phone verification)  
  - Payload: `{ action: "APPROVE" | "REJECT", feedback?: string, customerSignature?: string }`  
  - State Transitions:  
    - If `APPROVE`: Set `order.status = 'FILE_CONFIRMED'`, `order.proof_status = 'APPROVED'`. Ready for queue allocator to move to `IN_PRODUCTION`.  
    - If `REJECT`: Set `order.status = 'PAID_PREPRESS'`, `order.proof_status = 'REJECTED'`, append feedback note to order timeline log.

### 4\. Real-Time Status Invalidation on Admin Kanban

- When customer submits proof action, invalidate TanStack Query key `['orders']` on Admin Prepress board via Server-Sent Events (SSE) or polling interval (15s) so the Prepress card updates status without manual page refresh.

---

## Verification & Acceptance Criteria

- [ ] Prepress operator uploads proof in Admin \-\> Order card changes to `WAITING_APPROVAL`.  
- [ ] Customer opens `/proof-review?orderId=SSP-2026-XXXX`, views PDF/images, and clicks "Approve Proof" \-\> Order status updates to `FILE_CONFIRMED`.  
- [ ] If customer clicks "Reject & Request Changes" with feedback \-\> Order returns to `PAID_PREPRESS` with revision badge and customer comments visible to prepress staff.

