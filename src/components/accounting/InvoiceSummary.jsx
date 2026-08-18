import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Printer, Calendar, ChevronDown, ChevronUp, X } from "lucide-react";
import { getSalesInvoiceAggregate } from "../../api/accountant";
import DatePicker from "../DatePicker";

const Spinner = () => (
  <div
    className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    style={{ color: "#45a1a1" }}
    aria-hidden
  />
);

export default function InvoiceSummary() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [type, setType] = useState("daily");
  const [date, setDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [month, setMonth] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedWeeks, setExpandedWeeks] = useState({});

  const handleFetch = async () => {
    setLoading(true);
    setError("");
    setData(null);

    const params = { type };
    if (type === "daily" && date) params.date = date;
    if (type === "weekly" && startDate) params.startDate = startDate;
    if (type === "monthly" && month) params.month = month;

    if (!params.date && !params.startDate && !params.month) {
      setError(t("pleaseSelectDate"));
      setLoading(false);
      return;
    }

    try {
      const result = await getSalesInvoiceAggregate(params);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleWeek = (weekIndex) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekIndex]: !prev[weekIndex],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const getMonthName = (monthString) => {
    const [year, month] = monthString.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div>
      <div className="rounded-xl border border-graphite-200 bg-white p-6 shadow-sm dark:border-graphite-700 dark:bg-graphite-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-graphite-900 dark:text-graphite-100">
            {t("invoiceSummary")}
          </h1>
          <button
            onClick={() => navigate("/accounting")}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors dark:bg-red-900/30 dark:border-red-800 dark:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-graphite-700 mb-2 dark:text-graphite-300">
            {t("summaryType")}
          </label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setData(null);
              setError("");
            }}
            className="block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 bg-white dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100"
          >
            <option value="daily">{t("daily")}</option>
            <option value="weekly">{t("weekly")}</option>
            <option value="monthly">{t("monthly")}</option>
          </select>
        </div>

        {type === "daily" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-graphite-700 mb-2 dark:text-graphite-300">
              {t("selectDate")}
            </label>
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder={t("selectDate")}
            />
          </div>
        )}

        {type === "weekly" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-graphite-700 mb-2 dark:text-graphite-300">
              {t("startDate")}
            </label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder={t("selectStartDate")}
            />
          </div>
        )}

        {type === "monthly" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-graphite-700 mb-2 dark:text-graphite-300">
              {t("selectMonth")}
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 bg-white dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100"
            />
          </div>
        )}

        <button
          onClick={handleFetch}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Spinner />}
          {loading ? t("loading") : t("generateSummary")}
        </button>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {data && (
        <div
          id="print-content"
          className="mt-6 rounded-xl border border-graphite-200 bg-white p-6 shadow-sm print:border-none print:shadow-none dark:border-graphite-700 dark:bg-graphite-800"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-graphite-900 dark:text-graphite-100">
              {type === "daily" &&
                `${t("dailySummary")} - ${new Date(date).toLocaleDateString()}`}
              {type === "weekly" &&
                `${t("weeklySummary")} - ${t("starting")} ${new Date(startDate).toLocaleDateString()}`}
              {type === "monthly" &&
                `${t("monthlySummary")} - ${getMonthName(month)}`}
            </h2>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg border border-graphite-300 px-3 py-1.5 text-sm font-medium text-graphite-700 hover:bg-graphite-100 dark:border-graphite-600 dark:text-graphite-300 dark:hover:bg-graphite-700"
            >
              <Printer className="h-4 w-4" />
              {t("print")}
            </button>
          </div>

          <div className="mb-4 space-y-2 rounded-lg bg-graphite-50 p-4 dark:bg-graphite-900">
            <div className="flex justify-between text-sm text-graphite-700 dark:text-graphite-300">
              <span>{t("subtotal")}</span>
              <span className="font-semibold">{data.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-graphite-700 dark:text-graphite-300">
              <span>{t("vatDeduction")}</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                -{data.vatAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium text-graphite-900 border-t border-graphite-200 pt-2 dark:border-graphite-700 dark:text-graphite-100">
              <span>{t("totalAfterTax")}</span>
              <span className="font-semibold">{data.total.toFixed(2)}</span>
            </div>
          </div>

          {type === "monthly" && data.weeks && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-graphite-900 mb-3 dark:text-graphite-100">
                {t("weeklyBreakdown")}
              </h3>
              {data.weeks.map((week, index) => (
                <div
                  key={index}
                  className="mb-4 border border-graphite-200 rounded-lg overflow-hidden dark:border-graphite-700"
                >
                  <button
                    onClick={() => toggleWeek(index)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-graphite-50 hover:bg-graphite-100 transition-colors dark:bg-graphite-900 dark:hover:bg-graphite-700"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-graphite-500 dark:text-graphite-400" />
                      <span className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                        {t("week")} {week.weekNumber}:{" "}
                        {new Date(week.startDate).toLocaleDateString()} -{" "}
                        {new Date(week.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {week.total.toFixed(2)}
                      </span>
                      {expandedWeeks[index] ? (
                        <ChevronUp className="h-4 w-4 text-graphite-500 dark:text-graphite-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-graphite-500 dark:text-graphite-400" />
                      )}
                    </div>
                  </button>

                  {expandedWeeks[index] && (
                    <div className="p-4 bg-white dark:bg-graphite-800">
                      <div className="mb-3 space-y-2 rounded-lg bg-graphite-50 p-3 dark:bg-graphite-900">
                        <div className="flex justify-between text-xs text-graphite-700 dark:text-graphite-300">
                          <span>{t("subtotal")}</span>
                          <span className="font-semibold">
                            {week.subtotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-graphite-700 dark:text-graphite-300">
                          <span>{t("vatDeduction")}</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            -{week.vatAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-graphite-900 border-t border-graphite-200 pt-2 dark:border-graphite-700 dark:text-graphite-100">
                          <span>{t("totalAfterTax")}</span>
                          <span className="font-semibold">
                            {week.total.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {week.invoices.map((invoice) => (
                          <div
                            key={invoice._id}
                            className="p-3 border border-graphite-200 rounded-lg bg-white dark:border-graphite-700 dark:bg-graphite-800"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                                  {invoice.invoiceNumber}
                                </p>
                                <p className="text-xs text-graphite-500 dark:text-graphite-400">
                                  {invoice.customerName || t("noCustomer")}
                                </p>
                                <p className="text-xs text-graphite-500 dark:text-graphite-400">
                                  {new Date(
                                    invoice.date || invoice.createdAt,
                                  ).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-graphite-900 dark:text-graphite-100">
                                  {invoice.totalAmount?.toFixed(2) ||
                                    invoice.total?.toFixed(2)}
                                </p>
                                {invoice.vatAmount !== undefined && (
                                  <p className="text-xs text-red-600 dark:text-red-400">
                                    {t("vat")}: -{invoice.vatAmount.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-graphite-100 dark:border-graphite-700">
                              {invoice.lines?.map((line, i) => (
                                <div
                                  key={i}
                                  className="text-xs text-graphite-600 dark:text-graphite-400"
                                >
                                  {line.itemName} · {line.quantity} ×{" "}
                                  {line.unitPrice} = {line.lineTotal}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-graphite-900 mb-3 dark:text-graphite-100">
              {t("allInvoices")}
            </h3>
            {data.invoices.length === 0 ? (
              <p className="text-sm text-graphite-500 dark:text-graphite-400">
                {t("noInvoicesForPeriod")}
              </p>
            ) : (
              <div className="space-y-2">
                {data.invoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    className="p-3 border border-graphite-200 rounded-lg bg-white dark:border-graphite-700 dark:bg-graphite-800"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-xs text-graphite-500 dark:text-graphite-400">
                          {invoice.customerName || t("noCustomer")}
                        </p>
                        <p className="text-xs text-graphite-500 dark:text-graphite-400">
                          {new Date(
                            invoice.date || invoice.createdAt,
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-graphite-900 dark:text-graphite-100">
                          {invoice.totalAmount?.toFixed(2) ||
                            invoice.total?.toFixed(2)}
                        </p>
                        {invoice.vatAmount !== undefined && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {t("vat")}: -{invoice.vatAmount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-graphite-100 dark:border-graphite-700">
                      {invoice.lines?.map((line, i) => (
                        <div
                          key={i}
                          className="text-xs text-graphite-600 dark:text-graphite-400"
                        >
                          {line.itemName} · {line.quantity} × {line.unitPrice} ={" "}
                          {line.lineTotal}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-content,
          #print-content * {
            visibility: visible;
          }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white;
          }
          button {
            display: none !important;
          }
          #print-content * {
            font-family: 'Courier New', Courier, monospace !important;
          }
        }
      `}</style>
    </div>
  );
}
