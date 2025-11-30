import { useState } from 'react';
import { Calendar, Download, FileText, TrendingUp, Package, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-utils';
import { storageService } from '@/lib/storage';

type ReportCategory = 'sales' | 'inventory' | 'patients' | 'financial';
type ReportType = 
  | 'sales-summary' 
  | 'best-selling' 
  | 'stock-levels' 
  | 'stock-discrepancy'
  | 'expiring-soon' 
  | 'patient-visits'
  | 'prescription-history'
  | 'revenue-report'
  | 'profit-analysis';

interface ReportConfig {
  id: ReportType;
  name: string;
  description: string;
  category: ReportCategory;
  icon: React.ReactNode;
}

const reportConfigs: ReportConfig[] = [
  {
    id: 'sales-summary',
    name: 'Ringkasan Penjualan',
    description: 'Laporan total penjualan berdasarkan periode',
    category: 'sales',
    icon: <DollarSign className="h-5 w-5" />
  },
  {
    id: 'best-selling',
    name: 'Obat Terlaris',
    description: 'Daftar obat dengan penjualan tertinggi',
    category: 'sales',
    icon: <TrendingUp className="h-5 w-5" />
  },
  {
    id: 'stock-levels',
    name: 'Level Stok',
    description: 'Status stok obat saat ini',
    category: 'inventory',
    icon: <Package className="h-5 w-5" />
  },
  {
    id: 'stock-discrepancy',
    name: 'Selisih Stok',
    description: 'Perbedaan antara stok sistem dan fisik',
    category: 'inventory',
    icon: <AlertTriangle className="h-5 w-5" />
  },
  {
    id: 'expiring-soon',
    name: 'Obat Kadaluarsa',
    description: 'Obat yang akan atau sudah kadaluarsa',
    category: 'inventory',
    icon: <AlertTriangle className="h-5 w-5" />
  },
  {
    id: 'patient-visits',
    name: 'Kunjungan Pasien',
    description: 'Statistik kunjungan pasien',
    category: 'patients',
    icon: <Users className="h-5 w-5" />
  },
  {
    id: 'prescription-history',
    name: 'Riwayat Resep',
    description: 'Histori resep yang diproses',
    category: 'patients',
    icon: <FileText className="h-5 w-5" />
  },
  {
    id: 'revenue-report',
    name: 'Laporan Pendapatan',
    description: 'Analisis pendapatan apotek',
    category: 'financial',
    icon: <DollarSign className="h-5 w-5" />
  },
  {
    id: 'profit-analysis',
    name: 'Analisis Keuntungan',
    description: 'Margin keuntungan per produk',
    category: 'financial',
    icon: <TrendingUp className="h-5 w-5" />
  }
];

const categoryLabels: Record<ReportCategory, string> = {
  sales: 'Penjualan',
  inventory: 'Inventori',
  patients: 'Pasien',
  financial: 'Keuangan'
};

const categoryColors: Record<ReportCategory, string> = {
  sales: 'bg-blue-500',
  inventory: 'bg-green-500',
  patients: 'bg-purple-500',
  financial: 'bg-orange-500'
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper function to check if date is in range
const isDateInRange = (dateStr: string, startDate: string, endDate: string): boolean => {
  const date = new Date(dateStr);
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Include the end date fully
  return date >= start && date <= end;
};

export default function Reports() {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('sales');
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const filteredReports = reportConfigs.filter(report => report.category === selectedCategory);

  const generateReportData = (reportType: ReportType) => {
    const { startDate, endDate } = dateRange;

    switch (reportType) {
      case 'sales-summary': {
        const penjualan = storageService.getPenjualan().filter(p => 
          isDateInRange(p.tanggal, startDate, endDate)
        );

        // Group by date
        const salesByDate = penjualan.reduce((acc, sale) => {
          const date = sale.tanggal.split('T')[0];
          if (!acc[date]) {
            acc[date] = { count: 0, total: 0 };
          }
          acc[date].count += 1;
          acc[date].total += sale.total;
          return acc;
        }, {} as Record<string, { count: number; total: number }>);

        return Object.entries(salesByDate).map(([date, data]) => ({
          tanggal: date,
          total_transaksi: data.count,
          total_pendapatan: formatCurrency(data.total),
          rata_rata: formatCurrency(data.total / data.count)
        })).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
      }
      
      case 'best-selling': {
        const penjualan = storageService.getPenjualan().filter(p => 
          isDateInRange(p.tanggal, startDate, endDate)
        );

        // Aggregate sales by medicine
        const salesByMedicine = penjualan.reduce((acc, sale) => {
          sale.items.forEach(item => {
            if (!acc[item.obatId]) {
              acc[item.obatId] = {
                nama: item.obatNama,
                jumlah: 0,
                pendapatan: 0
              };
            }
            acc[item.obatId].jumlah += item.jumlah;
            acc[item.obatId].pendapatan += item.subtotal;
          });
          return acc;
        }, {} as Record<string, { nama: string; jumlah: number; pendapatan: number }>);

        const totalRevenue = Object.values(salesByMedicine).reduce((sum, item) => sum + item.pendapatan, 0);

        return Object.values(salesByMedicine)
          .map(item => ({
            nama_obat: item.nama,
            jumlah_terjual: item.jumlah,
            pendapatan: formatCurrency(item.pendapatan),
            persentase: totalRevenue > 0 ? `${((item.pendapatan / totalRevenue) * 100).toFixed(1)}%` : '0%'
          }))
          .sort((a, b) => b.jumlah_terjual - a.jumlah_terjual)
          .slice(0, 20);
      }
      
      case 'stock-levels': {
        const obatList = storageService.getObat();
        
        return obatList.map(obat => {
          let status = 'Aman';
          if (obat.stokCurrent === 0) {
            status = 'Habis';
          } else if (obat.stokCurrent < obat.stokMinimum) {
            status = obat.stokCurrent < obat.stokMinimum / 2 ? 'Kritis' : 'Rendah';
          }

          return {
            nama_obat: obat.nama,
            stok_tersedia: obat.stokCurrent,
            minimum_stok: obat.stokMinimum,
            status,
            kategori: obat.kategori,
            total_batch: obat.batches?.length || 0
          };
        }).sort((a, b) => a.stok_tersedia - b.stok_tersedia);
      }
      
      case 'stock-discrepancy': {
        const stockOpname = storageService.getStockOpname().filter(so => 
          isDateInRange(so.tanggal, startDate, endDate) && so.status === 'Selesai'
        );

        if (stockOpname.length === 0) {
          return [];
        }

        // Get the latest stock opname
        const latestOpname = stockOpname.sort((a, b) => 
          new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        )[0];

        return latestOpname.items.map(item => {
          const selisih = item.stokFisik - item.stokSistem;
          const obat = storageService.getObat().find(o => o.id === item.obatId);
          const nilaiSelisih = obat ? selisih * obat.hargaBeli : 0;

          return {
            nama_obat: item.obatNama,
            stok_sistem: item.stokSistem,
            stok_fisik: item.stokFisik,
            selisih,
            nilai_selisih: formatCurrency(nilaiSelisih),
            status: selisih === 0 ? 'Sesuai' : selisih > 0 ? 'Lebih' : 'Kurang',
            batch: item.nomorBatch || '-'
          };
        }).filter(item => item.selisih !== 0);
      }
      
      case 'expiring-soon': {
        const batches = storageService.getObatBatches();
        const expiryAlerts = storageService.getExpiryAlerts();
        const today = new Date();

        const expiringBatches = batches
          .filter(batch => {
            const expiryDate = new Date(batch.tanggalKadaluarsa);
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 90 && batch.jumlahStok > 0; // Show batches expiring within 90 days
          })
          .map(batch => {
            const obat = storageService.getObat().find(o => o.id === batch.obatId);
            const expiryDate = new Date(batch.tanggalKadaluarsa);
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            let status = 'Normal';
            if (daysUntilExpiry < 0) {
              status = 'Kadaluarsa';
            } else if (daysUntilExpiry <= 30) {
              status = 'Kritis';
            } else if (daysUntilExpiry <= 60) {
              status = 'Segera Kadaluarsa';
            } else {
              status = 'Perhatian';
            }

            return {
              nama_obat: obat?.nama || 'Unknown',
              batch: batch.nomorBatch,
              tanggal_kadaluarsa: batch.tanggalKadaluarsa,
              stok: batch.jumlahStok,
              hari_tersisa: daysUntilExpiry,
              status,
              supplier: batch.supplierNama
            };
          })
          .sort((a, b) => a.hari_tersisa - b.hari_tersisa);

        return expiringBatches;
      }
      
      case 'patient-visits': {
        const penjualan = storageService.getPenjualan().filter(p => 
          isDateInRange(p.tanggal, startDate, endDate)
        );
        const pasien = storageService.getPasien();

        // Group by date
        const visitsByDate = penjualan.reduce((acc, sale) => {
          const date = sale.tanggal.split('T')[0];
          if (!acc[date]) {
            acc[date] = { count: 0, total: 0 };
          }
          acc[date].count += 1;
          acc[date].total += sale.total;
          return acc;
        }, {} as Record<string, { count: number; total: number }>);

        // Calculate new vs returning patients (simplified)
        const totalPatients = pasien.length;
        const patientsCreatedInRange = pasien.filter(p => 
          isDateInRange(p.createdAt, startDate, endDate)
        ).length;

        return Object.entries(visitsByDate).map(([date, data]) => {
          const estimatedNew = Math.floor(data.count * 0.3); // Estimate 30% new patients
          const estimatedReturning = data.count - estimatedNew;

          return {
            tanggal: date,
            jumlah_pasien: data.count,
            pasien_baru: estimatedNew,
            pasien_lama: estimatedReturning,
            rata_rata_pembelian: formatCurrency(data.total / data.count)
          };
        }).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
      }
      
      case 'prescription-history': {
        const resep = storageService.getResep().filter(r => 
          isDateInRange(r.tanggal, startDate, endDate)
        );

        return resep.map(r => ({
          nomor_resep: r.nomorResep,
          tanggal: r.tanggal.split('T')[0],
          nama_pasien: r.pasienNama,
          dokter: r.dokter,
          total_item: r.items.length,
          total: formatCurrency(r.total),
          status: r.status,
          apoteker: r.apotekerNama || '-'
        })).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      }
      
      case 'revenue-report': {
        const penjualan = storageService.getPenjualan().filter(p => 
          isDateInRange(p.tanggal, startDate, endDate)
        );
        const pembelian = storageService.getPembelian().filter(p => 
          isDateInRange(p.tanggal, startDate, endDate)
        );

        // Group by week
        const getWeekNumber = (date: Date) => {
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
          return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        };

        const revenueByWeek = penjualan.reduce((acc, sale) => {
          const date = new Date(sale.tanggal);
          const week = `Minggu ${getWeekNumber(date)}`;
          
          if (!acc[week]) {
            acc[week] = {
              penjualanKotor: 0,
              diskon: 0,
              penjualanBersih: 0,
              hpp: 0
            };
          }
          
          acc[week].penjualanKotor += sale.subtotal;
          acc[week].diskon += sale.diskon;
          acc[week].penjualanBersih += sale.total;
          
          // Calculate COGS from items
          sale.items.forEach(item => {
            const obat = storageService.getObat().find(o => o.id === item.obatId);
            if (obat) {
              acc[week].hpp += obat.hargaBeli * item.jumlah;
            }
          });
          
          return acc;
        }, {} as Record<string, { penjualanKotor: number; diskon: number; penjualanBersih: number; hpp: number }>);

        return Object.entries(revenueByWeek).map(([week, data]) => ({
          periode: week,
          penjualan_kotor: formatCurrency(data.penjualanKotor),
          diskon: formatCurrency(data.diskon),
          penjualan_bersih: formatCurrency(data.penjualanBersih),
          hpp: formatCurrency(data.hpp),
          laba_kotor: formatCurrency(data.penjualanBersih - data.hpp)
        }));
      }
      
      case 'profit-analysis': {
        const penjualan = storageService.getPenjualan().filter(p => 
          isDateInRange(p.tanggal, startDate, endDate)
        );
        const obatList = storageService.getObat();

        // Aggregate sales by medicine
        const salesByMedicine = penjualan.reduce((acc, sale) => {
          sale.items.forEach(item => {
            if (!acc[item.obatId]) {
              acc[item.obatId] = 0;
            }
            acc[item.obatId] += item.jumlah;
          });
          return acc;
        }, {} as Record<string, number>);

        return obatList
          .filter(obat => salesByMedicine[obat.id] > 0)
          .map(obat => {
            const margin = obat.hargaJual - obat.hargaBeli;
            const persentaseMargin = obat.hargaBeli > 0 
              ? ((margin / obat.hargaBeli) * 100).toFixed(1) 
              : '0';

            return {
              nama_obat: obat.nama,
              harga_beli: formatCurrency(obat.hargaBeli),
              harga_jual: formatCurrency(obat.hargaJual),
              margin: formatCurrency(margin),
              persentase_margin: `${persentaseMargin}%`,
              total_terjual: salesByMedicine[obat.id],
              total_profit: formatCurrency(margin * salesByMedicine[obat.id])
            };
          })
          .sort((a, b) => b.total_terjual - a.total_terjual);
      }
      
      default:
        return [];
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!selectedReport) {
      toast.error('Pilih jenis laporan terlebih dahulu');
      return;
    }

    const reportConfig = reportConfigs.find(r => r.id === selectedReport);
    if (!reportConfig) return;

    const data = generateReportData(selectedReport);
    
    if (data.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const filename = `${reportConfig.name}_${dateRange.startDate}_${dateRange.endDate}`;

    try {
      switch (format) {
        case 'csv':
          exportToCSV(data, filename);
          break;
        case 'excel':
          exportToExcel(data, filename);
          break;
        case 'pdf':
          exportToPDF(data, reportConfig.name, filename);
          break;
      }
      toast.success(`Laporan berhasil diekspor ke ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Gagal mengekspor laporan');
      console.error(error);
    }
  };

  const selectedReportConfig = selectedReport ? reportConfigs.find(r => r.id === selectedReport) : null;
  const reportData = selectedReport ? generateReportData(selectedReport) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laporan</h1>
          <p className="text-muted-foreground mt-1">
            Kelola dan ekspor berbagai jenis laporan apotek
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(Object.keys(categoryLabels) as ReportCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setSelectedReport(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? `${categoryColors[category]} text-white`
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
              selectedReport === report.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${categoryColors[report.category]} text-white`}>
                {report.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{report.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {report.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Report Configuration & Preview */}
      {selectedReport && (
        <div className="space-y-4">
          {/* Date Range & Export Controls */}
          <div className="bg-card rounded-lg border p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              {/* Date Range */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-background"
                  />
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  disabled={reportData.length === 0}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={reportData.length === 0}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={reportData.length === 0}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </button>
              </div>
            </div>
          </div>

          {/* Report Preview */}
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${categoryColors[selectedReportConfig!.category]} text-white`}>
                  {selectedReportConfig!.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedReportConfig!.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    Periode: {dateRange.startDate} s/d {dateRange.endDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="p-4 overflow-x-auto">
              {reportData.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(reportData[0]).map((key) => (
                        <th key={key} className="text-left p-2 font-semibold">
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-secondary/50">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="p-2">
                            {value as string | number}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Tidak ada data untuk ditampilkan</p>
                  <p className="text-sm mt-1">Coba ubah rentang tanggal atau pastikan data sudah tersedia di sistem</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedReport && (
        <div className="bg-card rounded-lg border p-12 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Pilih Jenis Laporan</h3>
          <p className="text-muted-foreground">
            Pilih salah satu jenis laporan di atas untuk melihat preview dan mengekspor data
          </p>
        </div>
      )}
    </div>
  );
}