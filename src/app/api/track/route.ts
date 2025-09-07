import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { getClientIP, getLocationFromIP, parseUserAgent } from '@/lib/utils/location';
import { z } from 'zod';

const trackVisitorSchema = z.object({
  linkId: z.string().min(1, 'Link ID is required'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().optional(),
  gpsEnabled: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = trackVisitorSchema.parse(body);
    
    const db = getDatabase();
    
    // Verify link exists and is active
    const link = db.getLinkById(validatedData.linkId);
    if (!link || !link.is_active) {
      return NextResponse.json(
        { error: 'Link not found or inactive' },
        { status: 404 }
      );
    }
    
    // Check if link has expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Link has expired' },
        { status: 410 }
      );
    }
    
    // Get visitor information
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const deviceInfo = parseUserAgent(userAgent);
    
    // Get location from IP if GPS coordinates not provided
    let locationData = {
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      country: undefined as string | undefined,
      city: undefined as string | undefined
    };
    
    // If GPS coordinates not available or not accurate, use IP-based location
    if (!validatedData.latitude || !validatedData.longitude || (validatedData.accuracy && validatedData.accuracy > 1000)) {
      const ipLocation = await getLocationFromIP(ip);
      locationData = {
        latitude: validatedData.latitude || ipLocation.latitude,
        longitude: validatedData.longitude || ipLocation.longitude,
        country: ipLocation.country,
        city: ipLocation.city
      };
    }
    
    // Record visitor data
    const visitor = db.recordVisitor(validatedData.linkId, {
      ip_address: ip,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      country: locationData.country,
      city: locationData.city,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      user_agent: userAgent
    });
    
    // Increment click count
    db.incrementClickCount(validatedData.linkId);
    
    return NextResponse.json({
      success: true,
      visitor: {
        id: visitor.id,
        location: {
          country: visitor.country,
          city: visitor.city,
          coordinates: visitor.latitude && visitor.longitude ? {
            lat: visitor.latitude,
            lng: visitor.longitude
          } : null
        },
        device: visitor.device,
        browser: visitor.browser,
        timestamp: visitor.visited_at
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error tracking visitor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}