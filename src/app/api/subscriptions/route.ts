import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, recordAuditLog } from "@/lib/auth";
import { createSubscriptionSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER", "SUPPORT_AGENT"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "ALL";
  const planId = searchParams.get("planId");
  const customerId = searchParams.get("customerId");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "15")));
  const skip = (page - 1) * limit;

  const whereClause: any = {};
  if (status !== "ALL") {
    whereClause.status = status;
  }
  if (planId) {
    whereClause.planId = planId;
  }
  if (customerId) {
    whereClause.customerId = customerId;
  }

  const [totalCount, subscriptions] = await prisma.$transaction([
    prisma.subscription.count({ where: whereClause }),
    prisma.subscription.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, fullName: true, companyName: true, email: true },
        },
        plan: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    subscriptions,
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
    const parsed = createSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { customerId, planId, billingCycle, status } = parsed.data;

    const [customer, plan] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.subscriptionPlan.findUnique({ where: { id: planId } }),
    ]);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    if (!plan) {
      return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 });
    }

    const amount = billingCycle === "ANNUAL" ? plan.annualPrice : plan.monthlyPrice;
    const now = new Date();
    const renewalDate = new Date();
    if (billingCycle === "ANNUAL") {
      renewalDate.setFullYear(now.getFullYear() + 1);
    } else {
      renewalDate.setMonth(now.getMonth() + 1);
    }

    // Run in transaction: create subscription, create initial invoice, record audit
    const result = await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          customerId,
          planId,
          billingCycle,
          status,
          amount,
          startDate: now,
          renewalDate,
        },
        include: {
          customer: true,
          plan: true,
        },
      });

      // Generate first invoice
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId,
          subscriptionId: subscription.id,
          amount,
          status: status === "ACTIVE" ? "PAID" : "UNPAID",
          dueDate: renewalDate,
          paidAt: status === "ACTIVE" ? now : null,
        },
      });

      // If active, record payment success event
      if (status === "ACTIVE") {
        await tx.billingEvent.create({
          data: {
            invoiceId: invoice.id,
            customerId,
            eventType: "PAYMENT_SUCCESS",
            amount,
            currency: "USD",
            status: "SUCCESS",
            paymentMethod: "pm_card_default",
            idempotencyKey: `evt_init_${subscription.id}_${Date.now()}`,
          },
        });
      }

      return subscription;
    });

    await recordAuditLog({
      userId: auth.session.userId,
      userEmail: auth.session.email,
      action: "CREATE",
      entityType: "SUBSCRIPTION",
      entityId: result.id,
      changeSummary: `Created ${result.billingCycle} subscription for ${customer.companyName} on ${plan.name} ($${amount})`,
    });

    return NextResponse.json({ success: true, subscription: result }, { status: 201 });
  } catch (error) {
    console.error("Create subscription error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}

