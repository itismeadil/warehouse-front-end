import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Calculator, History, Play, AlertTriangle, Trash2 } from "lucide-react";
import { getItems } from "../../api/items";
import {
  getAccountantTasks,
  runAccountantTask,
  getAccountingReports,
  clearAccountingReports,
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

const StatCard = ({ label, value }) => (
  <div className="rounded-lg bg-graphite-100 p-3 sm:p-4 dark:bg-graphite-700">
    <p className="text-xs text-graphite-500 dark:text-graphite-400">{label}</p>
    <p className="mt-0.5 text-lg font-medium text-graphite-900 sm:text-2xl dark:text-graphite-100">
      {value}
    </p>
  </div>
);

// Shown when the accountant service can't be reached at all — wrong/missing
// VITE_ACCOUNTANT_API_URL, the service isn't running, or a CORS mismatch.
// Silently swallowing this (old behavior) is what made the tab look broken
// with no visible error.
const ServiceErrorBanner = ({ message }) => (
  <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
    <div>
      <p className="font-medium">{message}</p>
      <p className="mt-0.5 text-xs text-amber-700">
        Check that VITE_ACCOUNTANT_API_URL is set in .env and that the
        accountant-service is running.
      </p>
    </div>
  </div>
);

export default function CalculationsTab() {
  const { t } = useTranslation();
  const { alert, showAlert, hideAlert } = useAlert();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [taskKey, setTaskKey] = useState("");
  const [tasksError, setTasksError] = useState("");

  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [activeReport, setActiveReport] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadReports = useCallback((key) => {
    setReportsLoading(true);
    setReportsError("");
    getAccountingReports(key ? { taskKey: key } : undefined)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setReports(list);
        setActiveReport((current) => current || list[0] || null);
      })
      .catch((err) => {
        console.error(err);
        setReports([]);
        setReportsError(
          err.response?.data?.message ||
            err.message ||
            "Couldn't load report history.",
        );
      })
      .finally(() => setReportsLoading(false));
  }, []);

  useEffect(() => {
    getAccountantTasks()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTasks(list);
        if (list[0]) setTaskKey(list[0].key);
        if (list.length === 0) {
          setTasksError("No calculations are available from the service.");
        }
      })
      .catch((err) => {
        console.error(err);
        setTasks([]);
        setTasksError(
          err.response?.data?.message ||
            err.message ||
            "Couldn't reach the accounting service.",
        );
      });

    getItems()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));

    // Load history immediately on mount, independent of whether the task
    // list above succeeds — history should never be stuck waiting on a
    // filter that might never get set.
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-filter history whenever the selected task changes (only fires after
  // the initial unfiltered load above, once taskKey has a real value).
  useEffect(() => {
    if (taskKey) loadReports(taskKey);
  }, [taskKey, loadReports]);

  const handleRun = async (e) => {
    e.preventDefault();
    if (!taskKey) return;

    setRunning(true);
    setRunError("");
    try {
      const payload = {};
      if (itemId) payload.itemId = itemId;
      if (itemId && unitPrice !== "") {
        payload.unitPrices = { [itemId]: Number(unitPrice) };
      }

      const report = await runAccountantTask(taskKey, payload);
      setActiveReport(report);
      loadReports(taskKey);
    } catch (err) {
      setRunError(err.response?.data?.message || err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      await clearAccountingReports();
      setReports([]);
      setActiveReport(null);
      setShowClearConfirm(false);
    } catch (err) {
      showAlert(err.response?.data?.message || err.message, {
        type: "error",
        title: t("error", "Error"),
      });
    } finally {
      setClearing(false);
    }
  };

  const summary = activeReport?.summary || {};
  const hasValuation = summary.hasValuation;

  return (
    <div>
      {/* Helpful Hint */}
      <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 border border-blue-200 dark:border-blue-800 dark:bg-blue-900/30">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Calculator className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 mb-1 dark:text-blue-300">
              {t("calculationsHintTitle")}
            </h4>
            <p className="text-xs text-blue-800 leading-relaxed dark:text-blue-300">
              {t("calculationsHint")}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <form
        onSubmit={handleRun}
        className="mt-5 rounded-xl border border-graphite-200 bg-white p-6 shadow-sm dark:border-graphite-700 dark:bg-graphite-800"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("task")}
            </label>
            <select
              value={taskKey}
              onChange={(e) => setTaskKey(e.target.value)}
              disabled={tasks.length === 0}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-graphite-50 disabled:text-graphite-400 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/30 dark:disabled:bg-graphite-800 dark:disabled:text-graphite-500"
            >
              {tasks.length === 0 && <option value="">—</option>}
              {tasks.map((task) => (
                <option key={task.key} value={task.key}>
                  {task.name}
                </option>
              ))}
            </select>
            {tasksError && <ServiceErrorBanner message={tasksError} />}
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("filterByItem")}
            </label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/30"
            >
              <option value="">{t("allItems")}</option>
              {items.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} — {item.serialNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("unitPrice")}{" "}
              <span className="text-graphite-400 dark:text-graphite-500">
                ({t("optional")})
              </span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              disabled={!itemId}
              placeholder={t("unitPricePlaceholder")}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-graphite-50 disabled:text-graphite-400 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/30 dark:disabled:bg-graphite-800 dark:disabled:text-graphite-500"
            />
          </div>
        </div>

        {runError && <p className="mt-3 text-sm text-red-600">{runError}</p>}

        <button
          type="submit"
          disabled={running || !taskKey}
          className="mt-4 flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? <Spinner /> : <Play className="h-4 w-4" />}
          {running ? t("calculating") : t("runCalculation")}
        </button>
      </form>

      {/* Results */}
      <div className="mt-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-graphite-900">
          <Calculator className="h-4 w-4 text-graphite-400 dark:text-graphite-500" />
          {t("results")}
        </h2>

        {!activeReport ? (
          <div className="mt-3 rounded-lg border border-dashed border-graphite-300 bg-white py-12 text-center dark:border-graphite-600 dark:bg-graphite-800">
            <p className="text-sm text-graphite-500 dark:text-graphite-400">
              {t("noReportYet")}
            </p>
          </div>
        ) : (
          <div className="mt-3">
            <p className="mb-3 text-xs text-graphite-500 dark:text-graphite-400">
              {t("generatedAt")}:{" "}
              {new Date(
                activeReport.generatedAt || activeReport.createdAt,
              ).toLocaleString()}
            </p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
              <StatCard label={t("stock")} value={summary.totalStock ?? 0} />
              <StatCard label={t("sold")} value={summary.totalSold ?? 0} />
              <StatCard
                label={t("reserved")}
                value={summary.totalReserved ?? 0}
              />
              <StatCard
                label={t("damaged")}
                value={summary.totalDamaged ?? 0}
              />
              <StatCard
                label={t("totalUnits")}
                value={summary.totalUnits ?? 0}
              />
            </div>

            {/* Sales breakdown specific summary */}
            {activeReport.taskKey === "sales-breakdown" && (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                <StatCard
                  label={t("totalRevenue")}
                  value={summary.totalRevenue ?? 0}
                />
                <StatCard
                  label={t("totalUnitsSold")}
                  value={summary.totalUnitsSold ?? 0}
                />
                <StatCard
                  label={t("itemCount")}
                  value={summary.itemCount ?? 0}
                />
              </div>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              <StatCard
                label={t("sellThroughRate")}
                value={`${summary.sellThroughRate ?? 0}%`}
              />
              <StatCard
                label={t("availableRate")}
                value={`${summary.availableRate ?? 0}%`}
              />
              <StatCard
                label={t("reservedRate")}
                value={`${summary.reservedRate ?? 0}%`}
              />
              <StatCard
                label={t("damageRate")}
                value={`${summary.damageRate ?? 0}%`}
              />
            </div>

            {hasValuation && (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <StatCard
                  label={t("stockValue")}
                  value={summary.totalStockValue}
                />
                <StatCard
                  label={t("soldValue")}
                  value={summary.totalSoldValue}
                />
                <StatCard
                  label={t("damagedLoss")}
                  value={summary.totalDamagedLoss}
                />
                <StatCard
                  label={t("netInventoryValue")}
                  value={summary.netInventoryValue}
                />
              </div>
            )}

            {activeReport.items?.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-xl border border-graphite-200 bg-white shadow-sm dark:border-graphite-700 dark:bg-graphite-800">
                {/* Sales breakdown specific display */}
                {activeReport.taskKey === "sales-breakdown" ? (
                  <>
                    <div className="hidden border-b border-graphite-200 bg-graphite-50 px-4 py-2.5 sm:grid sm:grid-cols-4 sm:gap-4 dark:border-graphite-700 dark:bg-graphite-800">
                      {[
                        "item",
                        "totalQuantity",
                        "totalRevenue",
                        "averagePrice",
                      ].map((key) => (
                        <span
                          key={key}
                          className="text-xs font-medium uppercase tracking-wide text-graphite-400"
                        >
                          {t(key)}
                        </span>
                      ))}
                    </div>
                    <div className="divide-y divide-graphite-100">
                      {activeReport.items.map((row) => (
                        <div key={row.itemId} className="px-4 py-3 text-sm">
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
                            <span className="col-span-2 truncate font-medium text-graphite-900 sm:col-span-1 dark:text-graphite-100">
                              {row.itemName}
                            </span>
                            <span className="text-graphite-600 dark:text-graphite-400">
                              {row.totalQuantity}
                            </span>
                            <span className="text-graphite-600 dark:text-graphite-400">
                              {row.totalRevenue}
                            </span>
                            <span className="text-graphite-600 dark:text-graphite-400">
                              {row.averagePrice}
                            </span>
                          </div>
                          {row.priceBreakdown?.length > 0 && (
                            <div className="mt-2 rounded-lg bg-graphite-50 p-2 dark:bg-graphite-800">
                              <p className="mb-1 text-xs font-medium text-graphite-500 dark:text-graphite-400">
                                {t("priceBreakdown")}
                              </p>
                              <div className="space-y-1">
                                {row.priceBreakdown.map((pb, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 text-xs text-graphite-600"
                                  >
                                    <span>
                                      {pb.quantity} × {pb.price}
                                    </span>
                                    <span>= {pb.revenue}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hidden border-b border-graphite-200 bg-graphite-50 px-4 py-2.5 sm:grid sm:grid-cols-6 sm:gap-4 dark:border-graphite-700 dark:bg-graphite-800">
                      {[
                        "item",
                        "stock",
                        "sold",
                        "reserved",
                        "damaged",
                        "totalUnits",
                      ].map((key) => (
                        <span
                          key={key}
                          className="text-xs font-medium uppercase tracking-wide text-graphite-400"
                        >
                          {t(key)}
                        </span>
                      ))}
                    </div>
                    <div className="divide-y divide-graphite-100">
                      {activeReport.items.map((row) => (
                        <div
                          key={row.itemId}
                          className="grid grid-cols-2 gap-2 px-4 py-3 text-sm sm:grid-cols-6 sm:gap-4"
                        >
                          <span className="col-span-2 truncate font-medium text-graphite-900 sm:col-span-1">
                            {row.name}{" "}
                            <span className="text-graphite-400 dark:text-graphite-500">
                              ({row.serialNumber})
                            </span>
                          </span>
                          <span className="text-graphite-600">{row.stock}</span>
                          <span className="text-graphite-600">{row.sold}</span>
                          <span className="text-graphite-600">
                            {row.reserved}
                          </span>
                          <span className="text-graphite-600">
                            {row.damaged}
                          </span>
                          <span className="text-graphite-600">
                            {row.totalUnits}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* History */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-graphite-900 dark:text-graphite-100">
            <History className="h-4 w-4 text-graphite-400 dark:text-graphite-500" />
            {t("history")}
          </h2>
          {reports.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              {t("clearHistory")}
            </button>
          )}
        </div>

        <div className="mt-3">
          {reportsLoading ? (
            <div className="flex items-center gap-2">
              <Spinner />
              <p className="text-sm text-graphite-500 dark:text-graphite-400">
                {t("loading")}
              </p>
            </div>
          ) : reportsError ? (
            <ServiceErrorBanner message={reportsError} />
          ) : reports.length === 0 ? (
            <p className="text-sm text-graphite-500 dark:text-graphite-400">
              {t("noReportsYet")}
            </p>
          ) : (
            <div className="divide-y divide-graphite-200 rounded-xl border border-graphite-200 bg-white dark:divide-graphite-700 dark:border-graphite-700 dark:bg-graphite-800">
              {reports.map((report) => (
                <button
                  key={report._id}
                  onClick={() => setActiveReport(report)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-start transition-colors hover:bg-primary-50/40 dark:hover:bg-primary-900/30 ${
                    activeReport?._id === report._id
                      ? "bg-primary-50/60 dark:bg-primary-900/40"
                      : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                      {report.taskName}
                    </p>
                    <p className="text-xs text-graphite-500 dark:text-graphite-400">
                      {new Date(
                        report.generatedAt || report.createdAt,
                      ).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-graphite-500">
                    {report.summary?.itemCount ?? 0} {t("items")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
          <div className="mx-4 max-w-sm rounded-xl border border-red-200 bg-white p-6 shadow-lg dark:border-red-800 dark:bg-graphite-800">
            <h3 className="text-lg font-semibold text-graphite-900 dark:text-graphite-100">
              {t("clearHistory")}
            </h3>
            <p className="mt-2 text-sm text-graphite-600 dark:text-graphite-400">
              {t("confirmClearHistory")}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="flex-1 rounded-lg border border-graphite-300 px-4 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-graphite-600 dark:text-graphite-200 dark:hover:bg-graphite-700"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={clearing}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {clearing ? t("clearingHistory") : t("confirm")}
              </button>
            </div>
          </div>
        </div>
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
