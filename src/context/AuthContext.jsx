import { createContext, useContext, useEffect, useState } from "react";
import { login as loginApi, logout as logoutApi, getMe } from "../api/auth";
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No token stored at all? Skip the network call entirely.
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }

    getMe()
      .then(setUser)
      .catch(() => {
        clearStoredToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token, user: loggedInUser } = await loginApi(email, password);
    setStoredToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    await logoutApi().catch(() => {});
    clearStoredToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
