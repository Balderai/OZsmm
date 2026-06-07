"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, FolderOpen } from "lucide-react";
import { DocumentList } from "@/components/document-list";
import {
  COMPANY_INFO_FOLDERS,
  DOCUMENT_MONTH_FOLDERS,
  DOCUMENT_MONTH_LABELS,
  DOCUMENT_MONTH_VALUES,
  UPLOAD_DOCUMENT_TYPES,
} from "@/lib/constants";
import { DEMO_DOCUMENTS_CHANGED_EVENT, mergePortalDocuments, readDemoDocuments } from "@/lib/demo-documents";
import type { FolderType, PortalDocument } from "@/types/domain";

export function ClientFolderDocuments({
  clientId,
  folderType,
  documents,
}: {
  clientId: string;
  folderType: FolderType;
  documents: PortalDocument[];
}) {
  const [demoDocuments, setDemoDocuments] = useState<PortalDocument[]>([]);
  const visibleDocuments = useMemo(() => mergePortalDocuments(documents, demoDocuments), [documents, demoDocuments]);

  useEffect(() => {
    function refreshDemoDocuments() {
      setDemoDocuments(readDemoDocuments({ clientId, folderType }));
    }

    refreshDemoDocuments();
    window.addEventListener(DEMO_DOCUMENTS_CHANGED_EVENT, refreshDemoDocuments);
    window.addEventListener("storage", refreshDemoDocuments);

    return () => {
      window.removeEventListener(DEMO_DOCUMENTS_CHANGED_EVENT, refreshDemoDocuments);
      window.removeEventListener("storage", refreshDemoDocuments);
    };
  }, [clientId, folderType]);

  if (folderType === "documents_photos") {
    return <UploadedDocumentFolders documents={visibleDocuments} />;
  }

  return <ManagedDocumentFolders folderType={folderType} documents={visibleDocuments} />;
}

function ManagedDocumentFolders({ folderType, documents }: { folderType: FolderType; documents: PortalDocument[] }) {
  const folders = folderType === "declarations" ? [...COMPANY_INFO_FOLDERS] : DOCUMENT_MONTH_FOLDERS;

  return (
    <section aria-label="Alt klasorler" className="grid gap-2 sm:grid-cols-2">
      {folders.map((folder) => {
        const folderDocuments = documents.filter((document) => getManagedFolderLabel(document, folderType) === folder);

        return (
          <details key={folder} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
              <span className="grid size-9 place-items-center rounded-md bg-slate-100 text-slate-700">
                <FolderOpen aria-hidden="true" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{folder}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{folderDocuments.length} evrak</span>
              </span>
              <ChevronRight aria-hidden="true" size={18} className="text-slate-400" />
            </summary>
            {folderDocuments.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <DocumentList documents={folderDocuments} compact />
              </div>
            )}
          </details>
        );
      })}
    </section>
  );
}

function UploadedDocumentFolders({ documents }: { documents: PortalDocument[] }) {
  return (
    <section aria-label="Ay klasorleri" className="grid gap-2 sm:grid-cols-2">
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

function getManagedFolderLabel(document: PortalDocument, folderType: FolderType) {
  if (folderType === "declarations") {
    return extractDescriptionValue(document.description, "Klasör") || COMPANY_INFO_FOLDERS[0];
  }

  if (folderType === "accruals") {
    return getDocumentMonth(document);
  }

  return "";
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
