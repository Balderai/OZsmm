"use client";

import { Eye } from "lucide-react";
import { DocumentOpenButton } from "@/components/document-open-button";
import { DocumentPreview } from "@/components/document-preview";
import { FOLDER_LABELS } from "@/lib/constants";
import type { PortalDocument } from "@/types/domain";

export function DocumentList({ documents, compact = false }: { documents: PortalDocument[]; compact?: boolean }) {
  if (documents.length === 0) {
    if (compact) return null;

    return <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">Bu klasörde henüz evrak yok.</p>;
  }

  return (
    <div className="space-y-2">
      {documents.map((document) => (
        <article
          key={document.id}
          className={
            compact
              ? "flex min-h-14 items-center gap-2 border-t border-slate-100 pt-2"
              : "flex min-h-20 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
          }
        >
          <DocumentPreview documentId={document.id} title={document.title} mimeType={document.mimeType} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{document.title}</h3>
            <p className="mt-1 truncate text-xs text-slate-500">
              {FOLDER_LABELS[document.folderType]} · {new Intl.DateTimeFormat("tr-TR").format(new Date(document.createdAt))}
            </p>
            {document.description && <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-slate-500">{document.description}</p>}
          </div>
          {document.origin === "accountant_shared" && (
            <span className="hidden items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 sm:inline-flex">
              <Eye aria-hidden="true" size={13} />
              {document.viewedByClient ? "Okundu" : "Okunmadı"}
            </span>
          )}
          <DocumentOpenButton documentId={document.id} title={document.title} />
        </article>
      ))}
    </div>
  );
}
