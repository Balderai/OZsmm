import { ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";

type InvoiceItem = {
  id: string;
  title: string;
  amount: number;
  vat: number;
  date: string;
};

const incomingInvoices: InvoiceItem[] = [
  { id: "in-1", title: "Tedarikçi faturası", amount: 12800, vat: 2560, date: "2026-06-05" },
  { id: "in-2", title: "Kira ve ofis gideri", amount: 7200, vat: 1440, date: "2026-06-03" },
];

const outgoingInvoices: InvoiceItem[] = [
  { id: "out-1", title: "Satış faturası", amount: 31500, vat: 6300, date: "2026-06-06" },
  { id: "out-2", title: "Hizmet faturası", amount: 18600, vat: 3720, date: "2026-06-04" },
];

export function InvoiceVatOverview() {
  const incomingVat = sumVat(incomingInvoices);
  const outgoingVat = sumVat(outgoingInvoices);
  const currentVat = outgoingVat - incomingVat;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h2 className="text-base font-semibold">Fatura ve KDV Durumu</h2>
          <p className="mt-1 text-sm text-slate-500">Güncel KDV: {formatCurrency(Math.abs(currentVat))} {currentVat >= 0 ? "ödenecek" : "devreden"}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          <ReceiptText aria-hidden="true" size={14} />
          API bekleniyor
        </span>
      </div>
      <div className="grid md:grid-cols-2 md:divide-x md:divide-slate-200">
        <InvoiceColumn title="Gelen Faturalar" icon="incoming" invoices={incomingInvoices} />
        <InvoiceColumn title="Giden Faturalar" icon="outgoing" invoices={outgoingInvoices} />
      </div>
    </section>
  );
}

function InvoiceColumn({ title, icon, invoices }: { title: string; icon: "incoming" | "outgoing"; invoices: InvoiceItem[] }) {
  const Icon = icon === "incoming" ? ArrowDownLeft : ArrowUpRight;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Icon aria-hidden="true" size={16} className={icon === "incoming" ? "text-emerald-700" : "text-cyan-800"} />
          {title}
        </h3>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{formatCurrency(sumVat(invoices))} KDV</span>
      </div>
      <div className="mt-3 space-y-2">
        {invoices.map((invoice) => (
          <article key={invoice.id} className="rounded-md border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{invoice.title}</p>
                <p className="mt-1 text-xs text-slate-500">{new Intl.DateTimeFormat("tr-TR").format(new Date(invoice.date))}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatCurrency(invoice.amount)}</p>
                <p className="mt-1 text-xs text-slate-500">{formatCurrency(invoice.vat)} KDV</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function sumVat(invoices: InvoiceItem[]) {
  return invoices.reduce((total, invoice) => total + invoice.vat, 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}
