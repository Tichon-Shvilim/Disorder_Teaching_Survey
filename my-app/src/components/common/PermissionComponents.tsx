import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permission, UserRole } from '../../hooks/usePermissions';

/**
 * Permission-based component that conditionally renders children
 * Usage: <PermissionGate permission="class.edit">...</PermissionGate>
 */
export const PermissionGate: React.FC<{
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, children, fallback = null }) => {
  const { hasPermission } = usePermissions();
  
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
};

/**
 * Multi-permission gate - requires ANY of the permissions
 * Usage: <PermissionGateAny permissions={['class.edit', 'class.delete']}>...</PermissionGateAny>
 */
export const PermissionGateAny: React.FC<{
  permissions: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permissions, children, fallback = null }) => {
  const { hasAnyPermission } = usePermissions();
  
  return hasAnyPermission(permissions) ? <>{children}</> : <>{fallback}</>;
};

/**
 * Multi-permission gate - requires ALL of the permissions
 * Usage: <PermissionGateAll permissions={['class.view', 'student.view']}>...</PermissionGateAll>
 */
export const PermissionGateAll: React.FC<{
  permissions: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permissions, children, fallback = null }) => {
  const { hasAllPermissions } = usePermissions();
  
  return hasAllPermissions(permissions) ? <>{children}</> : <>{fallback}</>;
};

/**
 * Role-based component that conditionally renders children
 * Usage: <RoleGate roles={['admin', 'teacher']}>...</RoleGate>
 */
export const RoleGate: React.FC<{
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ roles, children, fallback = null }) => {
  const { getUserRole } = usePermissions();
  
  return roles.includes(getUserRole()) ? <>{children}</> : <>{fallback}</>;
};

/**
 * Admin-only component
 * Usage: <AdminOnly>...</AdminOnly>
 */
export const AdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  const { isAdmin } = usePermissions();
  
  return isAdmin() ? <>{children}</> : <>{fallback}</>;
};

/**
 * Teacher-only component
 * Usage: <TeacherOnly>...</TeacherOnly>
 */
export const TeacherOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  const { isTeacher } = usePermissions();
  
  return isTeacher() ? <>{children}</> : <>{fallback}</>;
};

/**
 * Button component with permission-based visibility and disable state
 * Usage: <PermissionButton permission="class.edit" onClick={handleEdit}>Edit</PermissionButton>
 */
export const PermissionButton: React.FC<{
  permission: Permission;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  hideIfNoPermission?: boolean;
}> = ({ 
  permission, 
  onClick, 
  children, 
  className, 
  style, 
  disabled = false, 
  hideIfNoPermission = false 
}) => {
  const { hasPermission } = usePermissions();
  const canPerformAction = hasPermission(permission);
  
  if (hideIfNoPermission && !canPerformAction) {
    return null;
  }
  
  return (
    <button
      onClick={canPerformAction && !disabled ? onClick : undefined}
      className={className}
      style={style}
      disabled={disabled || !canPerformAction}
    >
      {children}
    </button>
  );
};
