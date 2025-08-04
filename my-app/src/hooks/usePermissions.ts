import { useSelector } from 'react-redux';
import type UserModel from '../components/user/UserModel';

interface RootState {
  auth: {
    user: UserModel | null;
  };
}

export type UserRole = 'admin' | 'teacher' | 'therapist' | 'user';

export type Permission = 
  // Class permissions
  | 'class.create'
  | 'class.edit'
  | 'class.delete'
  | 'class.view'
  | 'class.manage_students'
  | 'class.assign_teachers'
  
  // Student permissions
  | 'student.create'
  | 'student.edit'
  | 'student.delete'
  | 'student.view'
  | 'student.view_all'
  | 'student.assign_class'
  | 'student.assign_therapist'
  
  // User permissions
  | 'user.create'
  | 'user.edit'
  | 'user.delete'
  | 'user.view'
  | 'user.view_all'
  | 'user.manage_roles'
  
  // Form permissions
  | 'form.create'
  | 'form.edit'
  | 'form.delete'
  | 'form.view'
  | 'form.submit'
  | 'form.view_submissions'
  | 'form.manage_templates'
  
  // Analytics permissions
  | 'analytics.view'
  | 'analytics.export'
  | 'analytics.view_all';

// Define permissions for each role
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Admins have all permissions
    'class.create', 'class.edit', 'class.delete', 'class.view', 'class.manage_students', 'class.assign_teachers',
    'student.create', 'student.edit', 'student.delete', 'student.view', 'student.view_all', 'student.assign_class', 'student.assign_therapist',
    'user.create', 'user.edit', 'user.delete', 'user.view', 'user.view_all', 'user.manage_roles',
    'form.create', 'form.edit', 'form.delete', 'form.view', 'form.submit', 'form.view_submissions', 'form.manage_templates',
    'analytics.view', 'analytics.export', 'analytics.view_all'
  ],
  
  teacher: [
    // Teachers can view their classes and students, submit forms
    'class.view',
    'student.view', // Only their class students
    'form.view', 'form.submit',
    'analytics.view' // Only their class analytics
  ],
  
  therapist: [
    // Therapists can view their assigned students, manage forms
    'student.view', // Only assigned students
    'form.create', 'form.view', 'form.submit', 'form.view_submissions',
    'analytics.view' // Only for their students
  ],
  
  user: [
    // Basic users can only submit forms
    'form.view', 'form.submit'
  ]
};

/**
 * Custom hook for checking user permissions
 */
export const usePermissions = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const getUserRole = (): UserRole => {
    if (!currentUser?.role) return 'user';
    return currentUser.role.toLowerCase() as UserRole;
  };

  const hasPermission = (permission: Permission): boolean => {
    const userRole = getUserRole();
    return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const isAdmin = (): boolean => {
    return getUserRole() === 'admin';
  };

  const isTeacher = (): boolean => {
    return getUserRole() === 'teacher';
  };

  const isTherapist = (): boolean => {
    return getUserRole() === 'therapist';
  };

  const canManage = (): boolean => {
    return isAdmin();
  };

  const canEdit = (): boolean => {
    return isAdmin();
  };

  const canDelete = (): boolean => {
    return isAdmin();
  };

  const canCreate = (): boolean => {
    return isAdmin();
  };

  return {
    currentUser,
    getUserRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isTeacher,
    isTherapist,
    canManage,
    canEdit,
    canDelete,
    canCreate
  };
};

/**
 * Utility function to check permissions outside of React components
 */
export const checkPermission = (userRole: string, permission: Permission): boolean => {
  const role = userRole.toLowerCase() as UserRole;
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};
