// src/components/RoleRoute.tsx
import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { Navigate } from "react-router-dom";

interface Props {
  allowedRoles: string[];
  children: React.ReactNode;
}

const RoleRoute: React.FC<Props> = ({ allowedRoles, children }) => {
  const user = useSelector((state: RootState) => state.auth.user);

  if (!user) {
    return <Navigate to="/signin" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/signin" />;
  }

  return <>{children}</>;
};

export default RoleRoute;