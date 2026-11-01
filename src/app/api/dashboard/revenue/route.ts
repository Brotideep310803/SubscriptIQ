import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "12m";

  // Build monthly historical buckets for the past 12 months
  const now = new Date();
  const monthsCount = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 12 : 12;

  // Let's get all payment events for charts
  const billingEvents = await prisma.billingEvent.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Aggregate monthly revenue and success vs fail
  const monthlyDataMap: {
    [key: string]: { month: string; revenue: number; successful: number; failed: number };
  } = {};

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthName = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthlyDataMap[key] = {
      month: monthName,
      revenue: 0,
      successful: 0,
      failed: 0,
    };
  }

  billingEvents.forEach((evt) => {
    const d = new Date(evt.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyDataMap[key]) {
      if (evt.eventType === "PAYMENT_SUCCESS") {
        monthlyDataMap[key].revenue += evt.amount;
        monthlyDataMap[key].successful += 1;
      } else if (evt.eventType === "PAYMENT_FAILED") {
        monthlyDataMap[key].failed += 1;
      }
    }
  });

  const revenueTimeline = Object.values(monthlyDataMap);

  // Revenue by Plan distribution
  const plans = await prisma.subscriptionPlan.findMany({
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
      },
    },
  });

  const planRevenueBreakdown = plans.map((plan) => {
    const activeSubCount = plan.subscriptions.length;
    const monthlySum = plan.subscriptions.reduce((sum, s) => {
      return sum + (s.billingCycle === "ANNUAL" ? s.amount / 12 : s.amount);
    }, 0);

    return {
      planName: plan.name,
      activeSubCount,
      monthlyRevenue: Math.round(monthlySum),
    };
  });

  return NextResponse.json({
    revenueTimeline,
    planRevenueBreakdown,
  });
}

