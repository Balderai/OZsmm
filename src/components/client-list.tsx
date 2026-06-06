"use client";

import { useMemo, useState } from "react";
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
  const [query, setQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id);
  const [message, setMessage] = useState(`${dataSourceLabel} verisi aktif.`);
  const selectedClient = clients.find((client) => client.id === selectedClientId) || clients[0];
  const filteredClients = useMemo(
    () => clients.filter((client) => client.companyName.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"))),
    [clients, query],
  );
  const clientDocuments = documents.filter((document) => document.clientId === selectedClient?.id);
  const clientRequests = requests.filter((request) => request.clientId === selectedClient?.id);

  function handleActionSubmit(action: string) {
    setMessage(`${action} kaydi hazirlandi. Yazma endpointi ${dataSourceLabel} backendine baglanacak.`);
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
                Vergi no {selectedClient?.taxNumber} · {selectedClient?.contactName}
              </p>
            </div>
            <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-semibold text-white">
              <Plus aria-hidden="true" size={16} />
              Mukellef ekle
            </button>
          </div>
          <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>
          <div className="grid gap-3 md:grid-cols-3">
            <ActionPanel
              icon={FileUp}
              title="Evrak paylas"
              button="Paylas"
              onSubmit={() => handleActionSubmit("Evrak paylasma")}
            />
            <ActionPanel
              icon={Send}
              title="Evrak talebi"
              button="Talep olustur"
              onSubmit={() => handleActionSubmit("Evrak talebi")}
            />
            <ActionPanel
              icon={Bell}
              title="Hatirlatma"
              button="Gonder"
              onSubmit={() => handleActionSubmit("Hatirlatma")}
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
  onSubmit,
}: {
  icon: LucideIcon;
  title: string;
  button: string;
  onSubmit: () => void;
}) {
  return (
    <form
      className="space-y-2 rounded-lg border border-slate-200 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden="true" size={16} />
        {title}
      </h2>
      <input className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="Baslik" />
      <select className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" defaultValue="documents_photos">
        {FOLDER_TYPES.map((folderType) => (
          <option key={folderType} value={folderType}>
            {FOLDER_LABELS[folderType]}
          </option>
        ))}
      </select>
      <button type="submit" className="min-h-10 w-full rounded-md bg-cyan-800 px-3 text-sm font-semibold text-white">
        {button}
      </button>
    </form>
  );
}
