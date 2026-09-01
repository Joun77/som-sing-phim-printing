# Task 31: Backend Security Hardening & Role-Based Access Control (RBAC)

## Mission & Context

Strengthen the Go backend security architecture for Somsin Printing (`som-sing-phim-printing`). Address security vulnerabilities by enforcing environment variable secrets, implementing strict Role-Based Access Control (RBAC) middleware across all API routes, sanitizing CORS configurations, and validating input payloads.

---

## Target Layer & Affected Files

- **Backend**: `admin-system/backend/main.go`  
- **Auth & Middleware**: `admin-system/backend/auth/jwt.go`, `admin-system/backend/auth/middleware.go` (new)  
- **Configuration**: `.env.example`, `admin-system/backend/Dockerfile`  
- **Frontend Auth**: `admin-system/frontend/src/store/useAuthStore.ts`, `admin-system/frontend/src/api/`

---

## Technical Specifications & Requirements

### 1\. Enforce JWT Secrets & Remove Hardcoded Fallbacks

- In `admin-system/backend/auth/jwt.go`:  
  - Check `os.Getenv("JWT_SECRET")`. If empty or whitespace, fail fast on server startup or log a fatal error in production mode (`ENVIRONMENT=production`).  
  - Implement token expiration (`exp` claim set to 24 hours) and standard payload claims (`sub`, `user_id`, `role`, `email`).  
  - Add token refresh endpoint: `POST /api/auth/refresh`.

### 2\. Implement Role-Based Access Control (RBAC) Middleware

- Define system roles:  
  - `admin`: Full system access  
  - `manager`: Access to Orders, Inventory, Pricing, Finance (read-only), HR (read-only)  
  - `prepress`: Access to Orders, Preflight, Proof reviews, Machinery assignments  
  - `production`: Access to Production Board, ShopFloorTracker, Machinery logs, Spoilage entry  
  - `finance`: Access to AP/AR, Invoices, Payment Verification, P\&L, Currency Rates  
  - `sales`: Access to Quotations, Order Creation, Customer Directory  
- Create middleware `RequireRoles(allowedRoles ...string) gin.HandlerFunc` (or standard `http.HandlerFunc`).  
- Protect routes accordingly:  
  - `/api/finance/*` \-\> `admin`, `finance`  
  - `/api/hr/*` \-\> `admin`  
  - `/api/inventory/inbound/*` (create/reverse) \-\> `admin`, `manager`  
  - `/api/pricing/margin-approval` \-\> `admin`, `manager`

### 3\. Strict CORS Whitelisting

- In `admin-system/backend/main.go`:  
  - Read `ALLOWED_ORIGINS` from environment variable (comma-separated).  
  - Allow local dev origins by default in development (`http://localhost:5173`, `http://localhost:3000`), but disallow wildcard `*` with credentials in production.

### 4\. Input Sanitization & SQL Parameterization Audit

- Ensure all queries in `admin-system/backend/` use PostgreSQL parameterized placeholders (`$1, $2, ...`).  
- Validate incoming JSON payloads using struct tags (`binding:"required,min=1"`).

---

## Verification & Acceptance Criteria

- [ ] Server refuses to start in `production` mode if `JWT_SECRET` is missing.  
- [ ] Users with `production` role receive `403 Forbidden` when attempting to access `/api/finance` or `/api/hr` endpoints.  
- [ ] Admin users can successfully authenticate and access all protected routes.  
- [ ] CORS preflight requests (`OPTIONS`) pass for whitelisted origins and are blocked for unauthorized domains.

