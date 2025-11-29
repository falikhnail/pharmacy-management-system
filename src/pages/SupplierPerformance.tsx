import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SupplierPerformance as SupplierPerformanceType } from '@/types';
import { TrendingUp, Clock, CheckCircle, Star, DollarSign, Package } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils-pharmacy';
import { getAllSupplierPerformance } from '@/lib/po-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

export default function SupplierPerformance() {
  const [performanceData, setPerformanceData] = useState<SupplierPerformanceType[]>([]);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = () => {
    const data = getAllSupplierPerformance();
    setPerformanceData(data);
  };

  const getQualityBadge = (score: number) => {
    if (score >= 4.5) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 3.5) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 2.5) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  const getDeliveryBadge = (days: number) => {
    if (days <= 3) return <Badge className="bg-green-100 text-green-800">Fast</Badge>;
    if (days <= 7) return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>;
    if (days <= 14) return <Badge className="bg-yellow-100 text-yellow-800">Slow</Badge>;
    return <Badge className="bg-red-100 text-red-800">Very Slow</Badge>;
  };

  const calculateOverallStats = () => {
    if (performanceData.length === 0) {
      return {
        avgQuality: 0,
        avgDeliveryTime: 0,
        avgFulfillmentRate: 0,
        totalValue: 0
      };
    }

    const totalQuality = performanceData.reduce((sum, p) => sum + p.qualityScore, 0);
    const totalDeliveryTime = performanceData.reduce((sum, p) => sum + p.averageDeliveryTime, 0);
    const totalFulfillmentRate = performanceData.reduce((sum, p) => sum + p.orderFulfillmentRate, 0);
    const totalValue = performanceData.reduce((sum, p) => sum + p.totalValue, 0);

    return {
      avgQuality: totalQuality / performanceData.length,
      avgDeliveryTime: totalDeliveryTime / performanceData.length,
      avgFulfillmentRate: totalFulfillmentRate / performanceData.length,
      totalValue
    };
  };

  const stats = calculateOverallStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Supplier Performance Dashboard</h1>
        <p className="text-gray-500 mt-1">Monitor dan evaluasi performa supplier</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgQuality.toFixed(1)}/5.0</div>
            <Progress value={stats.avgQuality * 20} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Rata-rata kualitas supplier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgDeliveryTime)} hari</div>
            <p className="text-xs text-muted-foreground mt-2">
              Rata-rata waktu pengiriman
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fulfillment Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgFulfillmentRate)}%</div>
            <Progress value={stats.avgFulfillmentRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Rata-rata tingkat pemenuhan order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Value</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Total nilai pembelian
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} />
            Supplier Performance Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performanceData.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada data</h3>
              <p className="mt-1 text-sm text-gray-500">
                Data performa akan muncul setelah ada purchase order yang selesai
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-center">Quality Score</TableHead>
                  <TableHead className="text-center">Avg Delivery</TableHead>
                  <TableHead className="text-center">Fulfillment Rate</TableHead>
                  <TableHead className="text-center">Total Orders</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead>Last Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceData.map((perf, index) => (
                  <TableRow key={perf.supplierId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">#{index + 1}</span>
                        {index === 0 && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{perf.supplierNama}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold">{perf.qualityScore.toFixed(1)}/5</span>
                        {getQualityBadge(perf.qualityScore)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">{perf.averageDeliveryTime} hari</span>
                        {getDeliveryBadge(perf.averageDeliveryTime)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">{perf.orderFulfillmentRate}%</span>
                        <Progress value={perf.orderFulfillmentRate} className="w-20" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {perf.completedOrders}/{perf.totalOrders}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(perf.totalValue)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {perf.lastOrderDate ? formatDate(perf.lastOrderDate) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              <div>
                <p className="text-2xl font-bold">{performanceData[0].supplierNama}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quality Score:</span>
                    <span className="font-medium">{performanceData[0].qualityScore.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fulfillment Rate:</span>
                    <span className="font-medium">{performanceData[0].orderFulfillmentRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Delivery:</span>
                    <span className="font-medium">{performanceData[0].averageDeliveryTime} hari</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Belum ada data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fastest Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              (() => {
                const fastest = [...performanceData].sort((a, b) => a.averageDeliveryTime - b.averageDeliveryTime)[0];
                return (
                  <div>
                    <p className="text-2xl font-bold">{fastest.supplierNama}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Delivery:</span>
                        <span className="font-medium">{fastest.averageDeliveryTime} hari</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Orders:</span>
                        <span className="font-medium">{fastest.totalOrders}</span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-gray-500">Belum ada data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Highest Value</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              (() => {
                const highest = [...performanceData].sort((a, b) => b.totalValue - a.totalValue)[0];
                return (
                  <div>
                    <p className="text-2xl font-bold">{highest.supplierNama}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Value:</span>
                        <span className="font-medium">{formatCurrency(highest.totalValue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Orders:</span>
                        <span className="font-medium">{highest.totalOrders}</span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-gray-500">Belum ada data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}