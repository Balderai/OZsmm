import { NextResponse } from "next/server";
import { assertClientAccess, authErrorResponse, requirePortalSessionFromRequest } from "@/lib/auth/appwrite";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const documentId = new URL(request.url).searchParams.get("document_id");

  if (!documentId) {
    return NextResponse.json({ error: "document_id is required" }, { status: 400 });
  }

  let session;
  try {
    session = await requirePortalSessionFromRequest(request);
  } catch (error) {
    return authErrorResponse(error);
  }

  const admin = createAdminClient();
  const { data: document, error: documentError } = await admin
    .from("documents")
    .select("firm_id, client_id, storage_bucket, storage_path, mime_type, title, status")
    .eq("id", documentId)
    .single();

  if (documentError || !document || document.status === "deleted" || document.firm_id !== session.profile.firmId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    await assertClientAccess(session, document.client_id);
  } catch (error) {
    return authErrorResponse(error);
  }

  const { data, error } = await admin.storage.from(document.storage_bucket).download(document.storage_path);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new Response(data, {
    headers: {
      "content-type": document.mime_type || "application/octet-stream",
      "content-disposition": `inline; filename="${encodeURIComponent(document.title || "document")}"`,
    },
  });
}
