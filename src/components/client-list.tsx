"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, ChevronRight, FolderOpen, Plus, Search, UploadCloud } from "lucide-react";
import { DocumentOpenButton } from "@/components/document-open-button";
import { DocumentPreview } from "@/components/document-preview";
import {
  COMPANY_INFO_FOLDERS,
  DOCUMENT_MONTH_LABELS,
  DOCUMENT_MONTH_VALUES,
  FOLDER_LABELS,
  FOLDER_TYPES,
  UPLOAD_DOCUMENT_TYPES,
} from "@/lib/constants";
import {
  createDemoDocumentFromUpload,
  DEMO_DOCUMENTS_CHANGED_EVENT,
  mergePortalDocuments,
  readDemoDocuments,
  saveDemoDocument,
} from "@/lib/demo-documents";
import type { ClientCompany, DashboardMetrics, FolderType, PortalDocument } from "@/types/domain";

type ClientPortalPreferences = {
  showIncomingInvoices: boolean;
  showOutgoingInvoices: boolean;
};

const defaultPortalPreferences: ClientPortalPreferences = {
  showIncomingInvoices: true,
  showOutgoingInvoices: true,
};

export function AccountantDashboard({
  clients,
  metrics,
  documents,
  dataSourceLabel,
}: {
  clients: ClientCompany[];
  metrics: DashboardMetrics;
  documents: PortalDocument[];
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
  const [newClientPhone, setNewClientPhone] = useState("");
  const [selectedFolderType, setSelectedFolderType] = useState<FolderType>("declarations");
  const [portalPreferences, setPortalPreferences] = useState<ClientPortalPreferences>(defaultPortalPreferences);
  const [demoDocuments, setDemoDocuments] = useState<PortalDocument[]>([]);
  const selectedClient = clients.find((client) => client.id === selectedClientId) || clients[0];
  const filteredClients = useMemo(
    () => clients.filter((client) => client.companyName.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"))),
    [clients, query],
  );
  const visibleDocuments = useMemo(() => mergePortalDocuments(documents, demoDocuments), [documents, demoDocuments]);
  const clientDocuments = visibleDocuments.filter((document) => document.clientId === selectedClient?.id);
  const selectedFolderDocuments = clientDocuments.filter((document) => document.folderType === selectedFolderType);
  const folderCounts = Object.fromEntries(
    FOLDER_TYPES.map((folderType) => [folderType, clientDocuments.filter((document) => document.folderType === folderType).length]),
  ) as Record<FolderType, number>;

  useEffect(() => {
    if (!selectedClient?.id) return;

    setPortalPreferences(loadClientPortalPreferences(selectedClient.id));
  }, [selectedClient?.id]);

  useEffect(() => {
    function refreshDemoDocuments() {
      setDemoDocuments(readDemoDocuments());
    }

    refreshDemoDocuments();
    window.addEventListener(DEMO_DOCUMENTS_CHANGED_EVENT, refreshDemoDocuments);
    window.addEventListener("storage", refreshDemoDocuments);

    return () => {
      window.removeEventListener(DEMO_DOCUMENTS_CHANGED_EVENT, refreshDemoDocuments);
      window.removeEventListener("storage", refreshDemoDocuments);
    };
  }, []);

  function updatePortalPreference(key: keyof ClientPortalPreferences, value: boolean) {
    if (!selectedClient) return;

    const nextPreferences = { ...portalPreferences, [key]: value };
    setPortalPreferences(nextPreferences);
    window.localStorage.setItem(getClientPortalPreferenceKey(selectedClient.id), JSON.stringify(nextPreferences));
    window.dispatchEvent(new Event("client-portal-preferences-changed"));
    setMessage(`${selectedClient.companyName} panel ayarlari guncellendi.`);
  }

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
          contact_phone: newClientPhone || undefined,
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
      setNewClientPhone("");
      if (payload.client_id) setSelectedClientId(payload.client_id);
    });
  }

  async function shareDocument(form: HTMLFormElement, droppedFile?: File | null) {
    if (!selectedClient) return;

    await runAction("Evrak ekleme", async () => {
      const formData = new FormData(form);
      const file = droppedFile ?? formData.get("file");

      if (!(file instanceof File) || file.size === 0) {
        throw new Error("Paylasmak icin dosya secin.");
      }

      formData.set("file", file);
      formData.set("client_id", selectedClient.id);
      formData.set("origin", "accountant_shared");
      const uploadFolderType = formData.get("folder_type") as FolderType;
      if (!String(formData.get("title") || "").trim()) {
        formData.set("title", file.name);
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { error?: string; mode?: string };

      if (!response.ok) {
        throw new Error(readApiError(payload.error) || "Evrak eklenemedi");
      }

      if (payload.mode === "mock") {
        saveDemoDocument(
          createDemoDocumentFromUpload({
            clientId: selectedClient.id,
            firmId: selectedClient.firmId,
            folderType: uploadFolderType,
            origin: "accountant_shared",
            title: String(formData.get("title") || file.name),
            file,
            formData,
          }),
        );
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
      <section className="grid grid-cols-2 gap-2">
        <Metric label="Aktif mukellef" value={metrics.activeClients} />
        <Metric label="Okunmamis evrak" value={metrics.unreadSharedDocuments} />
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
                {selectedClient
                  ? `Vergi no ${selectedClient.taxNumber || "-"} - ${selectedClient.contactName || "Yetkili yok"} - ${selectedClient.contactPhone || "Telefon yok"}`
                  : "Henuz mukellef yok"}
              </p>
            </div>
            <form
              className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[140px_140px_180px_130px_120px_130px_auto]"
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
                value={newClientPhone}
                onChange={(event) => setNewClientPhone(event.target.value)}
                className="min-h-10 rounded-md border border-slate-200 px-3 text-sm"
                placeholder="Telefon"
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
          {selectedClient && (
            <ClientPortalSettings
              preferences={portalPreferences}
              onChange={updatePortalPreference}
            />
          )}
          <div className="grid gap-3 md:grid-cols-3">
            {FOLDER_TYPES.map((folderType) => (
              <button
                key={folderType}
                type="button"
                onClick={() => setSelectedFolderType(folderType)}
                className={`grid min-h-24 grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg border p-4 text-left shadow-sm transition ${
                  selectedFolderType === folderType ? "border-cyan-700 bg-cyan-50" : "border-slate-200 bg-white hover:border-cyan-700"
                }`}
              >
                <span className="grid size-11 place-items-center rounded-md bg-white text-cyan-800">
                  <FolderOpen aria-hidden="true" size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold">{FOLDER_LABELS[folderType]}</span>
                  <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{folderCounts[folderType]} evrak</span>
                </span>
                <ChevronRight aria-hidden="true" className="text-slate-400" size={20} />
              </button>
            ))}
          </div>
          <FolderUploadPanel
            folderType={selectedFolderType}
            pending={pending === "Evrak ekleme"}
            documents={selectedFolderDocuments}
            onSubmit={shareDocument}
          />
          <div className="grid gap-4 xl:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold">Son evraklar</h2>
              <div className="mt-2 space-y-2">
                {clientDocuments.map((document) => (
                  <div key={document.id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2">
                    <DocumentPreview documentId={document.id} title={document.title} mimeType={document.mimeType} compact />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{document.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        {FOLDER_LABELS[document.folderType]} - {document.origin === "client_uploaded" ? "Mukellef yukledi" : "Musavir paylasti"}
                      </p>
                    </div>
                    {document.viewedByClient && <Check aria-label="Okundu" size={16} className="text-emerald-700" />}
                    <DocumentOpenButton documentId={document.id} title={document.title} />
                  </div>
                ))}
              </div>
            </div>
            <ReminderPanel pending={pending === "Hatirlatma"} onSubmit={sendReminder} />
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

function ClientPortalSettings({
  preferences,
  onChange,
}: {
  preferences: ClientPortalPreferences;
  onChange: (key: keyof ClientPortalPreferences, value: boolean) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 p-3">
      <h2 className="text-sm font-semibold">Mükellef paneli görünümü</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-slate-200 px-3">
          <span className="text-sm font-medium">Gelen Faturalar</span>
          <input
            type="checkbox"
            checked={preferences.showIncomingInvoices}
            onChange={(event) => onChange("showIncomingInvoices", event.target.checked)}
            className="size-4 accent-cyan-800"
          />
        </label>
        <label className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-slate-200 px-3">
          <span className="text-sm font-medium">Giden Faturalar</span>
          <input
            type="checkbox"
            checked={preferences.showOutgoingInvoices}
            onChange={(event) => onChange("showOutgoingInvoices", event.target.checked)}
            className="size-4 accent-cyan-800"
          />
        </label>
      </div>
    </section>
  );
}

function FolderUploadPanel({
  folderType,
  pending,
  documents,
  onSubmit,
}: {
  folderType: FolderType;
  pending: boolean;
  documents: PortalDocument[];
  onSubmit: (form: HTMLFormElement, file?: File | null) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <form
      className="space-y-2 rounded-lg border border-slate-200 p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(event.currentTarget, selectedFile);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }}
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <FolderOpen aria-hidden="true" size={16} />
        {FOLDER_LABELS[folderType]} alanına evrak ekle
      </h2>
      <input name="title" className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="Baslik" required />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          setSelectedFile(event.dataTransfer.files[0] ?? null);
        }}
        className={`flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed px-3 py-4 text-center transition ${
          isDragging ? "border-cyan-700 bg-cyan-50" : "border-slate-300 bg-slate-50 hover:border-cyan-700"
        }`}
      >
        <UploadCloud aria-hidden="true" size={24} className="text-cyan-800" />
        <span className="text-sm font-semibold">{selectedFile ? selectedFile.name : "Dosyayı buraya sürükleyin veya seçin"}</span>
        <span className="text-xs text-slate-500">PDF, görsel, Excel veya CSV</span>
      </button>
      <input
        ref={fileInputRef}
        name="file"
        type="file"
        className="sr-only"
        accept="application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
        onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
      />
      <input type="hidden" name="folder_type" value={folderType} />
      {folderType === "declarations" && (
        <select name="sub_folder" className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" defaultValue={COMPANY_INFO_FOLDERS[0]}>
          {COMPANY_INFO_FOLDERS.map((folder) => (
            <option key={folder} value={folder}>
              {folder}
            </option>
          ))}
        </select>
      )}
      {(folderType === "accruals" || folderType === "documents_photos") && (
        <select name="document_month" className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" defaultValue="01">
          {DOCUMENT_MONTH_VALUES.map((month) => (
            <option key={month} value={month}>
              {DOCUMENT_MONTH_LABELS[month]}
            </option>
          ))}
        </select>
      )}
      {folderType === "documents_photos" && (
        <select name="document_type" className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" defaultValue={UPLOAD_DOCUMENT_TYPES[0]}>
          {UPLOAD_DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-10 w-full rounded-md bg-cyan-800 px-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Isleniyor" : "Evrak ekle"}
      </button>
      <p className="text-xs text-slate-500">Bu alana eklenen evrak mükellefin kendi panelindeki aynı klasörde görünecek.</p>
      <div className="space-y-2 border-t border-slate-100 pt-2">
        <h3 className="text-xs font-semibold text-slate-600">Bu klasördeki evraklar</h3>
        {documents.length === 0 ? (
          <p className="text-xs text-slate-500">Henüz evrak yok.</p>
        ) : (
          documents.slice(0, 5).map((document) => (
            <div key={document.id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2">
              <DocumentPreview documentId={document.id} title={document.title} mimeType={document.mimeType} compact />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{document.title}</p>
                <p className="truncate text-xs text-slate-500">{document.origin === "client_uploaded" ? "Mukellef yukledi" : "Musavir ekledi"}</p>
              </div>
              <DocumentOpenButton documentId={document.id} title={document.title} />
            </div>
          ))
        )}
      </div>
    </form>
  );
}

function ReminderPanel({
  pending,
  onSubmit,
}: {
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
        <Bell aria-hidden="true" size={16} />
        Bildirim gönder
      </h2>
      <input name="title" className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="Baslik" required />
      <textarea name="body" className="min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Mesaj" />
      <input name="due_at" type="date" className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
      <button
        type="submit"
        disabled={pending}
        className="min-h-10 w-full rounded-md bg-cyan-800 px-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Isleniyor" : "Gonder"}
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

function loadClientPortalPreferences(clientId: string): ClientPortalPreferences {
  try {
    const rawPreferences = window.localStorage.getItem(getClientPortalPreferenceKey(clientId));
    if (!rawPreferences) return defaultPortalPreferences;

    return { ...defaultPortalPreferences, ...JSON.parse(rawPreferences) };
  } catch {
    return defaultPortalPreferences;
  }
}

function getClientPortalPreferenceKey(clientId: string) {
  return `client-portal-preferences:${clientId}`;
}
