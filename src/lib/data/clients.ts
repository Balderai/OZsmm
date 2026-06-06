import { appConfig } from "@/lib/config";
import { mockClients, getDashboardMetrics } from "@/lib/data/mock";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function listClients() {
  if (appConfig.mockMode) {
    return mockClients;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("is_active", true)
    .order("company_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data.map((client) => ({
    id: client.id,
    firmId: client.firm_id,
    companyName: client.company_name,
    taxNumber: client.tax_number ?? undefined,
    contactName: client.contact_name ?? undefined,
    contactEmail: client.contact_email ?? undefined,
    contactPhone: client.contact_phone ?? undefined,
    isActive: client.is_active,
  }));
}

export async function getAccountantMetrics() {
  if (appConfig.mockMode) {
    return getDashboardMetrics();
  }

  const clients = await listClients();

  return {
    activeClients: clients.length,
    openRequests: 0,
    unreadSharedDocuments: 0,
    pendingClientUploads: 0,
  };
}
