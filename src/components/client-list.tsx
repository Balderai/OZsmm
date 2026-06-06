"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, FileUp, FolderOpen, Plus, Search, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FOLDER_LABELS, FOLDER_TYPES } from "@/lib/constants";
import type { ClientCompany, DashboardMetrics, DocumentRequest, PortalDocument } from "@/types/domain";

export function AccountantDashboard({
  clients,
  metrics,
  documents,
  requests,
  dataSourceLabel,
}: {
  clients: ClientCompany[];
  metrics: DashboardMetrics;
  documents: PortalDocument[];
  requests: DocumentRequest[];
  dataSourceLabel: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id);
  const [message, setMessage] = useState(`${dataSourceLabel} verisi aktif.`);
  const [pending, setPending] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientContactName, setNewClientContactName] = useState("");
  const [newClientPassword, setNewClientPassword] = useState("");
  const [newClientTaxNumber, setNewClientTaxNumber] = useState("");
  const selectedClient = clients.find((client) => client.id === selectedClientId) || clients[0];
  const filteredClients = useMemo(
    () => clients.filter((client) => client.companyName.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"))),
    [clients, query],
  );
  const clientDocuments = documents.filter((document) => document.clientId === selectedClient?.id);
  const clientRequests = requests.filter((request) => request.clientId === selectedClient?.id);

  async function runAction(action: string, task: () => Promise<void>) {
    setPending(action);
    setMessage(`${action} isleniyor...`);

    try {
      await task();
      setMessage(`${action} tamamlandi.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `${action} basarisiz.`);
    } finally {
      setPending(null);
    }
  }

  async function createClient() {
    await runAction("Mukellef ekleme", async () => {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          company_name: newClientName,
          contact_email: newClientEmail || undefined,
          contact_name: newClientContactName || undefined,
          temporary_password: newClientPassword || undefined,
          tax_number: newClientTaxNumber || undefined,
        }),
      });
      const payload = (await response.json()) as { error?: string; client_id?: string };

      if (!response.ok) {
        throw new Error(readApiError(payload.error) || "Mukellef eklenemedi");
      }

      setNewClientName("");
      setNewClientEmail("");
      setNewClientContactName("");
      setNewClientPassword("");
      setNewClientTaxNumber("");
      if (payload.client_id) setSelectedClientId(payload.client_id);
    });
  }

  async function shareDocument(form: HTMLFormElement) {
    if (!selectedClient) return;

    await runAction("Evrak paylasma", async () => {
      const formData = new FormData(form);
      const file = formData.get("file");

      if (!(file instanceof File) || file.size === 0) {
        throw new Error("Paylasmak icin dosya secin.");
      }

      formData.set("client_id", selectedClient.id);
      formData.set("origin", "accountant_shared");
      if (!String(formData.get("title") || "").trim()) {
        formData.set("title", file.name);
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(readApiError(payload.error) || "Evrak paylasilamadi");
      }

      form.reset();
    });
  }

  async function createRequest(form: HTMLFormElement) {
    if (!selectedClient) return;

    await runAction("Evrak talebi", async () => {
      const formData = new FormData(form);
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client_id: selectedClient.id,
          title: formData.get("title"),
          description: formData.get("description") || undefined,
          folder_type: formData.get("folder_type") || "documents_photos",
          due_at: toIsoDateTime(formData.get("due_at")),
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(readApiError(payload.error) || "Talep olusturulamadi");
      }

      form.reset();
    });
  }

  async function sendReminder(form: HTMLFormElement) {
    if (!selectedClient) return;

    await runAction("Hatirlatma", async () => {
      const formData = new FormData(form);
      const title = String(formData.get("title") || "");
      const body = String(formData.get("body") || title);
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client_id: selectedClient.id,
          title,
          body,
          category: "reminder",
          action_url: "/client",
          due_at: toIsoDateTime(formData.get("due_at")),
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(readApiError(payload.error) || "Hatirlatma gonderilemedi");
      }

      form.reset();
    });
  }

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Metric label="Aktif mukellef" value={metrics.activeClients} />
        <Metric label="Acik talep" value={metrics.openRequests} />
        <Metric label="Okunmamis evrak" value={metrics.unreadSharedDocuments} />
        <Metric label="Mukellef yuklemesi" value={metrics.pendingClientUploads} />
      </section>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-3">
            <Search aria-hidden="true" size={17} className="text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Sirket ara"
            />
          </label>
          <div className="space-y-2">
            {filteredClients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => setSelectedClientId(client.id)}
                className={`w-full rounded-md border p-3 text-left ${
                  selectedClient?.id === client.id ? "border-cyan-700 bg-cyan-50" : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="block truncate text-sm font-semibold">{client.companyName}</span>
                <span className="mt-1 block truncate text-xs text-slate-500">{client.contactEmail}</span>
              </button>
            ))}
          </div>
        </aside>
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">{selectedClient?.companyName}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {selectedClient ? `Vergi no ${selectedClient.taxNumber || "-"} - ${selectedClient.contactName || "Yetkili yok"}` : "Henuz mukellef yok"}
              </p>
            </div>
            <form
              className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[150px_150px_190px_130px_120px_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                createClient();
              }}
            >
              <input
                value={newClientName}
                onChange={(event) => setNewClientName(event.target.value)}
                required
                className="min-h-10 rounded-md border border-slate-200 px-3 text-sm"
                placeholder="Sirket adi"
              />
              <input
                value={newClientContactName}
                onChange={(event) => setNewClientContactName(event.target.value)}
                className="min-h-10 rounded-md border border-slate-200 px-3 text-sm"
                placeholder="Yetkili ad"
              />
              <input
                value={newClientEmail}
                onChange={(event) => setNewClientEmail(event.target.value)}
                type="email"
                required
                className="min-h-10 rounded-md border border-slate-200 px-3 text-sm"
                placeholder="E-posta"
              />
              <input
                value={newClientPassword}
                onChange={(event) => setNewClientPassword(event.target.value)}
                type="password"
                required
                minLength={8}
                className="min-h-10 rounded-md border border-slate-200 px-3 text-sm"
                placeholder="Gecici sifre"
              />
              <input
                value={newClientTaxNumber}
                onChange={(event) => setNewClientTaxNumber(event.target.value)}
                className="min-h-10 rounded-md border border-slate-200 px-3 text-sm"
                placeholder="Vergi no"
              />
              <button
                type="submit"
                disabled={pending === "Mukellef ekleme"}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
              >
                <Plus aria-hidden="true" size={16} />
                Mukellef ekle
              </button>
            </form>
          </div>
          <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>
          <div className="grid gap-3 md:grid-cols-3">
            <ActionPanel
              icon={FileUp}
              title="Evrak paylas"
              button="Paylas"
              mode="file"
              pending={pending === "Evrak paylasma"}
              onSubmit={shareDocument}
            />
            <ActionPanel
              icon={Send}
              title="Evrak talebi"
              button="Talep olustur"
              mode="request"
              pending={pending === "Evrak talebi"}
              onSubmit={createRequest}
            />
            <ActionPanel
              icon={Bell}
              title="Hatirlatma"
              button="Gonder"
              mode="reminder"
              pending={pending === "Hatirlatma"}
              onSubmit={sendReminder}
            />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold">Son evraklar</h2>
              <div className="mt-2 space-y-2">
                {clientDocuments.map((document) => (
                  <div key={document.id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2">
                    <FolderOpen aria-hidden="true" size={16} className="text-cyan-800" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{document.title}</p>
                      <p className="text-xs text-slate-500">{FOLDER_LABELS[document.folderType]}</p>
                    </div>
                    {document.viewedByClient && <Check aria-label="Okundu" size={16} className="text-emerald-700" />}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Acik talepler</h2>
              <div className="mt-2 space-y-2">
                {clientRequests.map((request) => (
                  <div key={request.id} className="rounded-md border border-amber-200 bg-amber-50 p-2">
                    <p className="text-sm font-medium text-amber-950">{request.title}</p>
                    <p className="mt-1 text-xs text-amber-900">{request.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {FOLDER_TYPES.map((folderType) => (
              <button key={folderType} type="button" className="min-h-10 rounded-md border border-slate-200 px-3 text-sm font-medium">
                {FOLDER_LABELS[folderType]}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ActionPanel({
  icon: Icon,
  title,
  button,
  mode,
  pending,
  onSubmit,
}: {
  icon: LucideIcon;
  title: string;
  button: string;
  mode: "file" | "request" | "reminder";
  pending: boolean;
  onSubmit: (form: HTMLFormElement) => void;
}) {
  return (
    <form
      className="space-y-2 rounded-lg border border-slate-200 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(event.currentTarget);
      }}
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden="true" size={16} />
        {title}
      </h2>
      <input name="title" className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="Baslik" required />
      {mode === "file" && (
        <input
          name="file"
          type="file"
          className="min-h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          accept="application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          required
        />
      )}
      {mode !== "file" && (
        <textarea
          name={mode === "reminder" ? "body" : "description"}
          className="min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          placeholder={mode === "reminder" ? "Mesaj" : "Aciklama"}
        />
      )}
      <select name="folder_type" className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" defaultValue="documents_photos">
        {FOLDER_TYPES.map((folderType) => (
          <option key={folderType} value={folderType}>
            {FOLDER_LABELS[folderType]}
          </option>
        ))}
      </select>
      {mode !== "file" && (
        <input name="due_at" type="date" className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-10 w-full rounded-md bg-cyan-800 px-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Isleniyor" : button}
      </button>
    </form>
  );
}

function toIsoDateTime(value: FormDataEntryValue | null) {
  if (!value) return undefined;
  const date = String(value);
  if (!date) return undefined;
  return new Date(`${date}T09:00:00.000Z`).toISOString();
}

function readApiError(error: unknown) {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  return "Islem dogrulanamadi.";
}
