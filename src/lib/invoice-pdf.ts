import PDFDocument from "pdfkit";

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

export function generateInvoicePdf(inv: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const shortId = inv.id.split("-")[0].toUpperCase();
    const dark = "#111827";
    const mid = "#6b7280";
    const light = "#e5e7eb";
    const W = doc.page.width - 100; // usable width

    // ── Header background ────────────────────────
    doc.rect(0, 0, doc.page.width, 110).fill(dark);

    // Company name
    doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold")
      .text(inv.company_name, 50, 35);
    doc.fillColor("#9ca3af").fontSize(9).font("Helvetica")
      .text(`${inv.company_email}  ·  ${inv.company_phone}`, 50, 58)
      .text(inv.company_address, 50, 71);

    // Invoice number (right side)
    doc.fillColor("#9ca3af").fontSize(9).font("Helvetica")
      .text("INVOICE", 50, 35, { align: "right" });
    doc.fillColor("#ffffff").fontSize(22).font("Helvetica-Bold")
      .text(`#${shortId}`, 50, 46, { align: "right" });
    doc.fillColor("#ffffff").fontSize(9).font("Helvetica")
      .text(inv.status.toUpperCase(), 50, 76, { align: "right" });

    doc.moveDown(3);

    // ── Bill To / Shipment columns ────────────────
    const colY = 130;
    const col1X = 50;
    const col2X = 310;

    doc.fillColor(mid).fontSize(8).font("Helvetica-Bold")
      .text("BILL TO", col1X, colY);
    doc.fillColor(dark).fontSize(11).font("Helvetica-Bold")
      .text(inv.customer_name, col1X, colY + 14);
    doc.fillColor(mid).fontSize(9).font("Helvetica")
      .text(inv.customer_billing_address, col1X, colY + 28, { width: 220 })
      .text(inv.customer_email, col1X, colY + 52)
      .text(inv.customer_phone, col1X, colY + 65);

    doc.fillColor(mid).fontSize(8).font("Helvetica-Bold")
      .text("SHIPMENT", col2X, colY);
    doc.fillColor(dark).fontSize(9).font("Helvetica")
      .text(`Freight: ${inv.freight_type}`, col2X, colY + 14)
      .text(`Weight:  ${inv.weight_kg} kg`, col2X, colY + 27)
      .text(`From:    ${inv.pickup_location}`, col2X, colY + 40, { width: 220 })
      .text(`To:      ${inv.delivery_location}`, col2X, colY + 65, { width: 220 });

    // ── Dates bar ────────────────────────────────
    const datesY = 225;
    doc.rect(50, datesY, W, 38).fill("#f9fafb").stroke(light);
    doc.fillColor(mid).fontSize(8).font("Helvetica-Bold")
      .text("ISSUED", 66, datesY + 7)
      .text("DUE DATE", 250, datesY + 7)
      .text("REFERENCE", 430, datesY + 7);
    doc.fillColor(dark).fontSize(10).font("Helvetica-Bold")
      .text(fmtDate(inv.issued_date), 66, datesY + 20)
      .text(fmtDate(inv.due_date), 250, datesY + 20)
      .text(inv.id.slice(0, 8).toUpperCase(), 430, datesY + 20);

    // ── Line items table ─────────────────────────
    const tableY = 285;

    // Table header
    doc.rect(50, tableY, W, 22).fill("#f3f4f6");
    doc.fillColor(mid).fontSize(8).font("Helvetica-Bold")
      .text("DESCRIPTION", 66, tableY + 7)
      .text("ROUTE", 280, tableY + 7)
      .text("AMOUNT", 50, tableY + 7, { align: "right" });

    // Table row
    const rowY = tableY + 22;
    doc.rect(50, rowY, W, 40).fill("#ffffff").stroke(light);
    doc.fillColor(dark).fontSize(10).font("Helvetica-Bold")
      .text(`${inv.freight_type} Transportation`, 66, rowY + 8);
    doc.fillColor(mid).fontSize(8).font("Helvetica")
      .text(`${inv.weight_kg} kg load`, 66, rowY + 22);
    doc.fillColor(dark).fontSize(9).font("Helvetica")
      .text(`${inv.pickup_location} → ${inv.delivery_location}`, 230, rowY + 14, { width: 220 });
    doc.fillColor(dark).fontSize(10).font("Helvetica-Bold")
      .text(fmt(inv.amount, inv.currency), 50, rowY + 14, { align: "right" });

    // ── Total box ────────────────────────────────
    const totalY = rowY + 60;
    const boxW = 200;
    const boxX = doc.page.width - 50 - boxW;
    doc.rect(boxX, totalY, boxW, 56).fill(dark);
    doc.fillColor("#9ca3af").fontSize(8).font("Helvetica")
      .text("TOTAL DUE", boxX, totalY + 10, { width: boxW, align: "center" });
    doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold")
      .text(fmt(inv.amount, inv.currency), boxX, totalY + 24, { width: boxW, align: "center" });

    // ── Notes ────────────────────────────────────
    if (inv.notes) {
      const notesY = totalY + 80;
      doc.rect(50, notesY, W, 1).fill(light);
      doc.fillColor(mid).fontSize(8).font("Helvetica-Bold")
        .text("NOTES", 50, notesY + 8);
      doc.fillColor("#78350f").fontSize(9).font("Helvetica")
        .text(inv.notes, 50, notesY + 20, { width: W });
    }

    // ── Footer ───────────────────────────────────
    const footerY = doc.page.height - 60;
    doc.rect(0, footerY, doc.page.width, 60).fill("#f9fafb");
    doc.fillColor(mid).fontSize(9).font("Helvetica")
      .text(
        `Thank you for your business. Please remit payment by ${fmtDate(inv.due_date)}.`,
        50,
        footerY + 22,
        { align: "center", width: W }
      );

    doc.end();
  });
}
