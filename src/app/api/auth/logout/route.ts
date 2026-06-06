import { NextResponse } from "next/server";
import { createAppwriteSessionServices } from "@/lib/appwrite/server";
import { appwriteSessionCookieOptions, getAppwriteSessionCookieName } from "@/lib/auth/appwrite";

export async function POST(request: Request) {
  const sessionSecret = readCookie(request, getAppwriteSessionCookieName());

  if (sessionSecret) {
    try {
      const { account } = createAppwriteSessionServices(sessionSecret, request.headers.get("user-agent"));
      await account.deleteSession({ sessionId: "current" });
    } catch {
      // Cookie cleanup below is enough if Appwrite has already expired the session.
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAppwriteSessionCookieName(), "", appwriteSessionCookieOptions(new Date(0)));
  return response;
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return undefined;
}
