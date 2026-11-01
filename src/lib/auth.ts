import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "subscriptiq_super_secret_jwt_key_at_least_32_chars_long_2026";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

export type UserRole = "ADMIN" | "MANAGER" | "SUPPORT_AGENT";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

export const ROLE_PERMISSIONS = {
  ADMIN: {
    canViewAnalytics: true,
    canManagePlans: true,
    canManageUsers: true,
    canManageCustomers: true,
    canDeleteCustomers: true,
    canManageSubscriptions: true,
    canSimulateBilling: true,
    canViewAuditLogs: true,
    canExportReports: true,
  },
  MANAGER: {
    canViewAnalytics: true,
    canManagePlans: false,
    canManageUsers: false,
    canManageCustomers: true,
    canDeleteCustomers: false,
    canManageSubscriptions: true,
    canSimulateBilling: false,
    canViewAuditLogs: true,
    canExportReports: true,
  },
  SUPPORT_AGENT: {
    canViewAnalytics: false,
    canManagePlans: false,
    canManageUsers: false,
    canManageCustomers: true, // can update permitted customer info
    canDeleteCustomers: false,
    canManageSubscriptions: false, // can view only
    canSimulateBilling: false,
    canViewAuditLogs: false,
    canExportReports: false,
  },
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession(req?: NextRequest): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get("subscriptiq_session")?.value;
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = cookies();
      token = cookieStore.get("subscriptiq_session")?.value;
    } catch {
      return null;
    }
  }

  if (!token) return null;
  return await verifySessionToken(token);
}

export async function requireAuth(
  req?: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ session: SessionPayload } | { error: NextResponse }> {
  const session = await getSession(req);

  if (!session) {
    return {
      error: NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return {
      error: NextResponse.json(
        {
          error: `Forbidden. Your role (${session.role}) does not have permission for this resource.`,
        },
        { status: 403 }
      ),
    };
  }

  return { session };
}

export async function recordAuditLog({
  userId,
  userEmail,
  action,
  entityType,
  entityId,
  changeSummary,
  ipAddress,
}: {
  userId?: string | null;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  changeSummary: string;
  ipAddress?: string | null;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        userEmail,
        action,
        entityType,
        entityId,
        changeSummary,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}
