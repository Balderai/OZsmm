import { Account, Client, Storage, TablesDB, Users } from "node-appwrite";
import { appConfig, assertServerSecret } from "@/lib/config";

export function createAppwriteServerClient() {
  if (!appConfig.appwriteEndpoint || !appConfig.appwriteProjectId) {
    throw new Error("Appwrite requires NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  }

  return new Client()
    .setEndpoint(appConfig.appwriteEndpoint)
    .setProject(appConfig.appwriteProjectId)
    .setKey(assertServerSecret("APPWRITE_API_KEY"));
}

export function createAppwriteServices() {
  const client = createAppwriteServerClient();

  return {
    account: new Account(client),
    client,
    tables: new TablesDB(client),
    storage: new Storage(client),
    users: new Users(client),
  };
}

export function createAppwriteSessionServices(sessionSecret: string, userAgent?: string | null) {
  if (!appConfig.appwriteEndpoint || !appConfig.appwriteProjectId) {
    throw new Error("Appwrite requires NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  }

  const client = new Client()
    .setEndpoint(appConfig.appwriteEndpoint)
    .setProject(appConfig.appwriteProjectId)
    .setSession(sessionSecret);

  if (userAgent) {
    client.setForwardedUserAgent(userAgent);
  }

  return {
    account: new Account(client),
    client,
  };
}
