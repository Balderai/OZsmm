"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderCard } from "@/components/folder-card";
import { FOLDER_TYPES } from "@/lib/constants";
import { DEMO_DOCUMENTS_CHANGED_EVENT, mergePortalDocuments, readDemoDocuments } from "@/lib/demo-documents";
import type { PortalDocument } from "@/types/domain";

export function ClientHomeFolders({
  clientId,
  documents,
}: {
  clientId: string;
  documents: PortalDocument[];
}) {
  const [demoDocuments, setDemoDocuments] = useState<PortalDocument[]>([]);
  const visibleDocuments = useMemo(() => mergePortalDocuments(documents, demoDocuments), [documents, demoDocuments]);
  const folderCounts = Object.fromEntries(
    FOLDER_TYPES.map((folderType) => [
      folderType,
      visibleDocuments.filter((document) => document.folderType === folderType).length,
    ]),
  ) as Record<(typeof FOLDER_TYPES)[number], number>;

  useEffect(() => {
    function refreshDemoDocuments() {
      setDemoDocuments(readDemoDocuments({ clientId }));
    }

    refreshDemoDocuments();
    window.addEventListener(DEMO_DOCUMENTS_CHANGED_EVENT, refreshDemoDocuments);
    window.addEventListener("storage", refreshDemoDocuments);

    return () => {
      window.removeEventListener(DEMO_DOCUMENTS_CHANGED_EVENT, refreshDemoDocuments);
      window.removeEventListener("storage", refreshDemoDocuments);
    };
  }, [clientId]);

  return (
    <section aria-label="Ana klasorler" className="grid gap-3 sm:grid-cols-3">
      {FOLDER_TYPES.map((folderType) => (
        <FolderCard key={folderType} folderType={folderType} count={folderCounts[folderType]} />
      ))}
    </section>
  );
}
