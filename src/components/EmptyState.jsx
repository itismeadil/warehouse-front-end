import { Plus } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
  const ActionIcon = action?.icon || Plus;

  return (
    <div className="rounded-xl border-2 border-dashed border-graphite-300 bg-white px-6 py-12 text-center dark:border-graphite-700 dark:bg-graphite-800">
      <div className="flex flex-col items-center gap-3">
        {Icon && (
          <div className="rounded-full bg-graphite-100 p-4 text-graphite-400 dark:bg-graphite-700 dark:text-graphite-300">
            <Icon className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
        <div className="max-w-md">
          <p className="text-base font-semibold text-graphite-900 dark:text-graphite-100">
            {title}
          </p>
          {description && (
            <p className="mt-1.5 text-sm text-graphite-500 dark:text-graphite-400">
              {description}
            </p>
          )}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-graphite-800"
          >
            <ActionIcon className="h-4 w-4" aria-hidden="true" />
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
