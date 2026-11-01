# Document 05: REST API Reference & Integration Guide

**Base URL**: `http://localhost:3000/api`  
**Authentication**: Session Cookie (`subscriptiq_session`) or Bearer Token (`Authorization: Bearer <JWT>`)  
**Format**: `application/json`  

---

## 1. Authentication Endpoints

### 1.1 `POST /api/auth/login`
Authenticate user credentials and receive a signed HTTP-only JWT cookie.

**Request Body**:
```json
{
  "email": "admin@subscriptiq.com",
  "password": "Admin123!"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "e2c36412-f076-4d14-8f23-86b2faee4490",
    "email": "admin@subscriptiq.com",
    "name": "Alexandra Vance",
    "role": "ADMIN"
  }
}
```

**Error Response (401 Unauthorized)**:
```json
{
  "error": "Invalid email or password credentials."
}
```

---

### 1.2 `POST /api/auth/logout`
Terminates the active session and clears the session cookie.

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.3 `GET /api/auth/me`
Retrieves identity and role information for the currently active session.

**Success Response (200 OK)**:
```json
{
  "authenticated": true,
  "user": {
    "id": "e2c36412-f076-4d14-8f23-86b2faee4490",
    "email": "admin@subscriptiq.com",
    "name": "Alexandra Vance",
    "role": "ADMIN"
  }
}
```

---

## 2. Dashboard Endpoints

### 2.1 `GET /api/dashboard/summary`
**Access**: ADMIN, MANAGER, SUPPORT_AGENT  
**Query Parameters**: `period=7d | 30d | 90d | 12m` (Default: `30d`)

**Success Response (200 OK)**:
```json
{
  "metrics": {
    "totalRevenue": 48250.0,
    "periodRevenue": 14200.0,
    "mrr": 8450.0,
    "arr": 101400.0,
    "totalCustomers": 35,
    "newCustomersInPeriod": 8,
    "activeSubscriptions": 26,
    "churnRate": 5.4,
    "failedPaymentsCount": 3,
    "failedPaymentsAmount": 447.0,
    "paymentSuccessRate": 96.2,
    "estimatedLtv": 6500,
    "arpu": 325
  },
  "recentInvoices": [...],
  "role": "ADMIN",
  "period": "30d"
}
```
*Note*: For `SUPPORT_AGENT` role, sensitive financial metrics (`totalRevenue`, `periodRevenue`, `mrr`, `arr`, `failedPaymentsAmount`, `estimatedLtv`, `arpu`) return `null`.

---

### 2.2 `GET /api/dashboard/revenue`
**Access**: ADMIN, MANAGER  
**Success Response (200 OK)**:
```json
{
  "revenueTimeline": [
    { "month": "Nov 25", "revenue": 3490, "successful": 18, "failed": 1 },
    { "month": "Dec 25", "revenue": 4120, "successful": 21, "failed": 2 }
  ],
  "planRevenueBreakdown": [
    { "planName": "Starter", "activeSubCount": 6, "monthlyRevenue": 294 },
    { "planName": "Growth", "activeSubCount": 10, "monthlyRevenue": 1490 }
  ]
}
```

---

## 3. Subscription Plans Endpoints

### 3.1 `GET /api/plans`
**Access**: All authenticated roles  
**Query Parameters**: `status=ALL|ACTIVE|ARCHIVED`, `search=<string>`

**Success Response (200 OK)**:
```json
{
  "plans": [
    {
      "id": "c018db40-e26e-419b-b9f1-754637d45f8a",
      "name": "Growth",
      "description": "For growing businesses scaling customer operations rapidly.",
      "monthlyPrice": 149.0,
      "annualPrice": 1490.0,
      "billingInterval": "MONTHLY",
      "featuresList": ["Up to 25 team seats", "50,000 monthly API calls"],
      "maxUsageLimit": 50000,
      "status": "ACTIVE",
      "activeSubscriptionCount": 10
    }
  ]
}
```

---

### 3.2 `POST /api/plans`
**Access**: ADMIN only  
**Request Body**:
```json
{
  "name": "Scale Pro",
  "description": "High-volume infrastructure tier",
  "monthlyPrice": 499.0,
  "annualPrice": 4990.0,
  "billingInterval": "MONTHLY",
  "features": ["Unlimited seats", "500k API calls", "Dedicated CSM"],
  "maxUsageLimit": 500000,
  "status": "ACTIVE"
}
```

**Success Response (201 Created)**:
```json
{
  "success": true,
  "plan": { "id": "...", "name": "Scale Pro", "monthlyPrice": 499.0 }
}
```

---

### 3.3 `DELETE /api/plans/:id`
**Access**: ADMIN only  
**Constraint**: If active subscriptions exist, returns HTTP 409 Conflict.

**Conflict Response (409 Conflict)**:
```json
{
  "error": "Cannot delete plan 'Growth'. It is currently associated with 10 customer subscriptions. Deactivate or reassign them first."
}
```

---

## 4. Customer Endpoints

### 4.1 `GET /api/customers`
**Access**: All authenticated roles  
**Query Parameters**: `search=<string>`, `status=ALL|ACTIVE|INACTIVE|CHURNED`, `page=1`, `limit=10`

**Success Response (200 OK)**:
```json
{
  "customers": [
    {
      "id": "78ad4e56-11b3-469b-90f1-0987654321ab",
      "fullName": "Sarah Jenkins",
      "email": "sarah.j@acmelabs.io",
      "companyName": "Acme Labs",
      "contactNumber": "+1-555-0101",
      "status": "ACTIVE",
      "activeSubscription": {
        "id": "...",
        "planName": "Growth",
        "amount": 149.0,
        "billingCycle": "MONTHLY",
        "renewalDate": "2026-12-15T00:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "total": 35,
    "page": 1,
    "limit": 10,
    "totalPages": 4
  }
}
```

---

### 4.2 `POST /api/customers`
**Access**: ADMIN, MANAGER  
**Request Body**:
```json
{
  "fullName": "Marcus Brody",
  "email": "m.brody@apexflow.org",
  "companyName": "ApexFlow Technologies",
  "contactNumber": "+1-555-0188",
  "status": "ACTIVE"
}
```

---

## 5. Subscription Endpoints

### 5.1 `POST /api/subscriptions`
**Access**: ADMIN, MANAGER  
**Request Body**:
```json
{
  "customerId": "78ad4e56-11b3-469b-90f1-0987654321ab",
  "planId": "c018db40-e26e-419b-b9f1-754637d45f8a",
  "billingCycle": "MONTHLY",
  "status": "ACTIVE"
}
```

**Success Response (201 Created)**: Automatically creates `Subscription`, initial `Invoice`, and initial `BillingEvent` inside an ACID transaction.

---

### 5.2 `POST /api/subscriptions/:id/cancel`
**Access**: ADMIN, MANAGER  
**Effect**: Non-destructive cancellation. Updates `status` to `"CANCELLED"` and stamps `cancellationDate`.

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "subscription": {
    "id": "...",
    "status": "CANCELLED",
    "cancellationDate": "2026-11-01T13:30:00.000Z"
  }
}
```

---

## 6. Simulated Billing & Payments Endpoints

### 6.1 `POST /api/billing/events`
**Access**: ADMIN only  
**Request Body**:
```json
{
  "customerId": "78ad4e56-11b3-469b-90f1-0987654321ab",
  "invoiceId": "f9a2c3d4-1111-2222-3333-444455556666",
  "eventType": "PAYMENT_SUCCESS",
  "amount": 149.0,
  "currency": "USD",
  "paymentMethod": "pm_card_visa",
  "idempotencyKey": "evt_sim_manual_9823471"
}
```

**Idempotency Duplicate Rejection (409 Conflict)**:
```json
{
  "error": "Duplicate billing event detected. An event with this idempotency key has already been processed.",
  "event": { "id": "...", "idempotencyKey": "evt_sim_manual_9823471" },
  "isDuplicate": true
}
```

---

## 7. Compliance Audit Logs Endpoint

### 7.1 `GET /api/audit-logs`
**Access**: ADMIN, MANAGER only (Support Agent receives 403 Forbidden)  
**Query Parameters**: `entityType=ALL|PLAN|CUSTOMER|SUBSCRIPTION|BILLING|USER`, `action=ALL|CREATE|UPDATE|CANCEL|DELETE|SIMULATE_PAYMENT`

**Success Response (200 OK)**:
```json
{
  "logs": [
    {
      "id": "01b2c3d4-...",
      "userEmail": "admin@subscriptiq.com",
      "action": "SIMULATE_PAYMENT",
      "entityType": "BILLING",
      "entityId": "evt_sim_manual_9823471",
      "changeSummary": "Simulated PAYMENT_SUCCESS of $149 for Acme Labs",
      "createdAt": "2026-11-01T13:30:00.000Z",
      "user": { "name": "Alexandra Vance", "role": "ADMIN" }
    }
  ],
  "pagination": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}
```

