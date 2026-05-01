import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  // Also check localStorage directly to avoid the React state-update race condition
  const hasToken = isAuthenticated || !!localStorage.getItem("token");
  if (!hasToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
