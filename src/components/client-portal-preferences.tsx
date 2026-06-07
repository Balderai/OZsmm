"use client";

import { useEffect, useState } from "react";
import { InvoiceVatOverview } from "@/components/invoice-vat-overview";

type ClientPortalPreferences = {
  showIncomingInvoices: boolean;
  showOutgoingInvoices: boolean;
};

const defaultPreferences: ClientPortalPreferences = {
  showIncomingInvoices: true,
  showOutgoingInvoices: true,
};

export function ClientPortalPreferences({ clientId }: { clientId: string }) {
  const [preferences, setPreferences] = useState<ClientPortalPreferences>(defaultPreferences);

  useEffect(() => {
    function readPreferences() {
      setPreferences(loadClientPortalPreferences(clientId));
    }

    readPreferences();
    window.addEventListener("storage", readPreferences);
    window.addEventListener("client-portal-preferences-changed", readPreferences);

    return () => {
      window.removeEventListener("storage", readPreferences);
      window.removeEventListener("client-portal-preferences-changed", readPreferences);
    };
  }, [clientId]);

  return (
    <InvoiceVatOverview
      showIncoming={preferences.showIncomingInvoices}
      showOutgoing={preferences.showOutgoingInvoices}
    />
  );
}

function loadClientPortalPreferences(clientId: string): ClientPortalPreferences {
  try {
    const rawPreferences = window.localStorage.getItem(getClientPortalPreferenceKey(clientId));
    if (!rawPreferences) return defaultPreferences;

    return { ...defaultPreferences, ...JSON.parse(rawPreferences) };
  } catch {
    return defaultPreferences;
  }
}

function getClientPortalPreferenceKey(clientId: string) {
  return `client-portal-preferences:${clientId}`;
}
