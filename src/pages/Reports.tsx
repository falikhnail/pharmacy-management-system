import { useState } from 'react';
import { Calendar, Download, FileText, TrendingUp, Package, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-utils';

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

export default function Reports() {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('sales');
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const filteredReports = reportConfigs.filter(report => report.category === selectedCategory);

  const generateReportData = (reportType: ReportType) => {
    // Sample data generation based on report type
    switch (reportType) {
      case 'sales-summary':
        return [
          { tanggal: '2024-01-15', total_transaksi: 45, total_pendapatan: 'Rp 4.500.000', rata_rata: 'Rp 100.000' },
          { tanggal: '2024-01-16', total_transaksi: 52, total_pendapatan: 'Rp 5.200.000', rata_rata: 'Rp 100.000' },
          { tanggal: '2024-01-17', total_transaksi: 38, total_pendapatan: 'Rp 3.800.000', rata_rata: 'Rp 100.000' }
        ];
      
      case 'best-selling':
        return [
          { nama_obat: 'Paracetamol 500mg', jumlah_terjual: 450, pendapatan: 'Rp 2.250.000', persentase: '15%' },
          { nama_obat: 'Amoxicillin 500mg', jumlah_terjual: 380, pendapatan: 'Rp 3.800.000', persentase: '12%' },
          { nama_obat: 'OBH Combi', jumlah_terjual: 320, pendapatan: 'Rp 1.920.000', persentase: '10%' }
        ];
      
      case 'stock-levels':
        return [
          { nama_obat: 'Paracetamol 500mg', stok_tersedia: 450, minimum_stok: 100, status: 'Aman', lokasi: 'Rak A1' },
          { nama_obat: 'Amoxicillin 500mg', stok_tersedia: 85, minimum_stok: 100, status: 'Rendah', lokasi: 'Rak A2' },
          { nama_obat: 'Vitamin C 1000mg', stok_tersedia: 25, minimum_stok: 50, status: 'Kritis', lokasi: 'Rak B1' }
        ];
      
      case 'stock-discrepancy':
        return [
          { nama_obat: 'Paracetamol 500mg', stok_sistem: 450, stok_fisik: 448, selisih: -2, nilai_selisih: 'Rp -10.000', status: 'Kurang' },
          { nama_obat: 'Amoxicillin 500mg', stok_sistem: 380, stok_fisik: 382, selisih: 2, nilai_selisih: 'Rp 20.000', status: 'Lebih' },
          { nama_obat: 'OBH Combi', stok_sistem: 320, stok_fisik: 320, selisih: 0, nilai_selisih: 'Rp 0', status: 'Sesuai' },
          { nama_obat: 'Vitamin C 1000mg', stok_sistem: 150, stok_fisik: 145, selisih: -5, nilai_selisih: 'Rp -75.000', status: 'Kurang' }
        ];
      
      case 'expiring-soon':
        return [
          { nama_obat: 'Paracetamol 500mg', batch: 'B001', tanggal_kadaluarsa: '2024-03-15', stok: 50, status: 'Segera Kadaluarsa' },
          { nama_obat: 'Amoxicillin 500mg', batch: 'B002', tanggal_kadaluarsa: '2024-02-28', stok: 30, status: 'Kritis' },
          { nama_obat: 'Vitamin B Complex', batch: 'B003', tanggal_kadaluarsa: '2024-01-20', stok: 15, status: 'Kadaluarsa' }
        ];
      
      case 'patient-visits':
        return [
          { tanggal: '2024-01-15', jumlah_pasien: 45, pasien_baru: 12, pasien_lama: 33, rata_rata_pembelian: 'Rp 85.000' },
          { tanggal: '2024-01-16', jumlah_pasien: 52, pasien_baru: 15, pasien_lama: 37, rata_rata_pembelian: 'Rp 92.000' },
          { tanggal: '2024-01-17', jumlah_pasien: 38, pasien_baru: 8, pasien_lama: 30, rata_rata_pembelian: 'Rp 78.000' }
        ];
      
      case 'prescription-history':
        return [
          { nomor_resep: 'RX001', tanggal: '2024-01-15', nama_pasien: 'Ahmad Rizki', dokter: 'Dr. Siti', total_item: 3, total: 'Rp 150.000' },
          { nomor_resep: 'RX002', tanggal: '2024-01-15', nama_pasien: 'Budi Santoso', dokter: 'Dr. Andi', total_item: 2, total: 'Rp 85.000' },
          { nomor_resep: 'RX003', tanggal: '2024-01-16', nama_pasien: 'Citra Dewi', dokter: 'Dr. Siti', total_item: 4, total: 'Rp 220.000' }
        ];
      
      case 'revenue-report':
        return [
          { periode: 'Minggu 1', penjualan_kotor: 'Rp 15.000.000', diskon: 'Rp 500.000', penjualan_bersih: 'Rp 14.500.000', hpp: 'Rp 10.000.000', laba_kotor: 'Rp 4.500.000' },
          { periode: 'Minggu 2', penjualan_kotor: 'Rp 18.000.000', diskon: 'Rp 600.000', penjualan_bersih: 'Rp 17.400.000', hpp: 'Rp 12.000.000', laba_kotor: 'Rp 5.400.000' },
          { periode: 'Minggu 3', penjualan_kotor: 'Rp 16.500.000', diskon: 'Rp 550.000', penjualan_bersih: 'Rp 15.950.000', hpp: 'Rp 11.000.000', laba_kotor: 'Rp 4.950.000' }
        ];
      
      case 'profit-analysis':
        return [
          { nama_obat: 'Paracetamol 500mg', harga_beli: 'Rp 3.000', harga_jual: 'Rp 5.000', margin: 'Rp 2.000', persentase_margin: '40%', total_terjual: 450 },
          { nama_obat: 'Amoxicillin 500mg', harga_beli: 'Rp 8.000', harga_jual: 'Rp 10.000', margin: 'Rp 2.000', persentase_margin: '25%', total_terjual: 380 },
          { nama_obat: 'OBH Combi', harga_beli: 'Rp 4.500', harga_jual: 'Rp 6.000', margin: 'Rp 1.500', persentase_margin: '33%', total_terjual: 320 }
        ];
      
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
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
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
                            {value as string}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data untuk ditampilkan
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