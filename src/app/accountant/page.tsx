import { AppShell } from "@/components/app-shell";
import { AccountantDashboard } from "@/components/client-list";
import { getAccountantMetrics, listClients } from "@/lib/data/clients";
import { mockDocuments } from "@/lib/data/mock";
import { listOpenRequests } from "@/lib/data/notifications";

export default async function AccountantPage() {
  const [clients, metrics, requests] = await Promise.all([listClients(), getAccountantMetrics(), listOpenRequests()]);

  return (
    <AppShell activeRole="accountant" eyebrow="Musavir paneli">
      <AccountantDashboard clients={clients} metrics={metrics} documents={mockDocuments} requests={requests} />
    </AppShell>
  );
}
