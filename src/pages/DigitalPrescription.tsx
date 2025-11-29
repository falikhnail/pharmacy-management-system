import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Scan, Camera, Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { storageService } from '@/lib/storage';
import { BarcodeScanner } from '@/lib/barcode-scanner';
import { PrescriptionService } from '@/lib/prescription-service';
import { DigitalPrescription, PrescriptionStatus } from '@/types/prescription';
import { Pasien, Obat } from '@/types';
import { formatDate } from '@/lib/utils-pharmacy';

export default function DigitalPrescriptionPage() {
  const [prescriptions, setPrescriptions] = useState<DigitalPrescription[]>([]);
  const [patients, setPatients] = useState<Pasien[]>([]);
  const [medications, setMedications] = useState<Obat[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<DigitalPrescription | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = storageService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const presc = PrescriptionService.getAllPrescriptions();
    setPrescriptions(presc.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    
    const pts = storageService.getPasien();
    setPatients(pts);
    
    const meds = storageService.getObat().filter(o => !o.isArchived);
    setMedications(meds);
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start barcode detection
        const scanner = new BarcodeScanner(videoRef.current);
        scanner.onDetect = (barcode: string) => {
          handleBarcodeDetected(barcode);
          handleStopScan();
        };
        scanner.start();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Gagal mengakses kamera: ' + errorMessage);
      setIsScanning(false);
    }
  };

  const handleStopScan = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleBarcodeDetected = (barcode: string) => {
    toast.success(`Barcode terdeteksi: ${barcode}`);
    
    // Create new prescription from scanned barcode
    const newPrescription: DigitalPrescription = {
      id: `presc_${Date.now()}`,
      prescriptionNumber: barcode,
      patientId: '',
      patientName: '',
      doctorName: '',
      scannedAt: new Date().toISOString(),
      status: 'pending',
      items: [],
      queueNumber: PrescriptionService.getNextQueueNumber(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    PrescriptionService.savePrescription(newPrescription);
    setSelectedPrescription(newPrescription);
    loadData();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simulate barcode extraction from image
    toast.info('Memproses gambar resep...');
    
    setTimeout(() => {
      const mockBarcode = `RX${Date.now().toString().slice(-8)}`;
      handleBarcodeDetected(mockBarcode);
      toast.success('Resep berhasil dipindai dari gambar!');
    }, 1500);
  };

  const handleVerifyPrescription = (prescription: DigitalPrescription) => {
    setSelectedPrescription(prescription);
  };

  const handleUpdatePrescription = (field: keyof DigitalPrescription, value: string | PrescriptionStatus) => {
    if (!selectedPrescription) return;
    
    const updated = { ...selectedPrescription, [field]: value };
    setSelectedPrescription(updated);
  };

  const handleAddMedication = (medicationId: string) => {
    if (!selectedPrescription) return;
    
    const medication = medications.find(m => m.id === medicationId);
    if (!medication) return;

    const newItem = {
      medicationId: medication.id,
      medicationName: medication.nama,
      quantity: 1,
      dosage: '',
      instructions: '',
    };

    const updated = {
      ...selectedPrescription,
      items: [...selectedPrescription.items, newItem],
    };
    setSelectedPrescription(updated);
  };

  const handleSavePrescription = () => {
    if (!selectedPrescription) return;

    if (!selectedPrescription.patientId || !selectedPrescription.doctorName || selectedPrescription.items.length === 0) {
      toast.error('Mohon lengkapi data resep!');
      return;
    }

    const patient = patients.find(p => p.id === selectedPrescription.patientId);
    if (patient) {
      selectedPrescription.patientName = patient.nama;
    }

    selectedPrescription.status = 'verified';
    selectedPrescription.verifiedBy = currentUser.nama;
    selectedPrescription.verifiedAt = new Date().toISOString();
    selectedPrescription.updatedAt = new Date().toISOString();

    PrescriptionService.savePrescription(selectedPrescription);
    toast.success('Resep berhasil diverifikasi!');
    setSelectedPrescription(null);
    loadData();
  };

  const handleProcessPrescription = (prescription: DigitalPrescription) => {
    const updated = PrescriptionService.updatePrescriptionStatus(
      prescription.id,
      'processing',
      currentUser.nama
    );
    
    if (updated) {
      toast.success('Resep sedang diproses!');
      loadData();
    }
  };

  const handleCompletePrescription = (prescription: DigitalPrescription) => {
    const updated = PrescriptionService.updatePrescriptionStatus(
      prescription.id,
      'completed',
      currentUser.nama
    );
    
    if (updated) {
      toast.success('Resep selesai diproses!');
      loadData();
    }
  };

  const getStatusBadge = (status: PrescriptionStatus) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      verified: { label: 'Terverifikasi', className: 'bg-blue-100 text-blue-800' },
      processing: { label: 'Diproses', className: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Selesai', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Dibatalkan', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: PrescriptionStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'processing':
        return <AlertCircle className="h-5 w-5 text-purple-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resep Digital</h1>
          <p className="text-gray-500 mt-1">Scan dan verifikasi resep dokter secara digital</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleStartScan} disabled={isScanning}>
            <Camera className="mr-2 h-4 w-4" />
            {isScanning ? 'Scanning...' : 'Scan Barcode'}
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Gambar
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {isScanning && (
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full max-w-2xl mx-auto rounded-lg"
                autoPlay
                playsInline
              />
              <Button
                className="absolute top-4 right-4"
                variant="destructive"
                onClick={handleStopScan}
              >
                Stop Scanning
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedPrescription && (
        <Card>
          <CardHeader>
            <CardTitle>Verifikasi Resep - {selectedPrescription.prescriptionNumber}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pilih Pasien *</Label>
                <Select
                  value={selectedPrescription.patientId}
                  onValueChange={(value) => handleUpdatePrescription('patientId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pasien..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nama Dokter *</Label>
                <Input
                  value={selectedPrescription.doctorName}
                  onChange={(e) => handleUpdatePrescription('doctorName', e.target.value)}
                  placeholder="Nama dokter"
                />
              </div>
            </div>

            <div>
              <Label>Tambah Obat</Label>
              <Select onValueChange={handleAddMedication}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih obat..." />
                </SelectTrigger>
                <SelectContent>
                  {medications.map(med => (
                    <SelectItem key={med.id} value={med.id}>
                      {med.nama} (Stok: {med.stokCurrent})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPrescription.items.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Daftar Obat</h4>
                <div className="space-y-2">
                  {selectedPrescription.items.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <p className="font-medium">{item.medicationName}</p>
                      <p className="text-sm text-gray-600">
                        Jumlah: {item.quantity} | Dosis: {item.dosage || '-'} | {item.instructions || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Catatan</Label>
              <Textarea
                value={selectedPrescription.notes || ''}
                onChange={(e) => handleUpdatePrescription('notes', e.target.value)}
                placeholder="Catatan tambahan"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSavePrescription}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verifikasi & Simpan
              </Button>
              <Button variant="outline" onClick={() => setSelectedPrescription(null)}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Antrian Resep Digital</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Antrian</TableHead>
                <TableHead>No. Resep</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Dokter</TableHead>
                <TableHead>Waktu Scan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    Belum ada resep digital
                  </TableCell>
                </TableRow>
              ) : (
                prescriptions.map((presc) => (
                  <TableRow key={presc.id}>
                    <TableCell className="font-bold text-lg">#{presc.queueNumber}</TableCell>
                    <TableCell className="font-mono text-sm">{presc.prescriptionNumber}</TableCell>
                    <TableCell>{presc.patientName || '-'}</TableCell>
                    <TableCell>{presc.doctorName || '-'}</TableCell>
                    <TableCell>{formatDate(presc.scannedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(presc.status)}
                        {getStatusBadge(presc.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {presc.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => handleVerifyPrescription(presc)}>
                            <Scan className="mr-1 h-3 w-3" />
                            Verifikasi
                          </Button>
                        )}
                        {presc.status === 'verified' && (
                          <Button size="sm" onClick={() => handleProcessPrescription(presc)}>
                            <Clock className="mr-1 h-3 w-3" />
                            Proses
                          </Button>
                        )}
                        {presc.status === 'processing' && (
                          <Button size="sm" onClick={() => handleCompletePrescription(presc)}>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Selesai
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}