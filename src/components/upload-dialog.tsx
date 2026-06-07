"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload } from "lucide-react";
import { DOCUMENT_MONTH_LABELS, DOCUMENT_MONTH_VALUES, UPLOAD_DOCUMENT_TYPES } from "@/lib/constants";
import { createDemoDocumentFromUpload, saveDemoDocument } from "@/lib/demo-documents";
import type { FolderType } from "@/types/domain";

export function UploadDialog({
  compact = false,
  clientId,
  firmId,
  folderType = "documents_photos",
  origin = "client_uploaded",
}: {
  compact?: boolean;
  clientId: string;
  firmId?: string;
  folderType?: FolderType;
  origin?: "accountant_shared" | "client_uploaded";
}) {
  const [fileName, setFileName] = useState<string>("");
  const [title, setTitle] = useState("");
  const [documentMonth, setDocumentMonth] = useState<(typeof DOCUMENT_MONTH_VALUES)[number]>("01");
  const [documentType, setDocumentType] = useState<(typeof UPLOAD_DOCUMENT_TYPES)[number]>("Fiş");
  const [status, setStatus] = useState("PDF, fotograf, Excel veya CSV yukleyebilirsiniz.");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function uploadFile(file?: File) {
    if (!file) return;

    setPending(true);
    setFileName(file.name);
    setStatus("Yukleniyor...");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("client_id", clientId);
      formData.set("folder_type", folderType);
      formData.set("origin", origin);
      formData.set("title", title.trim() || file.name);
      formData.set("document_month", documentMonth);
      formData.set("document_type", documentType);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { error?: string; mode?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Yukleme basarisiz");
      }

      if (payload.mode === "mock") {
        saveDemoDocument(
          createDemoDocumentFromUpload({
            clientId,
            firmId,
            folderType,
            origin,
            title: title.trim() || file.name,
            file,
            formData,
          }),
        );
      }

      setTitle("");
      setStatus(`${file.name} yuklendi.`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Yukleme basarisiz");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={compact ? "space-y-3" : "rounded-lg border border-slate-200 bg-white p-4 shadow-sm"}>
      {!compact && (
        <div className="mb-3">
          <h2 className="text-base font-semibold">Evrak Yükle</h2>
          <p className="mt-1 text-sm text-slate-500">Ay ve evrak türünü seçerek yeni belge ekleyin.</p>
        </div>
      )}
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="mb-3 min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
        placeholder="Evrak basligi"
      />
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <select
          value={documentMonth}
          onChange={(event) => setDocumentMonth(event.target.value as (typeof DOCUMENT_MONTH_VALUES)[number])}
          className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
          aria-label="Evrak ayı"
        >
          {DOCUMENT_MONTH_VALUES.map((month) => (
            <option key={month} value={month}>
              {DOCUMENT_MONTH_LABELS[month]}
            </option>
          ))}
        </select>
        <select
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value as (typeof UPLOAD_DOCUMENT_TYPES)[number])}
          className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
          aria-label="Evrak türü"
        >
          {UPLOAD_DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-cyan-800 px-3 py-2 text-sm font-semibold text-white">
          <Camera aria-hidden="true" size={17} />
          {pending ? "Yukleniyor" : "Fotograf Cek"}
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            capture="environment"
            disabled={pending}
            onChange={(event) => uploadFile(event.target.files?.[0])}
          />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
          <Upload aria-hidden="true" size={17} />
          {pending ? "Yukleniyor" : "Dosya Yukle"}
          <input
            className="sr-only"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            disabled={pending}
            onChange={(event) => uploadFile(event.target.files?.[0])}
          />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        {fileName ? `${fileName}: ${status}` : status}
      </p>
    </div>
  );
}
