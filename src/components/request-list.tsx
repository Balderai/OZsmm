import { CheckCircle2, Clock } from "lucide-react";
import type { DocumentRequest } from "@/types/domain";

export function RequestList({ requests }: { requests: DocumentRequest[] }) {
  if (requests.length === 0) {
    return <p className="text-sm text-slate-500">Acik evrak talebi yok.</p>;
  }

  return (
    <div className="space-y-2">
      {requests.map((request) => (
        <article key={request.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <Clock aria-hidden="true" className="mt-0.5 shrink-0 text-amber-700" size={16} />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-amber-950">{request.title}</h3>
              {request.description && <p className="mt-1 text-xs text-amber-900">{request.description}</p>}
              {request.dueAt && (
                <p className="mt-2 text-xs font-medium text-amber-900">
                  Son gun: {new Intl.DateTimeFormat("tr-TR").format(new Date(request.dueAt))}
                </p>
              )}
            </div>
            <CheckCircle2 aria-hidden="true" className="shrink-0 text-amber-700" size={16} />
          </div>
        </article>
      ))}
    </div>
  );
}
