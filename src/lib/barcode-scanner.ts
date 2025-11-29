// Barcode scanner utility for prescription scanning
export class BarcodeScanner {
  private static instance: BarcodeScanner;
  private scanning: boolean = false;
  private buffer: string = '';
  private timeout: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): BarcodeScanner {
    if (!BarcodeScanner.instance) {
      BarcodeScanner.instance = new BarcodeScanner();
    }
    return BarcodeScanner.instance;
  }

  startScanning(onScan: (barcode: string) => void): void {
    if (this.scanning) return;
    
    this.scanning = true;
    this.buffer = '';

    const handleKeyPress = (event: KeyboardEvent) => {
      // Clear previous timeout
      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      // Enter key indicates end of barcode scan
      if (event.key === 'Enter') {
        if (this.buffer.length > 0) {
          onScan(this.buffer);
          this.buffer = '';
        }
        return;
      }

      // Add character to buffer
      if (event.key.length === 1) {
        this.buffer += event.key;
      }

      // Auto-clear buffer after 100ms of no input (typical for barcode scanners)
      this.timeout = setTimeout(() => {
        if (this.buffer.length > 0) {
          onScan(this.buffer);
          this.buffer = '';
        }
      }, 100);
    };

    document.addEventListener('keypress', handleKeyPress);
  }

  stopScanning(): void {
    this.scanning = false;
    this.buffer = '';
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  // Simulate barcode scan for testing
  simulateScan(barcode: string, onScan: (barcode: string) => void): void {
    setTimeout(() => {
      onScan(barcode);
    }, 100);
  }

  // Parse prescription barcode data
  static parsePrescriptionBarcode(barcode: string): {
    prescriptionNumber: string;
    doctorLicense: string;
    date: string;
  } | null {
    try {
      // Expected format: RX-{prescriptionNumber}-{doctorLicense}-{date}
      const parts = barcode.split('-');
      if (parts.length >= 4 && parts[0] === 'RX') {
        return {
          prescriptionNumber: parts[1],
          doctorLicense: parts[2],
          date: parts[3],
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing barcode:', error);
      return null;
    }
  }
}