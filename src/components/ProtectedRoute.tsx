import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { storageService } from '@/lib/storage';
import { hasPermission } from '@/lib/permissions';
import { UserPermissions } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: keyof UserPermissions;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const currentUser = storageService.getCurrentUser();

  // If no user is logged in, redirect to login
  if (!currentUser || !currentUser.id) {
    return <Navigate to="/login" replace />;
  }

  // If no permission is required, allow access
  if (!requiredPermission) {
    return <>{children}</>;
  }

  // Check if user has the required permission
  if (!hasPermission(currentUser, requiredPermission)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert size={24} />
              Akses Ditolak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Anda tidak memiliki hak akses untuk mengakses halaman ini.
            </p>
            <p className="text-sm text-gray-500">
              Silakan hubungi administrator untuk mendapatkan akses yang diperlukan.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}