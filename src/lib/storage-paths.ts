import type { FolderType } from "@/types/domain";

function safeFileName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function buildDocumentStoragePath(input: {
  firmId: string;
  clientId: string;
  folderType: FolderType;
  documentId: string;
  fileName: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  return [
    `firm_${input.firmId}`,
    `client_${input.clientId}`,
    input.folderType,
    yyyy,
    mm,
    `${input.documentId}__${safeFileName(input.fileName)}`,
  ].join("/");
}
