import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}