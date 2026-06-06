import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { createAppwriteServices } from "@/lib/appwrite/server";
import { createRequestPayloadSchema } from "@/lib/validators";

const demoFirmId = "11111111-1111-4111-8111-111111111111";

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

  const requestId = randomUUID();
  const { tables } = createAppwriteServices();

  await tables.createRow({
    databaseId: appConfig.appwriteDatabaseId,
    tableId: appwriteTables.requests,
    rowId: requestId,
    data: stripUndefined({
      firm_id: demoFirmId,
      client_id: payload.data.client_id,
      folder_type: payload.data.folder_type,
      title: payload.data.title,
      description: payload.data.description,
      status: "open",
      due_at: payload.data.due_at,
    }),
  });

  await tables.createRow({
    databaseId: appConfig.appwriteDatabaseId,
    tableId: appwriteTables.notifications,
    rowId: randomUUID(),
    data: stripUndefined({
      firm_id: demoFirmId,
      client_id: payload.data.client_id,
      category: "document_request",
      title: "Yeni evrak talebi",
      body: payload.data.title,
      action_url: "/client",
      related_request_id: requestId,
      due_at: payload.data.due_at,
    }),
  });

  return NextResponse.json({ ok: true, request_id: requestId });
}

function stripUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
