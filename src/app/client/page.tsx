import { AppShell } from "@/components/app-shell";
import { FolderCard } from "@/components/folder-card";
import { NotificationBell } from "@/components/notification-bell";
import { RequestList } from "@/components/request-list";
import { UploadDialog } from "@/components/upload-dialog";
import { FOLDER_TYPES } from "@/lib/constants";
import { appConfig } from "@/lib/config";
import { listClientDocuments } from "@/lib/data/documents";
import { getDefaultClientCompany } from "@/lib/data/clients";
import { mockFirm } from "@/lib/data/mock";
import { listClientNotifications, listOpenRequests } from "@/lib/data/notifications";

export default async function ClientPage() {
  const client = await getDefaultClientCompany();
  const [notifications, requests, documents] = await Promise.all([
    listClientNotifications(client.id),
    listOpenRequests(client.id),
    listClientDocuments({ clientId: client.id }),
  ]);
  const folderCounts = Object.fromEntries(
    FOLDER_TYPES.map((folderType) => [folderType, documents.filter((document) => document.folderType === folderType).length]),
  ) as Record<(typeof FOLDER_TYPES)[number], number>;

  return (
    <AppShell activeRole="client" eyebrow="Mukellef portal">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-cyan-900">{appConfig.firmName || mockFirm.name}</p>
            <h1 className="mt-1 text-2xl font-semibold leading-tight">Merhaba, {client.companyName}</h1>
            <p className="mt-2 text-sm text-slate-600">Beyannameler, tahakkuklar ve evrak yuklemeleri tek yerde.</p>
          </div>
          <NotificationBell notifications={notifications} />
        </section>
        <section aria-label="Ana klasorler" className="grid gap-3 sm:grid-cols-3">
          {FOLDER_TYPES.map((folderType) => (
            <FolderCard key={folderType} folderType={folderType} count={folderCounts[folderType]} />
          ))}
        </section>
        <section className="grid gap-4 md:grid-cols-[1fr_320px]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Acik talepler</h2>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">{requests.length} acik</span>
            </div>
            <div className="mt-3">
              <RequestList requests={requests} />
            </div>
          </div>
          <div>
            <UploadDialog clientId={client.id} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
