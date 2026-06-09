import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loginPayloadSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const payload = loginPayloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Email veya sifre gecersiz." }, { status: 400 });
  }

  if (appConfig.mockMode) {
    const redirectTo = payload.data.role === "accountant" ? "/accountant" : "/client";

    return NextResponse.json({ ok: true, mode: "mock", role: payload.data.role, redirect_to: redirectTo });
  }

  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: payload.data.email,
    password: payload.data.password,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Email veya sifre hatali." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile || profile.is_active === false) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Hesap pasif veya profil bulunamadi." }, { status: 403 });
  }

  if (profile.role !== payload.data.role) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Secilen giris turu bu hesapla eslesmiyor." }, { status: 403 });
  }

  const redirectTo = profile.role === "accountant" ? "/accountant" : "/client";
  return NextResponse.json({ ok: true, role: profile.role, redirect_to: redirectTo });
}
