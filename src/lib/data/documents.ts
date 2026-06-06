import { appConfig } from "@/lib/config";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { mockDocuments } from "@/lib/data/mock";
import { createAppwriteServices } from "@/lib/appwrite/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FolderType } from "@/types/domain";

type AppwriteDocumentRow = {
  $id: string;
  $createdAt?: string;
  firm_id: string;
  client_id: string;
  folder_type: FolderType;
  origin: "accountant_shared" | "client_uploaded";
  title: string;
  description?: string;
  storage_bucket?: string;
  storage_path: string;
  mime_type?: string;
  file_size_bytes?: number;
  status?: "active" | "archived" | "deleted";
  created_by?: string;
  shared_by?: string;
  shared_at?: string;
  due_at?: string;
};

export async function listClientDocuments(params: { clientId: string; folderType?: FolderType }) {
  if (appConfig.mockMode) {
    return mockDocuments.filter(
      (document) =>
        document.clientId === params.clientId && (!params.folderType || document.folderType === params.folderType),
    );
  }

  if (hasAppwriteServerConfig()) {
    return listAppwriteClientDocuments(params);
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

async function listAppwriteClientDocuments(params: { clientId: string; folderType?: FolderType }) {
  const { tables } = createAppwriteServices();
  const { rows } = await tables.listRows({
    databaseId: appConfig.appwriteDatabaseId,
    tableId: appwriteTables.documents,
  });

  return (rows as unknown as AppwriteDocumentRow[])
    .filter(
      (document) =>
        document.client_id === params.clientId &&
        (document.status ?? "active") === "active" &&
        (!params.folderType || document.folder_type === params.folderType),
    )
    .sort((first, second) => (second.$createdAt || "").localeCompare(first.$createdAt || ""))
    .map((document) => ({
      id: document.$id,
      firmId: document.firm_id,
      clientId: document.client_id,
      folderType: document.folder_type,
      origin: document.origin,
      title: document.title,
      description: document.description,
      storageBucket: document.storage_bucket || appConfig.appwriteBucketId,
      storagePath: document.storage_path,
      mimeType: document.mime_type,
      fileSizeBytes: document.file_size_bytes,
      status: document.status ?? "active",
      createdBy: document.created_by,
      sharedBy: document.shared_by,
      sharedAt: document.shared_at,
      dueAt: document.due_at,
      createdAt: document.$createdAt || new Date().toISOString(),
    }));
}
