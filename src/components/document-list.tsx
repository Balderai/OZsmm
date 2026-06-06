import { Download, Eye, FileText } from "lucide-react";
import { FOLDER_LABELS } from "@/lib/constants";
import type { PortalDocument } from "@/types/domain";

export function DocumentList({ documents }: { documents: PortalDocument[] }) {
  if (documents.length === 0) {
    return <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">Bu klasorde henuz evrak yok.</p>;
  }

  return (
    <div className="space-y-2">
      {documents.map((document) => (
        <article key={document.id} className="flex min-h-20 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700">
            <FileText aria-hidden="true" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{document.title}</h3>
            <p className="mt-1 truncate text-xs text-slate-500">
              {FOLDER_LABELS[document.folderType]} · {new Intl.DateTimeFormat("tr-TR").format(new Date(document.createdAt))}
            </p>
          </div>
          {document.origin === "accountant_shared" && (
            <span className="hidden items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 sm:inline-flex">
              <Eye aria-hidden="true" size={13} />
              {document.viewedByClient ? "Okundu" : "Okunmadi"}
            </span>
          )}
          <button
            type="button"
            aria-label={`${document.title} icin indirme baglantisi olustur`}
            className="grid size-10 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            <Download aria-hidden="true" size={18} />
          </button>
        </article>
      ))}
    </div>
  );
}
