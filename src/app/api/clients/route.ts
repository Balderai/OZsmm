import { randomUUID } from "crypto";
import { Query, type Users } from "node-appwrite";
import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { createAppwriteServices } from "@/lib/appwrite/server";
import { authErrorResponse, requirePortalSessionFromRequest } from "@/lib/auth/appwrite";
import { createClientPayloadSchema } from "@/lib/validators";

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

  let session;
  try {
    session = await requirePortalSessionFromRequest(request, "accountant");
  } catch (error) {
    return authErrorResponse(error);
  }

  if (!payload.data.contact_email || !payload.data.temporary_password) {
    return NextResponse.json({ error: "Musteri kullanicisi icin email ve gecici sifre gerekir." }, { status: 400 });
  }

  const clientId = randomUUID();
  const membershipId = randomUUID();
  const { tables, users } = createAppwriteServices();
  const fullName = payload.data.contact_name || payload.data.company_name;
  const user = await upsertClientUser({
    users,
    email: payload.data.contact_email,
    password: payload.data.temporary_password,
    name: fullName,
  });

  await tables.createRow({
    databaseId: appConfig.appwriteDatabaseId,
    tableId: appwriteTables.clients,
    rowId: clientId,
    data: stripUndefined({
      firm_id: session.profile.firmId,
      company_name: payload.data.company_name,
      tax_number: payload.data.tax_number,
      contact_name: fullName,
      contact_email: payload.data.contact_email,
      contact_phone: payload.data.contact_phone,
      is_active: true,
    }),
  });

  await tables.upsertRow({
    databaseId: appConfig.appwriteDatabaseId,
    tableId: appwriteTables.profiles,
    rowId: user.$id,
    data: {
      firm_id: session.profile.firmId,
      role: "client",
      full_name: fullName,
      email: payload.data.contact_email,
      is_active: true,
    },
  });

  await tables.upsertRow({
    databaseId: appConfig.appwriteDatabaseId,
    tableId: appwriteTables.clientMemberships,
    rowId: membershipId,
    data: {
      firm_id: session.profile.firmId,
      client_id: clientId,
      user_id: user.$id,
      is_active: true,
    },
  });

  return NextResponse.json({ ok: true, client_id: clientId });
}

function stripUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

async function upsertClientUser({
  users,
  email,
  password,
  name,
}: {
  users: Users;
  email: string;
  password: string;
  name: string;
}) {
  try {
    return await users.create({
      userId: randomUUID(),
      email,
      password,
      name,
    });
  } catch {
    const existing = await users.list({ queries: [Query.equal("email", email), Query.limit(1)] });
    const user = existing.users[0];
    if (!user) throw new Error("Musteri kullanicisi olusturulamadi.");

    await users.updatePassword({ userId: user.$id, password });
    return user;
  }
}
