import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
            path="/users"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Layout>
                  <ManageUsers />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
