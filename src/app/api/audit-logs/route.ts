import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN", "MANAGER"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const action = searchParams.get("action");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const whereClause: any = {};
  if (entityType && entityType !== "ALL") {
    whereClause.entityType = entityType;
  }
  if (action && action !== "ALL") {
    whereClause.action = action;
  }

  const [totalCount, logs] = await prisma.$transaction([
    prisma.auditLog.count({ where: whereClause }),
    prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}
