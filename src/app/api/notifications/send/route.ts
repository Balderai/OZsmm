import { NextResponse } from "next/server";
import type webpush from "web-push";
import { appConfig } from "@/lib/config";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { sendPush } from "@/lib/push";
import { createAppwriteServices } from "@/lib/appwrite/server";
import { authErrorResponse, requirePortalSessionFromRequest } from "@/lib/auth/appwrite";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notificationPayloadSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const payload = notificationPayloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  if (appConfig.mockMode) {
    return NextResponse.json({ ok: true, mode: "mock", in_app: 1, push_sent: 0, push_failed: 0 });
  }

  if (hasAppwriteServerConfig()) {
    let session;
    try {
      session = await requirePortalSessionFromRequest(request, "accountant");
    } catch (error) {
      return authErrorResponse(error);
    }

    const { tables } = createAppwriteServices();
    const client = await tables.getRow({
      databaseId: appConfig.appwriteDatabaseId,
      tableId: appwriteTables.clients,
      rowId: payload.data.client_id,
    });

    if (client.firm_id !== session.profile.firmId || client.is_active === false) {
      return NextResponse.json({ error: "Mukellef bu firmaya ait degil." }, { status: 403 });
    }

    await tables.createRow({
      databaseId: appConfig.appwriteDatabaseId,
      tableId: appwriteTables.notifications,
      rowId: crypto.randomUUID(),
      data: stripUndefined({
        firm_id: session.profile.firmId,
        client_id: payload.data.client_id,
        category: payload.data.category,
        title: payload.data.title,
        body: payload.data.body,
        action_url: payload.data.action_url,
        due_at: payload.data.due_at,
        created_by: session.user.id,
      }),
    });

    return NextResponse.json({ ok: true, in_app: 1, push_sent: 0, push_failed: 0 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", userResult.user.id)
    .single();

  if (profileError || !profile || profile.role !== "accountant") {
    return NextResponse.json({ error: "Only accountants can send notifications" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: members, error: membersError } = await admin
    .from("client_memberships")
    .select("user_id")
    .eq("firm_id", profile.firm_id)
    .eq("client_id", payload.data.client_id);

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  const notifications = (members || []).map((member) => ({
    firm_id: profile.firm_id,
    client_id: payload.data.client_id,
    recipient_user_id: member.user_id,
    category: payload.data.category,
    title: payload.data.title,
    body: payload.data.body,
    action_url: payload.data.action_url,
    due_at: payload.data.due_at,
    created_by: userResult.user.id,
  }));

  if (notifications.length > 0) {
    const { error } = await admin.from("notifications").insert(notifications);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("firm_id", profile.firm_id)
    .in(
      "user_id",
      (members || []).map((member) => member.user_id),
    )
    .eq("is_active", true);

  let pushSent = 0;
  let pushFailed = 0;

  await Promise.all(
    (subscriptions || []).map(async (subscription) => {
      try {
        await sendPush({
          subscription: {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          } satisfies webpush.PushSubscription,
          title: payload.data.title,
          body: payload.data.body,
          actionUrl: payload.data.action_url,
        });
        pushSent += 1;
      } catch {
        pushFailed += 1;
        await admin.from("push_subscriptions").update({ is_active: false }).eq("id", subscription.id);
      }
    }),
  );

  await admin.from("audit_logs").insert({
    firm_id: profile.firm_id,
    actor_user_id: userResult.user.id,
    action: "notification.send",
    entity_type: "client",
    entity_id: payload.data.client_id,
    metadata: { category: payload.data.category, pushSent, pushFailed },
  });

  return NextResponse.json({ ok: true, in_app: notifications.length, push_sent: pushSent, push_failed: pushFailed });
}

function stripUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
