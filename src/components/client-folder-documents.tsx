"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";
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
    return <UploadedDocumentNavigator documents={visibleDocuments} />;
  }

  return <ManagedDocumentNavigator folderType={folderType} documents={visibleDocuments} />;
}

function ManagedDocumentNavigator({ folderType, documents }: { folderType: FolderType; documents: PortalDocument[] }) {
  const folders = folderType === "declarations" ? [...COMPANY_INFO_FOLDERS] : DOCUMENT_MONTH_FOLDERS;
  const [activeFolder, setActiveFolder] = useState<string>();

  if (activeFolder) {
    const folderDocuments = documents.filter((document) => getManagedFolderLabel(document, folderType) === activeFolder);

    return (
      <section className="space-y-3">
        <SubfolderHeader title={activeFolder} count={folderDocuments.length} onBack={() => setActiveFolder(undefined)} />
        <DocumentList documents={folderDocuments} />
      </section>
    );
  }

  return (
    <FolderGrid
      ariaLabel="Alt klasorler"
      folders={folders.map((folder) => ({
        label: folder,
        count: documents.filter((document) => getManagedFolderLabel(document, folderType) === folder).length,
        onOpen: () => setActiveFolder(folder),
      }))}
    />
  );
}

function UploadedDocumentNavigator({ documents }: { documents: PortalDocument[] }) {
  const [activeMonth, setActiveMonth] = useState<string>();
  const [activeDocumentType, setActiveDocumentType] = useState<string>();

  if (activeMonth && activeDocumentType) {
    const monthDocuments = documents.filter((document) => getDocumentMonth(document) === activeMonth);
    const categoryDocuments = monthDocuments.filter((document) => getDocumentType(document) === activeDocumentType);

    return (
      <section className="space-y-3">
        <SubfolderHeader
          title={activeDocumentType}
          subtitle={activeMonth}
          count={categoryDocuments.length}
          onBack={() => setActiveDocumentType(undefined)}
        />
        <DocumentList documents={categoryDocuments} />
      </section>
    );
  }

  if (activeMonth) {
    const monthDocuments = documents.filter((document) => getDocumentMonth(document) === activeMonth);

    return (
      <section className="space-y-3">
        <SubfolderHeader
          title={activeMonth}
          count={monthDocuments.length}
          onBack={() => {
            setActiveMonth(undefined);
            setActiveDocumentType(undefined);
          }}
        />
        <FolderGrid
          ariaLabel={`${activeMonth} evrak turleri`}
          folders={UPLOAD_DOCUMENT_TYPES.map((documentType) => ({
            label: documentType,
            count: monthDocuments.filter((document) => getDocumentType(document) === documentType).length,
            onOpen: () => setActiveDocumentType(documentType),
          }))}
        />
      </section>
    );
  }

  return (
    <FolderGrid
      ariaLabel="Ay klasorleri"
      folders={DOCUMENT_MONTH_VALUES.map((month) => {
        const monthLabel = DOCUMENT_MONTH_LABELS[month];

        return {
          label: monthLabel,
          count: documents.filter((document) => getDocumentMonth(document) === monthLabel).length,
          onOpen: () => setActiveMonth(monthLabel),
        };
      })}
    />
  );
}

function FolderGrid({
  ariaLabel,
  folders,
}: {
  ariaLabel: string;
  folders: Array<{ label: string; count: number; onOpen: () => void }>;
}) {
  return (
    <section aria-label={ariaLabel} className="grid gap-2 sm:grid-cols-2">
      {folders.map((folder) => (
        <button
          key={folder.label}
          type="button"
          onClick={folder.onOpen}
          className="grid min-h-16 grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-cyan-700"
        >
          <span className="grid size-10 place-items-center rounded-md bg-slate-100 text-slate-700">
            <FolderOpen aria-hidden="true" size={18} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{folder.label}</span>
            <span className="mt-0.5 block text-xs text-slate-500">{folder.count} evrak</span>
          </span>
          <ChevronRight aria-hidden="true" size={18} className="text-slate-400" />
        </button>
      ))}
    </section>
  );
}

function SubfolderHeader({
  title,
  subtitle,
  count,
  onBack,
}: {
  title: string;
  subtitle?: string;
  count: number;
  onBack: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold hover:bg-slate-100"
      >
        <ChevronLeft aria-hidden="true" size={16} />
        Geri
      </button>
      <div className="mt-3 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-slate-100 text-slate-700">
          <FolderOpen aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0">
          {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
          <h2 className="truncate text-base font-semibold">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{count} evrak</p>
        </div>
      </div>
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
