import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { createAppwriteServices } from "@/lib/appwrite/server";
import { authErrorResponse, requirePortalSessionFromRequest } from "@/lib/auth/appwrite";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pushSubscriptionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const payload = pushSubscriptionSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  if (appConfig.mockMode) {
    return NextResponse.json({ ok: true, mode: "mock" });
  }

  if (hasAppwriteServerConfig()) {
    let session;
    try {
      session = await requirePortalSessionFromRequest(request);
    } catch (error) {
      return authErrorResponse(error);
    }

    const { tables } = createAppwriteServices();
    await tables.upsertRow({
      databaseId: appConfig.appwriteDatabaseId,
      tableId: appwriteTables.pushSubscriptions,
      rowId: crypto.randomUUID(),
      data: {
        firm_id: session.profile.firmId,
        user_id: session.user.id,
        endpoint: payload.data.endpoint,
        p256dh: payload.data.keys.p256dh,
        auth: payload.data.keys.auth,
        user_agent: request.headers.get("user-agent"),
        is_active: true,
      },
    });

    return NextResponse.json({ ok: true });
  }

  const supabase = await createServerSupabaseClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", userResult.user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      firm_id: profile.firm_id,
      user_id: userResult.user.id,
      endpoint: payload.data.endpoint,
      p256dh: payload.data.keys.p256dh,
      auth: payload.data.keys.auth,
      user_agent: request.headers.get("user-agent"),
      is_active: true,
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
