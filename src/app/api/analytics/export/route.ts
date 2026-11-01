import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "customers"; // "customers" | "subscriptions" | "invoices"

  if (type === "subscriptions") {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        customer: true,
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Subscription ID",
      "Customer Name",
      "Company",
      "Email",
      "Plan",
      "Billing Cycle",
      "Amount",
      "Status",
      "Start Date",
      "Renewal Date",
      "Cancellation Date",
    ];

    const rows = subscriptions.map((s) => [
      s.id,
      `"${s.customer.fullName.replace(/"/g, '""')}"`,
      `"${s.customer.companyName.replace(/"/g, '""')}"`,
      s.customer.email,
      s.plan.name,
      s.billingCycle,
      s.amount.toFixed(2),
      s.status,
      s.startDate.toISOString().split("T")[0],
      s.renewalDate.toISOString().split("T")[0],
      s.cancellationDate ? s.cancellationDate.toISOString().split("T")[0] : "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="subscriptiq-subscriptions-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  if (type === "invoices") {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Invoice Number",
      "Customer Name",
      "Company",
      "Email",
      "Amount",
      "Status",
      "Due Date",
      "Paid At",
      "Created At",
    ];

    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      `"${inv.customer.fullName.replace(/"/g, '""')}"`,
      `"${inv.customer.companyName.replace(/"/g, '""')}"`,
      inv.customer.email,
      inv.amount.toFixed(2),
      inv.status,
      inv.dueDate.toISOString().split("T")[0],
      inv.paidAt ? inv.paidAt.toISOString().split("T")[0] : "",
      inv.createdAt.toISOString().split("T")[0],
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="subscriptiq-invoices-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  // Default: Customers CSV
  const customers = await prisma.customer.findMany({
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        include: { plan: true },
        take: 1,
      },
      _count: { select: { subscriptions: true, invoices: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Customer ID",
    "Full Name",
    "Email",
    "Company",
    "Phone",
    "Status",
    "Active Plan",
    "Total Subscriptions",
    "Total Invoices",
    "Joined Date",
  ];

  const rows = customers.map((c) => [
    c.id,
    `"${c.fullName.replace(/"/g, '""')}"`,
    c.email,
    `"${c.companyName.replace(/"/g, '""')}"`,
    c.contactNumber || "",
    c.status,
    c.subscriptions[0]?.plan.name || "None",
    c._count.subscriptions,
    c._count.invoices,
    c.createdAt.toISOString().split("T")[0],
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscriptiq-customers-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
