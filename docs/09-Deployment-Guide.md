# Document 09: Production Deployment & Cloud Operations Guide

**Application**: SubscriptIQ SaaS Platform  
**Target Hosts**: Vercel, Railway, Render, or AWS ECS / Docker  
**Database Options**: Neon, Supabase, AWS RDS, or Render PostgreSQL  

---

## 1. Deployment Architecture

```mermaid
flowchart LR
    subgraph Users ["Client Endpoints"]
        Browser[Client Browser]
    end

    subgraph CDN ["Edge Network (Vercel / Cloudflare)"]
        Edge[Edge Caching & SSL Termination]
    end

    subgraph Compute ["Compute Tier (Vercel Serverless / Node.js Host)"]
        NextServer["Next.js 14 App Router Runtime\n- React Server Components\n- API Route Handlers (/api/*)"]
    end

    subgraph Storage ["Managed Cloud Database Tier"]
        Postgres[("PostgreSQL 15+\n(Neon / Supabase / AWS RDS)\nConnection Pooling (PgBouncer)")]
    end

    Browser --> Edge
    Edge --> NextServer
    NextServer -->|Connection String + SSL| Postgres
```

---

## 2. Environment Variables Configuration

Set these environment variables in your production host dashboard (e.g., Vercel Project Settings -> Environment Variables):

| Variable Name | Required | Example Production Value | Purpose |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql://user:password@ep-neon.us-east-2.aws.neon.tech/subscriptiq?sslmode=require` | Relational PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | `f7a93b6e82c194d0e517a2b9c8d3e4f50162738495a6b7c8d9e0f1a2b3c4d5e6` | High-entropy 64-char key for JWT signing |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `https://subscriptiq.yourdomain.com` | Base public URL of the application |
| `NODE_ENV` | **Yes** | `production` | Enables production optimizations & secure cookies |

---

## 3. Step-by-Step Deployment Instructions

### Option A: Deploy to Vercel with Neon PostgreSQL (Recommended)

1. **Provision Neon Database**:
   - Create a free project at [neon.tech](https://neon.tech).
   - Copy the connection string with pooling enabled (e.g. `postgresql://.../neondb?sslmode=require`).

2. **Configure PostgreSQL Prisma Schema**:
   - In your repository, copy or switch `prisma/schema.postgresql.prisma` to `prisma/schema.prisma` or run:
     ```bash
     npx prisma db push --schema=prisma/schema.postgresql.prisma
     ```
   - Seed the database:
     ```bash
     DATABASE_URL="<your-neon-url>" node prisma/seed.js
     ```

3. **Deploy to Vercel**:
   - Push repository to GitHub.
   - Import the project into Vercel.
   - Add the environment variables: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`.
   - Set Build Command: `prisma generate && next build`.
   - Click **Deploy**.

---

### Option B: Deploy to Railway or Render (Full Container)

1. Create a PostgreSQL service on Railway or Render.
2. Link the Next.js service to the PostgreSQL service.
3. Configure start command:
   ```bash
   npx prisma db push && node prisma/seed.js && npm run start
   ```

---

## 4. Verification & Health Check

After deployment, perform the initial verification run:
1. Navigate to `https://<your-app-url>/login`.
2. Click **Admin** (Alexandra Vance) to test authentication and role attribution.
3. Verify that MRR, ARR, and charts load with live data.
4. Navigate to **Billing & Invoices**, open the Payment Simulator, and test simulating a transaction.
5. Check **Audit Trail** to confirm the simulation is recorded.

---

## 5. Troubleshooting Common Production Issues

| Symptom | Probable Cause | Remediation |
| :--- | :--- | :--- |
| `PrismaClientInitializationError: Can't reach database server` | Incorrect `DATABASE_URL` or SSL mode disabled | Ensure `?sslmode=require` is appended to the connection string and whitelist `0.0.0.0/0` in DB provider firewall. |
| `Invalid JWT signature / 401 on reload` | Stale or missing `JWT_SECRET` | Verify `JWT_SECRET` is defined in production environment variables and is at least 32 characters. |
| `Connection pool exhausted` | Too many serverless functions without connection pooling | Enable PgBouncer or use Prisma Accelerate / Neon pooled connection string on port 6543 / pooled host. |
