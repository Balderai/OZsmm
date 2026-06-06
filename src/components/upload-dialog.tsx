"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload } from "lucide-react";
import type { FolderType } from "@/types/domain";

export function UploadDialog({
  compact = false,
  clientId,
  folderType = "documents_photos",
  origin = "client_uploaded",
}: {
  compact?: boolean;
  clientId: string;
  folderType?: FolderType;
  origin?: "accountant_shared" | "client_uploaded";
}) {
  const [fileName, setFileName] = useState<string>("");
  const [title, setTitle] = useState("");
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

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Yukleme basarisiz");
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
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="mb-3 min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
        placeholder="Evrak basligi"
      />
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
