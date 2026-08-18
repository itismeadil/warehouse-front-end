import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Camera } from "lucide-react";
import { getItems } from "../../api/items";
import {
  getPurchaseInvoices,
  createPurchaseInvoice,
} from "../../api/accountant";
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
  unitCost: "",
  description: "",
});

export default function PurchaseInvoicesTab() {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [lines, setLines] = useState([emptyLine()]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const loadInvoices = () => {
    setLoading(true);
    setListError("");
    getPurchaseInvoices()
      .then((data) => setInvoices(Array.isArray(data) ? data : []))
      .catch((err) => setListError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getItems()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
    loadInvoices();
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
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0),
    0,
  );

  const resetForm = () => {
    setInvoiceNumber("");
    setSupplierName("");
    setLines([emptyLine()]);
  };

  const handleScanComplete = (data) => {
    if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
    if (data.lineItems && data.lineItems.length > 0) {
      const newLines = data.lineItems.map((item) => ({
        itemId: "",
        quantity: item.quantity,
        unitCost: item.price,
        description: item.description || "",
      }));
      setLines(newLines);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!invoiceNumber.trim() || !supplierName.trim()) {
      return setFormError(t("invoiceFieldsRequired"));
    }
    const validLines = lines.filter(
      (l) => l.itemId && l.quantity && l.unitCost !== "",
    );
    if (validLines.length === 0) {
      return setFormError(t("atLeastOneLine"));
    }

    setSaving(true);
    try {
      await createPurchaseInvoice({
        invoiceNumber: invoiceNumber.trim(),
        supplierName: supplierName.trim(),
        lines: validLines.map((l) => ({
          itemId: l.itemId,
          itemName: items.find((i) => i._id === l.itemId)?.name,
          quantity: Number(l.quantity),
          unitCost: Number(l.unitCost),
        })),
      });
      resetForm();
      loadInvoices();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
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
      <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 border border-green-200 dark:border-green-800 dark:bg-green-900/30">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Plus className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-green-900 mb-1 dark:text-green-300">
              {t("purchaseInvoicesHintTitle")}
            </h4>
            <p className="text-xs text-green-800 leading-relaxed dark:text-green-300">
              {t("purchaseInvoicesHint")}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-graphite-200 bg-white p-6 shadow-sm dark:border-graphite-700 dark:bg-graphite-800"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-graphite-900 dark:text-graphite-100">
            Create Purchase Invoice
          </h2>
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50"
          >
            <Camera className="h-4 w-4" />
            Scan Invoice
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("invoiceNumber")}
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="PO-1001"
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("supplierName")}
            </label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/30"
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
                className="min-w-[10rem] flex-1 rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/30"
              >
                <option value="">{t("selectItem")}</option>
                {items.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} — {item.serialNumber}
                  </option>
                ))}
              </select>
              {line.description && (
                <input
                  type="text"
                  value={line.description}
                  onChange={(e) =>
                    updateLine(index, { description: e.target.value })
                  }
                  placeholder="Item description"
                  className="min-w-[8rem] flex-1 rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-graphite-50 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100"
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
                className="w-24 rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.unitCost}
                onChange={(e) =>
                  updateLine(index, { unitCost: e.target.value })
                }
                placeholder={t("unitCost")}
                className="w-28 rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100"
              />
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="rounded-lg p-2 text-graphite-400 hover:bg-graphite-100 hover:text-red-600 dark:text-graphite-500 dark:hover:bg-graphite-700 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("addLine")}
          </button>
        </div>

        <p className="mt-4 text-sm text-graphite-700 dark:text-graphite-200">
          {t("invoiceTotal")}:{" "}
          <span className="font-semibold">{total.toFixed(2)}</span>
        </p>

        {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Spinner />}
          {saving ? t("saving") : t("createPurchaseInvoice")}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-graphite-900 dark:text-graphite-100">
          {t("purchaseInvoiceHistory")}
        </h2>
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center gap-2">
              <Spinner />
              <p className="text-sm text-graphite-500 dark:text-graphite-400">
                {t("loading")}
              </p>
            </div>
          ) : listError ? (
            <p className="text-sm text-red-600">{listError}</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-graphite-500 dark:text-graphite-400">
              {t("noInvoicesYet")}
            </p>
          ) : (
            <div className="divide-y divide-graphite-200 rounded-xl border border-graphite-200 bg-white dark:divide-graphite-700 dark:border-graphite-700 dark:bg-graphite-800">
              {invoices.map((inv) => (
                <div key={inv._id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                      {inv.invoiceNumber} · {inv.supplierName}
                    </p>
                    <p className="text-sm font-semibold text-graphite-900">
                      {inv.totalAmount}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-graphite-500 dark:text-graphite-400">
                    {new Date(inv.date || inv.createdAt).toLocaleString()}
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {inv.lines.map((line, i) => (
                      <li className="text-xs text-graphite-600 dark:text-graphite-400">
                        {line.itemName} · {line.quantity} × {line.unitCost} ={" "}
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
