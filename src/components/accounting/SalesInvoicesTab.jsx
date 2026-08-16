import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, RefreshCw, Camera } from "lucide-react";
import { getItems } from "../../api/items";
import { getSalesInvoices, createSalesInvoice } from "../../api/accountant";
import DatePicker, { toLocalDateString } from "../DatePicker";
import InvoiceScanner from "./InvoiceScanner";

const Spinner = () => (
  <div
    className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    style={{ color: "#45a1a1" }}
    aria-hidden
  />
);

const emptyLine = () => ({
  itemId: "",
  quantity: 1,
  unitPrice: "",
  description: "",
});

export default function SalesInvoicesTab() {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [vatRate, setVatRate] = useState(15); // KSA standard VAT rate is 15%

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [refreshingItems, setRefreshingItems] = useState(false);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showScanner, setShowScanner] = useState(false);

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

  const vatAmount = total * (vatRate / 100);
  const totalAfterTax = total - vatAmount;

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
    setVatRate(15);
  };

  const handleScanComplete = (data) => {
    if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
    if (data.taxRate) setVatRate(Number(data.taxRate));
    if (data.lineItems && data.lineItems.length > 0) {
      const newLines = data.lineItems.map((item) => ({
        itemId: "",
        quantity: item.quantity,
        unitPrice: item.price,
        description: item.description || "",
      }));
      setLines(newLines);
    }
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
        vatRate: vatRate,
        subtotal: total,
        vatAmount: vatAmount,
        totalAmount: totalAfterTax,
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
      {showScanner && (
        <InvoiceScanner
          onScanComplete={handleScanComplete}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Helpful Hint */}
      <div className="mb-4 rounded-lg bg-purple-50 px-4 py-3 border border-purple-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Plus className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-purple-900 mb-1">
              {t("salesInvoicesHintTitle")}
            </h4>
            <p className="text-xs text-purple-800 leading-relaxed">
              {t("salesInvoicesHint")}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-graphite-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-graphite-900">
            Create Sales Invoice
          </h2>
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
          >
            <Camera className="h-4 w-4" />
            Scan Invoice
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("invoiceNumber")}{" "}
              <span className="text-graphite-400">({t("optional")})</span>
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
              {t("customerName")}{" "}
              <span className="text-graphite-400">({t("optional")})</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("vatRate")} (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-graphite-700">
              {t("lines")}
            </label>

            <button
              type="button"
              onClick={() => {
                setRefreshingItems(true);
                getItems()
                  .then((data) => {
                    console.log("Manually refreshed items:", data);
                    setItems(Array.isArray(data) ? data : []);
                  })
                  .catch((err) => console.error(err))
                  .finally(() => setRefreshingItems(false));
              }}
              disabled={refreshingItems}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshingItems ? "animate-spin" : ""}`}
              />
              Refresh Stock
            </button>
          </div>

          {lines.map((line, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <select
                value={line.itemId}
                onChange={(e) => updateLine(index, { itemId: e.target.value })}
                className="min-w-[10rem] flex-1 rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">{t("selectItem")}</option>

                {items.map((item) => {
                  const isOutOfStock = (item.stock || 0) === 0;

                  return (
                    <option
                      key={item._id}
                      value={item._id}
                      disabled={isOutOfStock}
                    >
                      {item.name} — {item.serialNumber} (Stock:{" "}
                      {item.stock || 0}){isOutOfStock ? " - OUT OF STOCK" : ""}
                    </option>
                  );
                })}
              </select>
              {line.description && (
                <input
                  type="text"
                  value={line.description}
                  onChange={(e) =>
                    updateLine(index, { description: e.target.value })
                  }
                  placeholder="Item description"
                  className="min-w-[8rem] flex-1 rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-graphite-50"
                  readOnly
                />
              )}
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

              {line.itemId && (
                <span className="text-xs text-graphite-500">
                  Max: {items.find((i) => i._id === line.itemId)?.stock || 0}
                </span>
              )}

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

        <div className="mt-4 space-y-2 rounded-lg bg-graphite-50 p-4">
          <div className="flex justify-between text-sm text-graphite-700">
            <span>{t("subtotal")}</span>
            <span className="font-semibold">{total.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm text-graphite-700">
            <span>
              {t("vatDeduction")} ({vatRate}%)
            </span>
            <span className="font-semibold text-red-600">
              -{vatAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between border-t border-graphite-200 pt-2 text-sm font-medium text-graphite-900">
            <span>{t("totalAfterTax")}</span>
            <span className="font-semibold">{totalAfterTax.toFixed(2)}</span>
          </div>
        </div>

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
          <h2 className="text-sm font-semibold text-graphite-900">
            {t("salesInvoiceHistory")}
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-graphite-600">
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
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
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
              <p className="text-sm text-graphite-500">{t("loading")}</p>
            </div>
          ) : listError ? (
            <p className="text-sm text-red-600">{listError}</p>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-sm text-graphite-500">
              {selectedDate ? t("noInvoicesForDate") : t("noInvoicesYet")}
            </p>
          ) : (
            <div className="divide-y divide-graphite-200 rounded-xl border border-graphite-200 bg-white">
              {filteredInvoices.map((inv) => (
                <div key={inv._id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-graphite-900">
                      {inv.invoiceNumber} ·{" "}
                      {inv.customerName || t("noCustomerName")}
                    </p>
                    <p className="text-sm font-semibold text-graphite-900">
                      {inv.totalAmount || inv.total}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-graphite-500">
                    {new Date(inv.date || inv.createdAt).toLocaleString()}
                  </p>
                  {(inv.vatAmount !== undefined ||
                    inv.vatRate !== undefined) && (
                    <div className="mt-2 flex items-center gap-3 text-xs text-graphite-600">
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
                        <span className="text-red-600">
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
                      <li key={i} className="text-xs text-graphite-600">
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
