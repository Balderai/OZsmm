import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DocumentList } from "@/components/document-list";
import { UploadDialog } from "@/components/upload-dialog";
import { FOLDER_LABELS, FOLDER_TYPES } from "@/lib/constants";
import { getDefaultClient } from "@/lib/data/mock";
import { listClientDocuments } from "@/lib/data/documents";
import type { FolderType } from "@/types/domain";

export default async function FolderPage({ params }: { params: Promise<{ folderType: string }> }) {
  const { folderType } = await params;

  if (!FOLDER_TYPES.includes(folderType as FolderType)) {
    notFound();
  }

  const typedFolder = folderType as FolderType;
  const client = getDefaultClient();
  const documents = await listClientDocuments({ clientId: client.id, folderType: typedFolder });

  return (
    <AppShell activeRole="client" eyebrow="Klasor">
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/client" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold">
          <ChevronLeft aria-hidden="true" size={16} />
          Geri
        </Link>
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-2xl font-semibold">{FOLDER_LABELS[typedFolder]}</h1>
          <p className="mt-1 text-sm text-slate-600">{client.companyName} icin paylasilan ve yuklenen evraklar.</p>
        </section>
        {typedFolder === "documents_photos" && <UploadDialog />}
        <DocumentList documents={documents} />
      </div>
    </AppShell>
  );
}
