import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { getItems } from "../../api/items";
import { getSalesInvoices, createSalesInvoice } from "../../api/accountant";
import DatePicker, { toLocalDateString } from "../DatePicker";

const Spinner = () => (
  <div
    className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent text-primary-500"
    aria-hidden
  />
);

const emptyLine = () => ({ itemId: "", quantity: 1, unitPrice: "" });

export default function SalesInvoicesTab() {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [lines, setLines] = useState([emptyLine()]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const loadInvoices = () => {
    setLoading(true);
    setListError("");
    getSalesInvoices()
      .then((data) => setInvoices(Array.isArray(data) ? data : []))
      .catch((err) => setListError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const loadItems = () => {
      getItems()
        .then((data) => {
          setItems(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error(err));
    };

    loadItems();
    loadInvoices();

    // Refresh items every 30 seconds to keep stock updated
    const interval = setInterval(loadItems, 30000);

    return () => clearInterval(interval);
  }, []);

  const updateLine = (index, patch) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (index) =>
    setLines((prev) => prev.filter((_, i) => i !== index));

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
    0,
  );

  // Distinct calendar days that have at least one sales invoice, for highlighting
  const salesDates = useMemo(() => {
    const dates = invoices
      .map((inv) => inv.date || inv.createdAt)
      .filter(Boolean)
      .map((d) => toLocalDateString(new Date(d)));
    return Array.from(new Set(dates));
  }, [invoices]);

  const filteredInvoices = selectedDate
    ? invoices.filter((inv) => {
        const invoiceDate = new Date(inv.date || inv.createdAt);
        const filterDate = new Date(selectedDate);
        return (
          invoiceDate.getFullYear() === filterDate.getFullYear() &&
          invoiceDate.getMonth() === filterDate.getMonth() &&
          invoiceDate.getDate() === filterDate.getDate()
        );
      })
    : invoices.filter((inv) => {
        const invoiceDate = new Date(inv.date || inv.createdAt);
        const today = new Date();
        return (
          invoiceDate.getFullYear() === today.getFullYear() &&
          invoiceDate.getMonth() === today.getMonth() &&
          invoiceDate.getDate() === today.getDate()
        );
      });

  const resetForm = () => {
    setInvoiceNumber("");
    setCustomerName("");
    setLines([emptyLine()]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const validLines = lines.filter(
      (l) => l.itemId && l.quantity && l.unitPrice !== "",
    );
    if (validLines.length === 0) {
      return setFormError(t("atLeastOneLine"));
    }

    setSaving(true);
    try {
      await createSalesInvoice({
        invoiceNumber: invoiceNumber.trim() || undefined,
        customerName: customerName.trim() || undefined,
        lines: validLines.map((l) => ({
          itemId: l.itemId,
          itemName: items.find((i) => i._id === l.itemId)?.name,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })),
      });
      resetForm();
      loadInvoices();
      // Reload items to update stock numbers
      getItems()
        .then((data) => {
          console.log("Reloaded items after invoice:", data);
          setItems(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error(err));
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      const stockErrors = err.response?.data?.stockErrors;

      if (stockErrors && stockErrors.length > 0) {
        const errorDetails = stockErrors
          .map(
            (error) =>
              `• ${error.itemName}: Requested ${error.requested}, Available ${error.available}`,
          )
          .join("\n");
        setFormError(`${errorMessage}\n\n${errorDetails}`);
      } else {
        setFormError(errorMessage);
      }
      // Scroll to top to show error
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-graphite-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("invoiceNumber")}
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder={t("autoGenerated")}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("customerName")}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-graphite-700">
            {t("lines")}
          </label>
          {lines.map((line, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <select
                value={line.itemId}
                onChange={(e) => updateLine(index, { itemId: e.target.value })}
                className="min-w-[10rem] flex-1 rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">{t("selectItem")}</option>
                {items.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} — {item.serialNumber}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={line.quantity}
                onChange={(e) =>
                  updateLine(index, { quantity: e.target.value })
                }
                placeholder={t("quantity")}
                className="w-24 rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.unitPrice}
                onChange={(e) =>
                  updateLine(index, { unitPrice: e.target.value })
                }
                placeholder={t("unitPrice")}
                className="w-28 rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="rounded-lg p-2 text-graphite-400 hover:bg-graphite-100 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("addLine")}
          </button>
        </div>

        <p className="mt-4 text-sm text-graphite-700">
          {t("total")}:{" "}
          <span className="font-semibold">{total.toFixed(2)}</span>
        </p>

        {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Spinner />}
          {saving ? t("saving") : t("createSalesInvoice")}
        </button>
      </form>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">
            {t("salesInvoiceHistory")}
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">
              {t("filterByDate")}
            </label>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder={t("selectDate")}
              markedDates={salesDates}
              markedLabel={t("salesDay", { defaultValue: "Sales day" })}
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate("")}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-primary-400 hover:bg-slate-700 hover:text-primary-300 transition-colors"
              >
                {t("clear")}
              </button>
            )}
          </div>
        </div>
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center gap-2">
              <Spinner />
              <p className="text-sm text-slate-400">{t("loading")}</p>
            </div>
          ) : listError ? (
            <p className="text-sm text-red-400">{listError}</p>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-sm text-slate-400">
              {selectedDate ? t("noInvoicesForDate") : t("noInvoicesYet")}
            </p>
          ) : (
            <div className="divide-y divide-slate-700 rounded-xl border border-slate-700 bg-slate-800">
              {filteredInvoices.map((inv) => (
                <div key={inv._id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-100">
                      {inv.invoiceNumber} ·{" "}
                      {inv.customerName || t("noCustomerName")}
                    </p>
                    <p className="text-sm font-semibold text-slate-100">
                      {inv.totalAmount || inv.total}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {new Date(inv.date || inv.createdAt).toLocaleString()}
                  </p>
                  {(inv.vatAmount !== undefined ||
                    inv.vatRate !== undefined) && (
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                      {inv.vatRate !== undefined && (
                        <span>
                          {t("vat")}: {inv.vatRate}%
                        </span>
                      )}
                      {inv.subtotal !== undefined && (
                        <span>
                          {t("subtotal")}: {inv.subtotal.toFixed(2)}
                        </span>
                      )}
                      {inv.vatAmount !== undefined && (
                        <span className="text-red-400">
                          {t("vatDeduction")}: -{inv.vatAmount.toFixed(2)}
                        </span>
                      )}
                      {inv.totalAmount !== undefined && (
                        <span className="font-medium">
                          {t("totalAfterTax")}: {inv.totalAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                  <ul className="mt-1.5 space-y-0.5">
                    {inv.lines.map((line, i) => (
                      <li key={i} className="text-xs text-slate-400">
                        {line.itemName} · {line.quantity} × {line.unitPrice} ={" "}
                        {line.lineTotal}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
