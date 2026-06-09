import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { authErrorResponse, requirePortalSessionFromRequest } from "@/lib/auth/appwrite";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClientPayloadSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const payload = createClientPayloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  if (appConfig.mockMode) {
    return NextResponse.json({ ok: true, mode: "mock", client_id: randomUUID() });
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

  const admin = createAdminClient();
  const fullName = payload.data.contact_name || payload.data.company_name;
  const userResult = await upsertClientUser({
    admin,
    email: payload.data.contact_email,
    password: payload.data.temporary_password,
    name: fullName,
  });

  if (!userResult.ok) {
    return NextResponse.json({ error: userResult.error }, { status: 500 });
  }

  const user = userResult.user;

  const clientId = randomUUID();
  const { error: clientError } = await admin.from("clients").insert({
    id: clientId,
    firm_id: session.profile.firmId,
    company_name: payload.data.company_name,
    tax_number: payload.data.tax_number,
    contact_name: fullName,
    contact_email: payload.data.contact_email,
    contact_phone: payload.data.contact_phone,
    is_active: true,
  });

  if (clientError) {
    return NextResponse.json({ error: clientError.message }, { status: 500 });
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id,
    firm_id: session.profile.firmId,
    role: "client",
    full_name: fullName,
    email: payload.data.contact_email,
    is_active: true,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: membershipError } = await admin.from("client_memberships").upsert(
    {
      firm_id: session.profile.firmId,
      client_id: clientId,
      user_id: user.id,
    },
    { onConflict: "client_id,user_id" },
  );

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, client_id: clientId });
}

async function upsertClientUser({
  admin,
  email,
  password,
  name,
}: {
  admin: ReturnType<typeof createAdminClient>;
  email: string;
  password: string;
  name: string;
}) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (!error && data.user) {
    return { ok: true as const, user: data.user };
  }

  const { data: users, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    return { ok: false as const, error: listError.message };
  }

  const existing = users.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    return { ok: false as const, error: error?.message || "Musteri kullanicisi olusturulamadi." };
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    user_metadata: { ...existing.user_metadata, name },
  });

  if (updateError) {
    return { ok: false as const, error: updateError.message };
  }

  return { ok: true as const, user: existing };
}
