import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FOLDER_ICONS, FOLDER_LABELS } from "@/lib/constants";
import type { FolderType } from "@/types/domain";

export function FolderCard({ folderType, count }: { folderType: FolderType; count: number }) {
  const Icon = FOLDER_ICONS[folderType];

  return (
    <Link
      href={`/client/folders/${folderType}`}
      className="grid min-h-24 grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-cyan-700"
    >
      <span className="grid size-11 place-items-center rounded-md bg-cyan-50 text-cyan-800">
        <Icon aria-hidden="true" size={22} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base font-semibold">{FOLDER_LABELS[folderType]}</span>
        <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{count} evrak</span>
      </span>
      <ChevronRight aria-hidden="true" className="text-slate-400" size={20} />
    </Link>
  );
}
