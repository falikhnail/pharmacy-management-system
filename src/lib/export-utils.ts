import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to CSV format
 */
export function exportToCSV(data: Record<string, string | number>[], filename: string): void {
  try {
    if (!data || data.length === 0) {
      console.error('No data to export');
      throw new Error('No data to export');
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
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
}

/**
 * Export data to Excel format (using TSV for better compatibility)
 */
export function exportToExcel(data: Record<string, string | number>[], filename: string): void {
  try {
    if (!data || data.length === 0) {
      console.error('No data to export');
      throw new Error('No data to export');
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

    // Create blob and download with proper Excel MIME type
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
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
}

/**
 * Export data to PDF format using jsPDF and autoTable
 */
export function exportToPDF(data: Record<string, string | number>[], title: string, filename: string): void {
  try {
    if (!data || data.length === 0) {
      console.error('No data to export');
      throw new Error('No data to export');
    }

    console.log('Starting PDF export...', { dataLength: data.length, title, filename });

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

    // Get table data and ensure all values are strings
    const tableData = data.map(row => 
      Object.values(row).map(val => {
        if (val === null || val === undefined) return '';
        return String(val);
      })
    );

    console.log('Table data prepared:', { headers, rowCount: tableData.length });

    // Add table using autoTable
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 28,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        cellWidth: 'auto'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 28, left: 14, right: 14 },
      didDrawPage: function(hookData: { pageNumber: number }) {
        // Footer with page numbers
        const pageCount = doc.getNumberOfPages();
        const pageNumber = hookData.pageNumber;
        doc.setFontSize(8);
        doc.text(
          `Halaman ${pageNumber} dari ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
    });

    console.log('PDF generated successfully, saving...');

    // Save the PDF
    doc.save(`${filename}.pdf`);
    
    console.log('PDF saved successfully');
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
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