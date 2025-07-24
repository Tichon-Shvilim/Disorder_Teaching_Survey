import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState, AppDispatch } from "../store";
import { refreshToken, logout } from "../store/authSlice";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, token, refreshToken: refToken, isLoading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (!token || !user) {
        setIsValidating(false);
        return;
      }

      try {
        // Check if token is expired or about to expire
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = tokenPayload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;

        // If token expires in less than 5 minutes, try to refresh
        if (timeUntilExpiry < 5 * 60 * 1000) {
          if (refToken) {
            try {
              await dispatch(refreshToken()).unwrap();
            } catch (error) {
              console.error('Token refresh failed:', error);
              dispatch(logout());
            }
          } else {
            // No refresh token, logout
            dispatch(logout());
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
        dispatch(logout());
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, refToken, user, dispatch]);

  // Show loading while validating token
  if (isValidating || isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Validating session...</div>
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
