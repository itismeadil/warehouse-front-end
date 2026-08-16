import { useState, useCallback, useRef } from "react";

export function useAlert() {
  const [alert, setAlert] = useState(null);
  const resolveRef = useRef(null);

  const showAlert = useCallback((message, options = {}) => {
    setAlert({
      message,
      type: options.type || "info",
      title: options.title || "Alert",
      showCancel: options.showCancel || false,
      confirmText: options.confirmText || "OK",
      cancelText: options.cancelText || "Cancel",
      onConfirm: options.onConfirm,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(null);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  const showConfirm = useCallback(
    (message, options = {}) => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        showAlert(message, {
          ...options,
          showCancel: true,
          onConfirm: () => {
            options.onConfirm?.();
            resolve(true);
            resolveRef.current = null;
            setAlert(null);
          },
        });
      });
    },
    [showAlert],
  );

  return {
    alert,
    showAlert,
    hideAlert,
    showConfirm,
  };
}
