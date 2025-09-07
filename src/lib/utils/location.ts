// IP Geolocation utility functions
export interface LocationData {
  latitude?: number;
  longitude?: number;
  country?: string;
  city?: string;
  ip?: string;
}

export interface DeviceInfo {
  device?: string;
  browser?: string;
  userAgent?: string;
}

// Get IP address from request headers
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddress = request.headers.get('remote-addr');
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (remoteAddress) {
    return remoteAddress;
  }
  
  return 'unknown';
}

// Get location data from IP address using ipapi.co (free tier: 30,000 requests/month)
export async function getLocationFromIP(ip: string): Promise<LocationData> {
  try {
    // Skip localhost and private IPs
    if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return {
        ip,
        country: 'Local',
        city: 'Local Development',
        latitude: 0,
        longitude: 0
      };
    }

    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'TrackingLinkApp/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      ip,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      country: data.country_name || undefined,
      city: data.city || undefined
    };
  } catch (error) {
    console.error('Failed to get location from IP:', error);
    return {
      ip,
      country: 'Unknown',
      city: 'Unknown'
    };
  }
}

// Parse user agent to extract device and browser info
export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let device = 'Desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'Tablet';
  }
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  }
  
  return {
    device,
    browser,
    userAgent
  };
}

// Validate coordinates
export function isValidCoordinates(lat?: number, lon?: number): boolean {
  if (lat === undefined || lon === undefined) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// Calculate distance between two points (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

// Format location display string
export function formatLocationString(country?: string, city?: string): string {
  if (country && city) {
    return `${city}, ${country}`;
  } else if (country) {
    return country;
  } else if (city) {
    return city;
  }
  return 'Unknown Location';
}