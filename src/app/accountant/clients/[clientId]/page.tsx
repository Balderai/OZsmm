import { notFound, redirect } from "next/navigation";
import { listClients } from "@/lib/data/clients";

export default async function AccountantClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const clients = await listClients();

  if (!clients.some((client) => client.id === clientId)) {
    notFound();
  }

  redirect("/accountant");
}
