// Main permission system exports
export { usePermissions, checkPermission } from '../../hooks/usePermissions';
export type { Permission, UserRole } from '../../hooks/usePermissions';

// Permission components
export {
  PermissionGate,
  PermissionGateAny,
  PermissionGateAll,
  RoleGate,
  AdminOnly,
  TeacherOnly,
  PermissionButton
} from './PermissionComponents';

// Permission utilities
export { usePermissionClasses } from '../../hooks/usePermissionClasses';
