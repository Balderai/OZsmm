import { Bell, Camera, FileText, FolderOpen, ReceiptText, type LucideIcon } from "lucide-react";
import type { AppRole, FolderType, NotificationCategory } from "@/types/domain";

export const FOLDER_TYPES = ["declarations", "accruals", "documents_photos"] as const satisfies readonly FolderType[];

export const FOLDER_LABELS: Record<FolderType, string> = {
  declarations: "Beyannameler",
  accruals: "Tahakkuklar",
  documents_photos: "Evrak ve Fotograflar",
};

export const FOLDER_ICONS: Record<FolderType, LucideIcon> = {
  declarations: FileText,
  accruals: ReceiptText,
  documents_photos: Camera,
};

export const ROLE_LABELS: Record<AppRole, string> = {
  accountant: "Mali musavir",
  client: "Mukellef",
};

export const NOTIFICATION_LABELS: Record<NotificationCategory, string> = {
  document_shared: "Evrak paylasildi",
  document_request: "Evrak talebi",
  reminder: "Hatirlatma",
  request_completed: "Talep tamamlandi",
  system: "Sistem",
};

export const ACTION_ICONS = {
  bell: Bell,
  folder: FolderOpen,
};

export const STORAGE_BUCKET = "client-documents";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
] as const;
