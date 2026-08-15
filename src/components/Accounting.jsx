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
    Component: CalculationsTab,
    icon: Calculator,
  },
  {
    id: "sellReserve",
    label: "sellReserve",
    Component: SellReserveTab,
    icon: ShoppingCart,
  },
  {
    id: "purchaseInvoices",
    label: "purchaseInvoices",
    Component: PurchaseInvoicesTab,
    icon: ArrowDown,
  },
  {
    id: "salesInvoices",
    label: "salesInvoices",
    Component: SalesInvoicesTab,
    icon: ArrowUp,
  },
  {
    id: "expenses",
    label: "expenses",
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
            <h1 className="text-2xl font-bold text-graphite-900">
              {t("accountingTitle")}
            </h1>
            <p className="mt-1 text-sm text-graphite-500">
              {t("accountingDescription")}
            </p>
          </div>
          <button
            onClick={() => navigate("/accounting/summary")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
          >
            <FileText className="h-4 w-4" />
            Invoice Summary
          </button>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-graphite-200">
        <nav className="flex border-b border-graphite-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-primary-600"
                    : "text-graphite-600 hover:text-graphite-900 hover:bg-graphite-50"
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    activeTab === tab.id
                      ? "text-primary-600"
                      : "text-graphite-400 group-hover:text-graphite-600"
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

      {/* Content Area */}
      <div className="min-h-[400px]">
        <ActiveComponent />
      </div>
    </div>
  );
}
