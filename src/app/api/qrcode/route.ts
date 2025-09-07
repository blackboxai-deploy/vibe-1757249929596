import { NextRequest, NextResponse } from 'next/server';
import { generateQRCodeBuffer, generateQRCode } from '@/lib/utils/qrcode';
import { z } from 'zod';

const qrCodeSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  format: z.enum(['png', 'svg', 'dataurl']).optional().default('png'),
  size: z.number().min(100).max(1000).optional().default(256),
  margin: z.number().min(0).max(10).optional().default(2)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = qrCodeSchema.parse(body);
    
    const options = {
      width: validatedData.size,
      margin: validatedData.margin,
      errorCorrectionLevel: 'M' as const,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    if (validatedData.format === 'dataurl') {
      // Return data URL for direct use in img src
      const dataUrl = await generateQRCode(validatedData.url, options);
      
      return NextResponse.json({
        success: true,
        qrCode: dataUrl,
        format: 'dataurl'
      });
    }
    
    if (validatedData.format === 'png') {
      // Return PNG buffer
      const buffer = await generateQRCodeBuffer(validatedData.url, options);
      
      return new NextResponse(buffer as any, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': buffer.length.toString(),
          'Content-Disposition': 'inline; filename="qrcode.png"'
        }
      });
    }
    
    // SVG format is not supported in this simplified version
    return NextResponse.json(
      { error: 'SVG format not supported in this endpoint' },
      { status: 400 }
    );
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const format = searchParams.get('format') || 'png';
  const size = parseInt(searchParams.get('size') || '256');
  const margin = parseInt(searchParams.get('margin') || '2');
  
  try {
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }
    
    const validatedData = qrCodeSchema.parse({
      url,
      format,
      size,
      margin
    });
    
    const options = {
      width: validatedData.size,
      margin: validatedData.margin,
      errorCorrectionLevel: 'M' as const,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    if (format === 'dataurl') {
      const dataUrl = await generateQRCode(url, options);
      return NextResponse.json({
        success: true,
        qrCode: dataUrl,
        format: 'dataurl'
      });
    }
    
    if (format === 'png') {
      const buffer = await generateQRCodeBuffer(url, options);
      
      return new NextResponse(buffer as any, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': buffer.length.toString(),
          'Content-Disposition': 'inline; filename="qrcode.png"'
        }
      });
    }
    
    return NextResponse.json(
      { error: 'Unsupported format' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}