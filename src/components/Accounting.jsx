import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Calculator,
  ShoppingCart,
  ArrowDown,
  ArrowUp,
  CreditCard,
} from "lucide-react";
import CalculationsTab from "./accounting/CalculationsTab";
import SellReserveTab from "./accounting/SellReserveTab";
import PurchaseInvoicesTab from "./accounting/PurchaseInvoicesTab";
import SalesInvoicesTab from "./accounting/SalesInvoicesTab";
import ExpensesTab from "./accounting/ExpensesTab";

const TABS = [
  {
    id: "calculations",
    label: "calculations",
    description: "calculationsDescription",
    Component: CalculationsTab,
    icon: Calculator,
  },
  {
    id: "sellReserve",
    label: "sellReserve",
    description: "sellReserveDescription",
    Component: SellReserveTab,
    icon: ShoppingCart,
  },
  {
    id: "purchaseInvoices",
    label: "purchaseInvoices",
    description: "purchaseInvoicesDescription",
    Component: PurchaseInvoicesTab,
    icon: ArrowDown,
  },
  {
    id: "salesInvoices",
    label: "salesInvoices",
    description: "salesInvoicesDescription",
    Component: SalesInvoicesTab,
    icon: ArrowUp,
  },
  {
    id: "expenses",
    label: "expenses",
    description: "expensesDescription",
    Component: ExpensesTab,
    icon: CreditCard,
  },
];

export default function Accounting() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("calculations");

  const ActiveComponent = TABS.find((tab) => tab.id === activeTab).Component;

  return (
    <div>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-graphite-900 dark:text-graphite-100">
              {t("accountingTitle")}
            </h1>
            <p className="mt-1 text-sm text-graphite-500 dark:text-graphite-400">
              {t("accountingDescription")}
            </p>
          </div>
          <button
            onClick={() => navigate("/accounting/summary")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
          >
            <FileText className="h-4 w-4" />
            {t("invoiceSummary")}
          </button>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-graphite-200 dark:ring-graphite-700 dark:bg-graphite-800">
        <nav className="flex border-b border-graphite-200 dark:border-graphite-700">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-graphite-600 hover:text-graphite-900 hover:bg-graphite-50 dark:text-graphite-400 dark:hover:bg-graphite-800 dark:hover:text-graphite-100"
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    activeTab === tab.id
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-graphite-400 group-hover:text-graphite-600 dark:text-graphite-500 dark:group-hover:text-graphite-300"
                  }`}
                />
                <span>{t(tab.label)}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Description */}
      <div className="mb-6 rounded-lg bg-blue-50 px-4 py-3 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {t(TABS.find((tab) => tab.id === activeTab).description)}
        </p>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        <ActiveComponent />
      </div>
    </div>
  );
}
