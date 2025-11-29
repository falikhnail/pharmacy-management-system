import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { storageService } from '@/lib/storage';
import { Notifikasi } from '@/types';
import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/utils-pharmacy';

export default function Header() {
  const [notifikasi, setNotifikasi] = useState<Notifikasi[]>([]);

  useEffect(() => {
    loadNotifikasi();
  }, []);

  const loadNotifikasi = () => {
    const allNotifikasi = storageService.getNotifikasi();
    const unread = allNotifikasi.filter(n => !n.isRead).slice(0, 5);
    setNotifikasi(unread);
  };

  const markAsRead = (id: string) => {
    const allNotifikasi = storageService.getNotifikasi();
    const updated = allNotifikasi.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    storageService.saveNotifikasi(updated);
    loadNotifikasi();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <header className="h-16 bg-background border-b flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold">Selamat Datang</h2>
        <p className="text-sm text-muted-foreground">Kelola apotek Anda dengan mudah</p>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              {notifikasi.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {notifikasi.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-2 border-b">
              <h3 className="font-semibold">Notifikasi</h3>
            </div>
            {notifikasi.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Tidak ada notifikasi baru
              </div>
            ) : (
              notifikasi.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className="flex flex-col items-start p-3 cursor-pointer"
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start justify-between w-full mb-1">
                    <span className="font-medium text-sm">{notif.judul}</span>
                    <Badge className={getPriorityColor(notif.priority)} variant="secondary">
                      {notif.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{notif.pesan}</p>
                  <span className="text-xs text-muted-foreground/70">{formatDateTime(notif.tanggal)}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}