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

export async function listClients(firmId?: string) {
  if (appConfig.mockMode) {
    return mockClients;
  }

  if (hasAppwriteServerConfig()) {
    return listAppwriteClients(firmId);
  }

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("clients")
    .select("*")
    .eq("is_active", true)
    .order("company_name", { ascending: true });

  if (firmId) {
    query = query.eq("firm_id", firmId);
  }

  const { data, error } = await query;

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

export async function getDefaultClientCompany(firmId?: string) {
  if (appConfig.mockMode) {
    return mockClients[0];
  }

  const clients = await listClients(firmId);
  return clients[0] ?? mockClients[0];
}

export async function getClientCompany(clientId: string, firmId?: string) {
  if (appConfig.mockMode) {
    return mockClients.find((client) => client.id === clientId) ?? null;
  }

  const clients = await listClients(firmId);
  return clients.find((client) => client.id === clientId) ?? null;
}

export async function getAccountantMetrics(firmId?: string) {
  if (appConfig.mockMode) {
    return getDashboardMetrics();
  }

  const clients = await listClients(firmId);
  const requests = await listOpenRequests(undefined, firmId);

  if (hasAppwriteServerConfig()) {
    const { tables } = createAppwriteServices();
    const documents = await tables.listRows({
      databaseId: appConfig.appwriteDatabaseId,
      tableId: appwriteTables.documents,
      queries: [...firmQuery(firmId), Query.limit(100)],
    });

    return {
      activeClients: clients.length,
      openRequests: requests.length,
      unreadSharedDocuments: 0,
      pendingClientUploads: documents.rows.filter((document) => document.origin === "client_uploaded").length,
    };
  }

  const supabase = await createServerSupabaseClient();
  let documentsQuery = supabase.from("documents").select("origin").eq("status", "active");

  if (firmId) {
    documentsQuery = documentsQuery.eq("firm_id", firmId);
  }

  const { data: documents, error } = await documentsQuery;

  if (error) {
    throw error;
  }

  return {
    activeClients: clients.length,
    openRequests: requests.length,
    unreadSharedDocuments: documents.filter((document) => document.origin === "accountant_shared").length,
    pendingClientUploads: documents.filter((document) => document.origin === "client_uploaded").length,
  };
}

async function listAppwriteClients(firmId?: string): Promise<ClientCompany[]> {
  const { tables } = createAppwriteServices();
  const { rows } = await tables.listRows({
    databaseId: appConfig.appwriteDatabaseId,
    tableId: appwriteTables.clients,
    queries: [...firmQuery(firmId), Query.limit(100), Query.orderDesc("$createdAt")],
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

function firmQuery(firmId?: string) {
  return firmId ? [Query.equal("firm_id", firmId)] : [];
}
