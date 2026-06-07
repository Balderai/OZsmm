import { Bell, Building2, FileUp, FolderOpen, ReceiptText, type LucideIcon } from "lucide-react";
import type { AppRole, FolderType, NotificationCategory } from "@/types/domain";

export const FOLDER_TYPES = ["declarations", "accruals", "documents_photos"] as const satisfies readonly FolderType[];

export const FOLDER_LABELS: Record<FolderType, string> = {
  declarations: "Firma Bilgileri",
  accruals: "Aylık Tahakkuklar",
  documents_photos: "Evrak Yükle",
};

export const FOLDER_DESCRIPTIONS: Record<FolderType, string> = {
  declarations: "Müşavirinizin paylaştığı resmi belgeler ve mali veriler.",
  accruals: "Müşavirinizin ay ay paylaştığı tahakkuk evrakları.",
  documents_photos: "Ay ve evrak türü seçerek belge yükleme alanı.",
};

export const FOLDER_ICONS: Record<FolderType, LucideIcon> = {
  declarations: Building2,
  accruals: ReceiptText,
  documents_photos: FileUp,
};

export const COMPANY_INFO_FOLDERS = ["01_Firma Resmi Belgeler", "02_Mali Veriler"] as const;

export const DOCUMENT_MONTH_VALUES = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const;

export const DOCUMENT_MONTH_FOLDERS = [
  "01_Ocak",
  "02_Şubat",
  "03_Mart",
  "04_Nisan",
  "05_Mayıs",
  "06_Haziran",
  "07_Temmuz",
  "08_Ağustos",
  "09_Eylül",
  "10_Ekim",
  "11_Kasım",
  "12_Aralık",
] as const;

export const DOCUMENT_MONTH_LABELS: Record<(typeof DOCUMENT_MONTH_VALUES)[number], string> = {
  "01": DOCUMENT_MONTH_FOLDERS[0],
  "02": DOCUMENT_MONTH_FOLDERS[1],
  "03": DOCUMENT_MONTH_FOLDERS[2],
  "04": DOCUMENT_MONTH_FOLDERS[3],
  "05": DOCUMENT_MONTH_FOLDERS[4],
  "06": DOCUMENT_MONTH_FOLDERS[5],
  "07": DOCUMENT_MONTH_FOLDERS[6],
  "08": DOCUMENT_MONTH_FOLDERS[7],
  "09": DOCUMENT_MONTH_FOLDERS[8],
  "10": DOCUMENT_MONTH_FOLDERS[9],
  "11": DOCUMENT_MONTH_FOLDERS[10],
  "12": DOCUMENT_MONTH_FOLDERS[11],
};

export const UPLOAD_DOCUMENT_TYPES = [
  "Fiş",
  "Fatura",
  "Serbest Meslek Makbuzu",
  "Gider Pusulası",
  "Yurtdışı Fatura",
  "Diğer",
] as const;

export const ACCOUNTANT_SUB_FOLDER_VALUES = [...COMPANY_INFO_FOLDERS, ...DOCUMENT_MONTH_FOLDERS] as const;

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
