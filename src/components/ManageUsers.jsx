import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { getUsers, createUser, deleteUser } from "../api/users";
import { useAuth } from "../context/AuthContext";

export default function ManageUsers() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
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
      alert(error.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) {
      alert(t("cannotDeleteOwnAccount"));
      return;
    }
    if (!confirm(t("confirmDeleteUser"))) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-graphite-900">
        {t("manageUsersTitle")}
      </h1>
      <p className="mt-1 text-sm text-graphite-500">
        {t("manageUsersDescription")}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-5 rounded-xl border border-graphite-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-700">
              {t("role")}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="supplier">{t("roleSupplier")}</option>
              <option value="manager">{t("roleManager")}</option>
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
          <p className="text-sm text-graphite-500">{t("loading")}</p>
        ) : (
          <div className="divide-y divide-graphite-200 rounded-xl border border-graphite-200 bg-white">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-graphite-900">
                    {u.name}{" "}
                    <span className="ms-1 rounded-full bg-graphite-100 px-2 py-0.5 text-xs font-medium text-graphite-600">
                      {t(
                        `role${u.role.charAt(0).toUpperCase()}${u.role.slice(1)}`,
                      )}
                    </span>
                  </p>
                  <p className="text-xs text-graphite-500">{u.email}</p>
                </div>
                <button
                  onClick={() => handleDelete(u.id)}
                  aria-label={t("deleteUser")}
                  className="rounded-md p-1 text-graphite-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
