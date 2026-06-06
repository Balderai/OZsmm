import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { createAppwriteServices } from "@/lib/appwrite/server";
import { createClientPayloadSchema } from "@/lib/validators";

const demoFirmId = "11111111-1111-4111-8111-111111111111";

export async function POST(request: Request) {
  const payload = createClientPayloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  if (appConfig.mockMode) {
    return NextResponse.json({ ok: true, mode: "mock", client_id: randomUUID() });
  }

  if (!hasAppwriteServerConfig()) {
    return NextResponse.json({ error: "Appwrite configuration is missing" }, { status: 500 });
  }

  const clientId = randomUUID();
  const { tables } = createAppwriteServices();

  await tables.createRow({
    databaseId: appConfig.appwriteDatabaseId,
    tableId: appwriteTables.clients,
    rowId: clientId,
    data: stripUndefined({
      firm_id: demoFirmId,
      company_name: payload.data.company_name,
      tax_number: payload.data.tax_number,
      contact_name: payload.data.contact_name,
      contact_email: payload.data.contact_email,
      contact_phone: payload.data.contact_phone,
      is_active: true,
    }),
  });

  return NextResponse.json({ ok: true, client_id: clientId });
}

function stripUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
