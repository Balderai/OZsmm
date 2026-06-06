import { appConfig } from "@/lib/config";
import { mockDocuments } from "@/lib/data/mock";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FolderType } from "@/types/domain";

export async function listClientDocuments(params: { clientId: string; folderType?: FolderType }) {
  if (appConfig.mockMode) {
    return mockDocuments.filter(
      (document) =>
        document.clientId === params.clientId && (!params.folderType || document.folderType === params.folderType),
    );
  }

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("documents")
    .select("*")
    .eq("client_id", params.clientId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (params.folderType) {
    query = query.eq("folder_type", params.folderType);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data.map((document) => ({
    id: document.id,
    firmId: document.firm_id,
    clientId: document.client_id,
    folderType: document.folder_type,
    origin: document.origin,
    title: document.title,
    description: document.description ?? undefined,
    storageBucket: document.storage_bucket,
    storagePath: document.storage_path,
    mimeType: document.mime_type ?? undefined,
    fileSizeBytes: document.file_size_bytes ?? undefined,
    status: document.status,
    createdBy: document.created_by ?? undefined,
    sharedBy: document.shared_by ?? undefined,
    sharedAt: document.shared_at ?? undefined,
    dueAt: document.due_at ?? undefined,
    createdAt: document.created_at,
  }));
}
