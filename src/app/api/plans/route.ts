import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, recordAuditLog } from "@/lib/auth";
import { planSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER", "SUPPORT_AGENT"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const whereClause: any = {};
  if (status && status !== "ALL") {
    whereClause.status = status;
  }
  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const plans = await prisma.subscriptionPlan.findMany({
    where: whereClause,
    include: {
      _count: {
        select: { subscriptions: true },
      },
    },
    orderBy: { monthlyPrice: "asc" },
  });

  // Parse JSON features for convenience
  const formattedPlans = plans.map((p) => {
    let parsedFeatures: string[] = [];
    try {
      parsedFeatures = JSON.parse(p.features);
    } catch {
      parsedFeatures = [p.features];
    }
    return {
      ...p,
      featuresList: parsedFeatures,
      activeSubscriptionCount: p._count.subscriptions,
    };
  });

  return NextResponse.json({ plans: formattedPlans });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = planSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, monthlyPrice, annualPrice, billingInterval, features, maxUsageLimit, status } =
      parsed.data;

    // Check if plan with name already exists
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A subscription plan named '${name}' already exists.` },
        { status: 409 }
      );
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        monthlyPrice,
        annualPrice,
        billingInterval,
        features: JSON.stringify(features),
        maxUsageLimit,
        status,
      },
    });

    await recordAuditLog({
      userId: auth.session.userId,
      userEmail: auth.session.email,
      action: "CREATE",
      entityType: "PLAN",
      entityId: plan.id,
      changeSummary: `Created new plan ${plan.name} ($${plan.monthlyPrice}/mo)`,
    });

    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error) {
    console.error("Create plan error:", error);
    return NextResponse.json({ error: "Failed to create subscription plan." }, { status: 500 });
  }
}
