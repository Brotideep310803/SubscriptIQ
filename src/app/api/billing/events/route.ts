import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, recordAuditLog } from "@/lib/auth";
import { billingEventSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = billingEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { customerId, invoiceId, eventType, amount, currency, paymentMethod, failureReason, idempotencyKey } =
      parsed.data;

    // 1. SAFEGUARD: Check for duplicate billing events using Idempotency Key
    const existingEvent = await prisma.billingEvent.findUnique({
      where: { idempotencyKey },
    });

    if (existingEvent) {
      return NextResponse.json(
        {
          error: "Duplicate billing event detected. An event with this idempotency key has already been processed.",
          event: existingEvent,
          isDuplicate: true,
        },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    let status = "SUCCESS";
    let invoiceStatus = "PAID";

    if (eventType === "PAYMENT_FAILED") {
      status = "FAILED";
      invoiceStatus = "UNPAID";
    } else if (eventType === "PAYMENT_REFUNDED") {
      status = "REFUNDED";
      invoiceStatus = "REFUNDED";
    } else if (eventType === "PAYMENT_PENDING") {
      status = "PENDING";
      invoiceStatus = "UNPAID";
    }

    // Execute in transaction: create event, optionally update invoice
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.billingEvent.create({
        data: {
          customerId,
          invoiceId: invoiceId || null,
          eventType,
          amount,
          currency,
          status,
          paymentMethod,
          failureReason: eventType === "PAYMENT_FAILED" ? failureReason || "card_declined" : null,
          idempotencyKey,
        },
      });

      if (invoiceId) {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: invoiceStatus,
            paidAt: status === "SUCCESS" ? new Date() : null,
          },
        });
      }

      return event;
    });

    await recordAuditLog({
      userId: auth.session.userId,
      userEmail: auth.session.email,
      action: "SIMULATE_PAYMENT",
      entityType: "BILLING",
      entityId: result.id,
      changeSummary: `Simulated ${eventType} of $${amount} for ${customer.companyName} (${idempotencyKey})`,
    });

    return NextResponse.json(
      {
        success: true,
        notice: "SIMULATED_PAYMENT: This is a simulated mock billing event and not a real financial transaction.",
        event: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Billing event simulation error:", error);
    return NextResponse.json({ error: "Failed to process billing event" }, { status: 500 });
  }
}
