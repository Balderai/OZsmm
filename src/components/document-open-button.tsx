"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function DocumentOpenButton({ documentId, title }: { documentId: string; title: string }) {
  const [pending, setPending] = useState(false);

  async function openDocument() {
    setPending(true);

    try {
      const response = await fetch("/api/documents/signed-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ document_id: documentId }),
      });
      const payload = (await response.json()) as { signed_url?: string; error?: string };

      if (!response.ok || !payload.signed_url) {
        throw new Error(payload.error || "Evrak acilamadi");
      }

      window.open(payload.signed_url, "_blank", "noopener,noreferrer");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={`${title} icin indirme baglantisi olustur`}
      onClick={openDocument}
      disabled={pending}
      className="grid size-10 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
    >
      <Download aria-hidden="true" size={18} />
    </button>
  );
}
