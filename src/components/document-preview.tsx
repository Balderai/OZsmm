"use client";

import { useEffect, useState } from "react";
import { FileText, ImageIcon } from "lucide-react";

type DocumentPreviewProps = {
  documentId: string;
  title: string;
  mimeType?: string;
  compact?: boolean;
};

export function DocumentPreview({ documentId, title, mimeType, compact = false }: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [failed, setFailed] = useState(false);
  const isImage = mimeType?.startsWith("image/");
  const isLocalDemoDocument = documentId.startsWith("local-");
  const sizeClass = compact ? "size-11" : "size-16";

  useEffect(() => {
    if (!isImage || isLocalDemoDocument) return;

    let cancelled = false;

    async function loadPreview() {
      try {
        const response = await fetch("/api/documents/signed-url", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ document_id: documentId }),
        });
        const payload = (await response.json()) as { signed_url?: string };

        if (!cancelled && response.ok && payload.signed_url) {
          setPreviewUrl(payload.signed_url);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [documentId, isImage, isLocalDemoDocument]);

  if (isImage && previewUrl && !failed) {
    return (
      <span
        role="img"
        aria-label={`${title} onizleme`}
        className={`${sizeClass} shrink-0 rounded-md border border-slate-200 bg-slate-100 bg-cover bg-center`}
        style={{ backgroundImage: `url("${previewUrl}")` }}
      />
    );
  }

  const Icon = isImage ? ImageIcon : FileText;

  return (
    <span className={`${sizeClass} grid shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700`}>
      <Icon aria-hidden="true" size={compact ? 18 : 22} />
    </span>
  );
}
