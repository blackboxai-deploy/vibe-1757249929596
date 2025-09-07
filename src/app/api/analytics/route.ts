import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');
    const days = parseInt(searchParams.get('days') || '30');
    
    const db = getDatabase();
    
    // Get overall statistics
    const stats = db.getClickStats(linkId || undefined);
    
    // Get visitors for date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const visitors = linkId 
      ? db.getVisitorsByLinkId(linkId)
      : db.getVisitorsByDateRange(startDate, endDate);
    
    // Calculate daily visits
    const dailyVisits = visitors.reduce((acc: Record<string, number>, visitor) => {
      const date = new Date(visitor.visited_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate device stats
    const deviceStats = visitors.reduce((acc: Record<string, number>, visitor) => {
      const device = visitor.device || 'Unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate browser stats
    const browserStats = visitors.reduce((acc: Record<string, number>, visitor) => {
      const browser = visitor.browser || 'Unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});
    
    // Get top cities
    const cityStats = visitors
      .filter(v => v.city)
      .reduce((acc: Record<string, number>, visitor) => {
        const city = visitor.city!;
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {});
    
    const topCities = Object.entries(cityStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));
    
    // Get visitor coordinates for map
    const visitorCoordinates = visitors
      .filter(v => v.latitude && v.longitude)
      .map(v => ({
        id: v.id,
        lat: v.latitude!,
        lng: v.longitude!,
        country: v.country,
        city: v.city,
        timestamp: v.visited_at,
        device: v.device,
        browser: v.browser
      }));
    
    // Calculate hourly distribution
    const hourlyStats = visitors.reduce((acc: Record<string, number>, visitor) => {
      const hour = new Date(visitor.visited_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    
    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalClicks: stats.totalClicks,
          uniqueVisitors: stats.uniqueVisitors,
          countries: stats.countries.length,
          avgClicksPerDay: Math.round(stats.totalClicks / days)
        },
        timeline: {
          dailyVisits,
          hourlyStats
        },
        demographics: {
          countries: stats.countries,
          topCities,
          devices: Object.entries(deviceStats).map(([device, count]) => ({ device, count })),
          browsers: Object.entries(browserStats).map(([browser, count]) => ({ browser, count }))
        },
        geography: {
          visitors: visitorCoordinates
        },
        recentActivity: stats.recentVisits.slice(0, 20)
      }
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}