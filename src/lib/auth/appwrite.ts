import { createServerSupabaseClient } from "@/lib/supabase/server";
import { appConfig } from "@/lib/config";
import type { AppRole, ClientMembership, Profile } from "@/types/domain";

type ProfileRow = {
  id: string;
  firm_id: string;
  role: AppRole;
  full_name: string;
  email: string;
  is_active: boolean;
};

type MembershipRow = {
  id: string;
  firm_id: string;
  client_id: string;
  user_id: string;
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

export async function getPortalSessionFromCookies() {
  return getPortalSession();
}

export async function getPortalSessionFromRequest(_request: Request) {
  return getPortalSession();
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

async function getPortalSession(): Promise<PortalSession | null> {
  if (appConfig.mockMode) return null;

  const supabase = await createServerSupabaseClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return null;
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, firm_id, role, full_name, email, is_active")
    .eq("id", userResult.user.id)
    .single();

  if (profileError || !profileRow || !profileRow.is_active) {
    return null;
  }

  const { data: membershipRows, error: membershipsError } = await supabase
    .from("client_memberships")
    .select("id, firm_id, client_id, user_id")
    .eq("user_id", userResult.user.id);

  if (membershipsError) {
    return null;
  }

  const profile = toProfile(profileRow as ProfileRow);

  return {
    user: {
      id: userResult.user.id,
      email: userResult.user.email || profile.email,
      name: userResult.user.user_metadata.name || profile.fullName,
    },
    profile,
    memberships: ((membershipRows || []) as MembershipRow[]).map(toMembership),
  };
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    firmId: row.firm_id,
    role: row.role,
    fullName: row.full_name,
    email: row.email,
    isActive: row.is_active,
  };
}

function toMembership(row: MembershipRow): ClientMembership {
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    userId: row.user_id,
    isActive: true,
  };
}
