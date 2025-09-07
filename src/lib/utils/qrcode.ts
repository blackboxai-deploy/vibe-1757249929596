import QRCode from 'qrcode';
import { Buffer } from 'node:buffer';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

// Generate QR code as data URL
export async function generateQRCode(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as const
  };

  const qrOptions = { ...defaultOptions, ...options };
  
  try {
    const dataUrl = await QRCode.toDataURL(text, qrOptions);
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Generate QR code as SVG string
export async function generateQRCodeSVG(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as const
  };

  const qrOptions = { ...defaultOptions, ...options };
  
  try {
    const svg = await QRCode.toString(text, { 
      ...qrOptions,
      type: 'svg'
    });
    return svg;
  } catch (error) {
    console.error('Failed to generate QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
}

// Generate QR code as buffer (for server-side use)
export async function generateQRCodeBuffer(
  text: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const defaultOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as const
  };

  const qrOptions = { ...defaultOptions, ...options };
  
  try {
    const buffer = await QRCode.toBuffer(text, qrOptions);
    return buffer;
  } catch (error) {
    console.error('Failed to generate QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
}

// Validate URL for QR code generation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Generate tracking URL for QR code
export function generateTrackingUrl(baseUrl: string, alias: string): string {
  // Remove trailing slash from baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}/link/${alias}`;
}

// Get QR code download filename
export function getQRCodeFilename(alias: string, format: 'png' | 'svg' = 'png'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `qr-${alias}-${timestamp}.${format}`;
}