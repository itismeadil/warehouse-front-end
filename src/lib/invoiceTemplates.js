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
  // Add supplier templates here, e.g.: EXAMPLE_TEMPLATE,
];

// Returns the first matching template for this OCR text, or null if none
// match (in which case InvoiceScanner falls back to its generic parser).
export function matchTemplate(text) {
  return invoiceTemplates.find((template) => template.identify(text)) || null;
}
