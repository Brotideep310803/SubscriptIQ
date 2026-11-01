const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting SubscriptIQ database seeding...");

  // Clear existing records in reverse dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.billingEvent.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.usageRecord.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.subscriptionPlan.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Cleaned existing data.");

  // 1. Create Demo Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("Admin123!", salt);
  const managerPasswordHash = await bcrypt.hash("Manager123!", salt);
  const supportPasswordHash = await bcrypt.hash("Support123!", salt);

  const admin = await prisma.user.create({
    data: {
      email: "admin@subscriptiq.com",
      name: "Alexandra Vance",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@subscriptiq.com",
      name: "Marcus Reynolds",
      passwordHash: managerPasswordHash,
      role: "MANAGER",
    },
  });

  const support = await prisma.user.create({
    data: {
      email: "support@subscriptiq.com",
      name: "Elena Rostova",
      passwordHash: supportPasswordHash,
      role: "SUPPORT_AGENT",
    },
  });

  console.log("Created 3 demo users (ADMIN, MANAGER, SUPPORT_AGENT).");

  // 2. Create Subscription Plans
  const plansData = [
    {
      name: "Starter",
      description: "Ideal for early-stage startups and small teams testing the waters.",
      monthlyPrice: 49.0,
      annualPrice: 490.0,
      billingInterval: "MONTHLY",
      features: JSON.stringify([
        "Up to 5 team seats",
        "10,000 monthly API calls",
        "Community support",
        "Standard analytics dashboard",
        "48-hour SLA",
      ]),
      maxUsageLimit: 10000,
      status: "ACTIVE",
    },
    {
      name: "Growth",
      description: "For growing businesses scaling customer operations rapidly.",
      monthlyPrice: 149.0,
      annualPrice: 1490.0,
      billingInterval: "MONTHLY",
      features: JSON.stringify([
        "Up to 25 team seats",
        "50,000 monthly API calls",
        "Priority email support",
        "Advanced revenue forecasting",
        "Custom webhooks",
        "12-hour SLA",
      ]),
      maxUsageLimit: 50000,
      status: "ACTIVE",
    },
    {
      name: "Scale",
      description: "Engineered for high-volume SaaS platforms demanding performance.",
      monthlyPrice: 399.0,
      annualPrice: 3990.0,
      billingInterval: "MONTHLY",
      features: JSON.stringify([
        "Unlimited team seats",
        "200,000 monthly API calls",
        "24/7 priority phone & chat",
        "Full audit trail export",
        "Dedicated customer success manager",
        "1-hour SLA",
      ]),
      maxUsageLimit: 200000,
      status: "ACTIVE",
    },
    {
      name: "Enterprise",
      description: "Custom enterprise deployments with maximum security and custom SLA.",
      monthlyPrice: 999.0,
      annualPrice: 9990.0,
      billingInterval: "ANNUAL",
      features: JSON.stringify([
        "Custom contract & billing",
        "1,000,000+ monthly API calls",
        "SOC2 compliance reports",
        "Custom SSO & SAML integration",
        "Isolated data tenancy",
        "Dedicated infrastructure engineer",
      ]),
      maxUsageLimit: 1000000,
      status: "ACTIVE",
    },
    {
      name: "Developer API",
      description: "Pay-as-you-go developer package with headless API access.",
      monthlyPrice: 199.0,
      annualPrice: 1990.0,
      billingInterval: "MONTHLY",
      features: JSON.stringify([
        "Full REST & GraphQL endpoints",
        "100,000 monthly API calls",
        "Real-time event webhooks",
        "Sandbox testing environments",
        "Developer Discord community access",
      ]),
      maxUsageLimit: 100000,
      status: "ACTIVE",
    },
    {
      name: "Legacy Beta",
      description: "Archived early adopter plan maintained for grandfathered customers.",
      monthlyPrice: 29.0,
      annualPrice: 290.0,
      billingInterval: "MONTHLY",
      features: JSON.stringify(["Basic dashboard", "5,000 API calls"]),
      maxUsageLimit: 5000,
      status: "ARCHIVED",
    },
  ];

  const createdPlans = [];
  for (const p of plansData) {
    const plan = await prisma.subscriptionPlan.create({ data: p });
    createdPlans.push(plan);
  }
  console.log(`Created ${createdPlans.length} subscription plans.`);

  // 3. Create 35 Customers
  const customerSeeds = [
    { fullName: "Sarah Jenkins", email: "sarah.j@acmelabs.io", companyName: "Acme Labs", contactNumber: "+1-555-0101", status: "ACTIVE" },
    { fullName: "David Chen", email: "dchen@nexusflow.tech", companyName: "NexusFlow", contactNumber: "+1-555-0102", status: "ACTIVE" },
    { fullName: "Amara Okafor", email: "aokafor@orbitscale.co", companyName: "OrbitScale", contactNumber: "+44-20-7946-0911", status: "ACTIVE" },
    { fullName: "Liam O'Connor", email: "liam@cloudpeak.ie", companyName: "CloudPeak Ireland", contactNumber: "+353-1-496-0123", status: "ACTIVE" },
    { fullName: "Sofia Rodriguez", email: "sofia@luminarai.com", companyName: "Luminar AI", contactNumber: "+1-555-0105", status: "ACTIVE" },
    { fullName: "Hiroshi Tanaka", email: "htanaka@synapsecore.jp", companyName: "Synapse Core", contactNumber: "+81-3-5555-0106", status: "ACTIVE" },
    { fullName: "Emma Watson", email: "emma@hypermetrics.io", companyName: "HyperMetrics", contactNumber: "+1-555-0107", status: "ACTIVE" },
    { fullName: "Mateo Silva", email: "mateo@verticecloud.br", companyName: "Vertice Cloud", contactNumber: "+55-11-9555-0108", status: "ACTIVE" },
    { fullName: "Chloe Dubois", email: "cdubois@aerovox.fr", companyName: "Aerovox Systems", contactNumber: "+33-1-5555-0109", status: "ACTIVE" },
    { fullName: "Lukas Weber", email: "lukas.w@quantumbit.de", companyName: "QuantumBit GmbH", contactNumber: "+49-30-5555-0110", status: "ACTIVE" },
    { fullName: "Priya Sharma", email: "priya@zenithstack.in", companyName: "ZenithStack India", contactNumber: "+91-98765-43210", status: "ACTIVE" },
    { fullName: "Carlos Mendes", email: "cmendes@solarpulse.pt", companyName: "SolarPulse", contactNumber: "+351-21-555-0112", status: "ACTIVE" },
    { fullName: "Ananya Patel", email: "ananya@dataloom.io", companyName: "DataLoom Analytics", contactNumber: "+1-555-0113", status: "ACTIVE" },
    { fullName: "Benjamin King", email: "ben@ironcladsecurity.com", companyName: "IronClad Security", contactNumber: "+1-555-0114", status: "ACTIVE" },
    { fullName: "Fatima Al-Mansoor", email: "fatima@crescentpay.ae", companyName: "CrescentPay", contactNumber: "+971-4-555-0115", status: "ACTIVE" },
    { fullName: "Noah van Dijk", email: "noah@tulipfintech.nl", companyName: "Tulip FinTech", contactNumber: "+31-20-555-0116", status: "ACTIVE" },
    { fullName: "Astrid Lindgren", email: "astrid@nordiccloud.se", companyName: "NordicCloud AB", contactNumber: "+46-8-555-0117", status: "ACTIVE" },
    { fullName: "Ethan Hunt", email: "ethan@missionvector.com", companyName: "MissionVector", contactNumber: "+1-555-0118", status: "ACTIVE" },
    { fullName: "Zoe Kravitz", email: "zoe@prismadesign.design", companyName: "Prisma Studio", contactNumber: "+1-555-0119", status: "ACTIVE" },
    { fullName: "Tariq Mansour", email: "tariq@sandstormai.com", companyName: "Sandstorm AI", contactNumber: "+966-11-555-0120", status: "ACTIVE" },
    { fullName: "Olga Ivanova", email: "olga@vortexdynamics.ch", companyName: "Vortex Dynamics", contactNumber: "+41-22-555-0121", status: "ACTIVE" },
    { fullName: "Julian Rossi", email: "julian@velocitymedia.it", companyName: "Velocity Media", contactNumber: "+39-06-555-0122", status: "ACTIVE" },
    { fullName: "Grace Hopper", email: "grace@nanobyte.org", companyName: "NanoByte", contactNumber: "+1-555-0123", status: "ACTIVE" },
    { fullName: "Kavita Rao", email: "kavita@ciphergrid.io", companyName: "CipherGrid", contactNumber: "+1-555-0124", status: "ACTIVE" },
    { fullName: "Marcus Aurelius", email: "marcus@stoiclogic.io", companyName: "StoicLogic", contactNumber: "+1-555-0125", status: "ACTIVE" },
    { fullName: "Hannah Scott", email: "hannah@brightwave.co", companyName: "BrightWave Commerce", contactNumber: "+1-555-0126", status: "ACTIVE" },
    { fullName: "Kenji Sato", email: "kenji@miraisoft.jp", companyName: "Mirai Software", contactNumber: "+81-6-555-0127", status: "INACTIVE" },
    { fullName: "Rachel Green", email: "rachel@bloomretail.com", companyName: "Bloom Retail", contactNumber: "+1-555-0128", status: "INACTIVE" },
    { fullName: "Sean Murphy", email: "sean@cloverlogic.ie", companyName: "Clover Logic", contactNumber: "+353-21-555-0129", status: "INACTIVE" },
    { fullName: "Dmitri Volkov", email: "dmitri@auroraedge.io", companyName: "AuroraEdge", contactNumber: "+1-555-0130", status: "CHURNED" },
    { fullName: "Jessica Pearson", email: "jessica@pearsonhardman.legal", companyName: "Pearson Legal Tech", contactNumber: "+1-555-0131", status: "CHURNED" },
    { fullName: "Oliver Queen", email: "oliver@arrowlogistics.com", companyName: "Arrow Logistics", contactNumber: "+1-555-0132", status: "CHURNED" },
    { fullName: "Mia Khalifa", email: "mia@apexstream.tv", companyName: "Apex Stream", contactNumber: "+1-555-0133", status: "ACTIVE" },
    { fullName: "Lucas Graham", email: "lucas@beaconhr.io", companyName: "Beacon HR", contactNumber: "+1-555-0134", status: "ACTIVE" },
    { fullName: "Maya Angelou", email: "maya@versepress.org", companyName: "Verse Press", contactNumber: "+1-555-0135", status: "ACTIVE" },
  ];

  const createdCustomers = [];
  for (const c of customerSeeds) {
    const cust = await prisma.customer.create({ data: c });
    createdCustomers.push(cust);
  }
  console.log(`Created ${createdCustomers.length} customers.`);

  // 4. Create Subscriptions
  // Realistic date generator over the last 12 months
  const now = new Date();
  const getPastDate = (monthsAgo, day = 15) => {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
    return d;
  };

  const getFutureDate = (monthsAhead, day = 15) => {
    const d = new Date(now.getFullYear(), now.getMonth() + monthsAhead, day);
    return d;
  };

  const createdSubscriptions = [];
  const activePlans = createdPlans.filter((p) => p.status === "ACTIVE");

  // We will assign subscriptions to customers:
  // 26 Active, 4 Trialing, 5 Churned/Cancelled, 3 Past Due, 2 Expired
  for (let i = 0; i < createdCustomers.length; i++) {
    const cust = createdCustomers[i];
    const plan = activePlans[i % activePlans.length];

    let status = "ACTIVE";
    let startDate = getPastDate(Math.floor(Math.random() * 10) + 1, (i % 28) + 1);
    let renewalDate = getFutureDate(1, (i % 28) + 1);
    let cancellationDate = null;
    let billingCycle = i % 4 === 0 ? "ANNUAL" : "MONTHLY";
    let amount = billingCycle === "ANNUAL" ? plan.annualPrice : plan.monthlyPrice;

    if (cust.status === "CHURNED") {
      status = "CANCELLED";
      startDate = getPastDate(8, 10);
      cancellationDate = getPastDate(2, 14);
      renewalDate = getPastDate(2, 14);
    } else if (cust.status === "INACTIVE") {
      if (i % 2 === 0) {
        status = "EXPIRED";
        startDate = getPastDate(11, 5);
        renewalDate = getPastDate(1, 5);
      } else {
        status = "PAST_DUE";
        startDate = getPastDate(4, 12);
        renewalDate = getPastDate(0, 12); // due recently
      }
    } else if (i === 18 || i === 22) {
      status = "TRIALING";
      startDate = getPastDate(0, 25);
      renewalDate = getFutureDate(0, 10);
      amount = 0.0;
    }

    const sub = await prisma.subscription.create({
      data: {
        customerId: cust.id,
        planId: plan.id,
        startDate,
        renewalDate,
        billingCycle,
        status,
        amount,
        cancellationDate,
      },
    });
    createdSubscriptions.push({ sub, plan, cust });
  }

  // Add 10 additional historical/upgraded subscriptions for realistic subscription history
  for (let j = 0; j < 10; j++) {
    const cust = createdCustomers[j];
    const plan = activePlans[(j + 1) % activePlans.length];
    const sub = await prisma.subscription.create({
      data: {
        customerId: cust.id,
        planId: plan.id,
        startDate: getPastDate(12, 1),
        renewalDate: getPastDate(6, 1),
        billingCycle: "MONTHLY",
        status: "CANCELLED", // Historical prior plan
        amount: plan.monthlyPrice,
        cancellationDate: getPastDate(6, 1),
      },
    });
    createdSubscriptions.push({ sub, plan, cust });
  }

  console.log(`Created ${createdSubscriptions.length} subscriptions (active, trialing, cancelled, past_due, expired).`);

  // 5. Create Usage Records (at least 150 records)
  // Metrics: API_REQUESTS, STORAGE_MB, ACTIVE_USERS, TRANSACTIONS
  const metricTypes = ["API_REQUESTS", "STORAGE_MB", "ACTIVE_USERS", "TRANSACTIONS"];
  let usageCount = 0;

  for (const { sub, plan, cust } of createdSubscriptions) {
    if (sub.status === "EXPIRED") continue;

    // Generate 3-5 usage records across time for each active/trialing/past_due subscription
    const recordsPerSub = sub.status === "ACTIVE" ? 4 : 2;
    for (let r = 0; r < recordsPerSub; r++) {
      const metric = metricTypes[r % metricTypes.length];
      let usageAmount = 0;

      // Realistic usage calculation based on plan max usage
      const limit = plan.maxUsageLimit;
      if (metric === "API_REQUESTS") {
        // Some users high usage (>85% limit), some normal (30-60%), some over limit (>100%)
        if (cust.companyName === "Acme Labs" || cust.companyName === "NexusFlow") {
          usageAmount = Math.floor(limit * 1.05); // Limit exceeded!
        } else if (cust.companyName === "OrbitScale" || cust.companyName === "Luminar AI") {
          usageAmount = Math.floor(limit * 0.88); // Warning >80%!
        } else {
          usageAmount = Math.floor(limit * (0.2 + (r * 0.15)));
        }
      } else if (metric === "STORAGE_MB") {
        usageAmount = Math.floor(Math.random() * 45000) + 5000;
      } else if (metric === "ACTIVE_USERS") {
        usageAmount = Math.floor(Math.random() * 40) + 3;
      } else {
        usageAmount = Math.floor(Math.random() * 8000) + 500;
      }

      await prisma.usageRecord.create({
        data: {
          subscriptionId: sub.id,
          customerId: cust.id,
          metricType: metric,
          amount: Math.max(10, usageAmount),
          recordedAt: getPastDate(r, (r * 5) + 1),
          notes: usageAmount > limit ? "ALERT: Usage threshold exceeded plan allocation" : null,
        },
      });
      usageCount++;
    }
  }

  console.log(`Created ${usageCount} usage records with limit warnings.`);

  // 6. Create Invoices and Billing Events (at least 60 events)
  let invoiceCounter = 1001;
  let billingEventCount = 0;

  for (let m = 11; m >= 0; m--) {
    // For each of the last 12 months, generate monthly invoices and billing events
    for (const { sub, plan, cust } of createdSubscriptions) {
      if (sub.status === "TRIALING") continue;
      // If subscription was created after this month, skip
      if (new Date(sub.startDate) > getPastDate(m, 28)) continue;
      // If subscription was cancelled before this month, skip
      if (sub.cancellationDate && new Date(sub.cancellationDate) < getPastDate(m, 1)) continue;

      // Only generate annual payments once per year or monthly payments every month
      if (sub.billingCycle === "ANNUAL" && m % 12 !== 0) continue;

      const invoiceNum = `INV-${invoiceCounter++}`;
      const invDate = getPastDate(m, 15);
      const isPastDueCust = cust.status === "INACTIVE" && m === 0;
      const isFailedSample = (invoiceCounter % 17 === 0) || isPastDueCust;
      const isRefundSample = !isFailedSample && invoiceCounter % 29 === 0;

      let invStatus = "PAID";
      let paidAt = new Date(invDate.getTime() + 1000 * 60 * 60 * 2); // 2 hours later
      if (isFailedSample) {
        invStatus = "UNPAID";
        paidAt = null;
      } else if (isRefundSample) {
        invStatus = "REFUNDED";
      }

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: invoiceNum,
          customerId: cust.id,
          subscriptionId: sub.id,
          amount: sub.amount,
          status: invStatus,
          dueDate: new Date(invDate.getTime() + 1000 * 60 * 60 * 24 * 7), // 7 days later
          paidAt,
          createdAt: invDate,
        },
      });

      // Corresponding Billing Event
      let eventType = "PAYMENT_SUCCESS";
      let status = "SUCCESS";
      let failureReason = null;

      if (isFailedSample) {
        eventType = "PAYMENT_FAILED";
        status = "FAILED";
        failureReason = "card_declined: insufficient_funds";
      } else if (isRefundSample) {
        eventType = "PAYMENT_REFUNDED";
        status = "REFUNDED";
      }

      await prisma.billingEvent.create({
        data: {
          invoiceId: invoice.id,
          customerId: cust.id,
          eventType,
          amount: sub.amount,
          currency: "USD",
          status,
          paymentMethod: isFailedSample ? "pm_card_chargeCustomerFail" : "pm_card_visa",
          failureReason,
          idempotencyKey: `evt_${invoiceNum}_${m}_${status.toLowerCase()}`,
          createdAt: invDate,
        },
      });
      billingEventCount++;

      // If refunded, also create initial success event then refund event
      if (isRefundSample) {
        await prisma.billingEvent.create({
          data: {
            invoiceId: invoice.id,
            customerId: cust.id,
            eventType: "PAYMENT_SUCCESS",
            amount: sub.amount,
            currency: "USD",
            status: "SUCCESS",
            paymentMethod: "pm_card_visa",
            idempotencyKey: `evt_${invoiceNum}_${m}_init_success`,
            createdAt: new Date(invDate.getTime() - 1000 * 60 * 60 * 24),
          },
        });
        billingEventCount++;
      }
    }
  }

  console.log(`Created ${invoiceCounter - 1001} invoices and ${billingEventCount} billing events.`);

  // 7. Create Audit Logs
  const auditEntries = [
    {
      userId: admin.id,
      userEmail: admin.email,
      action: "CREATE",
      entityType: "PLAN",
      entityId: createdPlans[0].id,
      changeSummary: "Created new Starter subscription tier with 10k quota",
      createdAt: getPastDate(11, 2),
    },
    {
      userId: admin.id,
      userEmail: admin.email,
      action: "CREATE",
      entityType: "PLAN",
      entityId: createdPlans[3].id,
      changeSummary: "Created Enterprise plan with custom SLA and 1M quota",
      createdAt: getPastDate(10, 5),
    },
    {
      userId: manager.id,
      userEmail: manager.email,
      action: "UPDATE",
      entityType: "CUSTOMER",
      entityId: createdCustomers[0].id,
      changeSummary: "Updated contact info for Acme Labs corporate account",
      createdAt: getPastDate(5, 12),
    },
    {
      userId: admin.id,
      userEmail: admin.email,
      action: "CANCEL",
      entityType: "SUBSCRIPTION",
      entityId: createdSubscriptions[29].sub.id,
      changeSummary: "Cancelled subscription upon customer churn request",
      createdAt: getPastDate(2, 14),
    },
    {
      userId: support.id,
      userEmail: support.email,
      action: "UPDATE",
      entityType: "CUSTOMER",
      entityId: createdCustomers[1].id,
      changeSummary: "Support agent verified billing contact phone number",
      createdAt: getPastDate(1, 20),
    },
    {
      userId: admin.id,
      userEmail: admin.email,
      action: "SIMULATE_PAYMENT",
      entityType: "BILLING",
      entityId: "evt_sim_manual_test_01",
      changeSummary: "Simulated test retry for failed invoice",
      createdAt: getPastDate(0, 2),
    },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }

  console.log(`Created ${auditEntries.length} initial audit logs.`);
  console.log("SubscriptIQ database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

