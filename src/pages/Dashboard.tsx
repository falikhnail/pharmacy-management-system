import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { storageService } from '@/lib/storage';
import { DashboardStats, Obat, Transaksi } from '@/types';
import { formatCurrency, isExpired, isStokLow, checkAndGenerateNotifications } from '@/lib/utils-pharmacy';
import { Package, ShoppingCart, DollarSign, AlertTriangle, Users, Truck, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PeriodType = 'daily' | 'weekly' | 'monthly';

interface SalesData {
  date: string;
  sales: number;
  transactions: number;
}

interface BestSellingMed {
  name: string;
  quantity: number;
  revenue: number;
}

interface StockPrediction {
  obatId: string;
  obatNama: string;
  currentStock: number;
  avgDailySales: number;
  daysUntilEmpty: number;
  predictedEmptyDate: string;
  status: 'critical' | 'warning' | 'safe';
}

interface PeriodComparison {
  currentPeriod: {
    sales: number;
    transactions: number;
    avgTransaction: number;
  };
  previousPeriod: {
    sales: number;
    transactions: number;
    avgTransaction: number;
  };
  changes: {
    salesChange: number;
    transactionsChange: number;
    avgTransactionChange: number;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalObat: 0,
    totalTransaksiHariIni: 0,
    pendapatanHariIni: 0,
    obatKadaluarsa: 0,
    obatStokMenipis: 0,
    totalPasien: 0,
    totalSupplier: 0,
    transaksiMingguIni: 0,
  });

  const [obatKadaluarsa, setObatKadaluarsa] = useState<Obat[]>([]);
  const [obatStokMenipis, setObatStokMenipis] = useState<Obat[]>([]);
  const [transaksiTerbaru, setTransaksiTerbaru] = useState<Transaksi[]>([]);
  
  // Analytics states
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [bestSellingMeds, setBestSellingMeds] = useState<BestSellingMed[]>([]);
  const [stockPredictions, setStockPredictions] = useState<StockPrediction[]>([]);
  const [periodComparison, setPeriodComparison] = useState<PeriodComparison | null>(null);

  useEffect(() => {
    loadDashboardData();
    loadAnalyticsData();
    checkAndGenerateNotifications();
  }, [period]);

  const loadDashboardData = () => {
    const obatList = storageService.getObat();
    const transaksiList = storageService.getTransaksi();
    const pasienList = storageService.getPasien();
    const supplierList = storageService.getSupplier();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transaksiHariIni = transaksiList.filter(t => {
      const transaksiDate = new Date(t.tanggal);
      transaksiDate.setHours(0, 0, 0, 0);
      return transaksiDate.getTime() === today.getTime();
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const transaksiMingguIni = transaksiList.filter(t => new Date(t.tanggal) >= weekAgo);

    const kadaluarsa = obatList.filter(o => isExpired(o.tanggalKadaluarsa) && !o.isArchived);
    const stokMenipis = obatList.filter(o => isStokLow(o) && !o.isArchived);

    setStats({
      totalObat: obatList.filter(o => !o.isArchived).length,
      totalTransaksiHariIni: transaksiHariIni.length,
      pendapatanHariIni: transaksiHariIni.reduce((sum, t) => sum + t.total, 0),
      obatKadaluarsa: kadaluarsa.length,
      obatStokMenipis: stokMenipis.length,
      totalPasien: pasienList.length,
      totalSupplier: supplierList.filter(s => s.isActive).length,
      transaksiMingguIni: transaksiMingguIni.length,
    });

    setObatKadaluarsa(kadaluarsa.slice(0, 5));
    setObatStokMenipis(stokMenipis.slice(0, 5));
    setTransaksiTerbaru(transaksiList.slice(-5).reverse());
  };

  const loadAnalyticsData = () => {
    const transaksiList = storageService.getTransaksi();
    const obatList = storageService.getObat();

    // Generate sales data based on period
    const salesDataByPeriod = generateSalesData(transaksiList, period);
    setSalesData(salesDataByPeriod);

    // Calculate best selling medications
    const bestSelling = calculateBestSellingMeds(transaksiList);
    setBestSellingMeds(bestSelling);

    // Predict stock needs
    const predictions = predictStockNeeds(obatList, transaksiList);
    setStockPredictions(predictions);

    // Compare with previous period
    const comparison = comparePeriods(transaksiList, period);
    setPeriodComparison(comparison);
  };

  const generateSalesData = (transaksiList: Transaksi[], periodType: PeriodType): SalesData[] => {
    const data: Map<string, { sales: number; transactions: number }> = new Map();
    const now = new Date();
    
    let daysToShow = 7;
    if (periodType === 'daily') daysToShow = 7;
    else if (periodType === 'weekly') daysToShow = 28;
    else if (periodType === 'monthly') daysToShow = 180;

    // Initialize data structure
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      let key = '';
      if (periodType === 'daily') {
        key = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      } else if (periodType === 'weekly') {
        const weekNum = Math.floor(i / 7);
        key = `Minggu ${4 - weekNum}`;
      } else {
        key = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      }
      
      if (!data.has(key)) {
        data.set(key, { sales: 0, transactions: 0 });
      }
    }

    // Aggregate transaction data
    transaksiList.forEach(t => {
      const transDate = new Date(t.tanggal);
      const daysDiff = Math.floor((now.getTime() - transDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < daysToShow) {
        let key = '';
        if (periodType === 'daily') {
          key = transDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        } else if (periodType === 'weekly') {
          const weekNum = Math.floor(daysDiff / 7);
          key = `Minggu ${4 - weekNum}`;
        } else {
          key = transDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        }
        
        const current = data.get(key) || { sales: 0, transactions: 0 };
        data.set(key, {
          sales: current.sales + t.total,
          transactions: current.transactions + 1,
        });
      }
    });

    return Array.from(data.entries()).map(([date, values]) => ({
      date,
      sales: values.sales,
      transactions: values.transactions,
    }));
  };

  const calculateBestSellingMeds = (transaksiList: Transaksi[]): BestSellingMed[] => {
    const medSales: Map<string, { quantity: number; revenue: number }> = new Map();

    // Get transactions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    transaksiList
      .filter(t => new Date(t.tanggal) >= thirtyDaysAgo)
      .forEach(t => {
        t.items.forEach(item => {
          const current = medSales.get(item.obatNama) || { quantity: 0, revenue: 0 };
          medSales.set(item.obatNama, {
            quantity: current.quantity + item.jumlah,
            revenue: current.revenue + item.subtotal,
          });
        });
      });

    return Array.from(medSales.entries())
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  };

  const predictStockNeeds = (obatList: Obat[], transaksiList: Transaksi[]): StockPrediction[] => {
    const predictions: StockPrediction[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    obatList
      .filter(o => !o.isArchived)
      .forEach(obat => {
        // Calculate average daily sales
        const sales = transaksiList
          .filter(t => new Date(t.tanggal) >= thirtyDaysAgo)
          .flatMap(t => t.items)
          .filter(item => item.obatId === obat.id);

        const totalSold = sales.reduce((sum, item) => sum + item.jumlah, 0);
        const avgDailySales = totalSold / 30;

        if (avgDailySales > 0) {
          const daysUntilEmpty = Math.floor(obat.stokCurrent / avgDailySales);
          const predictedDate = new Date();
          predictedDate.setDate(predictedDate.getDate() + daysUntilEmpty);

          let status: 'critical' | 'warning' | 'safe' = 'safe';
          if (daysUntilEmpty <= 7) status = 'critical';
          else if (daysUntilEmpty <= 14) status = 'warning';

          predictions.push({
            obatId: obat.id,
            obatNama: obat.nama,
            currentStock: obat.stokCurrent,
            avgDailySales: Math.round(avgDailySales * 10) / 10,
            daysUntilEmpty,
            predictedEmptyDate: predictedDate.toLocaleDateString('id-ID'),
            status,
          });
        }
      });

    return predictions
      .filter(p => p.status !== 'safe')
      .sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty)
      .slice(0, 10);
  };

  const comparePeriods = (transaksiList: Transaksi[], periodType: PeriodType): PeriodComparison => {
    const now = new Date();
    let periodDays = 7;
    
    if (periodType === 'daily') periodDays = 7;
    else if (periodType === 'weekly') periodDays = 28;
    else if (periodType === 'monthly') periodDays = 90;

    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - periodDays);

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);

    const currentTransactions = transaksiList.filter(
      t => new Date(t.tanggal) >= currentPeriodStart
    );

    const previousTransactions = transaksiList.filter(
      t => new Date(t.tanggal) >= previousPeriodStart && new Date(t.tanggal) < currentPeriodStart
    );

    const currentSales = currentTransactions.reduce((sum, t) => sum + t.total, 0);
    const previousSales = previousTransactions.reduce((sum, t) => sum + t.total, 0);

    const currentAvg = currentTransactions.length > 0 ? currentSales / currentTransactions.length : 0;
    const previousAvg = previousTransactions.length > 0 ? previousSales / previousTransactions.length : 0;

    return {
      currentPeriod: {
        sales: currentSales,
        transactions: currentTransactions.length,
        avgTransaction: currentAvg,
      },
      previousPeriod: {
        sales: previousSales,
        transactions: previousTransactions.length,
        avgTransaction: previousAvg,
      },
      changes: {
        salesChange: previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : 0,
        transactionsChange: previousTransactions.length > 0 
          ? ((currentTransactions.length - previousTransactions.length) / previousTransactions.length) * 100 
          : 0,
        avgTransactionChange: previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0,
      },
    };
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Analytics</h1>
        <p className="text-gray-500 mt-1">Analisis lengkap sistem manajemen apotek</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Obat</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalObat}</div>
            <p className="text-xs text-gray-500 mt-1">Obat aktif dalam sistem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Transaksi Hari Ini</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransaksiHariIni}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.transaksiMingguIni} transaksi minggu ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pendapatan Hari Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendapatanHariIni)}</div>
            <p className="text-xs text-gray-500 mt-1">Total penjualan hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.obatKadaluarsa + stats.obatStokMenipis}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.obatKadaluarsa} kadaluarsa, {stats.obatStokMenipis} stok menipis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.obatKadaluarsa > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{stats.obatKadaluarsa} obat kadaluarsa</strong> perlu ditangani segera!
            </AlertDescription>
          </Alert>
        )}

        {stats.obatStokMenipis > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{stats.obatStokMenipis} obat stok menipis</strong> perlu restok segera!
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Grafik Penjualan</TabsTrigger>
          <TabsTrigger value="bestselling">Obat Terlaris</TabsTrigger>
          <TabsTrigger value="prediction">Prediksi Stok</TabsTrigger>
          <TabsTrigger value="comparison">Perbandingan Periode</TabsTrigger>
        </TabsList>

        {/* Sales Chart Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Grafik Penjualan</CardTitle>
                <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Harian (7 Hari)</SelectItem>
                    <SelectItem value="weekly">Mingguan (4 Minggu)</SelectItem>
                    <SelectItem value="monthly">Bulanan (6 Bulan)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorSales)"
                    name="Penjualan"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jumlah Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip labelStyle={{ color: '#000' }} />
                  <Legend />
                  <Bar dataKey="transactions" fill="#10b981" name="Transaksi" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Best Selling Tab */}
        <TabsContent value="bestselling" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Obat Terlaris (30 Hari Terakhir)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={bestSellingMeds} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip labelStyle={{ color: '#000' }} />
                    <Legend />
                    <Bar dataKey="quantity" fill="#3b82f6" name="Jumlah Terjual" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pendapatan per Obat</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={bestSellingMeds.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {bestSellingMeds.slice(0, 8).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detail Obat Terlaris</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bestSellingMeds.map((med, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-gray-600">{med.quantity} unit terjual</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(med.revenue)}</p>
                      <p className="text-xs text-gray-500">Total pendapatan</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Prediction Tab */}
        <TabsContent value="prediction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prediksi Kebutuhan Stok Berdasarkan Data Historis</CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Analisis berdasarkan rata-rata penjualan 30 hari terakhir
              </p>
            </CardHeader>
            <CardContent>
              {stockPredictions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Semua stok dalam kondisi aman</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stockPredictions.map((pred) => (
                    <div 
                      key={pred.obatId} 
                      className={`p-4 rounded-lg border-l-4 ${
                        pred.status === 'critical' 
                          ? 'bg-red-50 border-red-500' 
                          : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{pred.obatNama}</h4>
                            <Badge variant={pred.status === 'critical' ? 'destructive' : 'outline'}>
                              {pred.status === 'critical' ? 'Kritis' : 'Peringatan'}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Stok Saat Ini</p>
                              <p className="font-medium">{pred.currentStock} unit</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Rata-rata Penjualan/Hari</p>
                              <p className="font-medium">{pred.avgDailySales} unit</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Estimasi Habis Dalam</p>
                              <p className="font-medium text-red-600">{pred.daysUntilEmpty} hari</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Prediksi Tanggal Habis</p>
                              <p className="font-medium">{pred.predictedEmptyDate}</p>
                            </div>
                          </div>
                        </div>
                        {pred.status === 'critical' && (
                          <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 ml-3" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Period Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Perbandingan Performa Periode</CardTitle>
                <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">7 Hari vs 7 Hari Sebelumnya</SelectItem>
                    <SelectItem value="weekly">4 Minggu vs 4 Minggu Sebelumnya</SelectItem>
                    <SelectItem value="monthly">3 Bulan vs 3 Bulan Sebelumnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {periodComparison && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Penjualan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Periode Sekarang</p>
                            <p className="text-2xl font-bold">{formatCurrency(periodComparison.currentPeriod.sales)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Periode Sebelumnya</p>
                            <p className="text-lg text-gray-600">{formatCurrency(periodComparison.previousPeriod.sales)}</p>
                          </div>
                          <div className={`flex items-center gap-1 text-sm font-medium ${
                            periodComparison.changes.salesChange >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {periodComparison.changes.salesChange >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {Math.abs(periodComparison.changes.salesChange).toFixed(1)}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Jumlah Transaksi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Periode Sekarang</p>
                            <p className="text-2xl font-bold">{periodComparison.currentPeriod.transactions}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Periode Sebelumnya</p>
                            <p className="text-lg text-gray-600">{periodComparison.previousPeriod.transactions}</p>
                          </div>
                          <div className={`flex items-center gap-1 text-sm font-medium ${
                            periodComparison.changes.transactionsChange >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {periodComparison.changes.transactionsChange >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {Math.abs(periodComparison.changes.transactionsChange).toFixed(1)}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Rata-rata per Transaksi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Periode Sekarang</p>
                            <p className="text-2xl font-bold">{formatCurrency(periodComparison.currentPeriod.avgTransaction)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Periode Sebelumnya</p>
                            <p className="text-lg text-gray-600">{formatCurrency(periodComparison.previousPeriod.avgTransaction)}</p>
                          </div>
                          <div className={`flex items-center gap-1 text-sm font-medium ${
                            periodComparison.changes.avgTransactionChange >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {periodComparison.changes.avgTransactionChange >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {Math.abs(periodComparison.changes.avgTransactionChange).toFixed(1)}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Visualisasi Perbandingan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            {
                              metric: 'Penjualan',
                              'Periode Sekarang': periodComparison.currentPeriod.sales,
                              'Periode Sebelumnya': periodComparison.previousPeriod.sales,
                            },
                            {
                              metric: 'Transaksi',
                              'Periode Sekarang': periodComparison.currentPeriod.transactions * 10000,
                              'Periode Sebelumnya': periodComparison.previousPeriod.transactions * 10000,
                            },
                            {
                              metric: 'Rata-rata',
                              'Periode Sekarang': periodComparison.currentPeriod.avgTransaction,
                              'Periode Sebelumnya': periodComparison.previousPeriod.avgTransaction,
                            },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="metric" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="Periode Sekarang" fill="#3b82f6" />
                          <Bar dataKey="Periode Sebelumnya" fill="#94a3b8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Obat Kadaluarsa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Obat Kadaluarsa</CardTitle>
          </CardHeader>
          <CardContent>
            {obatKadaluarsa.length === 0 ? (
              <p className="text-sm text-gray-500">Tidak ada obat kadaluarsa</p>
            ) : (
              <div className="space-y-3">
                {obatKadaluarsa.map(obat => (
                  <div key={obat.id} className="flex justify-between items-start p-2 bg-red-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{obat.nama}</p>
                      <p className="text-xs text-gray-600">Batch: {obat.nomorBatch}</p>
                    </div>
                    <Badge variant="destructive">Kadaluarsa</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Obat Stok Menipis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stok Menipis</CardTitle>
          </CardHeader>
          <CardContent>
            {obatStokMenipis.length === 0 ? (
              <p className="text-sm text-gray-500">Semua stok aman</p>
            ) : (
              <div className="space-y-3">
                {obatStokMenipis.map(obat => (
                  <div key={obat.id} className="flex justify-between items-start p-2 bg-yellow-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{obat.nama}</p>
                      <p className="text-xs text-gray-600">
                        Stok: {obat.stokCurrent} / Min: {obat.stokMinimum}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100">Low</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaksi Terbaru */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {transaksiTerbaru.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada transaksi</p>
            ) : (
              <div className="space-y-3">
                {transaksiTerbaru.map(transaksi => (
                  <div key={transaksi.id} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{transaksi.nomorTransaksi}</p>
                      <p className="text-xs text-gray-600">{transaksi.kasirNama}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(transaksi.total)}</p>
                      <Badge variant="outline">{transaksi.metodePembayaran}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Total Pasien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPasien}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Total Supplier Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSupplier}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}