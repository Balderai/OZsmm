import { Query } from "node-appwrite";
import { appConfig } from "@/lib/config";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { mockClients, getDashboardMetrics, mockDocuments } from "@/lib/data/mock";
import { createAppwriteServices } from "@/lib/appwrite/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listOpenRequests } from "@/lib/data/notifications";
import type { ClientCompany } from "@/types/domain";

type AppwriteClientRow = {
  $id: string;
  firm_id: string;
  company_name: string;
  tax_number?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active?: boolean;
};

export async function listClients() {
  if (appConfig.mockMode) {
    return mockClients;
  }

  if (hasAppwriteServerConfig()) {
    return listAppwriteClients();
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

export async function getDefaultClientCompany() {
  if (appConfig.mockMode) {
    return mockClients[0];
  }

  const clients = await listClients();
  return clients[0] ?? mockClients[0];
}

export async function getAccountantMetrics() {
  if (appConfig.mockMode) {
    return getDashboardMetrics();
  }

  const clients = await listClients();
  const requests = await listOpenRequests();

  if (hasAppwriteServerConfig()) {
    const { tables } = createAppwriteServices();
    const documents = await tables.listRows({
      databaseId: appConfig.appwriteDatabaseId,
      tableId: appwriteTables.documents,
    });

    return {
      activeClients: clients.length,
      openRequests: requests.length,
      unreadSharedDocuments: 0,
      pendingClientUploads: documents.rows.filter((document) => document.origin === "client_uploaded").length,
    };
  }

  return {
    activeClients: clients.length,
    openRequests: 0,
    unreadSharedDocuments: mockDocuments.filter((document) => document.origin === "accountant_shared" && !document.viewedByClient)
      .length,
    pendingClientUploads: mockDocuments.filter((document) => document.origin === "client_uploaded").length,
  };
}

async function listAppwriteClients(): Promise<ClientCompany[]> {
  const { tables } = createAppwriteServices();
  const { rows } = await tables.listRows({
    databaseId: appConfig.appwriteDatabaseId,
    tableId: appwriteTables.clients,
    queries: [Query.limit(100), Query.orderDesc("$createdAt")],
  });

  return (rows as unknown as AppwriteClientRow[])
    .filter((client) => client.is_active !== false)
    .map((client) => ({
      id: client.$id,
      firmId: client.firm_id,
      companyName: client.company_name,
      taxNumber: client.tax_number,
      contactName: client.contact_name,
      contactEmail: client.contact_email,
      contactPhone: client.contact_phone,
      isActive: client.is_active !== false,
    }));
}
