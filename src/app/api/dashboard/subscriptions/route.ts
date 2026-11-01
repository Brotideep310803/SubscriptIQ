import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER"]);
  if ("error" in auth) return auth.error;

  const now = new Date();

  // Status distribution
  const statusCounts = await prisma.subscription.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const subscriptionStatusDistribution = statusCounts.map((sc) => ({
    status: sc.status,
    count: sc._count.id,
  }));

  // Customer acquisition by month (past 12 months)
  const customers = await prisma.customer.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const monthlyAcquisitionMap: { [key: string]: { month: string; customers: number; subscriptions: number } } = {};

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthName = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthlyAcquisitionMap[key] = {
      month: monthName,
      customers: 0,
      subscriptions: 0,
    };
  }

  customers.forEach((c) => {
    const d = new Date(c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyAcquisitionMap[key]) {
      monthlyAcquisitionMap[key].customers += 1;
    }
  });

  const subscriptions = await prisma.subscription.findMany({
    select: { startDate: true },
    orderBy: { startDate: "asc" },
  });

  subscriptions.forEach((s) => {
    const d = new Date(s.startDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyAcquisitionMap[key]) {
      monthlyAcquisitionMap[key].subscriptions += 1;
    }
  });

  const growthTimeline = Object.values(monthlyAcquisitionMap);

  return NextResponse.json({
    growthTimeline,
    subscriptionStatusDistribution,
  });
}

