import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { authErrorResponse, requirePortalSessionFromRequest } from "@/lib/auth/appwrite";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRequestPayloadSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const payload = createRequestPayloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  if (appConfig.mockMode) {
    return NextResponse.json({ ok: true, mode: "mock", request_id: randomUUID() });
  }

  let session;
  try {
    session = await requirePortalSessionFromRequest(request, "accountant");
  } catch (error) {
    return authErrorResponse(error);
  }

  const admin = createAdminClient();
  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("id, firm_id, is_active")
    .eq("id", payload.data.client_id)
    .single();

  if (clientError || !client || client.firm_id !== session.profile.firmId || client.is_active === false) {
    return NextResponse.json({ error: "Mukellef bu firmaya ait degil." }, { status: 403 });
  }

  const requestId = randomUUID();
  const { error: requestError } = await admin.from("document_requests").insert({
    id: requestId,
    firm_id: session.profile.firmId,
    client_id: payload.data.client_id,
    folder_type: payload.data.folder_type,
    title: payload.data.title,
    description: payload.data.description,
    status: "open",
    due_at: payload.data.due_at,
    created_by: session.user.id,
  });

  if (requestError) {
    return NextResponse.json({ error: requestError.message }, { status: 500 });
  }

  const { error: notificationError } = await admin.from("notifications").insert({
    firm_id: session.profile.firmId,
    client_id: payload.data.client_id,
    category: "document_request",
    title: "Yeni evrak talebi",
    body: payload.data.title,
    action_url: "/client",
    related_request_id: requestId,
    due_at: payload.data.due_at,
    created_by: session.user.id,
  });

  if (notificationError) {
    return NextResponse.json({ error: notificationError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request_id: requestId });
}
