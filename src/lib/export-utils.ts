import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      head?: string[][];
      body?: (string | number)[][];
      startY?: number;
      styles?: {
        fontSize?: number;
        cellPadding?: number;
      };
      headStyles?: {
        fillColor?: number[];
        textColor?: number;
        fontStyle?: string;
      };
      alternateRowStyles?: {
        fillColor?: number[];
      };
      margin?: { top?: number; left?: number; right?: number };
      theme?: string;
    }) => jsPDF;
  }
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: Record<string, string | number>[], filename: string): void {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to Excel format (using CSV with .xlsx extension for simplicity)
 * For a more robust solution, consider using libraries like xlsx or exceljs
 */
export function exportToExcel(data: Record<string, string | number>[], filename: string): void {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create tab-separated content for better Excel compatibility
  const tsvContent = [
    headers.join('\t'), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values with special characters
        if (typeof value === 'string' && (value.includes('\t') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join('\t')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob(['\ufeff' + tsvContent], { 
    type: 'application/vnd.ms-excel;charset=utf-8;' 
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to PDF format using jsPDF and autoTable
 */
export function exportToPDF(data: Record<string, string | number>[], title: string, filename: string): void {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 15);

  // Add date
  doc.setFontSize(10);
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Tanggal: ${currentDate}`, 14, 22);

  // Get headers and format them
  const headers = Object.keys(data[0]).map(key => 
    key.replace(/_/g, ' ').toUpperCase()
  );

  // Get table data
  const tableData = data.map(row => Object.values(row).map(val => String(val)));

  // Add table using autoTable
  doc.autoTable({
    head: [headers],
    body: tableData,
    startY: 28,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 28, left: 14, right: 14 },
  });

  // Add footer with page numbers
  const pageCount = (doc as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`${filename}.pdf`);
}

/**
 * Format currency for Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indonesian format
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate summary statistics from data
 */
export function generateSummary(data: Record<string, string | number>[], numericFields: string[]): Record<string, number> {
  const summary: Record<string, number> = {
    totalRecords: data.length,
  };

  numericFields.forEach(field => {
    const values = data.map(row => parseFloat(String(row[field])) || 0);
    summary[`${field}_total`] = values.reduce((a, b) => a + b, 0);
    summary[`${field}_average`] = summary[`${field}_total`] / data.length;
    summary[`${field}_min`] = Math.min(...values);
    summary[`${field}_max`] = Math.max(...values);
  });

  return summary;
}