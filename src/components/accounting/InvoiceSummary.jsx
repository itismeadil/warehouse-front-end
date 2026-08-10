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
      setError("Please select a date");
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
      <div className="rounded-xl border border-graphite-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-graphite-900">
            Invoice Summary
          </h1>
          <button
            onClick={() => navigate("/accounting")}
            className="flex items-center gap-2 rounded-lg border border-graphite-300 px-3 py-1.5 text-sm font-medium text-graphite-700 hover:bg-graphite-100 transition-colors"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-graphite-700 mb-2">
            Summary Type
          </label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setData(null);
              setError("");
            }}
            className="block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {type === "daily" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-graphite-700 mb-2">
              Select Date
            </label>
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder="Select date"
            />
          </div>
        )}

        {type === "weekly" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-graphite-700 mb-2">
              Start Date
            </label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Select start date"
            />
          </div>
        )}

        {type === "monthly" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-graphite-700 mb-2">
              Select Month
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        )}

        <button
          onClick={handleFetch}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Spinner />}
          {loading ? "Loading..." : "Generate Summary"}
        </button>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {data && (
        <div
          id="print-content"
          className="mt-6 rounded-xl border border-graphite-200 bg-white p-6 shadow-sm print:border-none print:shadow-none"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-graphite-900">
              {type === "daily" &&
                `Daily Summary - ${new Date(date).toLocaleDateString()}`}
              {type === "weekly" &&
                `Weekly Summary - Starting ${new Date(startDate).toLocaleDateString()}`}
              {type === "monthly" && `Monthly Summary - ${getMonthName(month)}`}
            </h2>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg border border-graphite-300 px-3 py-1.5 text-sm font-medium text-graphite-700 hover:bg-graphite-100"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>

          <div className="mb-4 space-y-2 rounded-lg bg-graphite-50 p-4">
            <div className="flex justify-between text-sm text-graphite-700">
              <span>Subtotal</span>
              <span className="font-semibold">{data.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-graphite-700">
              <span>VAT Deduction</span>
              <span className="font-semibold text-red-600">
                -{data.vatAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium text-graphite-900 border-t border-graphite-200 pt-2">
              <span>Total After Tax</span>
              <span className="font-semibold">{data.total.toFixed(2)}</span>
            </div>
          </div>

          {type === "monthly" && data.weeks && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-graphite-900 mb-3">
                Weekly Breakdown
              </h3>
              {data.weeks.map((week, index) => (
                <div
                  key={index}
                  className="mb-4 border border-graphite-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleWeek(index)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-graphite-50 hover:bg-graphite-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-graphite-500" />
                      <span className="text-sm font-medium text-graphite-900">
                        Week {week.weekNumber}:{" "}
                        {new Date(week.startDate).toLocaleDateString()} -{" "}
                        {new Date(week.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-primary-600">
                        {week.total.toFixed(2)}
                      </span>
                      {expandedWeeks[index] ? (
                        <ChevronUp className="h-4 w-4 text-graphite-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-graphite-500" />
                      )}
                    </div>
                  </button>

                  {expandedWeeks[index] && (
                    <div className="p-4 bg-white">
                      <div className="mb-3 space-y-2 rounded-lg bg-graphite-50 p-3">
                        <div className="flex justify-between text-xs text-graphite-700">
                          <span>Subtotal</span>
                          <span className="font-semibold">
                            {week.subtotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-graphite-700">
                          <span>VAT Deduction</span>
                          <span className="font-semibold text-red-600">
                            -{week.vatAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-graphite-900 border-t border-graphite-200 pt-2">
                          <span>Total After Tax</span>
                          <span className="font-semibold">
                            {week.total.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {week.invoices.map((invoice) => (
                          <div
                            key={invoice._id}
                            className="p-3 border border-graphite-200 rounded-lg bg-white"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-graphite-900">
                                  {invoice.invoiceNumber}
                                </p>
                                <p className="text-xs text-graphite-500">
                                  {invoice.customerName || "No customer"}
                                </p>
                                <p className="text-xs text-graphite-500">
                                  {new Date(
                                    invoice.date || invoice.createdAt,
                                  ).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-graphite-900">
                                  {invoice.totalAmount?.toFixed(2) ||
                                    invoice.total?.toFixed(2)}
                                </p>
                                {invoice.vatAmount !== undefined && (
                                  <p className="text-xs text-red-600">
                                    VAT: -{invoice.vatAmount.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-graphite-100">
                              {invoice.lines?.map((line, i) => (
                                <div
                                  key={i}
                                  className="text-xs text-graphite-600"
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
            <h3 className="text-sm font-semibold text-graphite-900 mb-3">
              All Invoices
            </h3>
            {data.invoices.length === 0 ? (
              <p className="text-sm text-graphite-500">
                No invoices found for this period
              </p>
            ) : (
              <div className="space-y-2">
                {data.invoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    className="p-3 border border-graphite-200 rounded-lg bg-white"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-graphite-900">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-xs text-graphite-500">
                          {invoice.customerName || "No customer"}
                        </p>
                        <p className="text-xs text-graphite-500">
                          {new Date(
                            invoice.date || invoice.createdAt,
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-graphite-900">
                          {invoice.totalAmount?.toFixed(2) ||
                            invoice.total?.toFixed(2)}
                        </p>
                        {invoice.vatAmount !== undefined && (
                          <p className="text-xs text-red-600">
                            VAT: -{invoice.vatAmount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-graphite-100">
                      {invoice.lines?.map((line, i) => (
                        <div key={i} className="text-xs text-graphite-600">
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
