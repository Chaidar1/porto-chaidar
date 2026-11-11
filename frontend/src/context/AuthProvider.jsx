import { useState } from "react";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("admin_token"));

  const login = (newToken) => {
    localStorage.setItem("admin_token", newToken); // ← key WAJIB 'admin_token'
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;

