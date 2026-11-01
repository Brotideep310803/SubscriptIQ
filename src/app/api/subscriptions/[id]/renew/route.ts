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

    const currentRenewal = new Date(existing.renewalDate);
    const baseDate = currentRenewal > new Date() ? currentRenewal : new Date();

    const newRenewal = new Date(baseDate);
    if (existing.billingCycle === "ANNUAL") {
      newRenewal.setFullYear(newRenewal.getFullYear() + 1);
    } else {
      newRenewal.setMonth(newRenewal.getMonth() + 1);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.update({
        where: { id: params.id },
        data: {
          status: "ACTIVE",
          cancellationDate: null,
          renewalDate: newRenewal,
        },
      });

      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: existing.customerId,
          subscriptionId: existing.id,
          amount: existing.amount,
          status: "PAID",
          dueDate: newRenewal,
          paidAt: new Date(),
        },
      });

      await tx.billingEvent.create({
        data: {
          invoiceId: invoice.id,
          customerId: existing.customerId,
          eventType: "PAYMENT_SUCCESS",
          amount: existing.amount,
          currency: "USD",
          status: "SUCCESS",
          paymentMethod: "pm_card_renew",
          idempotencyKey: `evt_renew_${existing.id}_${Date.now()}`,
        },
      });

      return sub;
    });

    await recordAuditLog({
      userId: auth.session.userId,
      userEmail: auth.session.email,
      action: "RENEW",
      entityType: "SUBSCRIPTION",
      entityId: existing.id,
      changeSummary: `Renewed subscription for ${existing.customer.companyName} through ${newRenewal.toISOString().split("T")[0]}`,
    });

    return NextResponse.json({
      success: true,
      message: "Subscription renewed successfully",
      subscription: updated,
    });
  } catch (error) {
    console.error("Renew subscription error:", error);
    return NextResponse.json({ error: "Failed to renew subscription" }, { status: 500 });
  }
}
