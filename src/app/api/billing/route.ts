import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER", "SUPPORT_AGENT"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const eventType = searchParams.get("eventType");
  const customerId = searchParams.get("customerId");
  const tab = searchParams.get("tab") || "events"; // "events" | "invoices"
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "15")));
  const skip = (page - 1) * limit;

  if (tab === "invoices") {
    const whereClause: any = {};
    if (customerId) whereClause.customerId = customerId;

    const [totalCount, invoices] = await prisma.$transaction([
      prisma.invoice.count({ where: whereClause }),
      prisma.invoice.findMany({
        where: whereClause,
        include: {
          customer: { select: { id: true, fullName: true, companyName: true, email: true } },
          subscription: { include: { plan: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  }

  // Events tab
  const whereClause: any = {};
  if (eventType && eventType !== "ALL") {
    whereClause.eventType = eventType;
  }
  if (customerId) {
    whereClause.customerId = customerId;
  }

  const [totalCount, events] = await prisma.$transaction([
    prisma.billingEvent.count({ where: whereClause }),
    prisma.billingEvent.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, fullName: true, companyName: true, email: true } },
        invoice: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    events,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}

