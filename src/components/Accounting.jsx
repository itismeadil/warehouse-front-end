import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import CalculationsTab from "./accounting/CalculationsTab";
import SellReserveTab from "./accounting/SellReserveTab";
import PurchaseInvoicesTab from "./accounting/PurchaseInvoicesTab";
import SalesInvoicesTab from "./accounting/SalesInvoicesTab";

const TABS = [
  { id: "calculations", label: "calculations", Component: CalculationsTab },
  { id: "sellReserve", label: "sellReserve", Component: SellReserveTab },
  {
    id: "purchaseInvoices",
    label: "purchaseInvoices",
    Component: PurchaseInvoicesTab,
  },
  { id: "salesInvoices", label: "salesInvoices", Component: SalesInvoicesTab },
];

export default function Accounting() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("calculations");

  const ActiveComponent = TABS.find((tab) => tab.id === activeTab).Component;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-graphite-900">
            {t("accountingTitle")}
          </h1>
          <p className="mt-1 text-sm text-graphite-500">
            {t("accountingDescription")}
          </p>
        </div>
        <button
          onClick={() => navigate("/accounting/summary")}
          className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          <FileText className="h-4 w-4" />
          Invoice Summary
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-graphite-200 bg-graphite-50 p-1">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-white text-graphite-900 shadow-sm"
                  : "text-graphite-500 hover:text-graphite-900"
              }`}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <ActiveComponent />
      </div>
    </div>
  );
}
