import { NextResponse } from "next/server";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { createAppwriteServices } from "@/lib/appwrite/server";
import { appConfig } from "@/lib/config";
import { appwriteSessionCookieOptions, getAppwriteSessionCookieName } from "@/lib/auth/appwrite";
import { loginPayloadSchema } from "@/lib/validators";
import type { AppRole } from "@/types/domain";

type ProfileRow = {
  role: AppRole;
  is_active?: boolean;
};

export async function POST(request: Request) {
  const payload = loginPayloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Email veya sifre gecersiz." }, { status: 400 });
  }

  if (appConfig.mockMode || !hasAppwriteServerConfig()) {
    return NextResponse.json({ error: "Gercek giris icin Appwrite ve MOCK_MODE=false gerekir." }, { status: 503 });
  }

  const { account, tables } = createAppwriteServices();

  try {
    const session = await account.createEmailPasswordSession({
      email: payload.data.email,
      password: payload.data.password,
    });
    const profile = (await tables.getRow({
      databaseId: appConfig.appwriteDatabaseId,
      tableId: appwriteTables.profiles,
      rowId: session.userId,
    })) as unknown as ProfileRow;

    if (profile.is_active === false) {
      return NextResponse.json({ error: "Hesap pasif." }, { status: 403 });
    }

    if (profile.role !== payload.data.role) {
      return NextResponse.json({ error: "Seçilen giriş türü bu hesapla eşleşmiyor." }, { status: 403 });
    }

    const redirectTo = profile.role === "accountant" ? "/accountant" : "/client";
    const response = NextResponse.json({ ok: true, role: profile.role, redirect_to: redirectTo });
    response.cookies.set(getAppwriteSessionCookieName(), session.secret, appwriteSessionCookieOptions(new Date(session.expire)));

    return response;
  } catch {
    return NextResponse.json({ error: "Email veya sifre hatali." }, { status: 401 });
  }
}
