import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, recordAuditLog } from "@/lib/auth";
import { updatePlanSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER", "SUPPORT_AGENT"]);
  if ("error" in auth) return auth.error;

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: params.id },
    include: {
      subscriptions: {
        include: {
          customer: {
            select: { id: true, fullName: true, companyName: true, email: true },
          },
        },
      },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 });
  }

  let featuresList: string[] = [];
  try {
    featuresList = JSON.parse(plan.features);
  } catch {
    featuresList = [plan.features];
  }

  return NextResponse.json({
    plan: {
      ...plan,
      featuresList,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("error" in auth) return auth.error;

  try {
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updatePlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data: any = { ...parsed.data };
    if (data.features) {
      data.features = JSON.stringify(data.features);
    }

    const updated = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data,
    });

    await recordAuditLog({
      userId: auth.session.userId,
      userEmail: auth.session.email,
      action: "UPDATE",
      entityType: "PLAN",
      entityId: updated.id,
      changeSummary: `Updated plan ${updated.name}: ${JSON.stringify(parsed.data)}`,
    });

    return NextResponse.json({ success: true, plan: updated });
  } catch (error) {
    console.error("Update plan error:", error);
    return NextResponse.json({ error: "Failed to update subscription plan" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("error" in auth) return auth.error;

  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 });
    }

    // DEPENDENCY CHECK: Cannot delete if subscriptions exist
    if (plan._count.subscriptions > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete plan '${plan.name}'. It is currently associated with ${plan._count.subscriptions} customer subscriptions. Deactivate or reassign them first.`,
        },
        { status: 409 }
      );
    }

    await prisma.subscriptionPlan.delete({
      where: { id: params.id },
    });

    await recordAuditLog({
      userId: auth.session.userId,
      userEmail: auth.session.email,
      action: "DELETE",
      entityType: "PLAN",
      entityId: plan.id,
      changeSummary: `Deleted plan '${plan.name}'`,
    });

    return NextResponse.json({ success: true, message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Delete plan error:", error);
    return NextResponse.json({ error: "Failed to delete subscription plan" }, { status: 500 });
  }
}
