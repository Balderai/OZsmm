import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DocumentList } from "@/components/document-list";
import { requirePortalSession } from "@/lib/auth/appwrite";
import {
  COMPANY_INFO_FOLDERS,
  DOCUMENT_MONTH_FOLDERS,
  DOCUMENT_MONTH_LABELS,
  DOCUMENT_MONTH_VALUES,
  FOLDER_DESCRIPTIONS,
  FOLDER_LABELS,
  FOLDER_TYPES,
  UPLOAD_DOCUMENT_TYPES,
} from "@/lib/constants";
import { appConfig } from "@/lib/config";
import { getClientCompany, getDefaultClientCompany } from "@/lib/data/clients";
import { listClientDocuments } from "@/lib/data/documents";
import type { FolderType, PortalDocument } from "@/types/domain";

export default async function FolderPage({ params }: { params: Promise<{ folderType: string }> }) {
  const { folderType } = await params;

  if (!FOLDER_TYPES.includes(folderType as FolderType)) {
    notFound();
  }

  const typedFolder = folderType as FolderType;
  const session = appConfig.mockMode ? null : await requirePortalSession("client");

  if (!appConfig.mockMode && !session) {
    redirect("/login");
  }

  const membership = session?.memberships[0];
  const client = membership
    ? await getClientCompany(membership.clientId, membership.firmId)
    : await getDefaultClientCompany(session?.profile.firmId);

  if (!client) {
    redirect("/login");
  }

  const documents = await listClientDocuments({ clientId: client.id, folderType: typedFolder, firmId: client.firmId });

  return (
    <AppShell activeRole="client" eyebrow="Klasor" profile={session?.profile}>
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/client" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold">
          <ChevronLeft aria-hidden="true" size={16} />
          Geri
        </Link>
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-2xl font-semibold">{FOLDER_LABELS[typedFolder]}</h1>
          <p className="mt-1 text-sm text-slate-600">{FOLDER_DESCRIPTIONS[typedFolder]}</p>
        </section>
        {typedFolder === "documents_photos" ? (
          <UploadedDocumentFolders documents={documents} />
        ) : (
          <>
            <SubfolderGrid folderType={typedFolder} documents={documents} />
            <DocumentList documents={documents} />
          </>
        )}
      </div>
    </AppShell>
  );
}

function SubfolderGrid({ folderType, documents }: { folderType: FolderType; documents: PortalDocument[] }) {
  const folders = getSubfolders(folderType);

  if (folders.length === 0) return null;

  return (
    <section aria-label="Alt klasörler" className="grid gap-2 sm:grid-cols-2">
      {folders.map((folder) => (
        <div key={folder} className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <span className="grid size-9 place-items-center rounded-md bg-slate-100 text-slate-700">
            <FolderOpen aria-hidden="true" size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{folder}</p>
            <p className="mt-0.5 text-xs text-slate-500">{countFolderDocuments(documents, folder)} evrak</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function getSubfolders(folderType: FolderType) {
  if (folderType === "declarations") return [...COMPANY_INFO_FOLDERS];
  if (folderType === "accruals") return DOCUMENT_MONTH_FOLDERS;
  return [];
}

function countFolderDocuments(documents: PortalDocument[], folder: string) {
  return documents.filter((document) => document.description?.includes(folder)).length;
}

function UploadedDocumentFolders({ documents }: { documents: PortalDocument[] }) {
  return (
    <section aria-label="Ay klasörleri" className="grid gap-2 sm:grid-cols-2">
      {DOCUMENT_MONTH_VALUES.map((month) => {
        const monthLabel = DOCUMENT_MONTH_LABELS[month];
        const monthDocuments = documents.filter((document) => getDocumentMonth(document) === monthLabel);

        return (
          <details key={month} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
              <span className="grid size-9 place-items-center rounded-md bg-slate-100 text-slate-700">
                <FolderOpen aria-hidden="true" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{monthLabel}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{monthDocuments.length} evrak</span>
              </span>
              <ChevronRight aria-hidden="true" size={18} className="text-slate-400" />
            </summary>
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              {UPLOAD_DOCUMENT_TYPES.map((documentType) => {
                const categoryDocuments = monthDocuments.filter((document) => getDocumentType(document) === documentType);

                return (
                  <details key={`${monthLabel}-${documentType}`} className="rounded-md border border-slate-200 p-2">
                    <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                      <span className="grid size-8 place-items-center rounded-md bg-slate-100 text-slate-700">
                        <FolderOpen aria-hidden="true" size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{documentType}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{categoryDocuments.length} evrak</span>
                      </span>
                      <ChevronRight aria-hidden="true" size={16} className="text-slate-400" />
                    </summary>
                    {categoryDocuments.length > 0 && (
                      <div className="mt-3">
                        <DocumentList documents={categoryDocuments} compact />
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          </details>
        );
      })}
    </section>
  );
}

function getDocumentMonth(document: PortalDocument) {
  const descriptionMonth = extractDescriptionValue(document.description, "Ay");

  if (descriptionMonth) {
    return descriptionMonth;
  }

  const createdAt = new Date(document.createdAt);
  const monthValue = DOCUMENT_MONTH_VALUES[createdAt.getMonth()];

  return DOCUMENT_MONTH_LABELS[monthValue];
}

function getDocumentType(document: PortalDocument) {
  const descriptionType = extractDescriptionValue(document.description, "Evrak türü");
  const uploadTypes: readonly string[] = UPLOAD_DOCUMENT_TYPES;

  if (descriptionType && uploadTypes.includes(descriptionType)) {
    return descriptionType;
  }

  return "Diğer";
}

function extractDescriptionValue(description: string | undefined, label: string) {
  return description
    ?.split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith(`${label}: `))
    ?.replace(`${label}: `, "")
    .trim();
}
