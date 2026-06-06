import { NextResponse } from "next/server";
import { getPortalSessionFromRequest } from "@/lib/auth/appwrite";

export async function GET(request: Request) {
  const session = await getPortalSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: session.user,
    profile: session.profile,
    memberships: session.memberships,
  });
}
