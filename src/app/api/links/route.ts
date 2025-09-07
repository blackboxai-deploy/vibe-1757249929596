import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { z } from 'zod';

const createLinkSchema = z.object({
  alias: z.string().min(1, 'Alias is required').max(50, 'Alias must be less than 50 characters'),
  original_url: z.string().url('Please enter a valid URL'),
  description: z.string().optional(),
  expires_at: z.string().datetime().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createLinkSchema.parse(body);
    
    const db = getDatabase();
    
    // Check if alias already exists
    const existingLink = db.getLinkByAlias(validatedData.alias);
    if (existingLink) {
      return NextResponse.json(
        { error: 'Alias already exists. Please choose a different one.' },
        { status: 400 }
      );
    }
    
    // Create new tracking link
    const link = db.createLink(
      validatedData.alias,
      validatedData.original_url,
      validatedData.description,
      validatedData.expires_at ? new Date(validatedData.expires_at) : undefined
    );
    
    return NextResponse.json({
      success: true,
      link,
      trackingUrl: `http://localhost:3000/link/${link.alias}`
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alias = searchParams.get('alias');
    
    const db = getDatabase();
    
    // Clean up expired links
    db.cleanupExpiredLinks();
    
    if (alias) {
      // Get specific link by alias
      const link = db.getLinkByAlias(alias);
      if (!link) {
        return NextResponse.json(
          { error: 'Link not found' },
          { status: 404 }
        );
      }
      
      const stats = db.getClickStats(link.id);
      return NextResponse.json({
        success: true,
        link: {
          ...link,
          trackingUrl: `http://localhost:3000/link/${link.alias}`,
          totalClicks: stats.totalClicks,
          uniqueVisitors: stats.uniqueVisitors
        }
      });
    }
    
    // Get all active links
    const links = db.getAllLinks();
    
    // Add tracking URLs and statistics
    const linksWithStats = links.map(link => {
      const stats = db.getClickStats(link.id);
      return {
        ...link,
        trackingUrl: `http://localhost:3000/link/${link.alias}`,
        totalClicks: stats.totalClicks,
        uniqueVisitors: stats.uniqueVisitors
      };
    });
    
    return NextResponse.json({
      success: true,
      links: linksWithStats
    });
    
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}