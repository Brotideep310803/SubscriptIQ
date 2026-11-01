import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, recordAuditLog } from "@/lib/auth";
import { usageRecordSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER", "SUPPORT_AGENT"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const metricType = searchParams.get("metricType");
  const customerId = searchParams.get("customerId");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const whereClause: any = {};
  if (metricType && metricType !== "ALL") {
    whereClause.metricType = metricType;
  }
  if (customerId) {
    whereClause.customerId = customerId;
  }

  const [totalCount, records] = await prisma.$transaction([
    prisma.usageRecord.count({ where: whereClause }),
    prisma.usageRecord.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, fullName: true, companyName: true, email: true },
        },
        subscription: {
          include: { plan: true },
        },
      },
      orderBy: { recordedAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  // Aggregate customer usage quotas and warning detections
  const activeSubs = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
    include: {
      customer: { select: { id: true, companyName: true, fullName: true, email: true } },
      plan: true,
      usageRecords: {
        where: { metricType: "API_REQUESTS" },
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
    },
  });

  const usageSummaries = activeSubs.map((sub) => {
    const latestUsage = sub.usageRecords[0]?.amount || 0;
    const limit = sub.plan.maxUsageLimit;
    const percentage = limit > 0 ? Math.round((latestUsage / limit) * 100) : 0;
    const isExceeded = latestUsage > limit;
    const isWarning = !isExceeded && percentage >= 80;

    return {
      subscriptionId: sub.id,
      customerId: sub.customerId,
      companyName: sub.customer.companyName,
      customerEmail: sub.customer.email,
      planName: sub.plan.name,
      currentUsage: latestUsage,
      limit,
      percentage,
      status: isExceeded ? "EXCEEDED" : isWarning ? "WARNING" : "NORMAL",
    };
  });

  return NextResponse.json({
    records,
    usageSummaries,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = usageRecordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { subscriptionId, customerId, metricType, amount, notes } = parsed.data;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, customer: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const limit = subscription.plan.maxUsageLimit;
    const isExceeded = amount > limit;
    const isWarning = !isExceeded && amount >= limit * 0.8;

    let computedNotes = notes || "";
    if (isExceeded) {
      computedNotes = `EXCEEDED_LIMIT: Usage ${amount} exceeds plan limit ${limit}. ${computedNotes}`;
    } else if (isWarning) {
      computedNotes = `WARNING_HIGH_USAGE: Usage ${amount} reached >80% of limit ${limit}. ${computedNotes}`;
    }

    const record = await prisma.usageRecord.create({
      data: {
        subscriptionId,
        customerId,
        metricType,
        amount,
        notes: computedNotes || null,
      },
    });

    await recordAuditLog({
      userId: auth.session.userId,
      userEmail: auth.session.email,
      action: "RECORD_USAGE",
      entityType: "USAGE",
      entityId: record.id,
      changeSummary: `Recorded ${amount} ${metricType} for ${subscription.customer.companyName} (${isExceeded ? "EXCEEDED LIMIT" : isWarning ? "WARNING" : "NORMAL"})`,
    });

    return NextResponse.json(
      {
        success: true,
        record,
        usageStatus: {
          limit,
          amount,
          percentage: Math.round((amount / limit) * 100),
          isExceeded,
          isWarning,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Record usage error:", error);
    return NextResponse.json({ error: "Failed to record usage" }, { status: 500 });
  }
}
