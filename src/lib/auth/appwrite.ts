import { cookies } from "next/headers";
import { Query } from "node-appwrite";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { createAppwriteServices, createAppwriteSessionServices } from "@/lib/appwrite/server";
import { appConfig } from "@/lib/config";
import type { AppRole, ClientMembership, Profile } from "@/types/domain";

type AppwriteProfileRow = {
  $id: string;
  firm_id: string;
  role: AppRole;
  full_name: string;
  email: string;
  is_active?: boolean;
};

type AppwriteMembershipRow = {
  $id: string;
  firm_id: string;
  client_id: string;
  user_id: string;
  is_active?: boolean;
};

export type PortalSession = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  profile: Profile;
  memberships: ClientMembership[];
};

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status = 401,
  ) {
    super(message);
  }
}

export function getAppwriteSessionCookieName() {
  if (!appConfig.appwriteProjectId) {
    throw new Error("Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  }

  return `a_session_${appConfig.appwriteProjectId}`;
}

export function appwriteSessionCookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires,
  };
}

export async function getPortalSessionFromCookies() {
  if (appConfig.mockMode || !hasAppwriteServerConfig()) return null;

  const cookieStore = await cookies();
  const sessionSecret = cookieStore.get(getAppwriteSessionCookieName())?.value;

  return getPortalSession(sessionSecret);
}

export async function getPortalSessionFromRequest(request: Request) {
  if (appConfig.mockMode || !hasAppwriteServerConfig()) return null;

  return getPortalSession(readCookie(request, getAppwriteSessionCookieName()), request.headers.get("user-agent"));
}

export async function requirePortalSessionFromRequest(request: Request, role?: AppRole) {
  const session = await getPortalSessionFromRequest(request);

  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }

  if (role && session.profile.role !== role) {
    throw new AuthError("Forbidden", 403);
  }

  return session;
}

export async function requirePortalSession(role?: AppRole) {
  const session = await getPortalSessionFromCookies();

  if (!session) return null;
  if (role && session.profile.role !== role) return null;

  return session;
}

export async function assertClientAccess(session: PortalSession, clientId: string) {
  if (session.profile.role === "accountant") {
    return;
  }

  if (!session.memberships.some((membership) => membership.clientId === clientId && membership.isActive)) {
    throw new AuthError("Forbidden", 403);
  }
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  throw error;
}

async function getPortalSession(sessionSecret?: string, userAgent?: string | null): Promise<PortalSession | null> {
  if (!sessionSecret) return null;

  try {
    const { account } = createAppwriteSessionServices(sessionSecret, userAgent);
    const user = await account.get();
    const { tables } = createAppwriteServices();
    const profileRow = (await tables.getRow({
      databaseId: appConfig.appwriteDatabaseId,
      tableId: appwriteTables.profiles,
      rowId: user.$id,
    })) as unknown as AppwriteProfileRow;

    const profile = toProfile(profileRow);
    if (!profile.isActive) return null;

    const membershipRows = await tables.listRows({
      databaseId: appConfig.appwriteDatabaseId,
      tableId: appwriteTables.clientMemberships,
      queries: [Query.equal("user_id", user.$id), Query.equal("is_active", true), Query.limit(100)],
    });

    return {
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
      },
      profile,
      memberships: (membershipRows.rows as unknown as AppwriteMembershipRow[]).map(toMembership),
    };
  } catch {
    return null;
  }
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

function toProfile(row: AppwriteProfileRow): Profile {
  return {
    id: row.$id,
    firmId: row.firm_id,
    role: row.role,
    fullName: row.full_name,
    email: row.email,
    isActive: row.is_active !== false,
  };
}

function toMembership(row: AppwriteMembershipRow): ClientMembership {
  return {
    id: row.$id,
    firmId: row.firm_id,
    clientId: row.client_id,
    userId: row.user_id,
    isActive: row.is_active !== false,
  };
}
