import Modal from "./Modal";

export default function AlertModal({
  isOpen,
  onClose,
  title = "Alert",
  message,
  type = "info",
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
}) {
  const typeColors = {
    info: "text-blue-600 dark:text-blue-400",
    success: "text-green-600 dark:text-green-400",
    error: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      footer={
        <>
          {showCancel && (
            <button
              onClick={handleCancel}
              className="rounded-lg border border-graphite-300 px-4 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-50 dark:border-graphite-600 dark:text-graphite-300 dark:hover:bg-graphite-800"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              type === "error"
                ? "bg-red-600 hover:bg-red-700"
                : type === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : type === "warning"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className={`text-sm ${typeColors[type]}`}>{message}</p>
    </Modal>
  );
}
