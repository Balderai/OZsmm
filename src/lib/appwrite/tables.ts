import { appConfig } from "@/lib/config";

export const appwriteTables = {
  firms: process.env.APPWRITE_FIRMS_TABLE_ID || "firms",
  profiles: process.env.APPWRITE_PROFILES_TABLE_ID || "profiles",
  clients: process.env.APPWRITE_CLIENTS_TABLE_ID || "clients",
  documents: process.env.APPWRITE_DOCUMENTS_TABLE_ID || "documents",
  requests: process.env.APPWRITE_REQUESTS_TABLE_ID || "document_requests",
  notifications: process.env.APPWRITE_NOTIFICATIONS_TABLE_ID || "notifications",
  pushSubscriptions: process.env.APPWRITE_PUSH_SUBSCRIPTIONS_TABLE_ID || "push_subscriptions",
  clientMemberships: process.env.APPWRITE_CLIENT_MEMBERSHIPS_TABLE_ID || "client_memberships",
};

export function hasAppwriteServerConfig() {
  return Boolean(
    process.env.APP_BACKEND_PROVIDER === "appwrite" &&
      appConfig.appwriteEndpoint &&
      appConfig.appwriteProjectId &&
      process.env.APPWRITE_API_KEY,
  );
}
