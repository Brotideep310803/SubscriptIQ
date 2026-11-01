# Document 03: System Architecture Specification

**Project**: SubscriptIQ  
**Architecture Style**: Monolithic Next.js 14 App Router Full-Stack Application  
**Runtime**: Node.js v20+ with Edge-Compatible JWT Authentication  
**Data Tier**: PostgreSQL / SQLite with Prisma ORM  

---

## 1. High-Level Architecture Overview

SubscriptIQ leverages the unified Next.js 14 App Router paradigm. Server-side Route Handlers (`src/app/api/...`) function as a decoupled REST API backend, while React Server & Client components construct a responsive, theme-aware frontend dashboard.

```mermaid
graph TB
    subgraph ClientLayer ["Client Presentation Tier (Browser)"]
        UI["React 18 / Next.js Client Components\n- Dashboard, Plans, Customers\n- Subscriptions, Usage, Billing\n- Analytics, Audit Logs"]
        Theme["Theme Context\n(Light / Dark Mode)"]
        AuthCtx["Auth Context & State\n(Role Awareness)"]
        Charts["Recharts Visualizations"]
    end

    subgraph ApiGateway ["Server Boundary & Middleware (Next.js)"]
        Router["Next.js Route Handlers (/api/*)"]
        AuthGuard["requireAuth() Middleware\n- JWT Validation (jose)\n- Role Verification (RBAC)"]
        Validator["Zod Schema Validation\n(Type-Safe Input Guard)"]
        Auditor["Audit Logger Utility\n(Immutable Event Stamp)"]
    end

    subgraph ServiceLayer ["Business & Analytics Domain Logic"]
        AnalyticsEngine["Analytics Calculation Service\n- MRR & ARR Formulas\n- Churn & Retention Model\n- LTV & ARPU Computations"]
        SubLifecycle["Subscription Lifecycle Manager\n- Upgrade / Downgrade\n- Non-Destructive Cancel\n- Contract Renewal"]
        UsageMonitor["Usage & Quota Monitoring\n- Warning Engine (>80%)\n- Limit Breach Flagging"]
        BillingSim["Stripe-like Billing Simulator\n- Idempotency Gatekeeper\n- Invoicing & Refunds"]
    end

    subgraph DataTier ["Persistence Tier (Prisma ORM)"]
        PrismaClient["Prisma Client Instance"]
        PostgreSQL[("Relational Database\nPostgreSQL (Production) / SQLite (Dev)\n- users, customers, plans\n- subscriptions, invoices\n- billing_events, audit_logs")]
    end

    UI --> Router
    Router --> AuthGuard
    AuthGuard --> Validator
    Validator --> ServiceLayer
    ServiceLayer --> Auditor
    ServiceLayer --> PrismaClient
    PrismaClient --> PostgreSQL
```

---

## 2. Component Deconstruction

### 2.1 Client Presentation Layer
- **Framework**: Next.js 14 App Router with React 18 and TypeScript.
- **Styling**: Tailwind CSS with custom CSS variables for effortless dark and light mode transitions.
- **Iconography**: Lucide React icons delivering clean visual hierarchy.
- **Charts**: Recharts rendering declarative SVG charts (Area, Bar, Composed, and Pie) with dynamic tooltips and responsive wrappers.
- **Notifications**: Custom React Toast context delivering instant feedback on async operations without bulky external libraries.

### 2.2 API & Middleware Layer
- **REST Endpoints**: Located under `src/app/api/...`, providing standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).
- **Authentication**: Stateless, cryptographically signed JSON Web Tokens (JWT) signed with HMAC-SHA256 via the high-performance `jose` library, stored in secure HTTP-only cookies.
- **Authorization (RBAC)**: Centralized `requireAuth(req, allowedRoles)` guard intercepting incoming requests, checking permissions against `ROLE_PERMISSIONS`, and returning standard 401 or 403 responses.
- **Input Validation**: Strongly typed Zod schemas (`src/lib/validations.ts`) parsing request payloads before execution, preventing malformed or malicious inputs from reaching domain services.

### 2.3 Domain & Analytics Services
- **Real-Time Calculation Engine**: Rather than maintaining stale cached aggregates, metrics like MRR, ARR, and Churn are computed dynamically from actual database records across selected date ranges.
- **Idempotency Gatekeeper**: Billing events enforce an `idempotencyKey` unique database constraint. Re-submitting the same key immediately halts execution and returns HTTP 409, preventing accidental duplicate transactions.

### 2.4 Persistence Layer
- **Prisma ORM**: Provides type-safe database queries, automated relation resolution, and clean migrations.
- **Dual-Configuration Strategy**:
  - `dev.db` (SQLite): Configured out-of-the-box for zero-configuration, socket-free local development and sandboxed test execution.
  - `schema.postgresql.prisma`: Production-grade PostgreSQL schema tailored for cloud providers like Neon, Supabase, or AWS RDS.

---

## 3. Authentication & RBAC Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (Browser)
    participant AuthAPI as /api/auth/login
    participant DB as Database (Prisma)
    participant AppAPI as /api/analytics/revenue

    User->>AuthAPI: POST { email, password }
    AuthAPI->>DB: findUnique({ email })
    DB-->>AuthAPI: User record with passwordHash & role
    AuthAPI->>AuthAPI: bcrypt.compare(password, hash)
    alt Password Invalid
        AuthAPI-->>User: 401 Unauthorized
    else Password Valid
        AuthAPI->>AuthAPI: Generate signed JWT (userId, role)
        AuthAPI->>DB: Insert AuditLog (LOGIN action)
        AuthAPI-->>User: 200 OK + Set-Cookie: subscriptiq_session
    end

    Note over User,AppAPI: Subsequent Protected Request
    User->>AppAPI: GET /api/analytics/revenue (Cookie attached)
    AppAPI->>AppAPI: verifySessionToken(cookie)
    alt Invalid or Expired Token
        AppAPI-->>User: 401 Authentication Required
    else Valid Token (e.g. Role = SUPPORT_AGENT)
        AppAPI->>AppAPI: requireAuth(req, ["ADMIN", "MANAGER"])
        AppAPI-->>User: 403 Forbidden (Role unauthorized)
    else Valid Token (Role = ADMIN or MANAGER)
        AppAPI->>DB: Execute metric aggregate queries
        DB-->>AppAPI: Calculation results
        AppAPI-->>User: 200 OK { metrics, trends }
    end
```

---

## 4. API Design Standards

SubscriptIQ enforces standardized RESTful principles across all endpoints:

1. **Consistent Envelope**: Responses provide clear, structured JSON objects.
2. **Deterministic HTTP Status Codes**:
   - `200 OK`: Successful retrieval or update.
   - `201 Created`: Entity successfully created.
   - `400 Bad Request`: Zod validation failed (includes field-level error messages).
   - `401 Unauthorized`: Missing or invalid session cookie.
   - `403 Forbidden`: Authenticated user lacks role permissions.
   - `404 Not Found`: Target entity ID does not exist.
   - `409 Conflict`: Business constraint breached (e.g. duplicate idempotency key or deleting a plan with active subscribers).
   - `500 Internal Server Error`: Unhandled database or system exception.
3. **Audit Hooks**: Mutating operations (`POST`, `PUT`, `DELETE`) automatically invoke `recordAuditLog` to persist a tamper-proof audit trail entry in the same cycle.

