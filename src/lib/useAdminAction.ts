'use client';

import { useUser } from './UserContext';

export function useAdminAction() {
  const { role, loading } = useUser();
  const isAdmin = role === 'admin';
  const isObserver = role === 'viewer';

  const canCreate = isAdmin;
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  const requireAdmin = (action: string) => {
    if (!isAdmin) {
      console.warn(`⚠️ Solo administradores pueden ${action}`);
      return false;
    }
    return true;
  };

  return {
    isAdmin,
    isObserver,
    canCreate,
    canEdit,
    canDelete,
    requireAdmin,
    loading,
  };
}
