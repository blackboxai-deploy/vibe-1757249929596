'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Shield, Clock } from 'lucide-react';

interface LocationState {
  loading: boolean;
  granted: boolean;
  denied: boolean;
  error: string | null;
  coordinates: { lat: number; lng: number } | null;
}

export default function TrackingLinkPage() {
  const params = useParams();
  const alias = params.alias as string;
  
  const [location, setLocation] = useState<LocationState>({
    loading: false,
    granted: false,
    denied: false,
    error: null,
    coordinates: null
  });
  
  const [link, setLink] = useState<any>(null);
  const [redirecting, setRedirecting] = useState(false);
  
  // Get link information
  useEffect(() => {
    async function fetchLink() {
      try {
        const response = await fetch(`/api/links?alias=${alias}`);
        const data = await response.json();
        
        if (data.success && data.link) {
          setLink(data.link);
        }
      } catch (error) {
        console.error('Failed to fetch link:', error);
      }
    }
    
    if (alias) {
      fetchLink();
    }
  }, [alias]);
  
  // Request location permission
  const requestLocation = async () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setLocation(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Geolocation is not supported by this browser' 
      }));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          loading: false,
          granted: true,
          denied: false,
          error: null,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        });
        
        // Track the visit with location
        trackVisit(link?.id, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          gpsEnabled: true
        });
      },
      (error) => {
        setLocation({
          loading: false,
          granted: false,
          denied: true,
          error: error.message,
          coordinates: null
        });
        
        // Track the visit without location
        trackVisit(link?.id, { gpsEnabled: false });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };
  
  // Skip location and redirect
  const skipLocation = () => {
    if (link?.id) {
      trackVisit(link.id, { gpsEnabled: false });
    }
  };
  
  // Track visitor
  const trackVisit = async (linkId: string, locationData: any) => {
    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          linkId,
          ...locationData
        })
      });
      
      if (response.ok) {
        // Redirect to original URL
        setRedirecting(true);
        setTimeout(() => {
          if (link?.original_url) {
            window.location.href = link.original_url;
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to track visit:', error);
      // Still redirect even if tracking fails
      if (link?.original_url) {
        window.location.href = link.original_url;
      }
    }
  };
  
  if (!link) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading link information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Redirecting...</h3>
              <p className="text-muted-foreground mb-4">
                Thank you! You'll be redirected shortly.
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Location Request</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              This link collects location data for analytics purposes. 
              Your privacy is important to us.
            </p>
            
            {link.description && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800">{link.description}</p>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">Privacy Notice</p>
                <p className="text-gray-600 mt-1">
                  Location data is used solely for analytics and is stored securely. 
                  You can proceed without sharing your location.
                </p>
              </div>
            </div>
          </div>
          
          {location.error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-sm text-red-800">{location.error}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={requestLocation} 
              disabled={location.loading}
              className="w-full"
            >
              {location.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Share Location & Continue
            </Button>
            
            <Button 
              onClick={skipLocation} 
              variant="outline" 
              className="w-full"
            >
              Skip & Continue
            </Button>
          </div>
          
          <p className="text-xs text-center text-gray-500">
            Continuing will redirect you to: {new URL(link.original_url).hostname}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}