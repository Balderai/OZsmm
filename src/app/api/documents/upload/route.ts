import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { STORAGE_BUCKET } from "@/lib/constants";
import { buildDocumentStoragePath } from "@/lib/storage-paths";
import { createAppwriteServices } from "@/lib/appwrite/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { uploadMetadataSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const metadata = uploadMetadataSchema.safeParse({
    client_id: formData.get("client_id"),
    folder_type: formData.get("folder_type"),
    title: formData.get("title"),
    file_name: file instanceof File ? file.name : formData.get("file_name"),
    mime_type: file instanceof File ? file.type : formData.get("mime_type"),
    file_size_bytes: file instanceof File ? file.size : Number(formData.get("file_size_bytes")),
    origin: formData.get("origin") || "client_uploaded",
  });

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!metadata.success) {
    return NextResponse.json({ error: metadata.error.flatten() }, { status: 400 });
  }

  if (appConfig.mockMode) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      document_id: randomUUID(),
      storage_path: "mock/private/storage-path",
    });
  }

  if (hasAppwriteServerConfig()) {
    if (metadata.data.origin === "client_uploaded" && metadata.data.folder_type !== "documents_photos") {
      return NextResponse.json({ error: "Clients can upload only to Evrak ve Fotograflar" }, { status: 403 });
    }

    const documentId = randomUUID();
    const storagePath = documentId;
    const { storage, tables } = createAppwriteServices();

    await storage.createFile({
      bucketId: appConfig.appwriteBucketId,
      fileId: documentId,
      file,
    });

    await tables.upsertRow({
      databaseId: appConfig.appwriteDatabaseId,
      tableId: appwriteTables.documents,
      rowId: documentId,
      data: stripUndefined({
        firm_id: "11111111-1111-4111-8111-111111111111",
        client_id: metadata.data.client_id,
        folder_type: metadata.data.folder_type,
        origin: metadata.data.origin,
        title: metadata.data.title,
        storage_bucket: appConfig.appwriteBucketId,
        storage_path: storagePath,
        mime_type: metadata.data.mime_type,
        file_size_bytes: metadata.data.file_size_bytes,
        status: "active",
        shared_at: metadata.data.origin === "accountant_shared" ? new Date().toISOString() : undefined,
      }),
    });

    if (metadata.data.origin === "accountant_shared") {
      await tables.createRow({
        databaseId: appConfig.appwriteDatabaseId,
        tableId: appwriteTables.notifications,
        rowId: randomUUID(),
        data: stripUndefined({
          firm_id: "11111111-1111-4111-8111-111111111111",
          client_id: metadata.data.client_id,
          category: "document_shared",
          title: "Yeni evrak paylasildi",
          body: `${metadata.data.title} portala eklendi.`,
          action_url: `/client/folders/${metadata.data.folder_type}`,
        }),
      });
    }

    return NextResponse.json({ ok: true, document_id: documentId, storage_path: storagePath });
  }

  const supabase = await createServerSupabaseClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", userResult.user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  if (profile.role === "client" && metadata.data.folder_type !== "documents_photos") {
    return NextResponse.json({ error: "Clients can upload only to Evrak ve Fotograflar" }, { status: 403 });
  }

  const documentId = randomUUID();
  const storagePath = buildDocumentStoragePath({
    firmId: profile.firm_id,
    clientId: metadata.data.client_id,
    folderType: metadata.data.folder_type,
    documentId,
    fileName: metadata.data.file_name,
  });

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage.from(STORAGE_BUCKET).upload(storagePath, file, {
    contentType: metadata.data.mime_type,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: documentError } = await admin.from("documents").insert({
    id: documentId,
    firm_id: profile.firm_id,
    client_id: metadata.data.client_id,
    folder_type: metadata.data.folder_type,
    origin: profile.role === "accountant" ? "accountant_shared" : "client_uploaded",
    title: metadata.data.title,
    storage_bucket: STORAGE_BUCKET,
    storage_path: storagePath,
    mime_type: metadata.data.mime_type,
    file_size_bytes: metadata.data.file_size_bytes,
    created_by: userResult.user.id,
    shared_by: profile.role === "accountant" ? userResult.user.id : null,
    shared_at: profile.role === "accountant" ? new Date().toISOString() : null,
  });

  if (documentError) {
    await admin.storage.from(STORAGE_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: documentError.message }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    firm_id: profile.firm_id,
    actor_user_id: userResult.user.id,
    action: "document.upload",
    entity_type: "document",
    entity_id: documentId,
    metadata: { folderType: metadata.data.folder_type, origin: profile.role },
  });

  return NextResponse.json({ ok: true, document_id: documentId, storage_path: storagePath });
}

function stripUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
