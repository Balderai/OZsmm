import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, FolderOpen } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DocumentList } from "@/components/document-list";
import { UploadDialog } from "@/components/upload-dialog";
import { requirePortalSession } from "@/lib/auth/appwrite";
import { COMPANY_INFO_FOLDERS, DOCUMENT_MONTH_FOLDERS, FOLDER_DESCRIPTIONS, FOLDER_LABELS, FOLDER_TYPES } from "@/lib/constants";
import { appConfig } from "@/lib/config";
import { getClientCompany, getDefaultClientCompany } from "@/lib/data/clients";
import { listClientDocuments } from "@/lib/data/documents";
import type { FolderType } from "@/types/domain";

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
        <SubfolderGrid folderType={typedFolder} documents={documents} />
        {typedFolder === "documents_photos" && <UploadDialog clientId={client.id} folderType={typedFolder} />}
        <DocumentList documents={documents} />
      </div>
    </AppShell>
  );
}

function SubfolderGrid({ folderType, documents }: { folderType: FolderType; documents: Awaited<ReturnType<typeof listClientDocuments>> }) {
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
  if (folderType === "accruals" || folderType === "documents_photos") return DOCUMENT_MONTH_FOLDERS;
  return [];
}

function countFolderDocuments(documents: Awaited<ReturnType<typeof listClientDocuments>>, folder: string) {
  return documents.filter((document) => document.description?.includes(folder)).length;
}
