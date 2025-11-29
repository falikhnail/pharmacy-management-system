import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Store, 
  Bell, 
  Shield, 
  Database,
  Download,
  Upload,
  Clock,
  HardDrive,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import {
  getBackupSettings,
  saveBackupSettings,
  calculateBackupStatistics,
  createBackup,
  restoreBackup,
  formatBytes,
  calculateNextBackupDate,
  type BackupFrequency,
  type BackupSettings as BackupSettingsType,
  type BackupStatistics
} from '@/lib/backup';

interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  currency: string;
  lowStockThreshold: number;
}

const Settings: React.FC = () => {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: 'Apotek Sehat',
    address: 'Jl. Kesehatan No. 123',
    phone: '021-12345678',
    email: 'info@apoteksehat.com',
    taxRate: 10,
    currency: 'IDR',
    lowStockThreshold: 10,
  });

  const [notifications, setNotifications] = useState({
    lowStock: true,
    expiryAlert: true,
    salesReport: false,
    systemUpdates: true,
  });

  const [backupSettings, setBackupSettings] = useState<BackupSettingsType>({
    enabled: false,
    frequency: 'weekly',
    lastBackupDate: null,
    nextBackupDate: null,
  });

  const [backupStats, setBackupStats] = useState<BackupStatistics | null>(null);
  const [isLoadingBackup, setIsLoadingBackup] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed.store) setStoreSettings(parsed.store);
      if (parsed.notifications) setNotifications(parsed.notifications);
    }

    // Load backup settings
    const savedBackupSettings = getBackupSettings();
    setBackupSettings(savedBackupSettings);

    // Load backup statistics
    const stats = calculateBackupStatistics();
    setBackupStats(stats);
  }, []);

  const handleSaveStoreSettings = () => {
    const settings = {
      store: storeSettings,
      notifications,
    };
    localStorage.setItem('settings', JSON.stringify(settings));
    toast.success('Pengaturan toko berhasil disimpan');
  };

  const handleSaveNotifications = () => {
    const settings = {
      store: storeSettings,
      notifications,
    };
    localStorage.setItem('settings', JSON.stringify(settings));
    toast.success('Pengaturan notifikasi berhasil disimpan');
  };

  const handleBackupSettingsChange = (key: keyof BackupSettingsType, value: boolean | BackupFrequency) => {
    const updatedSettings = { ...backupSettings, [key]: value };
    
    // Calculate next backup date when enabling or changing frequency
    if (key === 'enabled' && value === true) {
      const now = new Date();
      const nextBackup = calculateNextBackupDate(now, updatedSettings.frequency);
      updatedSettings.nextBackupDate = nextBackup.toISOString();
      if (!updatedSettings.lastBackupDate) {
        updatedSettings.lastBackupDate = now.toISOString();
      }
    } else if (key === 'frequency' && updatedSettings.enabled) {
      const lastBackup = updatedSettings.lastBackupDate 
        ? new Date(updatedSettings.lastBackupDate) 
        : new Date();
      const nextBackup = calculateNextBackupDate(lastBackup, value as BackupFrequency);
      updatedSettings.nextBackupDate = nextBackup.toISOString();
    }
    
    setBackupSettings(updatedSettings);
    saveBackupSettings(updatedSettings);
    toast.success('Pengaturan backup berhasil disimpan');
  };

  const handleManualBackup = () => {
    setIsLoadingBackup(true);
    try {
      createBackup();
      // Reload backup settings and stats
      const updatedSettings = getBackupSettings();
      setBackupSettings(updatedSettings);
      const stats = calculateBackupStatistics();
      setBackupStats(stats);
    } finally {
      setIsLoadingBackup(false);
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoadingBackup(true);
    try {
      await restoreBackup(file);
      // Reload stats after restore
      const stats = calculateBackupStatistics();
      setBackupStats(stats);
    } finally {
      setIsLoadingBackup(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Belum pernah';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFrequencyLabel = (frequency: BackupFrequency): string => {
    const labels = {
      daily: 'Harian',
      weekly: 'Mingguan',
      monthly: 'Bulanan',
    };
    return labels[frequency];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola pengaturan aplikasi dan toko</p>
      </div>

      {/* Store Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Pengaturan Toko
          </CardTitle>
          <CardDescription>Informasi dasar tentang toko Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Nama Toko</Label>
              <Input
                id="storeName"
                value={storeSettings.name}
                onChange={(e) => setStoreSettings({ ...storeSettings, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                value={storeSettings.phone}
                onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={storeSettings.email}
                onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                value={storeSettings.address}
                onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Pajak (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={storeSettings.taxRate}
                onChange={(e) => setStoreSettings({ ...storeSettings, taxRate: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Ambang Batas Stok Rendah</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                value={storeSettings.lowStockThreshold}
                onChange={(e) => setStoreSettings({ ...storeSettings, lowStockThreshold: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <Button onClick={handleSaveStoreSettings}>Simpan Pengaturan Toko</Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Pengaturan Notifikasi
          </CardTitle>
          <CardDescription>Kelola preferensi notifikasi Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Peringatan Stok Rendah</Label>
              <p className="text-sm text-muted-foreground">Terima notifikasi saat stok obat rendah</p>
            </div>
            <Switch
              checked={notifications.lowStock}
              onCheckedChange={(checked) => setNotifications({ ...notifications, lowStock: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Peringatan Kedaluwarsa</Label>
              <p className="text-sm text-muted-foreground">Terima notifikasi untuk obat yang akan kedaluwarsa</p>
            </div>
            <Switch
              checked={notifications.expiryAlert}
              onCheckedChange={(checked) => setNotifications({ ...notifications, expiryAlert: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Laporan Penjualan</Label>
              <p className="text-sm text-muted-foreground">Terima laporan penjualan harian</p>
            </div>
            <Switch
              checked={notifications.salesReport}
              onCheckedChange={(checked) => setNotifications({ ...notifications, salesReport: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Pembaruan Sistem</Label>
              <p className="text-sm text-muted-foreground">Terima notifikasi tentang pembaruan sistem</p>
            </div>
            <Switch
              checked={notifications.systemUpdates}
              onCheckedChange={(checked) => setNotifications({ ...notifications, systemUpdates: checked })}
            />
          </div>
          <Button onClick={handleSaveNotifications}>Simpan Pengaturan Notifikasi</Button>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Pengaturan Backup Otomatis
          </CardTitle>
          <CardDescription>Kelola backup data sistem POS Apotek secara otomatis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Backup Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aktifkan Backup Otomatis</Label>
              <p className="text-sm text-muted-foreground">
                Backup otomatis akan mencadangkan seluruh data sistem
              </p>
            </div>
            <Switch
              checked={backupSettings.enabled}
              onCheckedChange={(checked) => handleBackupSettingsChange('enabled', checked)}
            />
          </div>

          <Separator />

          {/* Backup Frequency */}
          <div className="space-y-2">
            <Label>Frekuensi Backup</Label>
            <Select
              value={backupSettings.frequency}
              onValueChange={(value) => handleBackupSettingsChange('frequency', value as BackupFrequency)}
              disabled={!backupSettings.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Harian</SelectItem>
                <SelectItem value="weekly">Mingguan</SelectItem>
                <SelectItem value="monthly">Bulanan</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Backup akan dilakukan secara otomatis sesuai frekuensi yang dipilih
            </p>
          </div>

          <Separator />

          {/* Backup Status */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Backup Terakhir
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(backupSettings.lastBackupDate)}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Backup Berikutnya
                </div>
                <p className="text-sm text-muted-foreground">
                  {backupSettings.enabled 
                    ? formatDate(backupSettings.nextBackupDate)
                    : 'Backup otomatis tidak aktif'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Backup Statistics */}
          {backupStats && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <HardDrive className="h-4 w-4" />
                Statistik Data
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Ukuran Data</p>
                  <p className="text-lg font-semibold">{formatBytes(backupStats.totalSize)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Backup Terakhir</p>
                  <p className="text-lg font-semibold">{formatBytes(backupStats.lastBackupSize)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Records</p>
                  <p className="text-lg font-semibold">
                    {Object.values(backupStats.recordCounts).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Riwayat Backup</p>
                  <p className="text-lg font-semibold">{backupStats.backupHistory.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">Obat</p>
                  <p className="font-medium">{backupStats.recordCounts.medications}</p>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">Pasien</p>
                  <p className="font-medium">{backupStats.recordCounts.patients}</p>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">Resep</p>
                  <p className="font-medium">{backupStats.recordCounts.prescriptions}</p>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">Penjualan</p>
                  <p className="font-medium">{backupStats.recordCounts.sales}</p>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">Purchase Order</p>
                  <p className="font-medium">{backupStats.recordCounts.purchaseOrders}</p>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">Supplier</p>
                  <p className="font-medium">{backupStats.recordCounts.suppliers}</p>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{backupStats.recordCounts.users}</p>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">Stock Opname</p>
                  <p className="font-medium">{backupStats.recordCounts.stockOpname}</p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Backup History */}
          {backupStats && backupStats.backupHistory.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Riwayat Backup (10 Terakhir)
              </div>
              
              <div className="space-y-2">
                {backupStats.backupHistory.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {item.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(item.date).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.recordCount} records • {formatBytes(item.size)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.status === 'success' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status === 'success' ? 'Berhasil' : 'Gagal'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Manual Backup Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              Backup Manual
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleManualBackup}
                disabled={isLoadingBackup}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                {isLoadingBackup ? 'Membuat Backup...' : 'Buat Backup Sekarang'}
              </Button>
              
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  disabled={isLoadingBackup}
                  className="hidden"
                  id="restore-backup"
                />
                <Label htmlFor="restore-backup" className="cursor-pointer">
                  <Button 
                    variant="outline" 
                    disabled={isLoadingBackup}
                    className="w-full"
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {isLoadingBackup ? 'Memulihkan...' : 'Pulihkan dari Backup'}
                    </span>
                  </Button>
                </Label>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Backup manual akan mengunduh file JSON yang berisi seluruh data sistem. 
              Simpan file ini di tempat yang aman. Untuk memulihkan data, pilih file backup yang valid.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Shield className="h-5 w-5" />
            Catatan Keamanan
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-800">
          <ul className="list-disc list-inside space-y-1">
            <li>Backup otomatis akan mengunduh file ke perangkat Anda</li>
            <li>Simpan file backup di tempat yang aman dan terenkripsi</li>
            <li>Jangan bagikan file backup kepada pihak yang tidak berwenang</li>
            <li>File backup berisi seluruh data sensitif sistem POS Apotek</li>
            <li>Lakukan backup manual secara berkala sebagai cadangan tambahan</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;