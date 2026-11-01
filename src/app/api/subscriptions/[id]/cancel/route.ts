import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, recordAuditLog } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER"]);
  if ("error" in auth) return auth.error;

  try {
    const existing = await prisma.subscription.findUnique({
      where: { id: params.id },
      include: { customer: true, plan: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Subscription is already cancelled." },
        { status: 400 }
      );
    }

    const cancelled = await prisma.subscription.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
        cancellationDate: new Date(),
      },
    });

    await recordAuditLog({
      userId: auth.session.userId,
      userEmail: auth.session.email,
      action: "CANCEL",
      entityType: "SUBSCRIPTION",
      entityId: existing.id,
      changeSummary: `Cancelled subscription for ${existing.customer.companyName} on ${existing.plan.name}`,
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
      subscription: cancelled,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
