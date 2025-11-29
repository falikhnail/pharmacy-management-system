// Barcode generator utilities

export const generateBarcode = (prefix: string = 'OBT'): string => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
};

export const generateNomorTransaksi = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TRX${year}${month}${day}${random}`;
};

export const generateNomorResep = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RSP${year}${month}${day}${random}`;
};

export const generateNomorReturn = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RTN${year}${month}${day}${random}`;
};

export const generateNomorInvoice = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV${year}${month}${day}${random}`;
};

export const validateBarcode = (barcode: string): boolean => {
  return /^[A-Z]{3}\d{12}$/.test(barcode);
};

// Generate barcode SVG for display
export const generateBarcodeSVG = (barcode: string): string => {
  const width = 200;
  const height = 80;
  const barWidth = 2;
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  
  let x = 10;
  for (let i = 0; i < barcode.length; i++) {
    const char = barcode[i];
    const isDigit = !isNaN(parseInt(char));
    const barHeight = isDigit ? 50 : 40;
    
    svg += `<rect x="${x}" y="10" width="${barWidth}" height="${barHeight}" fill="black"/>`;
    x += barWidth + 1;
  }
  
  svg += `<text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-family="monospace" font-size="12">${barcode}</text>`;
  svg += `</svg>`;
  
  return svg;
};