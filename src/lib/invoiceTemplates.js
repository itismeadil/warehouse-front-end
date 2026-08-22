// Supplier-specific invoice templates.
//
// The scanner OCRs the image into raw text first (Tesseract can't reliably
// match a logo as a picture — skew, lighting, and compression make pixel
// matching fragile). What IS reliable is matching text that always sits
// near the logo: the company name, a fixed header phrase, a VAT/CR number,
// a particular invoice-number prefix, etc. So a "template" here identifies
// a supplier by a piece of stable text, then parses the rest of that
// invoice with rules written specifically for its layout — instead of the
// generic best-effort regexes in InvoiceScanner.jsx.
//
// HOW TO ADD ONE (once you have a real sample invoice):
//   1. Scan it once with the generic parser and copy the raw OCR text
//      Tesseract produced (InvoiceScanner keeps it on data.rawText — log it
//      or eyeball it in the browser console) so you can see exactly what
//      Tesseract outputs for THIS invoice: line order, spacing, any OCR
//      quirks (e.g. "0" read as "O").
//   2. Push a new object into `invoiceTemplates` below, following the
//      shape of the commented EXAMPLE_TEMPLATE.
//   3. Nothing else needs to change — InvoiceScanner.jsx already checks
//      every registered template before falling back to the generic parser.
//
// Order matters: the FIRST template whose `identify()` returns true wins,
// so put more specific matches before broader ones if you ever have two
// suppliers with overlapping text.

/*
const EXAMPLE_TEMPLATE = {
  id: "acme-trading",
  name: "Acme Trading Co.",

  // Return true only when you're confident this invoice came from this
  // supplier. Prefer something that appears verbatim near the logo on
  // every invoice they issue (company name, VAT number, a fixed header
  // line) over anything based on position — OCR line order shifts with
  // rotation/skew, but the *presence* of a distinctive phrase is stable.
  identify: (text) =>
    /acme\s+trading/i.test(text) || /VAT\s*300123456700003/i.test(text),

  // Given the raw OCR text (and Tesseract's confidence score), return
  // whichever fields you can reliably pull out. Any field you omit falls
  // back to the generic parser's guess for that field, so you only need
  // to write rules for the parts that differ from a normal invoice —
  // e.g. maybe just the invoiceNumber pattern and the line-item table
  // layout, because their date/total format happens to already match
  // what the generic parser expects.
  parse: (text) => {
    const data = {};

    const invMatch = text.match(/PO[\s#-]*([0-9]{6,})/i);
    if (invMatch) data.invoiceNumber = invMatch[1];

    // Acme's line items print as "SKU  Description  Qty  Unit  Total",
    // one per line — write a regex that matches THEIR exact column order.
    const lineItemPattern =
      /^[A-Z0-9-]+\s+(.+?)\s+(\d+)\s+[\d.]+\s+([\d.]+)$/gm;
    const lineItems = [];
    let m;
    while ((m = lineItemPattern.exec(text)) !== null) {
      lineItems.push({
        description: m[1].trim(),
        quantity: parseInt(m[2], 10),
        price: parseFloat(m[3]),
      });
    }
    if (lineItems.length > 0) data.lineItems = lineItems;

    return data;
  },
};
*/

export const invoiceTemplates = [
  {
    id: "al-raha-furniture",
    name: "Al Raha Furniture",

    // The header prints "AL RAHA FURNITURE" in large Latin caps and
    // "مفروشات الراحة" in Arabic — Latin text OCRs far more reliably than
    // Arabic, so it's checked first and the Arabic name is just a backup.
    identify: (text) =>
      /al\s*raha\s*furniture/i.test(text) || /مفروشات\s*الراحة/.test(text),

    // Verified against real Tesseract output captured from an actual
    // sample invoice at three different preprocessing scales (native
    // resolution, and the 2x/3x canvas-preprocessed versions the scanner
    // actually feeds Tesseract) — every field below either extracts
    // correctly or is left blank; none silently return a wrong value.
    parse: (text) => {
      const data = {};

      // OCR sometimes reads a decimal point as a comma or produces a
      // doubled separator (e.g. "3,500.00" -> "3.500.00", or a stray
      // extra dot). Treat whichever separator appears LAST as the true
      // decimal point and strip any earlier ones as thousands
      // separators — a plain comma->dot replace corrupts thousands
      // amounts (e.g. naively turns "3,500.00" into "3.500.00").
      const normalizeAmount = (raw) => {
        const cleaned = raw.replace(/\s/g, "");
        const lastSep = Math.max(
          cleaned.lastIndexOf(","),
          cleaned.lastIndexOf("."),
        );
        if (lastSep === -1) return cleaned;
        const intPart = cleaned.slice(0, lastSep).replace(/[.,]/g, "");
        const decPart = cleaned.slice(lastSep + 1);
        return `${intPart}.${decPart}`;
      };

      // Invoice number: this supplier always prints it as YYYY-NNNNNN
      // (e.g. "2025-000123"). Matching that exact shape directly is far
      // more reliable than anchoring on the "Invoice No." label, because
      // the label is bilingual (رقم الفاتورة / Invoice No.) sitting right
      // next to the Arabic "فاتورة" header — OCR frequently separates the
      // number from its label entirely. This is also the field most
      // sensitive to image resolution: it may not come through at every
      // scale, in which case it's simply left blank rather than guessed.
      const invMatch = text.match(/\b(20\d{2}-\d{6})\b/);
      if (invMatch) data.invoiceNumber = invMatch[1];

      // Date: printed as yyyy/mm/dd.
      const dateMatch = text.match(/(\d{4}\/\d{1,2}\/\d{1,2})/);
      if (dateMatch) data.date = dateMatch[1];

      // Time: "11:30 AM" — plain Latin digits, OCRs cleanly and
      // consistently since there's no adjacent Arabic on the same run.
      const timeMatch = text.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
      if (timeMatch) data.time = timeMatch[1];

      // Line items: each row always prints as
      //   <total>  <unit price>  <qty>
      // on one OCR line (the numbers stay in this order and on one line
      // even when everything else around them — item names, Arabic text
      // — gets scrambled by the RTL layout). Collect every such triple,
      // verifying total = unitPrice x qty to reject any stray numbers
      // that happen to land next to each other elsewhere on the page.
      const rowPattern =
        /(\d{1,3}(?:[.,]\d{2,3})+)\s+(\d{1,3}(?:[.,]\d{2,3})+)\s+(\d{1,2})\b/g;
      const rows = [];
      let m;
      while ((m = rowPattern.exec(text)) !== null) {
        const total = parseFloat(normalizeAmount(m[1]));
        const price = parseFloat(normalizeAmount(m[2]));
        const quantity = parseInt(m[3], 10);
        if (quantity > 0 && Math.abs(total - price * quantity) < 0.5) {
          rows.push({ price, quantity });
        }
      }

      // Al Raha's catalog, as the English names print on their invoices.
      // Matched in the order they appear in the OCR text, not by table
      // position, since RTL reflow can move a name a line or two from
      // its row. Only assigned to rows when EVERY name was found and the
      // count matches — a blank description the user notices and fills
      // in is safer than a wrong one silently assigned to the wrong row
      // (which is a real risk here: at some preprocessing scales only 2
      // of the 4 names come through legibly).
      const knownItems = [
        "3-Seater Sofa",
        "Coffee Table",
        "Side Table",
        "Single Chair",
      ];
      const foundNames = knownItems
        .map((name) => ({ name, idx: text.indexOf(name) }))
        .filter((n) => n.idx !== -1)
        .sort((a, b) => a.idx - b.idx);
      const namesReliable = foundNames.length === rows.length;

      if (rows.length > 0) {
        data.lineItems = rows.map((row, i) => ({
          description: namesReliable ? foundNames[i].name : "",
          quantity: row.quantity,
          price: row.price,
        }));
      }

      // Subtotal / VAT / Grand total: each amount's own label can land on
      // a different OCR line than the number due to RTL reflow, so search
      // nearby lines instead of requiring both on the same line. A number
      // on the SAME line but AFTER the label is checked last, since that
      // slot is where a *different* field's value often bleeds in (e.g.
      // "VAT (15%) SAR 4,025.00" — that 4,025.00 is the grand total, not
      // the VAT amount).
      const lines = text.split("\n");
      const amountRegex = /(\d{1,3}(?:[.,]\d{2,3})+)/;

      const amountNear = (labelRegex, radius = 2) => {
        const labelLine = lines.findIndex((l) => labelRegex.test(l));
        if (labelLine === -1) return null;
        const line = lines[labelLine];
        const labelMatch = line.match(labelRegex);

        let found = line.slice(0, labelMatch.index).match(amountRegex);
        if (found) return normalizeAmount(found[1]);

        for (let d = 1; d <= radius; d++) {
          const i = labelLine - d;
          if (i < 0) continue;
          found = lines[i].match(amountRegex);
          if (found) return normalizeAmount(found[1]);
        }

        found = line
          .slice(labelMatch.index + labelMatch[0].length)
          .match(amountRegex);
        if (found) return normalizeAmount(found[1]);

        for (let d = 1; d <= radius; d++) {
          const i = labelLine + d;
          if (i >= lines.length) continue;
          found = lines[i].match(amountRegex);
          if (found) return normalizeAmount(found[1]);
        }

        return null;
      };

      const subtotal = amountNear(/subtotal/i);
      if (subtotal) data.subtotal = subtotal;

      const vat = amountNear(/VAT/i);
      if (vat) data.vatAmount = vat;

      const grandTotal = amountNear(/grand\s*total/i);
      if (grandTotal) data.total = grandTotal;

      // VAT is always printed as a percentage right next to the amount.
      const taxRateMatch = text.match(/\((\d{1,2})%\)/);
      if (taxRateMatch) data.taxRate = taxRateMatch[1];

      // This supplier always prints the rate next to the amount, so once
      // subtotal + rate are known the correct VAT is known to the cent —
      // that arithmetic is far more trustworthy than a single fragile OCR
      // read of the amount (a misread digit doesn't "look" wrong the way
      // a garbled word does). Prefer the computed value whenever the
      // OCR'd one is off by more than rounding.
      if (data.subtotal && data.taxRate) {
        const expected =
          (parseFloat(data.subtotal) * parseFloat(data.taxRate)) / 100;
        const ocrVat = data.vatAmount ? parseFloat(data.vatAmount) : null;
        if (ocrVat === null || Math.abs(ocrVat - expected) > 1) {
          data.vatAmount = expected.toFixed(2);
        }
      }

      return data;
    },
  },

  // Add more supplier templates here, e.g.: EXAMPLE_TEMPLATE,
];

// Returns the first matching template for this OCR text, or null if none
// match (in which case InvoiceScanner falls back to its generic parser).
export function matchTemplate(text) {
  return invoiceTemplates.find((template) => template.identify(text)) || null;
}
