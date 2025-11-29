import { Obat, Transaksi, LogStok, Notifikasi, Settings } from '@/types';
import { storageService } from './storage';

// Format currency
export const formatCurrency = (amount: number): string => {
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
};

// Format date
export const formatDate = (date: string | Date): string => {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
  } catch (error) {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('id-ID');
  }
};

export const formatDateTime = (date: string | Date): string => {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    const dateObj = new Date(date);
    return dateObj.toLocaleString('id-ID');
  }
};

export const formatDateShort = (date: string | Date): string => {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  } catch (error) {
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }
};

// Check if obat is expired
export const isExpired = (tanggalKadaluarsa: string): boolean => {
  return new Date(tanggalKadaluarsa) < new Date();
};

// Check if obat is near expiry
export const isNearExpiry = (tanggalKadaluarsa: string, daysBeforeExpiry: number = 30): boolean => {
  const expiryDate = new Date(tanggalKadaluarsa);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= daysBeforeExpiry && daysUntilExpiry > 0;
};

// Check if stok is low
export const isStokLow = (obat: Obat): boolean => {
  return obat.stokCurrent <= obat.stokMinimum;
};

// Generate notifications
export const checkAndGenerateNotifications = (): void => {
  const obatList = storageService.getObat();
  const settings = storageService.getSettings();
  const notifikasi: Notifikasi[] = storageService.getNotifikasi();
  
  const today = new Date().toISOString().split('T')[0];
  
  // Clear old notifications for today
  const filteredNotifikasi = notifikasi.filter(n => 
    !n.tanggal.startsWith(today) || n.isRead
  );

  obatList.forEach(obat => {
    // Check stok menipis
    if (settings?.notifikasiStokMinimum && isStokLow(obat)) {
      filteredNotifikasi.push({
        id: `notif-stok-${obat.id}-${Date.now()}`,
        tipe: 'stok_menipis',
        judul: 'Stok Menipis',
        pesan: `Obat ${obat.nama} stok tersisa ${obat.stokCurrent} ${obat.satuan} (minimum: ${obat.stokMinimum})`,
        tanggal: new Date().toISOString(),
        isRead: false,
        referensiId: obat.id,
        priority: 'high',
      });
    }

    // Check kadaluarsa
    if (settings?.notifikasiKadaluarsa) {
      if (isExpired(obat.tanggalKadaluarsa)) {
        filteredNotifikasi.push({
          id: `notif-expired-${obat.id}-${Date.now()}`,
          tipe: 'kadaluarsa',
          judul: 'Obat Kadaluarsa',
          pesan: `Obat ${obat.nama} telah kadaluarsa pada ${formatDate(obat.tanggalKadaluarsa)}`,
          tanggal: new Date().toISOString(),
          isRead: false,
          referensiId: obat.id,
          priority: 'high',
        });
      } else if (isNearExpiry(obat.tanggalKadaluarsa, settings.hariSebelumKadaluarsa)) {
        const daysLeft = Math.ceil((new Date(obat.tanggalKadaluarsa).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        filteredNotifikasi.push({
          id: `notif-nearexpiry-${obat.id}-${Date.now()}`,
          tipe: 'kadaluarsa',
          judul: 'Obat Mendekati Kadaluarsa',
          pesan: `Obat ${obat.nama} akan kadaluarsa dalam ${daysLeft} hari (${formatDate(obat.tanggalKadaluarsa)})`,
          tanggal: new Date().toISOString(),
          isRead: false,
          referensiId: obat.id,
          priority: 'medium',
        });
      }
    }
  });

  storageService.saveNotifikasi(filteredNotifikasi);
};

// Calculate total penjualan for a period
export const calculatePenjualan = (transaksiList: Transaksi[], startDate: Date, endDate: Date) => {
  const filtered = transaksiList.filter(t => {
    const transaksiDate = new Date(t.tanggal);
    return transaksiDate >= startDate && transaksiDate <= endDate;
  });

  const totalTransaksi = filtered.length;
  const totalPenjualan = filtered.reduce((sum, t) => sum + t.total, 0);
  const totalDiskon = filtered.reduce((sum, t) => sum + t.diskon, 0);
  const totalPajak = filtered.reduce((sum, t) => sum + t.pajak, 0);

  return {
    totalTransaksi,
    totalPenjualan,
    totalDiskon,
    totalPajak,
    netPenjualan: totalPenjualan - totalDiskon,
  };
};

// Get obat terlaris
export const getObatTerlaris = (transaksiList: Transaksi[], limit: number = 10) => {
  const obatMap = new Map<string, { nama: string; jumlah: number; pendapatan: number }>();

  transaksiList.forEach(transaksi => {
    transaksi.items.forEach(item => {
      const existing = obatMap.get(item.obatId) || { nama: item.obatNama, jumlah: 0, pendapatan: 0 };
      existing.jumlah += item.jumlah;
      existing.pendapatan += item.subtotal;
      obatMap.set(item.obatId, existing);
    });
  });

  return Array.from(obatMap.entries())
    .map(([id, data]) => ({
      obatId: id,
      obatNama: data.nama,
      jumlahTerjual: data.jumlah,
      totalPendapatan: data.pendapatan,
    }))
    .sort((a, b) => b.jumlahTerjual - a.jumlahTerjual)
    .slice(0, limit);
};

// Log aktivitas user
export const logAktivitas = (userId: string, userName: string, aksi: string, detail: string): void => {
  const logs = storageService.getLogAktivitas();
  logs.push({
    id: `log-${Date.now()}`,
    userId,
    userName,
    aksi,
    detail,
    tanggal: new Date().toISOString(),
  });
  storageService.saveLogAktivitas(logs);
};

// Update stok obat
export const updateStokObat = (
  obatId: string,
  jumlah: number,
  tipe: 'masuk' | 'keluar' | 'transfer' | 'retur',
  keterangan: string,
  userId: string,
  userName: string,
  referensiId?: string
): boolean => {
  const obatList = storageService.getObat();
  const obatIndex = obatList.findIndex(o => o.id === obatId);
  
  if (obatIndex === -1) return false;

  const obat = obatList[obatIndex];
  const stokSebelum = obat.stokCurrent;
  
  if (tipe === 'masuk' || tipe === 'retur') {
    obat.stokCurrent += jumlah;
  } else {
    if (obat.stokCurrent < jumlah) return false;
    obat.stokCurrent -= jumlah;
  }

  obat.updatedAt = new Date().toISOString();
  obatList[obatIndex] = obat;
  storageService.saveObat(obatList);

  // Log stok
  const logs = storageService.getLogStok();
  logs.push({
    id: `logstok-${Date.now()}`,
    obatId: obat.id,
    obatNama: obat.nama,
    tipe,
    jumlah,
    stokSebelum,
    stokSesudah: obat.stokCurrent,
    tanggal: new Date().toISOString(),
    keterangan,
    userId,
    userName,
    referensiId,
  });
  storageService.saveLogStok(logs);

  return true;
};

// Generate ID
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Export data to JSON
export const exportToJSON = (data: unknown, filename: string): void => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Print receipt
export const printReceipt = (transaksi: Transaksi, settings: Settings | null): void => {
  const printWindow = window.open('', '', 'width=300,height=600');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Struk - ${transaksi.nomorTransaksi}</title>
      <style>
        body { font-family: monospace; font-size: 12px; margin: 10px; }
        .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
        .item { display: flex; justify-content: space-between; margin: 5px 0; }
        .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
        .footer { text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h3>${settings?.namaToko || 'Apotek'}</h3>
        <p>${settings?.alamat || ''}</p>
        <p>${settings?.telepon || ''}</p>
        <p>No: ${transaksi.nomorTransaksi}</p>
        <p>${formatDateTime(transaksi.tanggal)}</p>
        <p>Kasir: ${transaksi.kasirNama}</p>
      </div>
      
      ${transaksi.items.map(item => `
        <div class="item">
          <span>${item.obatNama}</span>
        </div>
        <div class="item">
          <span>${item.jumlah} x ${formatCurrency(item.hargaSatuan)}</span>
          <span>${formatCurrency(item.subtotal)}</span>
        </div>
      `).join('')}
      
      <div class="total">
        <div class="item">
          <span>Subtotal:</span>
          <span>${formatCurrency(transaksi.subtotal)}</span>
        </div>
        ${transaksi.diskon > 0 ? `
          <div class="item">
            <span>Diskon (${transaksi.diskonPersen}%):</span>
            <span>-${formatCurrency(transaksi.diskon)}</span>
          </div>
        ` : ''}
        ${transaksi.pajak > 0 ? `
          <div class="item">
            <span>Pajak (${transaksi.pajakPersen}%):</span>
            <span>${formatCurrency(transaksi.pajak)}</span>
          </div>
        ` : ''}
        <div class="item">
          <span>TOTAL:</span>
          <span>${formatCurrency(transaksi.total)}</span>
        </div>
        <div class="item">
          <span>Bayar (${transaksi.metodePembayaran}):</span>
          <span>${formatCurrency(transaksi.jumlahBayar)}</span>
        </div>
        <div class="item">
          <span>Kembalian:</span>
          <span>${formatCurrency(transaksi.kembalian)}</span>
        </div>
      </div>
      
      <div class="footer">
        <p>Terima Kasih</p>
        <p>Semoga Lekas Sembuh</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};