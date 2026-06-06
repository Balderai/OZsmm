export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Mukellef Portal",
  firmName: process.env.NEXT_PUBLIC_FIRM_NAME || "Demo Mali Musavirlik",
  mockMode: process.env.MOCK_MODE !== "false",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  appwriteEndpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "",
  appwriteProjectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "",
  appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID || "ozsmm",
  appwriteBucketId: process.env.APPWRITE_BUCKET_ID || "client-documents",
};

export function assertServerSecret(name: "SUPABASE_SERVICE_ROLE_KEY" | "VAPID_PRIVATE_KEY" | "APPWRITE_API_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing server-only environment variable: ${name}`);
  }

  return value;
}
