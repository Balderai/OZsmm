import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { appConfig } from "@/lib/config";
import { COMPANY_INFO_FOLDERS, DOCUMENT_MONTH_LABELS, STORAGE_BUCKET } from "@/lib/constants";
import { buildDocumentStoragePath } from "@/lib/storage-paths";
import { assertClientAccess, authErrorResponse, requirePortalSessionFromRequest } from "@/lib/auth/appwrite";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadMetadataSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const metadata = uploadMetadataSchema.safeParse({
    client_id: formData.get("client_id"),
    folder_type: formData.get("folder_type"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    file_name: file instanceof File ? file.name : formData.get("file_name"),
    mime_type: file instanceof File ? file.type : formData.get("mime_type"),
    file_size_bytes: file instanceof File ? file.size : Number(formData.get("file_size_bytes")),
    origin: formData.get("origin") || "client_uploaded",
    document_month: formData.get("document_month") || undefined,
    document_type: formData.get("document_type") || undefined,
    sub_folder: formData.get("sub_folder") || undefined,
  });

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!metadata.success) {
    return NextResponse.json({ error: metadata.error.flatten() }, { status: 400 });
  }

  const metadataRuleError = validateFolderMetadata(metadata.data);
  if (metadataRuleError) {
    return NextResponse.json({ error: metadataRuleError }, { status: 400 });
  }

  if (appConfig.mockMode) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      document_id: randomUUID(),
      storage_path: "mock/private/storage-path",
    });
  }

  let session;
  try {
    session = await requirePortalSessionFromRequest(request);
    await assertClientAccess(session, metadata.data.client_id);
  } catch (error) {
    return authErrorResponse(error);
  }

  if (session.profile.role === "client" && metadata.data.folder_type !== "documents_photos") {
    return NextResponse.json({ error: "Mukellef yalnizca Evrak Yukle alanina evrak yukleyebilir." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("id, firm_id, is_active")
    .eq("id", metadata.data.client_id)
    .single();

  if (clientError || !client || client.firm_id !== session.profile.firmId || client.is_active === false) {
    return NextResponse.json({ error: "Mukellef bu firmaya ait degil." }, { status: 403 });
  }

  const documentId = randomUUID();
  const description = buildDocumentDescription(metadata.data);
  const origin = session.profile.role === "accountant" ? "accountant_shared" : "client_uploaded";
  const storagePath = buildDocumentStoragePath({
    firmId: session.profile.firmId,
    clientId: metadata.data.client_id,
    folderType: metadata.data.folder_type,
    documentId,
    fileName: metadata.data.file_name,
    subFolders: buildStorageSubFolders(metadata.data),
  });

  const { error: uploadError } = await admin.storage.from(STORAGE_BUCKET).upload(storagePath, file, {
    contentType: metadata.data.mime_type,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: documentError } = await admin.from("documents").insert({
    id: documentId,
    firm_id: session.profile.firmId,
    client_id: metadata.data.client_id,
    folder_type: metadata.data.folder_type,
    origin,
    title: metadata.data.title,
    description,
    storage_bucket: STORAGE_BUCKET,
    storage_path: storagePath,
    mime_type: metadata.data.mime_type,
    file_size_bytes: metadata.data.file_size_bytes,
    created_by: session.user.id,
    shared_by: origin === "accountant_shared" ? session.user.id : null,
    shared_at: origin === "accountant_shared" ? new Date().toISOString() : null,
  });

  if (documentError) {
    await admin.storage.from(STORAGE_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: documentError.message }, { status: 500 });
  }

  if (origin === "accountant_shared") {
    await admin.from("notifications").insert({
      firm_id: session.profile.firmId,
      client_id: metadata.data.client_id,
      category: "document_shared",
      title: "Yeni evrak paylasildi",
      body: `${metadata.data.title} portala eklendi.`,
      action_url: `/client/folders/${metadata.data.folder_type}`,
      related_document_id: documentId,
      created_by: session.user.id,
    });
  }

  await admin.from("audit_logs").insert({
    firm_id: session.profile.firmId,
    actor_user_id: session.user.id,
    action: "document.upload",
    entity_type: "document",
    entity_id: documentId,
    metadata: {
      folderType: metadata.data.folder_type,
      origin: session.profile.role,
      documentMonth: metadata.data.document_month,
      documentType: metadata.data.document_type,
      subFolder: metadata.data.sub_folder,
    },
  });

  return NextResponse.json({ ok: true, document_id: documentId, storage_path: storagePath });
}

type UploadMetadata = z.infer<typeof uploadMetadataSchema>;

function validateFolderMetadata(metadata: UploadMetadata) {
  const companyInfoFolders: readonly string[] = COMPANY_INFO_FOLDERS;

  if (metadata.folder_type === "declarations" && (!metadata.sub_folder || !companyInfoFolders.includes(metadata.sub_folder))) {
    return "Firma Bilgileri icin alt klasor secin.";
  }

  if (metadata.folder_type === "accruals" && !metadata.document_month) {
    return "Aylik Tahakkuklar icin ay secin.";
  }

  if (metadata.folder_type === "documents_photos") {
    if (!metadata.document_month) return "Evrak yuklemek icin ay secin.";
    if (!metadata.document_type) return "Evrak yuklemek icin evrak turu secin.";
  }

  return undefined;
}

function buildDocumentDescription(metadata: UploadMetadata) {
  const parts = [
    metadata.sub_folder ? `Klasor: ${metadata.sub_folder}` : undefined,
    metadata.document_month ? `Ay: ${DOCUMENT_MONTH_LABELS[metadata.document_month]}` : undefined,
    metadata.document_type ? `Evrak turu: ${metadata.document_type}` : undefined,
    metadata.description,
  ].filter(Boolean);

  return parts.length ? parts.join("\n") : undefined;
}

function buildStorageSubFolders(metadata: UploadMetadata) {
  if (metadata.folder_type === "declarations" && metadata.sub_folder) {
    return [metadata.sub_folder];
  }

  if (metadata.folder_type === "accruals" && metadata.document_month) {
    return [DOCUMENT_MONTH_LABELS[metadata.document_month]];
  }

  if (metadata.folder_type === "documents_photos" && metadata.document_month) {
    return [DOCUMENT_MONTH_LABELS[metadata.document_month], metadata.document_type || "Diger"];
  }

  return undefined;
}
