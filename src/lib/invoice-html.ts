interface InvoiceData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  issued_date: string;
  due_date: string;
  notes: string | null;
  freight_type: string;
  pickup_location: string;
  delivery_location: string;
  weight_kg: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_billing_address: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
}

function fmt(amount: number, currency: string) {
  return `${currency} ${(amount / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const STATUS_COLOR: Record<string, string> = {
  paid: "#16a34a",
  sent: "#2563eb",
  draft: "#6b7280",
  overdue: "#dc2626",
  cancelled: "#9ca3af",
};

export function generateInvoiceHtml(inv: InvoiceData): string {
  const shortId = inv.id.split("-")[0].toUpperCase();
  const color = STATUS_COLOR[inv.status] ?? "#6b7280";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${shortId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f3f4f6; color: #111827; }
    .page { max-width: 760px; margin: 40px auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .header { background: #111827; color: #fff; padding: 36px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-left h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header-left p { color: #9ca3af; font-size: 13px; margin-top: 4px; }
    .header-right { text-align: right; }
    .invoice-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
    .invoice-num { font-size: 28px; font-weight: 800; color: #fff; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: ${color}22; color: ${color}; margin-top: 6px; border: 1px solid ${color}66; }
    .body { padding: 36px 40px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    .meta-block h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; }
    .meta-block p { font-size: 14px; color: #111827; line-height: 1.6; }
    .meta-block .name { font-weight: 700; font-size: 15px; }
    .dates-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px 20px; margin-bottom: 28px; }
    .date-item label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; display: block; margin-bottom: 4px; }
    .date-item span { font-size: 14px; font-weight: 600; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #f3f4f6; }
    th { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; padding: 10px 14px; }
    td { padding: 12px 14px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; }
    .amount-section { display: flex; justify-content: flex-end; margin-bottom: 28px; }
    .amount-box { background: #111827; color: #fff; border-radius: 6px; padding: 20px 28px; text-align: right; min-width: 240px; }
    .amount-box .label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
    .amount-box .total { font-size: 30px; font-weight: 800; margin-top: 4px; }
    .notes { background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 14px 18px; }
    .notes h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #92400e; margin-bottom: 6px; }
    .notes p { font-size: 13px; color: #78350f; }
    .footer { border-top: 1px solid #e5e7eb; padding: 20px 40px; text-align: center; color: #9ca3af; font-size: 12px; }
    @media print {
      body { background: #fff; }
      .page { margin: 0; border: none; border-radius: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <h1>${inv.company_name}</h1>
        <p>${inv.company_email} · ${inv.company_phone}</p>
        <p style="margin-top:2px">${inv.company_address}</p>
      </div>
      <div class="header-right">
        <div class="invoice-label">Invoice</div>
        <div class="invoice-num">#${shortId}</div>
        <div class="status-badge">${inv.status}</div>
      </div>
    </div>

    <div class="body">
      <div class="meta-grid">
        <div class="meta-block">
          <h3>Bill To</h3>
          <p class="name">${inv.customer_name}</p>
          <p>${inv.customer_billing_address}</p>
          <p>${inv.customer_email}</p>
          <p>${inv.customer_phone}</p>
        </div>
        <div class="meta-block">
          <h3>Shipment</h3>
          <p><strong>Freight:</strong> ${inv.freight_type}</p>
          <p><strong>Weight:</strong> ${inv.weight_kg} kg</p>
          <p><strong>From:</strong> ${inv.pickup_location}</p>
          <p><strong>To:</strong> ${inv.delivery_location}</p>
        </div>
      </div>

      <div class="dates-row">
        <div class="date-item">
          <label>Issued</label>
          <span>${fmtDate(inv.issued_date)}</span>
        </div>
        <div class="date-item">
          <label>Due Date</label>
          <span>${fmtDate(inv.due_date)}</span>
        </div>
        <div class="date-item">
          <label>Ref #</label>
          <span>${inv.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Route</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${inv.freight_type} Transportation<br/><span style="color:#6b7280;font-size:12px">${inv.weight_kg} kg load</span></td>
            <td>${inv.pickup_location} → ${inv.delivery_location}</td>
            <td style="text-align:right;font-weight:600">${fmt(inv.amount, inv.currency)}</td>
          </tr>
        </tbody>
      </table>

      <div class="amount-section">
        <div class="amount-box">
          <div class="label">Total Due</div>
          <div class="total">${fmt(inv.amount, inv.currency)}</div>
        </div>
      </div>

      ${inv.notes ? `<div class="notes"><h4>Notes</h4><p>${inv.notes}</p></div>` : ""}
    </div>

    <div class="footer">
      Thank you for your business. Please remit payment by ${fmtDate(inv.due_date)}.
    </div>
  </div>
</body>
</html>`;
}
