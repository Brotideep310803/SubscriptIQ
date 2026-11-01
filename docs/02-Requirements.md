# Document 02: Software Requirements Specification (SRS)

**Project**: SubscriptIQ  
**Architecture**: Next.js App Router (TypeScript) + Prisma ORM + PostgreSQL / SQLite  
**Audience**: Software Architects, Mentors, Evaluators, and Engineering Teams  

---

## 1. Functional Requirements by Module

### Module A: Authentication & Session Governance
- **FR-A1**: The system must securely authenticate users via email and password using salted bcrypt password hashes (cost factor >= 10).
- **FR-A2**: Upon successful login, the server must issue a signed JSON Web Token (JWT) using `jose` set in a secure, HTTP-only cookie (`subscriptiq_session`).
- **FR-A3**: The system must enforce role-based access control (RBAC) on all backend API routes before database access.
- **FR-A4**: Unauthorized requests must receive an appropriate HTTP 401 (Unauthenticated) or HTTP 403 (Forbidden) response with a clear error payload.
- **FR-A5**: The login view must provide one-click demo credentials for Admin, Manager, and Support Agent roles for streamlined evaluation.

### Module B: Real-Time Analytics Dashboard
- **FR-B1**: The system must calculate and display seven core SaaS KPIs:
  1. **Total Revenue** (Lifetime & selected window)
  2. **Monthly Recurring Revenue (MRR)**
  3. **Annual Recurring Revenue (ARR)**
  4. **Total Registered Customers**
  5. **Active Subscriptions**
  6. **Churn Rate (%)**
  7. **Failed Payment Volume & Success Rate (%)**
- **FR-B2**: Dynamic date filtering must support 7-day, 30-day, 90-day, and 12-month historical windows.
- **FR-B3**: Data visualizations powered by Recharts must render:
  - Monthly Revenue Trend (Area chart with gradient fill)
  - Customer Acquisition vs. Subscription Growth (Double bar chart)
  - Revenue Contribution by Plan (Horizontal bar chart)
  - Payment Success vs. Payment Failure (Grouped comparison chart)
- **FR-B4**: For Support Agent roles, sensitive financial metrics (Revenue, MRR, ARR) must be masked at the API layer.

### Module C: Subscription Plan Management
- **FR-C1**: Administrators must be able to perform full CRUD operations on subscription plans.
- **FR-C2**: Each plan entity must capture name, description, monthly price, annual price, billing interval, feature list (serialized JSON), maximum usage limit, and operational status (`ACTIVE`, `INACTIVE`, `ARCHIVED`).
- **FR-C3 (Dependency Constraint)**: The system must prohibit deletion of any plan currently associated with active or historical customer subscriptions, returning an HTTP 409 conflict error.

### Module D: Customer Account Management
- **FR-D1**: The system must maintain customer records including Full Name, Unique Email, Company Name, Contact Number, Registration Date, and Customer Status (`ACTIVE`, `INACTIVE`, `CHURNED`).
- **FR-D2**: Support search, status filtering, and paginated directory views.
- **FR-D3**: Provide an account detail view (`/customers/[id]`) aggregating the customer's subscription timeline, invoice records, payment events, and usage metrics.
- **FR-D4**: Support agents, managers, and administrators may update permitted customer contact info.

### Module E: Subscription Lifecycle Management
- **FR-E1**: Create new subscriptions linking a verified customer to an active plan with a monthly or annual billing cycle.
- **FR-E2**: Support seamless tier upgrades and downgrades, updating recurring contract value and logging changes to the audit trail.
- **FR-E3**: Support cancellation with non-destructive preservation: sets status to `CANCELLED` and stamps `cancellationDate`, preserving all historical invoices and telemetry.
- **FR-E4**: Support contract renewal, automatically advancing `renewalDate` and generating corresponding billing records.

### Module F: Usage Telemetry & Quota Tracking
- **FR-F1**: Ingest resource usage records across `API_REQUESTS`, `STORAGE_MB`, `ACTIVE_USERS`, and `TRANSACTIONS`.
- **FR-F2**: Calculate current consumption percentage against the customer's active plan `maxUsageLimit`.
- **FR-F3**: Surface visual warning flags when usage reaches or exceeds 80% of limit, and critical breach flags when usage exceeds 100%.

### Module G: Simulated Billing & Payment System
- **FR-G1**: Generate invoice records with auto-incrementing/unique invoice numbers, due dates, paid dates, and amount.
- **FR-G2**: Provide an interactive Stripe-like payment simulator supporting `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `PAYMENT_REFUNDED`, and `PAYMENT_PENDING` events.
- **FR-G3 (Idempotency Safeguard)**: Require unique idempotency keys for billing event submissions. Re-submitting an existing key must be rejected with an HTTP 409 conflict, preventing duplicate financial transactions.
- **FR-G4**: Surface prominent disclaimers affirming simulated status.

### Module H: Advanced Financial Analytics & Reporting
- **FR-H1**: Display 12-month cash collection trajectories and normalized MRR benchmarks.
- **FR-H2**: Calculate Average Revenue Per User (ARPU) and estimated Customer Lifetime Value (LTV).
- **FR-H3**: Provide one-click CSV export utilities for Customers, Subscriptions, and Invoices.
- **FR-H4**: Enforce backend restrictions: Manager and Admin access only.

### Module I: Compliance Audit Trail
- **FR-I1**: Maintain an immutable, append-only log of significant events (`CREATE`, `UPDATE`, `DELETE`, `CANCEL`, `SIMULATE_PAYMENT`, `LOGIN`, `LOGOUT`).
- **FR-I2**: Record Actor ID, Actor Email, Action, Entity Type, Entity ID, human-readable summary, and timestamp.
- **FR-I3**: Provide read-only inspection with action and entity filters; disallow user modification of audit records.

---

## 2. Non-Functional Requirements (NFR)

| Category | Requirement Specification |
| :--- | :--- |
| **Performance** | API responses for dashboard summaries and list queries must execute in < 150ms under typical seed volume. Recharts rendering must remain smooth without client-side UI freeze. |
| **Security** | Zero plaintext password storage. All authentication credentials hashed with bcrypt. Cryptographic JWT verification using `jose`. SQL injection eliminated via Prisma query parameterization. |
| **Data Integrity** | Foreign key constraints, unique constraints, and ACID transactions (`prisma.$transaction`) across multi-step mutations (e.g. subscription creation + invoice generation). |
| **Usability & UX** | Minimal, modern design inspired by Linear/Stripe/Vercel. Responsive layout supporting mobile, tablet, and desktop viewports. Persistent light and dark mode. Toast notification feedback on all mutations. |
| **Reliability** | Zero runtime crashes on missing or null fields. Graceful error handling with structured JSON responses. Safe fallbacks for empty states and edge cases. |

---

## 3. Data Inputs & Outputs Summary

```
INPUTS:
- User Credentials (Email, Password)
- Customer Profile Payloads (Name, Email, Company, Phone, Status)
- Plan Definitions (Name, Pricing, Interval, Quota, Features)
- Subscription Creation / Modification Payloads (CustomerId, PlanId, Cycle)
- Usage Telemetry Payloads (SubscriptionId, MetricType, Amount, Notes)
- Billing Simulation Payloads (CustomerId, Amount, EventType, Method, IdempotencyKey)

OUTPUTS:
- Signed JWT Session Cookies (HTTP-only)
- Real-Time Calculated Financial Metrics (MRR, ARR, Churn %, LTV, ARPU)
- JSON Time-Series Graph Data for Recharts
- Formatted CSV Data Streams for Export
- Paginated Entity Collections with Metadata (total, page, limit, totalPages)
- Structured HTTP Status Codes (200, 201, 400, 401, 403, 404, 409, 500)
```

---

## 4. Edge Cases & Handling Strategy

1. **Simultaneous Submissions / Duplicate Billing**:
   - *Scenario*: User rapidly clicks "Simulate Payment" twice or client retries network call.
   - *Handling*: Database unique index on `idempotencyKey` rejects the second request with HTTP 409 and returns the existing event without re-billing.
2. **Deletion of Plan with Active Subscribers**:
   - *Scenario*: Administrator attempts to delete a plan currently used by active customers.
   - *Handling*: Plan deletion handler verifies `_count.subscriptions > 0`. If active subscriptions exist, deletion is blocked with a descriptive error prompting reassignment.
3. **Non-Destructive Subscription Cancellation**:
   - *Scenario*: Customer churns or cancels.
   - *Handling*: Record is never hard-deleted; status is updated to `CANCELLED`, `cancellationDate` is stamped, allowing historical revenue and cohort analytics to remain 100% accurate.
4. **Usage Limit Breaches (>100%)**:
   - *Scenario*: Customer consumes 105,000 requests on a 100,000-request tier.
   - *Handling*: Telemetry is accepted, but an automated `EXCEEDED_LIMIT` alert flag is attached, and the frontend highlights the quota bar in red.
5. **Support Agent Role Infiltration**:
   - *Scenario*: Support agent manually sends GET request to `/api/analytics/revenue` or `/api/dashboard/summary`.
   - *Handling*: API middleware intercepts request; sensitive financial numbers are either masked or rejected with HTTP 403 Forbidden.

