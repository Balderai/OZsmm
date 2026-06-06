import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AccountantDashboard } from "@/components/client-list";
import { requirePortalSession } from "@/lib/auth/appwrite";
import { hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { getAccountantMetrics, listClients } from "@/lib/data/clients";
import { listDocuments } from "@/lib/data/documents";
import { listOpenRequests } from "@/lib/data/notifications";
import { appConfig } from "@/lib/config";

export default async function AccountantPage() {
  const session = appConfig.mockMode ? null : await requirePortalSession("accountant");

  if (!appConfig.mockMode && !session) {
    redirect("/login");
  }

  const firmId = session?.profile.firmId;
  const [clients, metrics, documents, requests] = await Promise.all([
    listClients(firmId),
    getAccountantMetrics(firmId),
    listDocuments({ firmId }),
    listOpenRequests(undefined, firmId),
  ]);
  const dataSourceLabel = appConfig.mockMode ? "Mock" : hasAppwriteServerConfig() ? "Appwrite" : "Supabase";

  return (
    <AppShell activeRole="accountant" eyebrow="Musavir paneli" profile={session?.profile}>
      <AccountantDashboard
        clients={clients}
        metrics={metrics}
        documents={documents}
        requests={requests}
        dataSourceLabel={dataSourceLabel}
      />
    </AppShell>
  );
}
