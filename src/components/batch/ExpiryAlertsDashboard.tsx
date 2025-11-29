import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExpiryAlert, Obat, ObatBatch } from '@/types';
import { storageService } from '@/lib/storage';
import { generateExpiryAlerts, calculateDaysUntilExpiry } from '@/lib/batch-utils';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ExpiryAlertsDashboard() {
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateAlerts();
  }, []);

  const generateAlerts = () => {
    setLoading(true);
    try {
      const obatList = storageService.getObat();
      const settings = storageService.getSettings();
      const allAlerts: ExpiryAlert[] = [];

      obatList.forEach(obat => {
        if (obat.batches && obat.batches.length > 0) {
          const obatAlerts = generateExpiryAlerts(obat, obat.batches, settings.expiryWarningDays);
          allAlerts.push(...obatAlerts);
        }
      });

      // Sort by priority and days until expiry
      allAlerts.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });

      setAlerts(allAlerts);
      storageService.saveExpiryAlerts(allAlerts);
      
      // Create notifications for high priority alerts
      const highPriorityAlerts = allAlerts.filter(a => a.priority === 'high' && a.status === 'active');
      if (highPriorityAlerts.length > 0) {
        const notifikasi = storageService.getNotifikasi();
        highPriorityAlerts.forEach(alert => {
          notifikasi.push({
            id: `notif-${alert.id}`,
            tipe: 'batch_expired',
            judul: alert.daysUntilExpiry < 0 ? 'Batch Kadaluarsa' : 'Batch Mendekati Kadaluarsa',
            pesan: `${alert.obatNama} - Batch ${alert.nomorBatch} ${
              alert.daysUntilExpiry < 0 
                ? `telah kadaluarsa ${Math.abs(alert.daysUntilExpiry)} hari lalu` 
                : `akan kadaluarsa dalam ${alert.daysUntilExpiry} hari`
            }`,
            tanggal: new Date().toISOString(),
            isRead: false,
            batchId: alert.batchId,
            priority: alert.priority,
          });
        });
        storageService.saveNotifikasi(notifikasi);
      }
      
      toast.success(`${allAlerts.length} alert ditemukan`);
    } catch (error) {
      console.error('Error generating alerts:', error);
      toast.error('Gagal generate alerts');
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = (alertId: string) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId ? { ...alert, status: 'resolved' as const } : alert
    );
    setAlerts(updatedAlerts);
    storageService.saveExpiryAlerts(updatedAlerts);
    toast.success('Alert ditandai sebagai resolved');
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const highPriorityCount = activeAlerts.filter(a => a.priority === 'high').length;
  const mediumPriorityCount = activeAlerts.filter(a => a.priority === 'medium').length;
  const lowPriorityCount = activeAlerts.filter(a => a.priority === 'low').length;

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-orange-100 text-orange-800 border-orange-300',
      low: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };
    return <Badge className={colors[priority]}>{priority.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Expiry Alerts Dashboard</h2>
          <p className="text-muted-foreground">Monitor obat yang akan atau sudah kadaluarsa</p>
        </div>
        <Button onClick={generateAlerts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Alerts
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">alerts aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highPriorityCount}</div>
            <p className="text-xs text-muted-foreground">perlu tindakan segera</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-600">Medium Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{mediumPriorityCount}</div>
            <p className="text-xs text-muted-foreground">perlu perhatian</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">Low Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowPriorityCount}</div>
            <p className="text-xs text-muted-foreground">monitoring</p>
          </CardContent>
        </Card>
      </div>

      {highPriorityCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Peringatan!</AlertTitle>
          <AlertDescription>
            Terdapat {highPriorityCount} batch obat dengan prioritas tinggi yang perlu segera ditangani.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Expiry Alerts</CardTitle>
          <CardDescription>
            Batch obat yang akan atau sudah kadaluarsa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>Tidak ada alert aktif</p>
              <p className="text-sm">Semua batch obat dalam kondisi baik</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Obat</TableHead>
                  <TableHead>Nomor Batch</TableHead>
                  <TableHead>Tanggal Kadaluarsa</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>{getPriorityBadge(alert.priority)}</TableCell>
                    <TableCell className="font-medium">{alert.obatNama}</TableCell>
                    <TableCell>{alert.nomorBatch}</TableCell>
                    <TableCell>
                      <div>
                        {new Date(alert.tanggalKadaluarsa).toLocaleDateString('id-ID')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {alert.daysUntilExpiry < 0 
                          ? `Expired ${Math.abs(alert.daysUntilExpiry)} hari lalu`
                          : `${alert.daysUntilExpiry} hari lagi`
                        }
                      </div>
                    </TableCell>
                    <TableCell>{alert.jumlahStok} unit</TableCell>
                    <TableCell>
                      {alert.daysUntilExpiry < 0 ? (
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          <XCircle className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Near Expiry
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}