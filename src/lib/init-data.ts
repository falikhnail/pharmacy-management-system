import { User, Obat, Supplier } from '@/types';
import { storageService } from './storage';
import { getDefaultPermissions } from './permissions';

/**
 * Initialize default data for the application
 */
export function initializeDefaultData(): void {
  // Check if data already exists
  const existingUsers = storageService.getUsers();
  if (existingUsers.length > 0) {
    // Update existing users with permissions if they don't have them
    const updatedUsers = existingUsers.map(user => {
      if (!user.permissions) {
        return {
          ...user,
          permissions: getDefaultPermissions(user.role),
          updatedAt: new Date().toISOString(),
        };
      }
      return user;
    });
    
    // Check if any user was updated
    const hasUpdates = updatedUsers.some((user, index) => 
      JSON.stringify(user) !== JSON.stringify(existingUsers[index])
    );
    
    if (hasUpdates) {
      storageService.saveUsers(updatedUsers);
      console.log('Updated existing users with permissions');
    }
    
    return; // Data already initialized
  }

  // Initialize default users with permissions
  const defaultUsers: User[] = [
    {
      id: 'user-1',
      username: 'admin',
      password: 'admin123',
      nama: 'Administrator',
      email: 'admin@apotek.com',
      telepon: '081234567890',
      role: 'admin',
      isActive: true,
      permissions: getDefaultPermissions('admin'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-2',
      username: 'apoteker',
      password: 'apoteker123',
      nama: 'Apoteker',
      email: 'apoteker@apotek.com',
      telepon: '081234567891',
      role: 'apoteker',
      isActive: true,
      permissions: getDefaultPermissions('apoteker'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-3',
      username: 'kasir',
      password: 'kasir123',
      nama: 'Kasir',
      email: 'kasir@apotek.com',
      telepon: '081234567892',
      role: 'kasir',
      isActive: true,
      permissions: getDefaultPermissions('kasir'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  storageService.saveUsers(defaultUsers);

  // Initialize sample medications
  const sampleObat: Obat[] = [
    {
      id: 'obat-1',
      nama: 'Paracetamol 500mg',
      kategori: 'analgesik',
      bentuk: 'tablet',
      satuan: 'tablet',
      nomorBatch: 'BATCH001',
      nomorRegistrasi: 'REG001',
      tanggalKadaluarsa: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      barcode: '8991234567890',
      stokMinimum: 20,
      stokCurrent: 100,
      hargaBeli: 500,
      hargaJual: 1000,
      deskripsi: 'Obat pereda nyeri dan penurun demam',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'obat-2',
      nama: 'Amoxicillin 500mg',
      kategori: 'antibiotik',
      bentuk: 'kapsul',
      satuan: 'kapsul',
      nomorBatch: 'BATCH002',
      nomorRegistrasi: 'REG002',
      tanggalKadaluarsa: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      barcode: '8991234567891',
      stokMinimum: 15,
      stokCurrent: 50,
      hargaBeli: 1500,
      hargaJual: 3000,
      deskripsi: 'Antibiotik untuk infeksi bakteri',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  storageService.saveObat(sampleObat);

  // Initialize sample suppliers
  const sampleSuppliers: Supplier[] = [
    {
      id: 'supplier-1',
      nama: 'PT Kimia Farma',
      alamat: 'Jakarta Pusat',
      telepon: '021-1234567',
      email: 'kimiafarma@example.com',
      kontakPerson: 'Budi Santoso',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'supplier-2',
      nama: 'PT Kalbe Farma',
      alamat: 'Bekasi',
      telepon: '021-7654321',
      email: 'kalbe@example.com',
      kontakPerson: 'Siti Rahayu',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  storageService.saveSupplier(sampleSuppliers);

  console.log('Default data initialized successfully with permissions');
}