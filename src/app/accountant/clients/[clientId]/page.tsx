import { notFound, redirect } from "next/navigation";
import { requirePortalSession } from "@/lib/auth/appwrite";
import { appConfig } from "@/lib/config";
import { listClients } from "@/lib/data/clients";

export default async function AccountantClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const session = appConfig.mockMode ? null : await requirePortalSession("accountant");

  if (!appConfig.mockMode && !session) {
    redirect("/login");
  }

  const clients = await listClients(session?.profile.firmId);

  if (!clients.some((client) => client.id === clientId)) {
    notFound();
  }

  redirect("/accountant");
}
