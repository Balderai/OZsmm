"use client";

import { useState } from "react";
import { Camera, Upload } from "lucide-react";

export function UploadDialog({ compact = false }: { compact?: boolean }) {
  const [fileName, setFileName] = useState<string>("");

  return (
    <div className={compact ? "space-y-3" : "rounded-lg border border-slate-200 bg-white p-4 shadow-sm"}>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-cyan-800 px-3 py-2 text-sm font-semibold text-white">
          <Camera aria-hidden="true" size={17} />
          Fotograf Cek
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
          />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
          <Upload aria-hidden="true" size={17} />
          Dosya Yukle
          <input
            className="sr-only"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
          />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        {fileName ? `${fileName} secildi. Gercek Supabase modunda private bucket'a yuklenecek.` : "PDF, fotograf, Excel veya CSV yukleyebilirsiniz."}
      </p>
    </div>
  );
}
