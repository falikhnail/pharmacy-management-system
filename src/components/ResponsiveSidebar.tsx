import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Pill, 
  Users, 
  FileText, 
  ShoppingCart,
  Package,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  LogOut,
  ShoppingBag,
  UserCog,
  ClipboardList,
  BarChart3,
  Boxes,
  FileBarChart,
  Stethoscope,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storageService } from '@/lib/storage';
import { hasPermission } from '@/lib/permissions';
import { useMemo } from 'react';

interface ResponsiveSidebarProps {
  onLogout: () => void;
}

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  highlight?: boolean;
  permission?: string;
}

export function ResponsiveSidebar({ onLogout }: ResponsiveSidebarProps) {
  const location = useLocation();
  const currentUser = storageService.getCurrentUser();

  // Define all possible nav items with their required permissions
  const allNavItems: NavItem[] = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/pos', icon: ShoppingCart, label: 'POS', highlight: true, permission: 'canProcessSales' },
    { path: '/obat', icon: Pill, label: 'Obat', permission: 'canManageInventory' },
    { path: '/pasien', icon: Users, label: 'Pasien', permission: 'canProcessPrescriptions' },
    { path: '/resep', icon: FileText, label: 'Resep', permission: 'canProcessPrescriptions' },
    { path: '/digital-prescription', icon: Stethoscope, label: 'Resep Digital', permission: 'canProcessPrescriptions' },
    { path: '/stok', icon: Package, label: 'Stok', permission: 'canManageInventory' },
    { path: '/stock-opname', icon: ClipboardList, label: 'Stock Opname', permission: 'canManageInventory' },
    { path: '/supplier', icon: TrendingUp, label: 'Supplier', permission: 'canManageSuppliers' },
    { path: '/purchase-order', icon: ShoppingBag, label: 'Purchase Order', permission: 'canManageSuppliers' },
    { path: '/supplier-performance', icon: BarChart3, label: 'Performa Supplier', permission: 'canManageSuppliers' },
    { path: '/reorder-suggestions', icon: Boxes, label: 'Saran Reorder', permission: 'canManageInventory' },
    { path: '/return', icon: FileBarChart, label: 'Return', permission: 'canProcessSales' },
    { path: '/laporan', icon: FileSpreadsheet, label: 'Laporan', permission: 'canViewReports' },
    { path: '/reports', icon: FileSpreadsheet, label: 'Reports', permission: 'canViewReports' },
    { path: '/user', icon: UserCog, label: 'User Management', permission: 'canManageUsers' },
    { path: '/settings', icon: Settings, label: 'Pengaturan', permission: 'canManageSettings' },
  ];

  // Filter nav items based on user permissions
  const navItems = useMemo(() => {
    if (!currentUser || !currentUser.id) {
      return [];
    }

    return allNavItems.filter(item => {
      // Dashboard is always visible
      if (item.path === '/dashboard') {
        return true;
      }

      // If no permission required, show the item
      if (!item.permission) {
        return true;
      }

      // Check if user has the required permission
      return hasPermission(currentUser, item.permission as keyof typeof currentUser.permissions);
    });
  }, [currentUser]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <Pill className="h-8 w-8 text-blue-600" />
        <span className="font-bold text-xl">PharmaCare</span>
      </div>

      {/* User Info */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentUser?.nama || 'User'}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{currentUser?.role || 'Role'}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                active
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              } ${item.highlight ? 'font-semibold' : ''}`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </aside>
  );
}