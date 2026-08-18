import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-900/50 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${sizeClasses[size]} rounded-xl bg-white p-6 shadow-lg flex flex-col max-h-[90vh] dark:bg-graphite-800`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-graphite-900 dark:text-graphite-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-graphite-400 transition-colors hover:bg-graphite-100 hover:text-graphite-600 dark:text-graphite-500 dark:hover:bg-graphite-700 dark:hover:text-graphite-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="mt-6 flex justify-end gap-2 shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );
}
