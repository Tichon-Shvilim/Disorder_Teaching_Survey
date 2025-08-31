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

// PDF components
export { default as PDFDownloadButton } from './PDFDownloadButton';
export { default as PDFGenerator } from './PDFGenerator';
export { SimplePDFDocument } from './SimplePDFGenerator';
export { usePDFGeneration } from './usePDFGeneration';

// Language components
export { default as LanguageSwitcher } from './LanguageSwitcher';

// Theme components
export { default as RTLThemeProvider } from './RTLThemeProvider';
