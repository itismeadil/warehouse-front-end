import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Edit2, TrendingUp, Calendar } from "lucide-react";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} from "../../api/accountant";
import DatePicker from "../DatePicker";
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

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-lg bg-graphite-100 p-3 sm:p-4">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-graphite-500" />
      <p className="text-xs text-graphite-500">{label}</p>
    </div>
    <p className="mt-0.5 text-lg font-medium text-graphite-900 sm:text-2xl">
      {value}
    </p>
  </div>
);

const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Rent" },
  { value: "salaries", label: "Salaries" },
  { value: "utilities", label: "Utilities" },
  { value: "shipping", label: "Shipping" },
  { value: "supplies", label: "Supplies" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

export default function ExpensesTab() {
  const { t } = useTranslation();
  const { alert, showAlert, hideAlert, showConfirm } = useAlert();
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    amount: "",
    currency: "SAR",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "",
    attachmentUrl: "",
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [summary, setSummary] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

  const loadExpenses = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterFromDate) params.from = filterFromDate;
      if (filterToDate) params.to = filterToDate;

      const data = await getExpenses(params);
      setExpenses(data.expenses || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const data = await getExpenseSummary({ groupBy: "category" });
      setSummary(data || []);
    } catch (err) {
      console.error("Failed to load summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    loadSummary();
  }, [filterCategory, filterFromDate, filterToDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.amount || !formData.category || !formData.date) {
      return setFormError("Please fill in all required fields");
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };

      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }

      setFormData({
        amount: "",
        currency: "SAR",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "",
        attachmentUrl: "",
      });
      setEditingId(null);
      loadExpenses();
      loadSummary();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      amount: expense.amount,
      currency: expense.currency || "SAR",
      category: expense.category,
      description: expense.description || "",
      date: expense.date
        ? new Date(expense.date).toISOString().split("T")[0]
        : "",
      paymentMethod: expense.paymentMethod || "",
      attachmentUrl: expense.attachmentUrl || "",
    });
    setEditingId(expense._id);
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      t(
        "confirmDeleteExpense",
        "Are you sure you want to delete this expense?",
      ),
      {
        title: t("deleteExpense", "Delete Expense"),
        type: "warning",
        confirmText: t("delete", "Delete"),
        cancelText: t("cancel", "Cancel"),
      },
    );

    if (!confirmed) return;

    try {
      await deleteExpense(id);
      loadExpenses();
      loadSummary();
    } catch (err) {
      showAlert(err.response?.data?.message || err.message, {
        type: "error",
        title: t("error", "Error"),
      });
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      amount: "",
      currency: "SAR",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "",
      attachmentUrl: "",
    });
    setEditingId(null);
    setFormError("");
  };

  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + (exp.amount || 0),
    0,
  );

  return (
    <div>
      {/* Summary Stats */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t("totalExpenses")}
          value={`${totalExpenses.toFixed(2)} SAR`}
          icon={TrendingUp}
        />
        <StatCard
          label={t("thisMonth")}
          value={expenses.length}
          icon={Calendar}
        />
        <StatCard
          label={t("categories")}
          value={summary.length}
          icon={TrendingUp}
        />
      </div>

      {/* Helpful Hint */}
      <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 border border-rose-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-rose-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-rose-900 mb-1">
              {t("expensesHintTitle")}
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              {t("expensesHint")}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-xl border border-graphite-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-graphite-900">
            {editingId ? t("editExpense") : t("addNewExpense")}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs font-medium text-graphite-500 hover:text-graphite-700"
            >
              {t("cancelEdit")}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("amount")}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("currency")}
            </label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("category")}
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">{t("selectCategory")}</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("date")}
            </label>
            <DatePicker
              value={formData.date}
              onChange={(date) => setFormData({ ...formData, date })}
              placeholder={t("selectDate")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("paymentMethod")}
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData({ ...formData, paymentMethod: e.target.value })
              }
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">{t("selectMethod")}</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("attachmentUrl")}
            </label>
            <input
              type="url"
              value={formData.attachmentUrl}
              onChange={(e) =>
                setFormData({ ...formData, attachmentUrl: e.target.value })
              }
              placeholder="https://..."
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-graphite-700">
              {t("description")}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder={t("expenseDetailsPlaceholder")}
              className="mt-1.5 block w-full resize-none rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Spinner />}
          {saving
            ? t("saving")
            : editingId
              ? t("updateExpense")
              : t("addExpense")}
        </button>
      </form>

      {/* Filters */}
      <div className="mb-5 rounded-xl border border-graphite-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-graphite-900">
          {t("filters")}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-graphite-700 mb-1">
              {t("category")}
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">{t("allCategories")}</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-graphite-700 mb-1">
              {t("fromDate")}
            </label>
            <DatePicker
              value={filterFromDate}
              onChange={setFilterFromDate}
              placeholder={t("startDate")}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-graphite-700 mb-1">
              {t("toDate")}
            </label>
            <DatePicker
              value={filterToDate}
              onChange={setFilterToDate}
              placeholder={t("endDate")}
            />
          </div>
        </div>
      </div>

      {/* Summary by Category */}
      {summary.length > 0 && (
        <div className="mb-5 rounded-xl border border-graphite-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-graphite-900">
            {t("summaryByCategory")}
          </h3>
          <div className="space-y-2">
            {summary.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between rounded-lg bg-graphite-50 px-3 py-2"
              >
                <span className="text-sm font-medium text-graphite-900 capitalize">
                  {item._id}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-graphite-500">
                    {t("expensesCount", { count: item.count })}
                  </span>
                  <span className="text-sm font-semibold text-graphite-900">
                    {item.total.toFixed(2)} SAR
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-graphite-900">
          {t("expenseHistory")}
        </h2>
        {loading ? (
          <div className="flex items-center gap-2">
            <Spinner />
            <p className="text-sm text-graphite-500">{t("loadingExpenses")}</p>
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-graphite-500">{t("noExpensesYet")}</p>
        ) : (
          <div className="divide-y divide-graphite-200 rounded-xl border border-graphite-200 bg-white">
            {expenses.map((expense) => (
              <div
                key={expense._id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-graphite-900">
                      {expense.amount.toFixed(2)} {expense.currency}
                    </span>
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 capitalize">
                      {expense.category}
                    </span>
                  </div>
                  {expense.description && (
                    <p className="mt-1 text-xs text-graphite-600">
                      {expense.description}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-graphite-500">
                    <span>{new Date(expense.date).toLocaleDateString()}</span>
                    {expense.paymentMethod && (
                      <span className="capitalize">
                        {expense.paymentMethod}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(expense)}
                    className="rounded-lg p-2 text-graphite-400 hover:bg-graphite-100 hover:text-primary-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(expense._id)}
                    className="rounded-lg p-2 text-graphite-400 hover:bg-graphite-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
