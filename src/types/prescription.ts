export type PrescriptionStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface DigitalPrescription {
  id: string;
  prescriptionNumber: string;
  barcodeData: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorLicense: string;
  date: string;
  status: PrescriptionStatus;
  queueNumber: number;
  medications: PrescriptionMedication[];
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionMedication {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  quantity: number;
  frequency: string;
  duration: string;
  instructions: string;
  verified: boolean;
  available: boolean;
  price: number;
}

export interface QueueItem {
  id: string;
  queueNumber: number;
  prescriptionId: string;
  patientName: string;
  status: PrescriptionStatus;
  estimatedTime: string;
  createdAt: string;
}