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
    console.warn("User not found in state, redirecting to sign-in page.");
    return <Navigate to="/signin" />;
  }

  if (!allowedRoles.includes(user.role)) {
    console.warn(`User with role ${user.role} is not allowed to access this route.`);   
    return <Navigate to="/signin" />;
  }

  return <>{children}</>;
};

export default RoleRoute;