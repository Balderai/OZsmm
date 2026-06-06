import { appConfig } from "@/lib/config";
import { mockNotifications, mockRequests } from "@/lib/data/mock";

export async function listClientNotifications(clientId: string) {
  if (appConfig.mockMode) {
    return mockNotifications.filter((notification) => notification.clientId === clientId);
  }

  return [];
}

export async function listOpenRequests(clientId?: string) {
  if (appConfig.mockMode) {
    return mockRequests.filter((request) => request.status === "open" && (!clientId || request.clientId === clientId));
  }

  return [];
}
