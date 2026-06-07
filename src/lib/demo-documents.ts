import {
  COMPANY_INFO_FOLDERS,
  DOCUMENT_MONTH_LABELS,
  DOCUMENT_MONTH_VALUES,
  STORAGE_BUCKET,
  UPLOAD_DOCUMENT_TYPES,
} from "@/lib/constants";
import type { DocumentOrigin, FolderType, PortalDocument } from "@/types/domain";

export const DEMO_DOCUMENTS_CHANGED_EVENT = "demo-documents-changed";

const DEMO_DOCUMENTS_KEY = "demo-portal-documents";

type DemoDocumentFilter = {
  clientId?: string;
  folderType?: FolderType;
};

export function readDemoDocuments(filter?: DemoDocumentFilter) {
  if (typeof window === "undefined") return [];

  try {
    const documents = JSON.parse(window.localStorage.getItem(DEMO_DOCUMENTS_KEY) || "[]") as PortalDocument[];

    return documents.filter(
      (document) =>
        (!filter?.clientId || document.clientId === filter.clientId) &&
        (!filter?.folderType || document.folderType === filter.folderType),
    );
  } catch {
    return [];
  }
}

export function saveDemoDocument(document: PortalDocument) {
  if (typeof window === "undefined") return;

  const documents = readDemoDocuments();
  window.localStorage.setItem(
    DEMO_DOCUMENTS_KEY,
    JSON.stringify([document, ...documents.filter((current) => current.id !== document.id)]),
  );
  window.dispatchEvent(new Event(DEMO_DOCUMENTS_CHANGED_EVENT));
}

export function mergePortalDocuments(initialDocuments: PortalDocument[], demoDocuments: PortalDocument[]) {
  const initialIds = new Set(initialDocuments.map((document) => document.id));

  return [
    ...demoDocuments.filter((document) => !initialIds.has(document.id)),
    ...initialDocuments,
  ];
}

export function createDemoDocumentFromUpload({
  clientId,
  firmId,
  folderType,
  origin,
  title,
  file,
  formData,
}: {
  clientId: string;
  firmId?: string;
  folderType: FolderType;
  origin: DocumentOrigin;
  title: string;
  file: File;
  formData: FormData;
}): PortalDocument {
  const now = new Date().toISOString();
  const documentId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id: documentId,
    firmId: firmId || "demo-firm",
    clientId,
    folderType,
    origin,
    title: title.trim() || file.name,
    description: buildDemoDescription(folderType, formData),
    storageBucket: STORAGE_BUCKET,
    storagePath: `demo/${clientId}/${folderType}/${documentId}/${file.name}`,
    mimeType: file.type || undefined,
    fileSizeBytes: file.size,
    status: "active",
    createdAt: now,
    createdBy: origin === "client_uploaded" ? "demo-client" : undefined,
    sharedBy: origin === "accountant_shared" ? "demo-accountant" : undefined,
    sharedAt: origin === "accountant_shared" ? now : undefined,
    viewedByClient: false,
  };
}

function buildDemoDescription(folderType: FolderType, formData: FormData) {
  if (folderType === "declarations") {
    return `Klasör: ${readFormString(formData, "sub_folder") || COMPANY_INFO_FOLDERS[0]}`;
  }

  if (folderType === "accruals") {
    const month = readFormString(formData, "document_month");
    return `Ay: ${getDemoMonthLabel(month)}`;
  }

  const month = readFormString(formData, "document_month");
  const documentType = readFormString(formData, "document_type");

  return [
    `Ay: ${getDemoMonthLabel(month)}`,
    `Evrak türü: ${getDemoDocumentType(documentType)}`,
  ].join("\n");
}

function getDemoMonthLabel(month: string | undefined) {
  const monthValues: readonly string[] = DOCUMENT_MONTH_VALUES;
  const safeMonth = month && monthValues.includes(month) ? month : DOCUMENT_MONTH_VALUES[0];

  return DOCUMENT_MONTH_LABELS[safeMonth as (typeof DOCUMENT_MONTH_VALUES)[number]];
}

function getDemoDocumentType(documentType: string | undefined) {
  const documentTypes: readonly string[] = UPLOAD_DOCUMENT_TYPES;

  return documentType && documentTypes.includes(documentType) ? documentType : UPLOAD_DOCUMENT_TYPES[0];
}

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
