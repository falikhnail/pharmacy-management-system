import { DigitalPrescription, PrescriptionMedication, PrescriptionStatus, QueueItem } from '../types/prescription';

// Mock medication database for verification
const medicationDatabase = [
  { id: '1', name: 'Paracetamol 500mg', available: true, stock: 500, price: 5000 },
  { id: '2', name: 'Amoxicillin 500mg', available: true, stock: 300, price: 15000 },
  { id: '3', name: 'Ibuprofen 400mg', available: true, stock: 200, price: 8000 },
  { id: '4', name: 'Omeprazole 20mg', available: true, stock: 150, price: 12000 },
  { id: '5', name: 'Metformin 500mg', available: true, stock: 250, price: 10000 },
  { id: '6', name: 'Amlodipine 5mg', available: true, stock: 180, price: 18000 },
  { id: '7', name: 'Cetirizine 10mg', available: true, stock: 400, price: 6000 },
  { id: '8', name: 'Simvastatin 20mg', available: true, stock: 120, price: 20000 },
];

export class PrescriptionService {
  private static prescriptions: DigitalPrescription[] = [];
  private static queue: QueueItem[] = [];
  private static queueCounter = 1;

  // Verify prescription medications against database
  static async verifyPrescription(medications: PrescriptionMedication[]): Promise<{
    verified: boolean;
    medications: PrescriptionMedication[];
    issues: string[];
  }> {
    const issues: string[] = [];
    const verifiedMedications = medications.map(med => {
      const dbMed = medicationDatabase.find(
        m => m.name.toLowerCase().includes(med.medicationName.toLowerCase())
      );

      if (!dbMed) {
        issues.push(`Medication "${med.medicationName}" not found in database`);
        return { ...med, verified: false, available: false };
      }

      if (dbMed.stock < med.quantity) {
        issues.push(`Insufficient stock for "${med.medicationName}". Available: ${dbMed.stock}, Required: ${med.quantity}`);
        return { ...med, verified: true, available: false, price: dbMed.price };
      }

      return { 
        ...med, 
        medicationId: dbMed.id,
        verified: true, 
        available: true,
        price: dbMed.price 
      };
    });

    return {
      verified: issues.length === 0,
      medications: verifiedMedications,
      issues,
    };
  }

  // Create new prescription from barcode
  static async createPrescriptionFromBarcode(
    barcodeData: string,
    patientName: string,
    doctorName: string,
    medications: Omit<PrescriptionMedication, 'id' | 'verified' | 'available' | 'price'>[]
  ): Promise<DigitalPrescription> {
    const prescriptionId = `PRESC-${Date.now()}`;
    const now = new Date().toISOString();

    // Verify medications
    const verification = await this.verifyPrescription(
      medications.map(m => ({ ...m, id: '', verified: false, available: false, price: 0 }))
    );

    const prescription: DigitalPrescription = {
      id: prescriptionId,
      prescriptionNumber: barcodeData.split('-')[1] || barcodeData,
      barcodeData,
      patientId: `PAT-${Date.now()}`,
      patientName,
      doctorName,
      doctorLicense: barcodeData.split('-')[2] || 'UNKNOWN',
      date: barcodeData.split('-')[3] || new Date().toISOString().split('T')[0],
      status: 'pending',
      queueNumber: this.queueCounter++,
      medications: verification.medications.map((m, idx) => ({
        ...m,
        id: `MED-${idx + 1}`,
      })),
      createdAt: now,
      updatedAt: now,
    };

    this.prescriptions.push(prescription);
    this.addToQueue(prescription);

    return prescription;
  }

  // Add prescription to queue
  static addToQueue(prescription: DigitalPrescription): void {
    const queueItem: QueueItem = {
      id: `QUEUE-${Date.now()}`,
      queueNumber: prescription.queueNumber,
      prescriptionId: prescription.id,
      patientName: prescription.patientName,
      status: prescription.status,
      estimatedTime: this.calculateEstimatedTime(prescription.queueNumber),
      createdAt: prescription.createdAt,
    };

    this.queue.push(queueItem);
  }

  // Calculate estimated waiting time
  static calculateEstimatedTime(queueNumber: number): string {
    const averageProcessingTime = 10; // minutes per prescription
    const waitingTime = (queueNumber - 1) * averageProcessingTime;
    
    if (waitingTime === 0) return 'Processing now';
    if (waitingTime < 60) return `${waitingTime} minutes`;
    
    const hours = Math.floor(waitingTime / 60);
    const minutes = waitingTime % 60;
    return `${hours}h ${minutes}m`;
  }

  // Update prescription status
  static updatePrescriptionStatus(
    prescriptionId: string,
    status: PrescriptionStatus,
    verifiedBy?: string
  ): DigitalPrescription | null {
    const prescription = this.prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return null;

    prescription.status = status;
    prescription.updatedAt = new Date().toISOString();

    if (status === 'processing' && verifiedBy) {
      prescription.verifiedBy = verifiedBy;
      prescription.verifiedAt = new Date().toISOString();
    }

    if (status === 'completed') {
      prescription.completedAt = new Date().toISOString();
    }

    // Update queue
    const queueItem = this.queue.find(q => q.prescriptionId === prescriptionId);
    if (queueItem) {
      queueItem.status = status;
    }

    return prescription;
  }

  // Get all prescriptions
  static getAllPrescriptions(): DigitalPrescription[] {
    return [...this.prescriptions].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Get prescription by ID
  static getPrescriptionById(id: string): DigitalPrescription | null {
    return this.prescriptions.find(p => p.id === id) || null;
  }

  // Get queue
  static getQueue(): QueueItem[] {
    return [...this.queue]
      .filter(q => q.status !== 'completed' && q.status !== 'cancelled')
      .sort((a, b) => a.queueNumber - b.queueNumber);
  }

  // Get prescriptions by status
  static getPrescriptionsByStatus(status: PrescriptionStatus): DigitalPrescription[] {
    return this.prescriptions.filter(p => p.status === status);
  }

  // Search prescriptions
  static searchPrescriptions(query: string): DigitalPrescription[] {
    const lowerQuery = query.toLowerCase();
    return this.prescriptions.filter(p =>
      p.prescriptionNumber.toLowerCase().includes(lowerQuery) ||
      p.patientName.toLowerCase().includes(lowerQuery) ||
      p.doctorName.toLowerCase().includes(lowerQuery)
    );
  }

  // Get medication database
  static getMedicationDatabase() {
    return medicationDatabase;
  }
}