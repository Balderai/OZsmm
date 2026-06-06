import { AppShell } from "@/components/app-shell";
import { AccountantDashboard } from "@/components/client-list";
import { hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { getAccountantMetrics, listClients } from "@/lib/data/clients";
import { listDocuments } from "@/lib/data/documents";
import { listOpenRequests } from "@/lib/data/notifications";
import { appConfig } from "@/lib/config";

export default async function AccountantPage() {
  const [clients, metrics, documents, requests] = await Promise.all([
    listClients(),
    getAccountantMetrics(),
    listDocuments(),
    listOpenRequests(),
  ]);
  const dataSourceLabel = appConfig.mockMode ? "Mock" : hasAppwriteServerConfig() ? "Appwrite" : "Supabase";

  return (
    <AppShell activeRole="accountant" eyebrow="Musavir paneli">
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
