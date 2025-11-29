import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { storageService } from '@/lib/storage';
import { Transaksi, Obat } from '@/types';
import { formatCurrency, calculatePenjualan, getObatTerlaris } from '@/lib/utils-pharmacy';
import { BarChart3, TrendingUp, Package, DollarSign, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-utils';
import { toast } from 'sonner';

export default function Laporan() {
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [obatList, setObatList] = useState<Obat[]>([]);
  const [periode, setPeriode] = useState('hari_ini');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [stats, setStats] = useState({
    totalTransaksi: 0,
    totalPenjualan: 0,
    totalDiskon: 0,
    totalPajak: 0,
    netPenjualan: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [periode, customStartDate, customEndDate, transaksiList]);

  const loadData = () => {
    const transaksi = storageService.getTransaksi();
    setTransaksiList(transaksi);
    
    const obat = storageService.getObat();
    setObatList(obat);
  };

  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate = new Date(today);
    let endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    switch (periode) {
      case 'hari_ini':
        break;
      case 'minggu_ini':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'bulan_ini':
        startDate.setDate(1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
    }

    return { startDate, endDate };
  };

  const calculateStats = () => {
    const { startDate, endDate } = getDateRange();
    const result = calculatePenjualan(transaksiList, startDate, endDate);
    setStats(result);
  };

  const getObatKadaluarsa = () => {
    const today = new Date();
    return obatList.filter(o => new Date(o.tanggalKadaluarsa) < today && !o.isArchived);
  };

  const getObatStokMenipis = () => {
    return obatList.filter(o => o.stokCurrent <= o.stokMinimum && !o.isArchived);
  };

  const handleExportPenjualan = (format: 'csv' | 'excel' | 'pdf') => {
    try {
      if (filteredTransaksi.length === 0) {
        toast.error('Tidak ada data untuk diekspor');
        return;
      }

      const data = filteredTransaksi.map(t => ({
        'No. Transaksi': t.nomorTransaksi,
        'Tanggal': new Date(t.tanggal).toLocaleDateString('id-ID'),
        'Kasir': t.kasirNama,
        'Subtotal': t.subtotal,
        'Diskon': t.diskon,
        'Pajak': t.pajak,
        'Total': t.total,
        'Metode Pembayaran': t.metodePembayaran,
      }));

      if (format === 'csv') {
        exportToCSV(data, 'Laporan_Penjualan');
        toast.success('Data berhasil diekspor ke CSV');
      } else if (format === 'excel') {
        exportToExcel(data, 'Laporan_Penjualan');
        toast.success('Data berhasil diekspor ke Excel');
      } else if (format === 'pdf') {
        exportToPDF(data, 'Laporan Penjualan', 'Laporan_Penjualan');
        toast.success('Data berhasil diekspor ke PDF');
      }
    } catch (error) {
      toast.error('Gagal mengekspor data');
      console.error(error);
    }
  };

  const handleExportObatTerlaris = (format: 'csv' | 'excel' | 'pdf') => {
    try {
      if (obatTerlaris.length === 0) {
        toast.error('Tidak ada data untuk diekspor');
        return;
      }

      const data = obatTerlaris.map((o, index) => ({
        'No': index + 1,
        'Nama Obat': o.obatNama,
        'Jumlah Terjual': o.jumlahTerjual,
        'Total Pendapatan': o.totalPendapatan,
      }));

      if (format === 'csv') {
        exportToCSV(data, 'Obat_Terlaris');
        toast.success('Data berhasil diekspor ke CSV');
      } else if (format === 'excel') {
        exportToExcel(data, 'Obat_Terlaris');
        toast.success('Data berhasil diekspor ke Excel');
      } else if (format === 'pdf') {
        exportToPDF(data, 'Obat Terlaris', 'Obat_Terlaris');
        toast.success('Data berhasil diekspor ke PDF');
      }
    } catch (error) {
      toast.error('Gagal mengekspor data');
      console.error(error);
    }
  };

  const handleExportObatKadaluarsa = (format: 'csv' | 'excel' | 'pdf') => {
    try {
      if (obatKadaluarsa.length === 0) {
        toast.error('Tidak ada data untuk diekspor');
        return;
      }

      const data = obatKadaluarsa.map((o, index) => ({
        'No': index + 1,
        'Nama Obat': o.nama,
        'Nomor Batch': o.nomorBatch,
        'Tanggal Kadaluarsa': new Date(o.tanggalKadaluarsa).toLocaleDateString('id-ID'),
        'Stok': o.stokCurrent,
      }));

      if (format === 'csv') {
        exportToCSV(data, 'Obat_Kadaluarsa');
        toast.success('Data berhasil diekspor ke CSV');
      } else if (format === 'excel') {
        exportToExcel(data, 'Obat_Kadaluarsa');
        toast.success('Data berhasil diekspor ke Excel');
      } else if (format === 'pdf') {
        exportToPDF(data, 'Obat Kadaluarsa', 'Obat_Kadaluarsa');
        toast.success('Data berhasil diekspor ke PDF');
      }
    } catch (error) {
      toast.error('Gagal mengekspor data');
      console.error(error);
    }
  };

  const handleExportStokMenipis = (format: 'csv' | 'excel' | 'pdf') => {
    try {
      if (obatStokMenipis.length === 0) {
        toast.error('Tidak ada data untuk diekspor');
        return;
      }

      const data = obatStokMenipis.map((o, index) => ({
        'No': index + 1,
        'Nama Obat': o.nama,
        'Stok Saat Ini': o.stokCurrent,
        'Stok Minimum': o.stokMinimum,
        'Selisih': o.stokMinimum - o.stokCurrent,
      }));

      if (format === 'csv') {
        exportToCSV(data, 'Stok_Menipis');
        toast.success('Data berhasil diekspor ke CSV');
      } else if (format === 'excel') {
        exportToExcel(data, 'Stok_Menipis');
        toast.success('Data berhasil diekspor ke Excel');
      } else if (format === 'pdf') {
        exportToPDF(data, 'Stok Menipis', 'Stok_Menipis');
        toast.success('Data berhasil diekspor ke PDF');
      }
    } catch (error) {
      toast.error('Gagal mengekspor data');
      console.error(error);
    }
  };

  const { startDate, endDate } = getDateRange();
  const filteredTransaksi = transaksiList.filter(t => {
    const transaksiDate = new Date(t.tanggal);
    return transaksiDate >= startDate && transaksiDate <= endDate;
  });

  const obatTerlaris = getObatTerlaris(filteredTransaksi, 10);
  const obatKadaluarsa = getObatKadaluarsa();
  const obatStokMenipis = getObatStokMenipis();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Laporan</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Laporan penjualan dan analisis bisnis</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Pilih Periode</Label>
              <Select value={periode} onValueChange={setPeriode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hari_ini">Hari Ini</SelectItem>
                  <SelectItem value="minggu_ini">7 Hari Terakhir</SelectItem>
                  <SelectItem value="bulan_ini">Bulan Ini</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periode === 'custom' && (
              <>
                <div>
                  <Label>Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Tanggal Akhir</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transaksi</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransaksi}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Transaksi dalam periode</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Penjualan</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPenjualan)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Gross sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Diskon</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDiskon)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Diskon diberikan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Penjualan</CardTitle>
            <Package className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.netPenjualan)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Setelah diskon</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Section with Card Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Laporan Penjualan Export */}
            <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Laporan Penjualan
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {filteredTransaksi.length} transaksi dalam periode
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleExportPenjualan('csv')} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  CSV
                </Button>
                <Button 
                  onClick={() => handleExportPenjualan('excel')} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  Excel
                </Button>
                <Button 
                  onClick={() => handleExportPenjualan('pdf')} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <FileText className="mr-1 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Obat Terlaris Export */}
            <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Obat Terlaris
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Top {obatTerlaris.length} obat dengan penjualan tertinggi
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleExportObatTerlaris('csv')} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  CSV
                </Button>
                <Button 
                  onClick={() => handleExportObatTerlaris('excel')} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  Excel
                </Button>
                <Button 
                  onClick={() => handleExportObatTerlaris('pdf')} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <FileText className="mr-1 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Obat Kadaluarsa Export */}
            <div className="p-4 border rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-red-600" />
                Obat Kadaluarsa
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {obatKadaluarsa.length} obat yang sudah kadaluarsa
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleExportObatKadaluarsa('csv')} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  CSV
                </Button>
                <Button 
                  onClick={() => handleExportObatKadaluarsa('excel')} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  Excel
                </Button>
                <Button 
                  onClick={() => handleExportObatKadaluarsa('pdf')} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <FileText className="mr-1 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Stok Menipis Export */}
            <div className="p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-yellow-600" />
                Stok Menipis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {obatStokMenipis.length} obat dengan stok di bawah minimum
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleExportStokMenipis('csv')} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  CSV
                </Button>
                <Button 
                  onClick={() => handleExportStokMenipis('excel')} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  Excel
                </Button>
                <Button 
                  onClick={() => handleExportStokMenipis('pdf')} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <FileText className="mr-1 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Obat Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead className="text-right">Terjual</TableHead>
                  <TableHead className="text-right">Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obatTerlaris.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 dark:text-gray-400">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  obatTerlaris.map((obat, index) => (
                    <TableRow key={obat.obatId}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{obat.obatNama}</TableCell>
                      <TableCell className="text-right">{obat.jumlahTerjual}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(obat.totalPendapatan)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Transaksi</TableHead>
                  <TableHead>Kasir</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransaksi.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 dark:text-gray-400">
                      Tidak ada transaksi
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransaksi.slice(-10).reverse().map((transaksi) => (
                    <TableRow key={transaksi.id}>
                      <TableCell className="font-mono text-sm">{transaksi.nomorTransaksi}</TableCell>
                      <TableCell>{transaksi.kasirNama}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaksi.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Obat Kadaluarsa ({obatKadaluarsa.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {obatKadaluarsa.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">Tidak ada obat kadaluarsa</p>
            ) : (
              <div className="space-y-2">
                {obatKadaluarsa.slice(0, 5).map(obat => (
                  <div key={obat.id} className="p-2 bg-red-50 dark:bg-red-900/20 rounded flex justify-between">
                    <span className="font-medium">{obat.nama}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Batch: {obat.nomorBatch}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Stok Menipis ({obatStokMenipis.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {obatStokMenipis.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">Semua stok aman</p>
            ) : (
              <div className="space-y-2">
                {obatStokMenipis.slice(0, 5).map(obat => (
                  <div key={obat.id} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded flex justify-between">
                    <span className="font-medium">{obat.nama}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Stok: {obat.stokCurrent} / Min: {obat.stokMinimum}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}