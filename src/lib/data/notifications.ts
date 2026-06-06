import { Query } from "node-appwrite";
import { appConfig } from "@/lib/config";
import { appwriteTables, hasAppwriteServerConfig } from "@/lib/appwrite/tables";
import { mockNotifications, mockRequests } from "@/lib/data/mock";
import { createAppwriteServices } from "@/lib/appwrite/server";
import type { DocumentRequest, PortalNotification } from "@/types/domain";

type AppwriteRequestRow = {
  $id: string;
  $createdAt?: string;
  firm_id: string;
  client_id: string;
  folder_type?: "declarations" | "accruals" | "documents_photos";
  title: string;
  description?: string;
  status?: "open" | "submitted" | "resolved" | "cancelled";
  due_at?: string;
};

type AppwriteNotificationRow = {
  $id: string;
  $createdAt?: string;
  firm_id: string;
  client_id?: string;
  recipient_user_id?: string;
  category: PortalNotification["category"];
  title: string;
  body: string;
  action_url?: string;
  due_at?: string;
  read_at?: string;
};

export async function listClientNotifications(clientId: string) {
  if (appConfig.mockMode) {
    return mockNotifications.filter((notification) => notification.clientId === clientId);
  }

  if (hasAppwriteServerConfig()) {
    const { tables } = createAppwriteServices();
    const { rows } = await tables.listRows({
      databaseId: appConfig.appwriteDatabaseId,
      tableId: appwriteTables.notifications,
      queries: [Query.limit(100), Query.orderDesc("$createdAt")],
    });

    return (rows as unknown as AppwriteNotificationRow[])
      .filter((notification) => notification.client_id === clientId)
      .map((notification) => ({
        id: notification.$id,
        firmId: notification.firm_id,
        clientId: notification.client_id,
        recipientUserId: notification.recipient_user_id,
        category: notification.category,
        title: notification.title,
        body: notification.body,
        actionUrl: notification.action_url,
        dueAt: notification.due_at,
        readAt: notification.read_at,
        createdAt: notification.$createdAt || new Date().toISOString(),
      }));
  }

  return [];
}

export async function listOpenRequests(clientId?: string) {
  if (appConfig.mockMode) {
    return mockRequests.filter((request) => request.status === "open" && (!clientId || request.clientId === clientId));
  }

  if (hasAppwriteServerConfig()) {
    const { tables } = createAppwriteServices();
    const { rows } = await tables.listRows({
      databaseId: appConfig.appwriteDatabaseId,
      tableId: appwriteTables.requests,
      queries: [Query.limit(100), Query.orderDesc("$createdAt")],
    });

    return (rows as unknown as AppwriteRequestRow[])
      .filter((request) => (request.status ?? "open") === "open" && (!clientId || request.client_id === clientId))
      .map(toDocumentRequest);
  }

  return [];
}

function toDocumentRequest(request: AppwriteRequestRow): DocumentRequest {
  return {
    id: request.$id,
    firmId: request.firm_id,
    clientId: request.client_id,
    folderType: request.folder_type || "documents_photos",
    title: request.title,
    description: request.description,
    status: request.status || "open",
    dueAt: request.due_at,
    createdAt: request.$createdAt || new Date().toISOString(),
  };
}
