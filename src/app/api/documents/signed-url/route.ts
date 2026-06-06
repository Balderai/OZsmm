import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { signedUrlPayloadSchema } from "@/lib/validators";

type SignedUrlDocument = {
  id: string;
  firm_id: string;
  storage_bucket: string;
  storage_path: string;
  origin: "accountant_shared" | "client_uploaded";
};

export async function POST(request: Request) {
  const payload = signedUrlPayloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  if (appConfig.mockMode) {
    return NextResponse.json({ signed_url: `/mock-documents/${payload.data.document_id}.pdf`, mode: "mock" });
  }

  if (hasAppwriteServerConfig()) {
    return NextResponse.json({ signed_url: `/api/documents/download?document_id=${payload.data.document_id}` });
  }

  const supabase = await createServerSupabaseClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: documentData, error: documentError } = await supabase
    .from("documents")
    .select("id, firm_id, storage_bucket, storage_path, origin")
    .eq("id", payload.data.document_id)
    .eq("status", "active")
    .single();

  const document = documentData as SignedUrlDocument | null;

  if (documentError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: signed, error: signedError } = await admin.storage
    .from(document.storage_bucket)
    .createSignedUrl(document.storage_path, 60 * 5);

  if (signedError) {
    return NextResponse.json({ error: signedError.message }, { status: 500 });
  }

  if (document.origin === "accountant_shared") {
    await admin.from("document_views").upsert(
      {
        firm_id: document.firm_id,
        document_id: document.id,
        user_id: userResult.user.id,
      },
      { onConflict: "document_id,user_id" },
    );
  }

  return NextResponse.json({ signed_url: signed.signedUrl });
}
