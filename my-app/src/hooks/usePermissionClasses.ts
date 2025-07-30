import { usePermissions } from './usePermissions';
import type { Permission } from './usePermissions';

/**
 * Utility for conditional CSS classes based on permissions
 */
export const usePermissionClasses = () => {
  const permissions = usePermissions();
  
  return {
    adminOnly: (className: string) => permissions.isAdmin() ? className : '',
    teacherOnly: (className: string) => permissions.isTeacher() ? className : '',
    withPermission: (permission: Permission, className: string) => 
      permissions.hasPermission(permission) ? className : '',
    hideIfNoPermission: (permission: Permission) => 
      permissions.hasPermission(permission) ? '' : 'hidden',
  };
};
