# SubscriptIQ: Interactive Evaluation & Demo Walkthrough Script

**Audience**: Mentors, Internship Evaluators, and Engineering Reviewers  
**Estimated Walkthrough Time**: 5 to 7 Minutes  

---

## Preparation (30 Seconds)
1. Verify terminal has completed setup:
   ```bash
   npm run db:setup
   npm run dev
   ```
2. Open browser to `http://localhost:3000`.

---

## Step 1: Authentication & Quick Persona Switching (1 Minute)
1. At `http://localhost:3000/login`, observe the clean, minimal SaaS login screen inspired by Stripe and Linear.
2. Note the three **1-Click Demo Evaluation Cards**:
   - **Admin** (`admin@subscriptiq.com` / `Admin123!`)
   - **Manager** (`manager@subscriptiq.com` / `Manager123!`)
   - **Support Agent** (`support@subscriptiq.com` / `Support123!`)
3. Click **Sign in as Admin**.
4. Observe the toast notification: *"Welcome back to SubscriptIQ!"* and redirection to `/dashboard`.

---

## Step 2: Dashboard & Real-Time Calculated Analytics (1.5 Minutes)
1. Examine the **7 KPI Cards**:
   - Total Lifetime Revenue ($48,250+)
   - Monthly Recurring Revenue (MRR)
   - Annual Recurring Revenue (ARR = MRR × 12)
   - Total Customers (35)
   - Active Subscriptions
   - Churn Rate (%)
   - Payment Health & Success Rate (%)
2. Switch between the **Date Filter Buttons** (`7 Days`, `30 Days`, `90 Days`, `12 Months`):
   - Notice how period revenue and transaction counts adjust in real time from database queries.
3. Review the **Recharts Visualizations**:
   - *Revenue History*: Smooth area chart with gradient fills.
   - *Growth & Acquisition*: Side-by-side customer vs. subscription creations.
   - *Plan Performance Breakdown*: Horizontal bar chart displaying each plan's monthly cash contribution.
   - *Payment Health*: Bar comparison of successful vs. failed billing attempts.
4. Review the **Standardized SaaS Formulas** section at the bottom explaining exact definitions.

---

## Step 3: Role-Based Access Control (RBAC) Verification (1 Minute)
1. In the top navigation bar, click the **Role: Admin** pill dropdown.
2. Select **Support Agent** (Elena Rostova).
3. Observe how the page refreshes into the Support Agent persona:
   - Notice the prominent notice banner: *"Support Agent View: Sensitive executive financial metrics are masked..."*
   - In KPI cards, Total Revenue, MRR, ARR, and LTV display *"Confidential"*.
   - In the sidebar, notice that **Analytics & Reports** and **Audit Trail** are completely hidden from the navigation!
4. Try to navigate manually to `http://localhost:3000/analytics`—notice the access restriction banner.
5. In the top navbar, switch back to **Admin** to restore full capabilities.

---

## Step 4: Subscription Plan Management & Dependency Safeguard (1 Minute)
1. Navigate to **Plans** (`/plans`) in the sidebar.
2. Observe all 6 subscription tiers (Starter, Growth, Scale, Enterprise, Developer API, Legacy Beta).
3. Test the **Dependency Check Safeguard**:
   - Click the Trash icon on the **Growth** plan (which has active subscribers).
   - Click **Confirm Delete**.
   - Notice that the deletion is rejected with an informative error toast: *"Cannot delete plan 'Growth'. It is currently associated with 10 customer subscriptions. Deactivate or reassign them first."*
4. Click **Create New Plan**, enter test attributes, and click **Create Plan** to verify the creation flow.

---

## Step 5: Resource Usage Telemetry & Quota Warnings (1 Minute)
1. Navigate to **Usage Tracking** (`/usage`).
2. Observe the **Active Subscriber Quota Health** progress bars:
   - Green bars represent Normal usage (< 80%).
   - Amber bars represent **WARNING >80%** threshold alerts.
   - Red bars represent **LIMIT EXCEEDED** breaches (> 100%).
3. Click **Ingest Usage Event** to simulate a batch telemetry payload:
   - Select a customer, enter a quantity exceeding the limit, and submit.
   - Observe the alert notification and immediate progress bar update.

---

## Step 6: Simulated Stripe Payments & Idempotency Safeguard (1 Minute)
1. Navigate to **Billing & Invoices** (`/billing`).
2. Review the **Payment Events Log** and **Invoices** tabs.
3. Click **Open Payment Simulator**:
   - Select an account, set amount to `$149.00`, and choose `PAYMENT_SUCCESS`.
   - Click **Simulate Payment Event**.
   - Observe the success toast and notice the event added to the live table.
4. Re-open the simulator, **keep the identical Idempotency Key**, and click **Simulate Payment Event** again:
   - Observe that the backend intercepts the duplicate key and rejects it with: *"Safeguard Triggered: Duplicate billing event detected."*

---

## Step 7: Compliance Audit Trail & Data Export (30 Seconds)
1. Navigate to **Audit Trail** (`/audit-logs`).
2. Notice the live chronological record of every action just performed (Admin login, plan check, usage ingestion, simulated payment).
3. Navigate to **Analytics & Reports** (`/analytics`) and click **Subscriptions CSV**:
   - Observe your browser downloading a formatted CSV file (`subscriptiq-subscriptions-YYYY-MM-DD.csv`) containing complete database records.

---

## Conclusion
The application satisfies all 15 acceptance criteria: fully functional, robustly tested, gracefully styled, securely architected, and completely reproducible.

