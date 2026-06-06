import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { Query } from "node-appwrite";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { createAppwriteServices } from "@/lib/appwrite/server";
import { authErrorResponse, requirePortalSessionFromRequest } from "@/lib/auth/appwrite";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { endpoint } = (await request.json()) as { endpoint?: string };

  if (!endpoint) {
    return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
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
    const subscriptions = await tables.listRows({
      databaseId: appConfig.appwriteDatabaseId,
      tableId: appwriteTables.pushSubscriptions,
      queries: [Query.equal("user_id", session.user.id), Query.equal("endpoint", endpoint), Query.limit(10)],
    });

    await Promise.all(
      subscriptions.rows.map((subscription) =>
        tables.updateRow({
          databaseId: appConfig.appwriteDatabaseId,
          tableId: appwriteTables.pushSubscriptions,
          rowId: subscription.$id,
          data: { is_active: false },
        }),
      ),
    );

    return NextResponse.json({ ok: true });
  }

  const supabase = await createServerSupabaseClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("push_subscriptions")
    .update({ is_active: false })
    .eq("user_id", userResult.user.id)
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
