import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

const WEEKDAYS_EN = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAYS_AR = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

export const toLocalDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  markedDates = [],
  markedLabel = "Sales day",
}) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const containerRef = useRef(null);

  const isArabic = i18n.language === "ar";
  const WEEKDAYS = isArabic ? WEEKDAYS_AR : WEEKDAYS_EN;

  const selectedDate = parseLocalDate(value);
  const today = new Date();
  const markedSet = useMemo(() => new Set(markedDates), [markedDates]);

  const [viewDate, setViewDate] = useState(selectedDate || today);

  useEffect(() => {
    if (isOpen) setViewDate(selectedDate || today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeMenu();
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") closeMenu();
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const closeMenu = () => {
    setClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setClosing(false);
    }, 120);
  };

  const formatDate = (dateString) => {
    if (!dateString) return placeholder;
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const monthLabel = viewDate.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
    month: "long",
    year: "numeric",
  });

  const goToMonth = (offset) => {
    setViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  };

  const handleSelectDay = (day) => {
    onChange(toLocalDateString(day));
    closeMenu();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
  };

  // Build calendar grid (weeks of 7), including leading/trailing days from adjacent months
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - startOffset);

  const weeks = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => (isOpen ? closeMenu() : setIsOpen(true))}
        className={`group flex w-48 items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-graphite-900 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
          isOpen
            ? "border-primary-500 ring-2 ring-primary-500/20"
            : "border-graphite-300 hover:border-primary-400"
        }`}
      >
        <Calendar
          className={`h-4 w-4 shrink-0 transition-colors ${
            value
              ? "text-primary-600"
              : "text-graphite-400 group-hover:text-primary-500"
          }`}
        />
        <span
          className={`flex-1 truncate text-left ${!value ? "text-graphite-400" : ""}`}
        >
          {formatDate(value)}
        </span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            className="rounded p-0.5 text-graphite-300 transition-colors hover:bg-graphite-100 hover:text-graphite-600"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute ${isArabic ? "right-0 origin-top-right" : "left-0 origin-top-left"} top-full z-50 mt-2 w-72 rounded-2xl border border-graphite-200 bg-white p-4 shadow-lg transition-all duration-150 ${
            closing ? "scale-95 opacity-0" : "scale-100 opacity-100"
          }`}
          style={{ animation: closing ? undefined : "dp-pop 120ms ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              className="rounded-lg p-1.5 text-graphite-500 transition-colors hover:bg-graphite-100 hover:text-graphite-900"
              aria-label="Previous month"
            >
              {isArabic ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
            <p className="text-sm font-semibold text-graphite-900">
              {monthLabel}
            </p>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              className="rounded-lg p-1.5 text-graphite-500 transition-colors hover:bg-graphite-100 hover:text-graphite-900"
              aria-label="Next month"
            >
              {isArabic ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Weekday labels */}
          <div
            className={`mt-3 grid grid-cols-7 gap-y-1 ${isArabic ? "rtl" : ""}`}
          >
            {WEEKDAYS.map((wd, i) => (
              <div
                key={i}
                className="flex h-7 items-center justify-center text-[11px] font-medium uppercase tracking-wide text-graphite-400"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {weeks.map((week, wi) =>
              week.map((day, di) => {
                const inMonth = day.getMonth() === viewDate.getMonth();
                const isToday = isSameDay(day, today);
                const isSelected = isSameDay(day, selectedDate);
                const isMarked =
                  inMonth && markedSet.has(toLocalDateString(day));
                return (
                  <button
                    type="button"
                    key={`${wi}-${di}`}
                    onClick={() => handleSelectDay(day)}
                    title={isMarked ? markedLabel : undefined}
                    className={[
                      "relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors",
                      isSelected
                        ? "bg-primary-600 font-semibold text-white shadow-sm"
                        : isMarked
                          ? "bg-primary-50 font-semibold text-primary-700 hover:bg-primary-100"
                          : inMonth
                            ? "text-graphite-700 hover:bg-primary-50 hover:text-primary-700"
                            : "text-graphite-300 hover:bg-graphite-50",
                      isToday && !isSelected
                        ? "ring-1 ring-inset ring-primary-400"
                        : "",
                    ].join(" ")}
                  >
                    {day.getDate()}
                    {isMarked && !isSelected && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary-500" />
                    )}
                  </button>
                );
              }),
            )}
          </div>

          {/* Legend */}
          {markedDates.length > 0 && (
            <div className="mt-3 flex items-center gap-4 border-t border-graphite-100 pt-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary-500" />
                <span className="text-[11px] font-medium text-graphite-500">
                  {markedLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full ring-1 ring-inset ring-primary-400" />
                <span className="text-[11px] font-medium text-graphite-500">
                  Today
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-graphite-100 pt-3">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-graphite-500 transition-colors hover:text-graphite-800"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleSelectDay(today)}
              className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              Today
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dp-pop {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
