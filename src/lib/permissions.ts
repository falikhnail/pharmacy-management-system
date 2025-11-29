import { User, UserPermissions } from '@/types';

/**
 * Default permissions based on role
 */
export const getDefaultPermissions = (role: User['role']): UserPermissions => {
  // Normalize role to handle both capitalized and lowercase
  const normalizedRole = role.toLowerCase() as 'admin' | 'apoteker' | 'kasir';
  
  switch (normalizedRole) {
    case 'admin':
      return {
        canManageUsers: true,
        canManageInventory: true,
        canManageSuppliers: true,
        canProcessPrescriptions: true,
        canProcessSales: true,
        canViewReports: true,
        canManageSettings: true,
        canApproveTransactions: true,
        canManageBackup: true,
      };
    
    case 'apoteker':
      return {
        canManageUsers: false,
        canManageInventory: true, // Only inventory/medicine management
        canManageSuppliers: false,
        canProcessPrescriptions: false,
        canProcessSales: false,
        canViewReports: false,
        canManageSettings: false,
        canApproveTransactions: false,
        canManageBackup: false,
      };
    
    case 'kasir':
      return {
        canManageUsers: false,
        canManageInventory: false,
        canManageSuppliers: false,
        canProcessPrescriptions: false,
        canProcessSales: true, // Only sales/POS
        canViewReports: false,
        canManageSettings: false,
        canApproveTransactions: false,
        canManageBackup: false,
      };
    
    default:
      return {
        canManageUsers: false,
        canManageInventory: false,
        canManageSuppliers: false,
        canProcessPrescriptions: false,
        canProcessSales: false,
        canViewReports: false,
        canManageSettings: false,
        canApproveTransactions: false,
        canManageBackup: false,
      };
  }
};

/**
 * Get user permissions (from custom permissions or default based on role)
 */
export const getUserPermissions = (user: User): UserPermissions => {
  if (user.permissions) {
    return user.permissions;
  }
  return getDefaultPermissions(user.role);
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (user: User, permission: keyof UserPermissions): boolean => {
  const permissions = getUserPermissions(user);
  return permissions[permission] === true;
};

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (user: User | null, path: string): boolean => {
  if (!user) return false;
  
  const permissions = getUserPermissions(user);
  
  // Admin can access everything
  const normalizedRole = user.role.toLowerCase();
  if (normalizedRole === 'admin') return true;
  
  // Route-based access control
  switch (path) {
    // Sales/POS routes - Kasir and Admin only
    case '/pos':
    case '/stok':
      return permissions.canProcessSales;
    
    // Inventory/Medicine routes - Apoteker and Admin only
    case '/obat':
    case '/stock-opname':
      return permissions.canManageInventory;
    
    // Prescription routes - Admin only
    case '/resep':
    case '/digital-prescription':
      return permissions.canProcessPrescriptions;
    
    // Patient management - Admin only
    case '/pasien':
      return permissions.canProcessPrescriptions;
    
    // Supplier management - Admin only
    case '/supplier':
    case '/purchase-order':
    case '/supplier-performance':
    case '/reorder-suggestions':
      return permissions.canManageSuppliers;
    
    // Returns - Admin only
    case '/return':
      return permissions.canApproveTransactions;
    
    // Reports - Admin only
    case '/laporan':
    case '/reports':
      return permissions.canViewReports;
    
    // User management - Admin only
    case '/user':
      return permissions.canManageUsers;
    
    // Settings - Admin only
    case '/settings':
      return permissions.canManageSettings;
    
    // Dashboard - accessible to all authenticated users
    case '/':
      return true;
    
    default:
      return false;
  }
};

/**
 * Get allowed routes for a user
 */
export const getAllowedRoutes = (user: User | null): string[] => {
  if (!user) return [];
  
  const allRoutes = [
    '/',
    '/pos',
    '/obat',
    '/pasien',
    '/resep',
    '/digital-prescription',
    '/stok',
    '/supplier',
    '/purchase-order',
    '/supplier-performance',
    '/reorder-suggestions',
    '/stock-opname',
    '/return',
    '/laporan',
    '/reports',
    '/user',
    '/settings',
  ];
  
  return allRoutes.filter(route => canAccessRoute(user, route));
};

/**
 * Permission labels for UI display
 */
export const permissionLabels: Record<keyof UserPermissions, string> = {
  canManageUsers: 'Kelola User',
  canManageInventory: 'Kelola Inventory',
  canManageSuppliers: 'Kelola Supplier',
  canProcessPrescriptions: 'Proses Resep',
  canProcessSales: 'Proses Penjualan',
  canViewReports: 'Lihat Laporan',
  canManageSettings: 'Kelola Pengaturan',
  canApproveTransactions: 'Approve Transaksi',
  canManageBackup: 'Kelola Backup',
};

/**
 * Permission descriptions for UI display
 */
export const permissionDescriptions: Record<keyof UserPermissions, string> = {
  canManageUsers: 'Menambah, mengedit, dan menghapus user serta mengatur hak akses',
  canManageInventory: 'Mengelola data obat, stok, dan melakukan stock opname',
  canManageSuppliers: 'Mengelola data supplier dan purchase order',
  canProcessPrescriptions: 'Memproses resep dan resep digital',
  canProcessSales: 'Melakukan transaksi penjualan di POS',
  canViewReports: 'Melihat dan mengekspor laporan',
  canManageSettings: 'Mengatur konfigurasi sistem',
  canApproveTransactions: 'Menyetujui transaksi yang memerlukan approval',
  canManageBackup: 'Melakukan backup dan restore data',
};