import {ReactNode} from "react";
import {Navigate, useLocation} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {Loading} from "@/components/Loading";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({children}: ProtectedRouteProps) => {
  const {user, loading} = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{from: location}} />;
  }

  return <>{children}</>;
};
