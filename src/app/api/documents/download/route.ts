import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { createAppwriteServices } from "@/lib/appwrite/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AppwriteDocumentRow = {
  $id: string;
  storage_bucket?: string;
  storage_path: string;
  mime_type?: string;
  title?: string;
};

export async function GET(request: Request) {
  const documentId = new URL(request.url).searchParams.get("document_id");

  if (!documentId) {
    return NextResponse.json({ error: "document_id is required" }, { status: 400 });
  }

  if (hasAppwriteServerConfig()) {
    const { tables, storage } = createAppwriteServices();
    const document = (await tables.getRow({
      databaseId: appConfig.appwriteDatabaseId,
      tableId: appwriteTables.documents,
      rowId: documentId,
    })) as unknown as AppwriteDocumentRow;

    const bytes = await storage.getFileDownload({
      bucketId: document.storage_bucket || appConfig.appwriteBucketId,
      fileId: document.storage_path,
    });

    return new Response(bytes, {
      headers: {
        "content-type": document.mime_type || "application/octet-stream",
        "content-disposition": `inline; filename="${encodeURIComponent(document.title || "document")}"`,
      },
    });
  }

  const admin = createAdminClient();
  const { data: document, error: documentError } = await admin
    .from("documents")
    .select("storage_bucket, storage_path, mime_type, title")
    .eq("id", documentId)
    .single();

  if (documentError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
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
