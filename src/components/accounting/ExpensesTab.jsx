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
      date: expense.date ? new Date(expense.date).toISOString().split("T")[0] : "",
      paymentMethod: expense.paymentMethod || "",
      attachmentUrl: expense.attachmentUrl || "",
    });
    setEditingId(expense._id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await deleteExpense(id);
      loadExpenses();
      loadSummary();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
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

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div>
      {/* Summary Stats */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Expenses"
          value={`${totalExpenses.toFixed(2)} SAR`}
          icon={TrendingUp}
        />
        <StatCard
          label="This Month"
          value={expenses.length}
          icon={Calendar}
        />
        <StatCard
          label="Categories"
          value={summary.length}
          icon={TrendingUp}
        />
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-xl border border-graphite-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-graphite-900">
            {editingId ? "Edit Expense" : "Add New Expense"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs font-medium text-graphite-500 hover:text-graphite-700"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-graphite-700">
              Amount *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700">
              Currency
            </label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700">
              Date *
            </label>
            <DatePicker
              value={formData.date}
              onChange={(date) => setFormData({ ...formData, date })}
              placeholder="Select date"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Select method</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700">
              Attachment URL
            </label>
            <input
              type="url"
              value={formData.attachmentUrl}
              onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
              placeholder="https://..."
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-graphite-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Expense details..."
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
          {saving ? "Saving..." : editingId ? "Update Expense" : "Add Expense"}
        </button>
      </form>

      {/* Filters */}
      <div className="mb-5 rounded-xl border border-graphite-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-graphite-900">Filters</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-graphite-700 mb-1">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">All categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-graphite-700 mb-1">
              From Date
            </label>
            <DatePicker
              value={filterFromDate}
              onChange={setFilterFromDate}
              placeholder="Start date"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-graphite-700 mb-1">
              To Date
            </label>
            <DatePicker
              value={filterToDate}
              onChange={setFilterToDate}
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      {/* Summary by Category */}
      {summary.length > 0 && (
        <div className="mb-5 rounded-xl border border-graphite-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-graphite-900">
            Summary by Category
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
                  <span className="text-xs text-graphite-500">{item.count} expenses</span>
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
          Expense History
        </h2>
        {loading ? (
          <div className="flex items-center gap-2">
            <Spinner />
            <p className="text-sm text-graphite-500">Loading expenses...</p>
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-graphite-500">No expenses yet</p>
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
                    <span>
                      {new Date(expense.date).toLocaleDateString()}
                    </span>
                    {expense.paymentMethod && (
                      <span className="capitalize">{expense.paymentMethod}</span>
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
    </div>
  );
}