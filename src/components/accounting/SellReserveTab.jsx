import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingCart, BookmarkPlus, X } from "lucide-react";
import { getItems } from "../../api/items";
import {
  createSalesInvoice,
  createReservation,
  getReservations,
  cancelReservation,
  fulfillReservation,
} from "../../api/accountant";
import AlertModal from "../AlertModal";
import { useAlert } from "../../hooks/useAlert";
import { useAuth } from "../../context/AuthContext";

const Spinner = () => (
  <div
    className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    style={{ color: "#45a1a1" }}
    aria-hidden
  />
);

// Small modal asking for a cancellation reason before subtracting a
// reservation back into stock.
function CancelReasonModal({ reservation, onClose, onConfirm, submitting }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-900/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg dark:bg-graphite-800">
        <h3 className="text-sm font-semibold text-graphite-900 dark:text-graphite-100">
          {t("cancelReservation")}
        </h3>
        <p className="mt-1 text-xs text-graphite-500 dark:text-graphite-400">
          {reservation.itemName} — {reservation.quantity} {t("units")}
          {reservation.unitPrice != null && (
            <>
              {" "}
              · {reservation.unitPrice} {t("perUnit")}
            </>
          )}
        </p>

        <label className="mt-4 block text-sm font-medium text-graphite-700 dark:text-graphite-300">
          {t("cancelReason")}
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder={t("cancelReasonPlaceholder")}
          className="mt-1.5 w-full resize-none rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 bg-white dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-graphite-300 px-3 py-1.5 text-sm font-medium text-graphite-700 hover:bg-graphite-100 dark:border-graphite-600 dark:text-graphite-300 dark:hover:bg-graphite-700"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={!reason.trim() || submitting}
            onClick={() => onConfirm(reason.trim())}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Spinner />}
            {t("confirmCancellation")}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal for fulfilling a reservation with VAT rate
function FulfillModal({ reservation, onClose, onConfirm, submitting }) {
  const { t } = useTranslation();
  const [vatRate, setVatRate] = useState(15);

  const subtotal = (reservation.quantity || 0) * (reservation.unitPrice || 0);
  const vatAmount = subtotal * (vatRate / 100);
  const totalAfterTax = subtotal - vatAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-900/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg dark:bg-graphite-800">
        <h3 className="text-sm font-semibold text-graphite-900 dark:text-graphite-100">
          {t("markSold")}
        </h3>
        <p className="mt-1 text-xs text-graphite-500 dark:text-graphite-400">
          {reservation.itemName} — {reservation.quantity} {t("units")}
          {reservation.unitPrice != null && (
            <>
              {" "}
              · {reservation.unitPrice} {t("perUnit")}
            </>
          )}
        </p>

        <label className="mt-4 block text-sm font-medium text-graphite-700 dark:text-graphite-300">
          {t("vatRate")} (%)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={vatRate}
          onChange={(e) => setVatRate(Number(e.target.value))}
          className="mt-1.5 w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 bg-white dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100"
        />

        <div className="mt-4 space-y-2 rounded-lg bg-graphite-50 p-3 dark:bg-graphite-900">
          <div className="flex justify-between text-xs text-graphite-700 dark:text-graphite-300">
            <span>{t("subtotal")}</span>
            <span className="font-semibold">{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-graphite-700 dark:text-graphite-300">
            <span>
              {t("vatDeduction")} ({vatRate}%)
            </span>
            <span className="font-semibold text-red-600 dark:text-red-400">
              -{vatAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs font-medium text-graphite-900 border-t border-graphite-200 pt-2 dark:border-graphite-700 dark:text-graphite-100">
            <span>{t("totalAfterTax")}</span>
            <span className="font-semibold">{totalAfterTax.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-graphite-300 px-3 py-1.5 text-sm font-medium text-graphite-700 hover:bg-graphite-100 dark:border-graphite-600 dark:text-graphite-300 dark:hover:bg-graphite-700"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() =>
              onConfirm({ vatRate, subtotal, vatAmount, totalAfterTax })
            }
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Spinner />}
            {t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SellReserveTab() {
  const { t } = useTranslation();
  const { alert, showAlert, hideAlert } = useAlert();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [vatRate, setVatRate] = useState(15);

  const [saving, setSaving] = useState(false); // "sale" | "reservation" | false
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [fulfillingId, setFulfillingId] = useState(null);
  const [fulfillTarget, setFulfillTarget] = useState(null);

  const loadReservations = () => {
    setReservationsLoading(true);
    getReservations({ status: "active" })
      .then((data) => setReservations(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setReservationsLoading(false));
  };

  useEffect(() => {
    getItems()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
    loadReservations();
  }, []);

  const selectedItem = items.find((i) => i._id === itemId);

  const resetForm = () => {
    setQuantity(1);
    setPrice("");
    setCustomerName("");
    setVatRate(15);
  };

  const validate = () => {
    if (!itemId) return t("selectItemFirst");
    if (!quantity || quantity < 1) return t("quantityRequired");
    return "";
  };

  const handleSell = async (e) => {
    e.preventDefault();
    const error = validate();
    if (!price) return setFormError(t("priceRequired"));
    if (error) return setFormError(error);

    setFormError("");
    setFormSuccess("");
    setSaving("sale");
    try {
      const subtotal = Number(quantity) * Number(price);
      const vatAmount = subtotal * (vatRate / 100);
      const totalAfterTax = subtotal - vatAmount;

      await createSalesInvoice({
        invoiceNumber: `SALE-${Date.now()}`,
        customerName: customerName || undefined,
        vatRate: vatRate,
        subtotal: subtotal,
        vatAmount: vatAmount,
        totalAmount: totalAfterTax,
        lines: [
          {
            itemId,
            itemName: selectedItem?.name,
            quantity: Number(quantity),
            unitPrice: Number(price),
          },
        ],
      });
      setFormSuccess(t("saleRecorded"));
      resetForm();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) return setFormError(error);

    setFormError("");
    setFormSuccess("");
    setSaving("reservation");
    try {
      await createReservation({
        itemId,
        itemName: selectedItem?.name,
        quantity: Number(quantity),
        unitPrice: price ? Number(price) : undefined,
        customerName: customerName || undefined,
      });
      setFormSuccess(t("reservationCreated"));
      resetForm();
      loadReservations();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmCancel = async (reason) => {
    setCancelling(true);
    try {
      await cancelReservation(cancelTarget._id, reason);
      setCancelTarget(null);
      loadReservations();
    } catch (err) {
      showAlert(err.response?.data?.message || err.message, {
        type: "error",
        title: t("error", "Error"),
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleFulfill = async (reservation) => {
    setFulfillTarget(reservation);
  };

  const handleConfirmFulfill = async (vatData) => {
    setFulfillingId(fulfillTarget._id);
    try {
      await fulfillReservation(fulfillTarget._id, {
        vatRate: vatData.vatRate,
        subtotal: vatData.subtotal,
        vatAmount: vatData.vatAmount,
        totalAmount: vatData.totalAfterTax,
      });
      setFulfillTarget(null);
      loadReservations();
    } catch (err) {
      showAlert(err.response?.data?.message || err.message, {
        type: "error",
        title: t("error", "Error"),
      });
    } finally {
      setFulfillingId(null);
    }
  };

  return (
    <div>
      {/* Helpful Hint */}
      <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <ShoppingCart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900 mb-1">
              {t("sellReserveHintTitle")}
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              {t("sellReserveHint")}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-graphite-200 bg-white p-6 shadow-sm dark:border-graphite-700 dark:bg-graphite-800">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("item")}
            </label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-800 dark:text-graphite-200"
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
                    {item.name} — {item.serialNumber}{" "}
                    {typeof item.stock === "number" &&
                      `(${item.stock} ${t("inStock")})`}
                    {isOutOfStock ? " - OUT OF STOCK" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("customerName")}{" "}
              <span className="text-graphite-400 dark:text-graphite-500">
                ({t("optional")})
              </span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 bg-white dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("quantity")}
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 bg-white dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("unitPrice")}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={t("unitPricePlaceholder")}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 bg-white dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("vatRate")} (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 bg-white dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100"
            />
          </div>
        </div>

        {formError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {formError}
          </p>
        )}
        {formSuccess && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-400">
            {formSuccess}
          </p>
        )}

        {quantity && price && (
          <div className="mt-4 space-y-2 rounded-lg bg-graphite-50 p-4 dark:bg-graphite-900">
            <div className="flex justify-between text-sm text-graphite-700 dark:text-graphite-300">
              <span>{t("subtotal")}</span>
              <span className="font-semibold">
                {(Number(quantity) * Number(price)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-graphite-700 dark:text-graphite-300">
              <span>
                {t("vatDeduction")} ({vatRate}%)
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                -
                {(Number(quantity) * Number(price) * (vatRate / 100)).toFixed(
                  2,
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium text-graphite-900 border-t border-graphite-200 pt-2 dark:border-graphite-700 dark:text-graphite-100">
              <span>{t("totalAfterTax")}</span>
              <span className="font-semibold">
                {(
                  Number(quantity) * Number(price) -
                  Number(quantity) * Number(price) * (vatRate / 100)
                ).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSell}
            disabled={saving !== false}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving === "sale" ? (
              <Spinner />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            {t("recordSale")}
          </button>
          <button
            type="button"
            onClick={handleReserve}
            disabled={saving !== false}
            className="flex items-center gap-2 rounded-lg border border-graphite-300 px-4 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-graphite-600 dark:text-graphite-300 dark:hover:bg-graphite-700"
          >
            {saving === "reservation" ? (
              <Spinner />
            ) : (
              <BookmarkPlus className="h-4 w-4" />
            )}
            {t("reserveStock")}
          </button>
        </div>
        <p className="mt-2 text-xs text-graphite-400 dark:text-graphite-500">
          {t("sellReserveHint")}
        </p>
      </div>

      {/* Active reservations */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-graphite-900 dark:text-graphite-100">
          {t("activeReservations")}
        </h2>

        <div className="mt-3">
          {reservationsLoading ? (
            <div className="flex items-center gap-2">
              <Spinner />
              <p className="text-sm text-graphite-500 dark:text-graphite-400">
                {t("loading")}
              </p>
            </div>
          ) : reservations.length === 0 ? (
            <p className="text-sm text-graphite-500 dark:text-graphite-400">
              {t("noActiveReservations")}
            </p>
          ) : (
            <div className="divide-y divide-graphite-200 rounded-xl border border-graphite-200 bg-white dark:border-graphite-700 dark:divide-graphite-700 dark:bg-graphite-800">
              {reservations.map((res) => (
                <div
                  key={res._id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                      {res.itemName} · {res.quantity} {t("units")}
                    </p>
                    <p className="text-xs text-graphite-500 dark:text-graphite-400">
                      {res.customerName || t("noCustomerName")}
                      {res.unitPrice != null && (
                        <>
                          {" "}
                          · {res.unitPrice} {t("perUnit")}
                        </>
                      )}
                      {" · "}
                      {new Date(res.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleFulfill(res)}
                      disabled={fulfillingId === res._id}
                      className="rounded-lg border border-graphite-300 px-3 py-1.5 text-xs font-medium text-graphite-700 transition-colors hover:bg-graphite-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-graphite-600 dark:text-graphite-300 dark:hover:bg-graphite-700"
                    >
                      {fulfillingId === res._id ? t("saving") : t("markSold")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancelTarget(res)}
                      className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30 dark:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {cancelTarget && (
        <CancelReasonModal
          reservation={cancelTarget}
          submitting={cancelling}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleConfirmCancel}
        />
      )}

      {fulfillTarget && (
        <FulfillModal
          reservation={fulfillTarget}
          submitting={fulfillingId === fulfillTarget._id}
          onClose={() => setFulfillTarget(null)}
          onConfirm={handleConfirmFulfill}
        />
      )}

      <AlertModal
        isOpen={!!alert}
        onClose={hideAlert}
        title={alert?.title}
        message={alert?.message}
        type={alert?.type}
        showCancel={alert?.showCancel}
        confirmText={alert?.confirmText}
        cancelText={alert?.cancelText}
        onConfirm={alert?.onConfirm}
      />
    </div>
  );
}
