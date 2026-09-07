import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  SaudiRiyal,
  Plus,
  Trash2,
  BarChart3,
  Calendar,
} from "lucide-react";
import Modal from "../Modal";
import {
  getProfitCalculations,
  createProfitCalculation,
  deleteProfitCalculation,
} from "../../api/accountant";

export default function ProfitCalculator() {
  const { t } = useTranslation();
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");
  const [month, setMonth] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculateProfit = () => {
    const revenueValue = parseFloat(revenue) || 0;
    const expensesValue = parseFloat(expenses) || 0;
    return revenueValue - expensesValue;
  };

  const handleAddToHistory = async () => {
    if (!month || !revenue || !expenses) return;

    const revenueValue = parseFloat(revenue) || 0;
    const expensesValue = parseFloat(expenses) || 0;
    const profit = revenueValue - expensesValue;

    // Calculate breakdowns
    const daily = calculateDailyBreakdown({
      month,
      revenue: revenueValue,
      expenses: expensesValue,
      profit,
    });
    const weekly = calculateWeeklyBreakdown({
      revenue: revenueValue,
      expenses: expensesValue,
      profit,
    });

    try {
      const result = await createProfitCalculation({
        month,
        revenue: revenueValue,
        expenses: expensesValue,
        dailyBreakdown: daily,
        weeklyBreakdown: weekly,
      });

      // Add to local state
      const newEntry = {
        id: result._id,
        month,
        revenue: revenueValue,
        expenses: expensesValue,
        profit,
        date: new Date().toLocaleDateString(),
        dailyBreakdown: daily,
        weeklyBreakdown: weekly,
      };
      setHistory([newEntry, ...history]);
      setMonth("");
      setRevenue("");
      setExpenses("");
    } catch (err) {
      console.error("Error saving profit calculation:", err);
      setError("Failed to save profit calculation");
    }
  };

  const handleDeleteEntry = async (id) => {
    try {
      await deleteProfitCalculation(id);
      setHistory(history.filter((entry) => entry.id !== id));
    } catch (err) {
      console.error("Error deleting profit calculation:", err);
      setError("Failed to delete profit calculation");
    }
  };

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
    setShowDetailsModal(true);
  };

  const calculateDailyBreakdown = (entry) => {
    // Assuming the month format is YYYY-MM, calculate days in that month
    const [year, month] = entry.month.split("-");
    const daysInMonth = new Date(year, month, 0).getDate();

    const dailyRevenue = entry.revenue / daysInMonth;
    const dailyExpenses = entry.expenses / daysInMonth;
    const dailyProfit = entry.profit / daysInMonth;

    return {
      daysInMonth,
      dailyRevenue,
      dailyExpenses,
      dailyProfit,
    };
  };

  const calculateWeeklyBreakdown = (entry) => {
    // Assuming 4 weeks per month for simplicity
    const weeksInMonth = 4;

    const weeklyRevenue = entry.revenue / weeksInMonth;
    const weeklyExpenses = entry.expenses / weeksInMonth;
    const weeklyProfit = entry.profit / weeksInMonth;

    return {
      weeksInMonth,
      weeklyRevenue,
      weeklyExpenses,
      weeklyProfit,
    };
  };

  // Load profit calculations from backend on component mount
  useEffect(() => {
    loadProfitCalculations();
  }, []);

  const loadProfitCalculations = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProfitCalculations();
      // Transform backend data to match frontend format
      const transformedData = data.map((calc) => ({
        id: calc._id,
        month: calc.month,
        revenue: calc.revenue,
        expenses: calc.expenses,
        profit: calc.profit,
        date: new Date(calc.calculatedAt).toLocaleDateString(),
        dailyBreakdown: calc.dailyBreakdown,
        weeklyBreakdown: calc.weeklyBreakdown,
      }));
      setHistory(transformedData);
    } catch (err) {
      console.error("Error loading profit calculations:", err);
      setError("Failed to load profit calculations");
    } finally {
      setLoading(false);
    }
  };

  const currentProfit = revenue && expenses ? calculateProfit() : null;
  const profitPercentage =
    currentProfit && parseFloat(revenue) > 0
      ? ((currentProfit / parseFloat(revenue)) * 100).toFixed(1)
      : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-graphite-900 dark:text-graphite-100">
          <Calculator className="h-5 w-5 text-primary-600" />
          {t("manualProfitCalculator")}
        </h2>
        <p className="mt-1 text-sm text-graphite-500 dark:text-graphite-400">
          {t("manualProfitCalculatorDescription")}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Calculator Form */}
      <div className="mb-6 rounded-xl border border-graphite-200 bg-white p-6 shadow-sm dark:border-graphite-700 dark:bg-graphite-800">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("month")}
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("revenue")}
            </label>
            <div className="relative mt-1.5">
              <SaudiRiyal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="0.00"
                className="block w-full rounded-lg border border-graphite-300 bg-white pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("expenses")}
            </label>
            <div className="relative mt-1.5">
              <SaudiRiyal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="0.00"
                className="block w-full rounded-lg border border-graphite-300 bg-white pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/30"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddToHistory}
              disabled={!month || !revenue || !expenses}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {t("addToHistory")}
            </button>
          </div>
        </div>

        {/* Current Calculation Result */}
        {currentProfit !== null && (
          <div className="mt-6 rounded-lg bg-graphite-50 p-4 dark:bg-graphite-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-graphite-700 dark:text-graphite-300">
                  {t("calculatedProfit")}
                </p>
                <p className="mt-1 text-2xl font-bold text-graphite-900 dark:text-graphite-100">
                  <SaudiRiyal className="h-7 w-7 text-graphite-400 inline-block pr-1" />

                  {currentProfit.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentProfit >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-graphite-700 dark:text-graphite-300">
                    {profitPercentage !== null ? `${profitPercentage}%` : "0%"}
                  </p>
                  <p className="text-xs text-graphite-500 dark:text-graphite-400">
                    {currentProfit >= 0 ? t("profitMargin") : t("lossMargin")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-xl border border-graphite-200 bg-white shadow-sm dark:border-graphite-700 dark:bg-graphite-800">
          <div className="border-b border-graphite-200 px-6 py-4 dark:border-graphite-700">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-graphite-900 dark:text-graphite-100">
              <Calculator className="h-4 w-4 text-graphite-400" />
              {t("calculationHistory")}
            </h3>
          </div>
          <div className="divide-y divide-graphite-100 dark:divide-graphite-700">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="px-6 py-4 cursor-pointer hover:bg-graphite-50 dark:hover:bg-graphite-700/50 transition-colors"
                onClick={() => handleViewDetails(entry)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                        {entry.month}
                      </p>
                      <span className="text-xs text-graphite-500 dark:text-graphite-400">
                        {entry.date}
                      </span>
                      <BarChart3 className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-graphite-500 dark:text-graphite-400">
                          {t("revenue")}
                        </p>
                        <p className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                          <SaudiRiyal className="h-5 w-5 text-graphite-400 inline-block pr-1" />
                          {entry.revenue.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-graphite-500 dark:text-graphite-400">
                          {t("expenses")}
                        </p>
                        <p className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                          <SaudiRiyal className="h-5 w-5 text-graphite-400 inline-block pr-1" />
                          {entry.expenses.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-graphite-500 dark:text-graphite-400">
                          {t("profit")}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            entry.profit >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          <SaudiRiyal className="h-5 w-5 text-graphite-400 inline-block pr-1" />
                          {entry.profit.toFixed(2)}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-graphite-500 dark:text-graphite-400">
                          {t("margin")}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            entry.profit >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {((entry.profit / entry.revenue) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEntry(entry.id);
                    }}
                    className="ml-4 rounded-lg p-2 text-graphite-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {history.length === 0 && (
        <div className="rounded-lg border border-dashed border-graphite-300 bg-white py-12 text-center dark:border-graphite-600 dark:bg-graphite-800">
          <Calculator className="mx-auto h-12 w-12 text-graphite-300 dark:text-graphite-600" />
          <p className="mt-4 text-sm text-graphite-500 dark:text-graphite-400">
            {t("noCalculationsYet")}
          </p>
          <p className="mt-1 text-xs text-graphite-400 dark:text-graphite-500">
            {t("addFirstCalculation")}
          </p>
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`${selectedEntry?.month} - ${t("detailedBreakdown")}`}
        size="lg"
      >
        {selectedEntry && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="rounded-lg bg-graphite-50 p-4 dark:bg-graphite-700">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-graphite-900 dark:text-graphite-100 mb-3">
                <Calculator className="h-4 w-4 text-primary-600" />
                {t("profitMonthlySummary")}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-graphite-500 dark:text-graphite-400">
                    {t("revenue")}
                  </p>
                  <p className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                    <SaudiRiyal className="h-5 w-5 text-graphite-400 inline-block pr-1" />
                    {selectedEntry.revenue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-graphite-500 dark:text-graphite-400">
                    {t("expenses")}
                  </p>
                  <p className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                    <SaudiRiyal className="h-5 w-5 text-graphite-400 inline-block pr-1" />
                    {selectedEntry.expenses.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-graphite-500 dark:text-graphite-400">
                    {t("profit")}
                  </p>
                  <p
                    className={`text-sm font-medium ${selectedEntry.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    <SaudiRiyal className="h-5 w-5 text-graphite-400 inline-block pr-1" />
                    {selectedEntry.profit.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Breakdown */}
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-graphite-900 dark:text-graphite-100 mb-3">
                <Calendar className="h-4 w-4 text-primary-600" />
                {t("profitDailyBreakdown")}
              </h3>
              <div className="rounded-lg border border-graphite-200 bg-white p-4 dark:border-graphite-700 dark:bg-graphite-800">
                {(() => {
                  const daily =
                    selectedEntry.dailyBreakdown ||
                    calculateDailyBreakdown(selectedEntry);
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-graphite-600 dark:text-graphite-400">
                          {t("daysInMonth")}
                        </span>
                        <span className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                          {daily.daysInMonth}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-graphite-600 dark:text-graphite-400">
                          {t("dailyRevenue")}
                        </span>
                        <span className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                          <SaudiRiyal className="h-5 w-5 text-graphite-400 inline-block pr-1" />
                          {daily.dailyRevenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-graphite-600 dark:text-graphite-400">
                          {t("dailyExpenses")}
                        </span>
                        <span className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                          <SaudiRiyal className="h-5 w-5 text-graphite-400 inline-block pr-1" />
                          {daily.dailyExpenses.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-graphite-200 pt-3 dark:border-graphite-700">
                        <span className="text-sm font-medium text-graphite-700 dark:text-graphite-300">
                          {t("dailyProfitAverage")}
                        </span>
                        <span
                          className={`text-sm font-bold ${daily.dailyProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          <SaudiRiyal className="h-5 w-5 text-graphite-400 inline-block pr-1" />
                          {daily.dailyProfit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Weekly Breakdown */}
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-graphite-900 dark:text-graphite-100 mb-3">
                <BarChart3 className="h-4 w-4 text-primary-600" />
                {t("profitWeeklyBreakdown")}
              </h3>
              <div className="rounded-lg border border-graphite-200 bg-white p-4 dark:border-graphite-700 dark:bg-graphite-800">
                {(() => {
                  const weekly = calculateWeeklyBreakdown(selectedEntry);
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-graphite-600 dark:text-graphite-400">
                          {t("weeksInMonth")}
                        </span>
                        <span className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                          {weekly.weeksInMonth}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-graphite-600 dark:text-graphite-400">
                          {t("weeklyRevenue")}
                        </span>
                        <span className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                          <SaudiRiyal className="h-5 w-5 text-graphite-400 inline-block pr-1" />
                          {weekly.weeklyRevenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-graphite-600 dark:text-graphite-400">
                          {t("weeklyExpenses")}
                        </span>
                        <span className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                          <SaudiRiyal className="h-5 w-5 text-graphite-400 inline-block pr-1" />
                          {weekly.weeklyExpenses.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-graphite-200 pt-3 dark:border-graphite-700">
                        <span className="text-sm font-medium text-graphite-700 dark:text-graphite-300">
                          {t("weeklyProfitAverage")}
                        </span>
                        <span
                          className={`text-sm font-bold ${weekly.weeklyProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          <SaudiRiyal className="h-5 w-5 text-graphite-400 inline-block pr-1" />
                          {weekly.weeklyProfit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Loss Analysis */}
            {selectedEntry.profit < 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/30">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-red-900 dark:text-red-300 mb-3">
                  <TrendingDown className="h-4 w-4" />
                  {t("lossAnalysis")}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-700 dark:text-red-400">
                      {t("totalLoss")}
                    </span>
                    <span className="text-sm font-bold text-red-900 dark:text-red-300">
                      <SaudiRiyal className="h-5 w-5 text-graphite-400 inline-block pr-1" />
                      {Math.abs(selectedEntry.profit).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-700 dark:text-red-400">
                      {t("dailyLossAverage")}
                    </span>
                    <span className="text-sm font-medium text-red-900 dark:text-red-300">
                      <SaudiRiyal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-400" />
                      {Math.abs(
                        calculateDailyBreakdown(selectedEntry).dailyProfit,
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-700 dark:text-red-400">
                      {t("weeklyLossAverage")}
                    </span>
                    <span className="text-sm font-medium text-red-900 dark:text-red-300">
                      <SaudiRiyal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-400" />
                      {Math.abs(
                        calculateWeeklyBreakdown(selectedEntry).weeklyProfit,
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
