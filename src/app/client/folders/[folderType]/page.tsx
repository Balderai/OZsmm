import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ClientFolderDocuments } from "@/components/client-folder-documents";
import { requirePortalSession } from "@/lib/auth/appwrite";
import { FOLDER_DESCRIPTIONS, FOLDER_LABELS, FOLDER_TYPES } from "@/lib/constants";
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
        <ClientFolderDocuments clientId={client.id} folderType={typedFolder} documents={documents} />
      </div>
    </AppShell>
  );
}
