import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Pill,
  Users,
  FileText,
  Package,
  TrendingUp,
  RotateCcw,
  BarChart3,
  UserCog,
  Settings,
  ShoppingCart,
  ClipboardList,
  Truck,
  TrendingDown,
  PackageSearch,
  ClipboardCheck,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { User } from '@/types';
import { canAccessRoute } from '@/lib/permissions';

interface SidebarProps {
  currentUser: User | null;
  onLogout: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingCart, label: 'POS', path: '/pos' },
  { icon: Pill, label: 'Obat', path: '/obat' },
  { icon: Users, label: 'Pasien', path: '/pasien' },
  { icon: FileText, label: 'Resep', path: '/resep' },
  { icon: ClipboardList, label: 'Resep Digital', path: '/digital-prescription' },
  { icon: Package, label: 'Stok', path: '/stok' },
  { icon: Truck, label: 'Supplier', path: '/supplier' },
  { icon: PackageSearch, label: 'Purchase Order', path: '/purchase-order' },
  { icon: TrendingDown, label: 'Supplier Performance', path: '/supplier-performance' },
  { icon: TrendingUp, label: 'Reorder Suggestions', path: '/reorder-suggestions' },
  { icon: ClipboardCheck, label: 'Stock Opname', path: '/stock-opname' },
  { icon: RotateCcw, label: 'Return', path: '/return' },
  { icon: BarChart3, label: 'Laporan', path: '/laporan' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: UserCog, label: 'User', path: '/user' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar({ currentUser, onLogout }: SidebarProps) {
  const location = useLocation();

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter(item => 
    currentUser && canAccessRoute(currentUser, item.path)
  );

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Pill className="h-6 w-6 text-primary" />
        <span className="ml-2 text-lg font-semibold">Apotek Sehat</span>
      </div>

      {currentUser && (
        <div className="border-b p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.nama}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary'
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      <Separator />
      
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}