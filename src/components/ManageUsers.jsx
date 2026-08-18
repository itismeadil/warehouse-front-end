import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { getUsers, createUser, deleteUser } from "../api/users";
import { useAuth } from "../context/AuthContext";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";

export default function ManageUsers() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { alert, showAlert, hideAlert, showConfirm } = useAlert();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("supplier");

  const loadUsers = () => {
    setLoading(true);
    getUsers()
      .then(setUsers)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createUser({ name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("supplier");
      loadUsers();
    } catch (error) {
      showAlert(error.response?.data?.message || error.message, {
        type: "error",
        title: "Error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) {
      showAlert(t("cannotDeleteOwnAccount"), {
        type: "error",
        title: t("error", "Error"),
      });
      return;
    }

    const confirmed = await showConfirm(t("confirmDeleteUser"), {
      title: t("deleteUser", "Delete User"),
      type: "warning",
      confirmText: t("delete", "Delete"),
      cancelText: t("cancel", "Cancel"),
    });

    if (!confirmed) return;

    try {
      await deleteUser(id);
      loadUsers();
    } catch (error) {
      showAlert(error.response?.data?.message || error.message, {
        type: "error",
        title: t("error", "Error"),
      });
    }
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-graphite-900 dark:text-graphite-100">
        {t("manageUsersTitle")}
      </h1>
      <p className="mt-1 text-sm text-graphite-500 dark:text-graphite-400">
        {t("manageUsersDescription")}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-5 rounded-xl border border-graphite-200 bg-white p-6 shadow-sm dark:border-graphite-700 dark:bg-graphite-800"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 bg-white dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 bg-white dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 bg-white dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
              {t("role")}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-800"
            >
              <option value="supplier">{t("roleSupplier")}</option>
              <option value="manager">{t("roleManager")}</option>
              <option value="accountant">{t("roleAccountant")}</option>
              <option value="admin">{t("roleAdmin")}</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? t("creatingUser") : t("createUser")}
        </button>
      </form>

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-3 rounded-md bg-graphite-50 px-6 py-8 text-center dark:bg-graphite-900">
              <div
                className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent"
                style={{ color: "#45a1a1" }}
                aria-hidden
              />
              <p className="text-sm text-graphite-600 dark:text-graphite-400">
                {t("loading")}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-graphite-200 rounded-xl border border-graphite-200 bg-white dark:border-graphite-700 dark:divide-graphite-700 dark:bg-graphite-800">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                    {u.name}{" "}
                    <span className="ms-1 rounded-full bg-graphite-100 px-2 py-0.5 text-xs font-medium text-graphite-600 dark:bg-graphite-700 dark:text-graphite-400">
                      {t(
                        `role${u.role.charAt(0).toUpperCase()}${u.role.slice(1)}`,
                      )}
                    </span>
                  </p>
                  <p className="text-xs text-graphite-500 dark:text-graphite-400">
                    {u.email}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(u.id)}
                  aria-label={t("deleteUser")}
                  className="rounded-md p-1 text-graphite-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-graphite-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertModal
        isOpen={!!alert}
        onClose={hideAlert}
        title={alert?.title}
        message={alert?.message}
        type={alert?.type}
        showCancel={alert?.showCancel}
        confirmText={alert?.confirmText}
        cancelText={alert?.cancelText}
        onConfirm={alert?.onConfirm}
      />
    </div>
  );
}
