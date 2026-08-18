import { Link } from "react-router-dom";

/**
 * Centered dashed-border placeholder used wherever a list has nothing to show.
 *
 * `icon` is a lucide component (not an element). `action` is optional and takes
 * either an `onClick` handler or a `to` route, plus a `label`.
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  const actionClasses =
    "inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-graphite-900";

  return (
    <div className="rounded-xl border border-dashed border-graphite-300 bg-white px-4 py-12 text-center dark:border-graphite-600 dark:bg-graphite-800">
      <div className="flex flex-col items-center gap-3">
        {Icon && (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-graphite-100 text-graphite-400 dark:bg-graphite-700 dark:text-graphite-500">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </span>
        )}

        {title && (
          <p className="text-sm font-semibold text-graphite-900 dark:text-graphite-100">
            {title}
          </p>
        )}

        {description && (
          <p className="max-w-sm text-sm text-graphite-500 dark:text-graphite-400">
            {description}
          </p>
        )}

        {action &&
          (action.to ? (
            <Link to={action.to} className={`mt-1 ${actionClasses}`}>
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className={`mt-1 ${actionClasses}`}
            >
              {action.label}
            </button>
          ))}
      </div>
    </div>
  );
}
