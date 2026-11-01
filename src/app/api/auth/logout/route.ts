import { NextRequest, NextResponse } from "next/server";
import { getSession, recordAuditLog } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession(req);

  if (session) {
    await recordAuditLog({
      userId: session.userId,
      userEmail: session.email,
      action: "LOGOUT",
      entityType: "USER",
      entityId: session.userId,
      changeSummary: `User ${session.email} signed out`,
    });
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete("subscriptiq_session");
  return response;
}
