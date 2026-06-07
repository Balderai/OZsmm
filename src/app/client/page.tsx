import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { FolderCard } from "@/components/folder-card";
import { InvoiceVatOverview } from "@/components/invoice-vat-overview";
import { NotificationBell } from "@/components/notification-bell";
import { UploadDialog } from "@/components/upload-dialog";
import { requirePortalSession } from "@/lib/auth/appwrite";
import { FOLDER_TYPES } from "@/lib/constants";
import { appConfig } from "@/lib/config";
import { listClientDocuments } from "@/lib/data/documents";
import { getClientCompany, getDefaultClientCompany } from "@/lib/data/clients";
import { mockFirm } from "@/lib/data/mock";
import { listClientNotifications } from "@/lib/data/notifications";

export default async function ClientPage() {
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

  const [notifications, documents] = await Promise.all([
    listClientNotifications(client.id, client.firmId),
    listClientDocuments({ clientId: client.id, firmId: client.firmId }),
  ]);
  const folderCounts = Object.fromEntries(
    FOLDER_TYPES.map((folderType) => [folderType, documents.filter((document) => document.folderType === folderType).length]),
  ) as Record<(typeof FOLDER_TYPES)[number], number>;

  return (
    <AppShell activeRole="client" eyebrow="Mukellef portal" profile={session?.profile}>
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-cyan-900">{appConfig.firmName || mockFirm.name}</p>
            <h1 className="mt-1 text-2xl font-semibold leading-tight">Merhaba, {client.companyName}</h1>
            <p className="mt-2 text-sm text-slate-600">Firma bilgileri, aylık tahakkuklar ve evrak yüklemeleri tek yerde.</p>
          </div>
          <NotificationBell notifications={notifications} />
        </section>
        <section aria-label="Ana klasorler" className="grid gap-3 sm:grid-cols-3">
          {FOLDER_TYPES.map((folderType) => (
            <FolderCard key={folderType} folderType={folderType} count={folderCounts[folderType]} />
          ))}
        </section>
        <UploadDialog clientId={client.id} />
        <InvoiceVatOverview />
      </div>
    </AppShell>
  );
}
