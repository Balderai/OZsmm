import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { createAppwriteServices } from "@/lib/appwrite/server";
import { authErrorResponse, requirePortalSessionFromRequest } from "@/lib/auth/appwrite";
import { createRequestPayloadSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const payload = createRequestPayloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  if (appConfig.mockMode) {
    return NextResponse.json({ ok: true, mode: "mock", request_id: randomUUID() });
  }

  if (!hasAppwriteServerConfig()) {
    return NextResponse.json({ error: "Appwrite configuration is missing" }, { status: 500 });
  }

  let session;
  try {
    session = await requirePortalSessionFromRequest(request, "accountant");
  } catch (error) {
    return authErrorResponse(error);
  }

  const requestId = randomUUID();
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
    tableId: appwriteTables.requests,
    rowId: requestId,
    data: stripUndefined({
      firm_id: session.profile.firmId,
      client_id: payload.data.client_id,
      folder_type: payload.data.folder_type,
      title: payload.data.title,
      description: payload.data.description,
      status: "open",
      due_at: payload.data.due_at,
      created_by: session.user.id,
    }),
  });

  await tables.createRow({
    databaseId: appConfig.appwriteDatabaseId,
    tableId: appwriteTables.notifications,
    rowId: randomUUID(),
    data: stripUndefined({
      firm_id: session.profile.firmId,
      client_id: payload.data.client_id,
      category: "document_request",
      title: "Yeni evrak talebi",
      body: payload.data.title,
      action_url: "/client",
      related_request_id: requestId,
      due_at: payload.data.due_at,
      created_by: session.user.id,
    }),
  });

  return NextResponse.json({ ok: true, request_id: requestId });
}

function stripUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
