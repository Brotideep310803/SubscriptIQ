import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER"]);
  if ("error" in auth) return auth.error;

  const now = new Date();
  const churnTrend: { month: string; cancelled: number; active: number; rate: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const dStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthName = dStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const [cancelled, activeAtPeriod] = await Promise.all([
      prisma.subscription.count({
        where: {
          status: "CANCELLED",
          cancellationDate: { gte: dStart, lte: dEnd },
        },
      }),
      prisma.subscription.count({
        where: {
          startDate: { lte: dEnd },
          OR: [
            { cancellationDate: null },
            { cancellationDate: { gt: dStart } },
          ],
        },
      }),
    ]);

    const rate = activeAtPeriod > 0 ? (cancelled / activeAtPeriod) * 100 : 0;

    churnTrend.push({
      month: monthName,
      cancelled,
      active: activeAtPeriod,
      rate: Math.round(rate * 10) / 10,
    });
  }

  // Churned customers list with tenure
  const churnedSubscriptions = await prisma.subscription.findMany({
    where: { status: "CANCELLED" },
    include: {
      customer: true,
      plan: true,
    },
    orderBy: { cancellationDate: "desc" },
    take: 10,
  });

  const churnDetails = churnedSubscriptions.map((sub) => {
    const start = new Date(sub.startDate);
    const end = sub.cancellationDate ? new Date(sub.cancellationDate) : new Date();
    const tenureMonths = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));

    return {
      id: sub.id,
      customerName: sub.customer.fullName,
      companyName: sub.customer.companyName,
      planName: sub.plan.name,
      amount: sub.amount,
      cancelledAt: sub.cancellationDate,
      tenureMonths,
    };
  });

  return NextResponse.json({
    churnTrend,
    churnDetails,
  });
}
