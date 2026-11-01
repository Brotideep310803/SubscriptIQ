import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER", "SUPPORT_AGENT"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "30d";

  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case "7d":
      startDate.setDate(now.getDate() - 7);
      break;
    case "90d":
      startDate.setDate(now.getDate() - 90);
      break;
    case "12m":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case "30d":
    default:
      startDate.setDate(now.getDate() - 30);
      break;
  }

  // 1. Calculate Active Subscriptions & MRR / ARR
  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
    include: { plan: true },
  });

  let mrr = 0;
  for (const sub of activeSubscriptions) {
    if (sub.billingCycle === "ANNUAL") {
      mrr += sub.amount / 12;
    } else {
      mrr += sub.amount;
    }
  }
  const arr = mrr * 12;

  // 2. Total Customers
  const totalCustomers = await prisma.customer.count();
  const newCustomersInPeriod = await prisma.customer.count({
    where: { createdAt: { gte: startDate } },
  });

  // 3. Paid Billing Events & Revenue in Period
  const paidEvents = await prisma.billingEvent.findMany({
    where: {
      eventType: "PAYMENT_SUCCESS",
      createdAt: { gte: startDate },
    },
  });

  const periodRevenue = paidEvents.reduce((acc, curr) => acc + curr.amount, 0);

  // Lifetime Revenue
  const allPaidEvents = await prisma.billingEvent.findMany({
    where: { eventType: "PAYMENT_SUCCESS" },
  });
  const lifetimeRevenue = allPaidEvents.reduce((acc, curr) => acc + curr.amount, 0);

  // 4. Failed Payments in Period
  const failedEvents = await prisma.billingEvent.findMany({
    where: {
      eventType: "PAYMENT_FAILED",
      createdAt: { gte: startDate },
    },
  });
  const failedPaymentsCount = failedEvents.length;
  const failedPaymentsAmount = failedEvents.reduce((acc, curr) => acc + curr.amount, 0);

  // Total Payment Attempts
  const totalPaymentEventsCount = paidEvents.length + failedPaymentsCount;
  const paymentSuccessRate =
    totalPaymentEventsCount > 0 ? (paidEvents.length / totalPaymentEventsCount) * 100 : 100;

  // 5. Churn Rate Calculation
  // Subscriptions cancelled during the period vs active subscriptions
  const cancelledInPeriod = await prisma.subscription.count({
    where: {
      status: "CANCELLED",
      cancellationDate: { gte: startDate },
    },
  });

  const activeCount = activeSubscriptions.length;
  const totalRelevantSubscriptions = activeCount + cancelledInPeriod;
  const churnRate =
    totalRelevantSubscriptions > 0
      ? (cancelledInPeriod / totalRelevantSubscriptions) * 100
      : 0;

  // 6. Customer Lifetime Value (LTV)
  // LTV = (Total Lifetime Revenue / Total Customers) or ARPU / Churn Rate
  const arpu = totalCustomers > 0 ? mrr / (activeCount || 1) : 0;
  const monthlyChurnDec = churnRate > 0 ? churnRate / 100 : 0.05; // floor at 5% for realistic bounds
  const estimatedLtv = arpu / monthlyChurnDec;

  // 7. Recent Invoices / Activity
  const recentInvoices = await prisma.invoice.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { fullName: true, companyName: true, email: true } },
    },
  });

  // For Support Agent, mask revenue numbers if restricted
  const isSupport = auth.session.role === "SUPPORT_AGENT";

  return NextResponse.json({
    metrics: {
      totalRevenue: isSupport ? null : lifetimeRevenue,
      periodRevenue: isSupport ? null : periodRevenue,
      mrr: isSupport ? null : Math.round(mrr * 100) / 100,
      arr: isSupport ? null : Math.round(arr * 100) / 100,
      totalCustomers,
      newCustomersInPeriod,
      activeSubscriptions: activeCount,
      churnRate: Math.round(churnRate * 10) / 10,
      failedPaymentsCount,
      failedPaymentsAmount: isSupport ? null : failedPaymentsAmount,
      paymentSuccessRate: Math.round(paymentSuccessRate * 10) / 10,
      estimatedLtv: isSupport ? null : Math.round(estimatedLtv),
      arpu: isSupport ? null : Math.round(arpu),
    },
    recentInvoices,
    role: auth.session.role,
    period,
  });
}

