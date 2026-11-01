import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, recordAuditLog } from "@/lib/auth";
import { updateSubscriptionSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER", "SUPPORT_AGENT"]);
  if ("error" in auth) return auth.error;

  const subscription = await prisma.subscription.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      plan: true,
      invoices: { orderBy: { createdAt: "desc" } },
      usageRecords: { orderBy: { recordedAt: "desc" }, take: 10 },
    },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  return NextResponse.json({ subscription });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER"]);
  if ("error" in auth) return auth.error;

  try {
    const existing = await prisma.subscription.findUnique({
      where: { id: params.id },
      include: { plan: true, customer: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: any = {};
    let isUpgradeOrDowngrade = false;

    if (parsed.data.planId && parsed.data.planId !== existing.planId) {
      const newPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: parsed.data.planId },
      });
      if (!newPlan) {
        return NextResponse.json({ error: "Target subscription plan not found" }, { status: 404 });
      }

      updateData.planId = newPlan.id;
      const cycle = parsed.data.billingCycle || existing.billingCycle;
      updateData.amount = cycle === "ANNUAL" ? newPlan.annualPrice : newPlan.monthlyPrice;
      isUpgradeOrDowngrade = true;
    }

    if (parsed.data.billingCycle && parsed.data.billingCycle !== existing.billingCycle) {
      updateData.billingCycle = parsed.data.billingCycle;
      if (!updateData.amount) {
        updateData.amount =
          parsed.data.billingCycle === "ANNUAL"
            ? existing.plan.annualPrice
            : existing.plan.monthlyPrice;
      }
    }

    if (parsed.data.status) {
      updateData.status = parsed.data.status;
      if (parsed.data.status === "CANCELLED" && !existing.cancellationDate) {
        updateData.cancellationDate = new Date();
      }
    }

    if (parsed.data.renewalDate) {
      updateData.renewalDate = new Date(parsed.data.renewalDate);
    }

    const updated = await prisma.subscription.update({
      where: { id: params.id },
      data: updateData,
      include: { plan: true, customer: true },
    });

    await recordAuditLog({
      userId: auth.session.userId,
      userEmail: auth.session.email,
      action: isUpgradeOrDowngrade ? "PLAN_CHANGE" : "UPDATE",
      entityType: "SUBSCRIPTION",
      entityId: updated.id,
      changeSummary: isUpgradeOrDowngrade
        ? `Changed plan for ${updated.customer.companyName} from ${existing.plan.name} to ${updated.plan.name}`
        : `Updated subscription status/cycle to ${updated.status} / ${updated.billingCycle}`,
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    console.error("Update subscription error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
