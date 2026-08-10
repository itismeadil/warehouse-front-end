import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import AddItemForm from "./components/AddItemForm";
import Home from "./components/Home";
import FloorsMap from "./components/FloorsMap";
import Layout from "./components/Layout";
import Login from "./components/Login";
import ManageUsers from "./components/ManageUsers";
import SupplierItems from "./components/SupplierItems";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ItemDetail from "./components/ItemDetail";
import Accounting from "./components/Accounting";
import InvoiceSummary from "./components/accounting/InvoiceSummary";
import NotFound from "./components/NotFound";
import { useTranslation } from "react-i18next";

// Component to update document title based on route
function PageTitle() {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const titles = {
      "/": t("home"),
      "/login": t("login"),
      "/add": t("addItem"),
      "/floors": t("floorMaps"),
      "/accounting": t("accounting"),
      "/accounting/summary": "Invoice Summary",
      "/users": t("manageUsers"),
    };

    // Check for dynamic routes
    if (location.pathname.startsWith("/items/")) {
      document.title = `${t("itemDetails")} - ${t("brandName")}`;
    } else {
      const title = titles[location.pathname] || t("brandName");
      document.title = `${title} - ${t("brandName")}`;
    }
  }, [location.pathname, t]);

  return null;
}

// "/" shows a different page depending on who's logged in.
// admin and manager both get the normal Home; supplier gets their own view.
function RoleHome() {
  const { user } = useAuth();
  return user.role === "supplier" ? <SupplierItems /> : <Home />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <PageTitle />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleHome />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/add"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <Layout>
                  <AddItemForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/items/:id"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <Layout>
                  <ItemDetail />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/floors"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <Layout>
                  <FloorsMap />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/accounting"
            element={
              <ProtectedRoute roles={["admin", "accountant"]}>
                <Layout>
                  <Accounting />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/accounting/summary"
            element={
              <ProtectedRoute roles={["admin", "accountant"]}>
                <Layout>
                  <InvoiceSummary />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Layout>
                  <ManageUsers />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Any unmatched path (typo, stale bookmark, etc.) shows 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
