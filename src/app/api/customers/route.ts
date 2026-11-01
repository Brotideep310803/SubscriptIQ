import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, recordAuditLog } from "@/lib/auth";
import { customerSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER", "SUPPORT_AGENT"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "ALL";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
  const skip = (page - 1) * limit;

  const whereClause: any = {};

  if (status !== "ALL") {
    whereClause.status = status;
  }

  if (search.trim()) {
    whereClause.OR = [
      { fullName: { contains: search } },
      { email: { contains: search } },
      { companyName: { contains: search } },
    ];
  }

  const [totalCount, customers] = await prisma.$transaction([
    prisma.customer.count({ where: whereClause }),
    prisma.customer.findMany({
      where: whereClause,
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          include: { plan: true },
          take: 1,
        },
        _count: {
          select: { subscriptions: true, invoices: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const formattedCustomers = customers.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    email: c.email,
    companyName: c.companyName,
    contactNumber: c.contactNumber,
    status: c.status,
    createdAt: c.createdAt,
    activeSubscription: c.subscriptions[0]
      ? {
          id: c.subscriptions[0].id,
          planName: c.subscriptions[0].plan.name,
          amount: c.subscriptions[0].amount,
          billingCycle: c.subscriptions[0].billingCycle,
          renewalDate: c.subscriptions[0].renewalDate,
        }
      : null,
    totalSubscriptions: c._count.subscriptions,
    totalInvoices: c._count.invoices,
  }));

  return NextResponse.json({
    customers: formattedCustomers,
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
    const parsed = customerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fullName, email, companyName, contactNumber, status } = parsed.data;

    // Check unique email
    const existing = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A customer with email '${email}' already exists.` },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        companyName,
        contactNumber,
        status,
      },
    });

    await recordAuditLog({
      userId: auth.session.userId,
      userEmail: auth.session.email,
      action: "CREATE",
      entityType: "CUSTOMER",
      entityId: customer.id,
      changeSummary: `Created customer account for ${customer.fullName} (${customer.companyName})`,
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
