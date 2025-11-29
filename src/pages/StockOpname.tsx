import { useState, useEffect } from 'react';
import { Search, Plus, Save, FileText, AlertTriangle, CheckCircle, XCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { storageService } from '@/lib/storage';
import { Obat } from '@/types';
import { updateStokObat, logAktivitas } from '@/lib/utils-pharmacy';

interface StockOpnameItem {
  id: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  status: 'match' | 'excess' | 'shortage';
  notes: string;
  unit: string;
}

interface StockOpnameSession {
  id: string;
  sessionDate: string;
  sessionNumber: string;
  status: 'draft' | 'in-progress' | 'completed';
  items: StockOpnameItem[];
  createdBy: string;
  completedAt?: string;
  totalItems: number;
  totalDifferences: number;
}

export default function StockOpname() {
  const [sessions, setSessions] = useState<StockOpnameSession[]>([]);
  const [currentSession, setCurrentSession] = useState<StockOpnameSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [physicalCount, setPhysicalCount] = useState('');
  const [notes, setNotes] = useState('');
  const [obatList, setObatList] = useState<Obat[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load sessions from localStorage
    const savedSessions = localStorage.getItem('stockOpnameSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }

    // Load actual medicine data from storage
    const medicines = storageService.getObat().filter(o => !o.isArchived);
    setObatList(medicines);
  };

  const createNewSession = () => {
    const currentUser = storageService.getCurrentUser();
    const sessionNumber = `SO-${Date.now()}`;
    const newSession: StockOpnameSession = {
      id: Date.now().toString(),
      sessionDate: new Date().toISOString(),
      sessionNumber,
      status: 'draft',
      items: [],
      createdBy: currentUser?.nama || 'Admin',
      totalItems: 0,
      totalDifferences: 0,
    };
    setCurrentSession(newSession);
    setShowNewSession(true);
    toast.success('Sesi stok opname baru dibuat');
  };

  const addItemToSession = () => {
    if (!currentSession || !selectedMedicine || !physicalCount) {
      toast.error('Lengkapi semua field');
      return;
    }

    // Get medicine from actual storage
    const medicine = obatList.find(m => m.id === selectedMedicine);
    if (!medicine) {
      toast.error('Obat tidak ditemukan');
      return;
    }

    // Check if medicine already added to this session
    const alreadyAdded = currentSession.items.find(item => item.medicineId === medicine.id);
    if (alreadyAdded) {
      toast.error('Obat sudah ditambahkan ke sesi ini');
      return;
    }

    const physical = parseInt(physicalCount);
    const difference = physical - medicine.stokCurrent;
    let status: 'match' | 'excess' | 'shortage' = 'match';
    
    if (difference > 0) status = 'excess';
    else if (difference < 0) status = 'shortage';

    const newItem: StockOpnameItem = {
      id: Date.now().toString(),
      medicineId: medicine.id,
      medicineName: medicine.nama,
      batchNumber: medicine.nomorBatch,
      expiryDate: medicine.tanggalKadaluarsa,
      systemStock: medicine.stokCurrent,
      physicalStock: physical,
      difference,
      status,
      notes,
      unit: medicine.satuan,
    };

    const updatedSession = {
      ...currentSession,
      items: [...currentSession.items, newItem],
      totalItems: currentSession.items.length + 1,
      totalDifferences: currentSession.totalDifferences + Math.abs(difference),
      status: 'in-progress' as const,
    };

    setCurrentSession(updatedSession);
    setSelectedMedicine('');
    setPhysicalCount('');
    setNotes('');
    toast.success('Item berhasil ditambahkan');
  };

  const completeSession = () => {
    if (!currentSession || currentSession.items.length === 0) {
      toast.error('Tambahkan minimal 1 item sebelum menyelesaikan');
      return;
    }

    const currentUser = storageService.getCurrentUser();
    if (!currentUser) {
      toast.error('User tidak ditemukan');
      return;
    }

    // Update stock for all items with differences
    let updateCount = 0;
    currentSession.items.forEach(item => {
      if (item.difference !== 0) {
        const tipe = item.difference > 0 ? 'masuk' : 'keluar';
        const jumlah = Math.abs(item.difference);
        const keterangan = `Penyesuaian Stok Opname ${currentSession.sessionNumber}: ${item.notes || 'Hasil pengecekan fisik'}`;
        
        const success = updateStokObat(
          item.medicineId,
          jumlah,
          tipe,
          keterangan,
          currentUser.id,
          currentUser.nama,
          currentSession.id
        );

        if (success) {
          updateCount++;
        }
      }
    });

    const completedSession = {
      ...currentSession,
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
    };

    const updatedSessions = [...sessions, completedSession];
    setSessions(updatedSessions);
    localStorage.setItem('stockOpnameSessions', JSON.stringify(updatedSessions));
    
    // Log activity
    logAktivitas(
      currentUser.id,
      currentUser.nama,
      'COMPLETE_STOCK_OPNAME',
      `Menyelesaikan stok opname ${currentSession.sessionNumber} dengan ${updateCount} penyesuaian stok`
    );

    setCurrentSession(null);
    setShowNewSession(false);
    loadData(); // Reload to get updated stock
    toast.success(`Stok opname berhasil diselesaikan! ${updateCount} item stok telah disesuaikan.`);
  };

  const saveDraft = () => {
    if (!currentSession) return;

    const draftSession = { ...currentSession };
    const existingIndex = sessions.findIndex(s => s.id === draftSession.id);
    
    let updatedSessions;
    if (existingIndex >= 0) {
      updatedSessions = [...sessions];
      updatedSessions[existingIndex] = draftSession;
    } else {
      updatedSessions = [...sessions, draftSession];
    }

    setSessions(updatedSessions);
    localStorage.setItem('stockOpnameSessions', JSON.stringify(updatedSessions));
    
    const currentUser = storageService.getCurrentUser();
    if (currentUser) {
      logAktivitas(
        currentUser.id,
        currentUser.nama,
        'SAVE_DRAFT_STOCK_OPNAME',
        `Menyimpan draft stok opname ${currentSession.sessionNumber}`
      );
    }
    
    toast.success('Draft berhasil disimpan');
  };

  const filteredSessions = sessions.filter(session =>
    session.sessionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getItemStatusIcon = (status: string) => {
    if (status === 'match') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'excess') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Stok Opname</h1>
          <p className="text-muted-foreground mt-1">Kelola dan pantau proses pengecekan stok fisik</p>
        </div>
      </div>

      {!showNewSession ? (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Cari nomor sesi atau petugas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={createNewSession}>
                  <Plus className="w-4 h-4 mr-2" />
                  Sesi Baru
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Nomor Sesi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Total Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Selisih
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Petugas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Belum ada sesi stok opname</p>
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map((session) => (
                        <tr key={session.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {session.sessionNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(session.sessionDate).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusBadge(session.status)}>
                              {session.status === 'draft' ? 'Draft' : session.status === 'in-progress' ? 'Proses' : 'Selesai'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {session.totalItems}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {session.totalDifferences > 0 ? (
                              <span className="text-red-600 dark:text-red-400 font-semibold">
                                {session.totalDifferences}
                              </span>
                            ) : (
                              <span className="text-green-600 dark:text-green-400">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {session.createdBy}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCurrentSession(session);
                                setShowNewSession(true);
                              }}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{currentSession?.sessionNumber}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(currentSession?.sessionDate || '').toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={saveDraft} disabled={currentSession?.status === 'completed'}>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Draft
                  </Button>
                  <Button onClick={completeSession} disabled={currentSession?.status === 'completed'}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Selesaikan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentSession(null);
                      setShowNewSession(false);
                    }}
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentSession?.status !== 'completed' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label>Pilih Obat</Label>
                    <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
                      <SelectTrigger>
                        <SelectValue placeholder="-- Pilih Obat --" />
                      </SelectTrigger>
                      <SelectContent>
                        {obatList.map((med) => (
                          <SelectItem key={med.id} value={med.id}>
                            {med.nama} (Stok: {med.stokCurrent} {med.satuan})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Jumlah Fisik</Label>
                    <Input
                      type="number"
                      value={physicalCount}
                      onChange={(e) => setPhysicalCount(e.target.value)}
                      placeholder="Masukkan jumlah"
                    />
                  </div>
                  <div>
                    <Label>Catatan</Label>
                    <Input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan (opsional)"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addItemToSession} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Item
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nama Obat</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Batch</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stok Sistem</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stok Fisik</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Selisih</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentSession?.items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          Belum ada item. Tambahkan item untuk memulai stok opname.
                        </td>
                      </tr>
                    ) : (
                      currentSession?.items.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">{getItemStatusIcon(item.status)}</td>
                          <td className="px-4 py-3 text-sm">{item.medicineName}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{item.batchNumber}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {item.systemStock} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">
                            {item.physicalStock} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`font-semibold ${
                                item.difference > 0
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : item.difference < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}
                            >
                              {item.difference > 0 ? '+' : ''}
                              {item.difference}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{item.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {currentSession && currentSession.items.length > 0 && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Item</p>
                    <p className="text-2xl font-bold">{currentSession.totalItems}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Selisih</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {currentSession.totalDifferences}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Item Sesuai</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {currentSession.items.filter((i) => i.status === 'match').length}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}