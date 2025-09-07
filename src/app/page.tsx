'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  Link as LinkIcon, 
  Plus, 
  Copy, 
  QrCode, 
  BarChart3, 
  Globe, 
  Users, 
  MousePointer,
  Calendar,
  TrendingUp
} from 'lucide-react';

const createLinkSchema = z.object({
  alias: z.string().min(1, 'Alias is required').max(50, 'Alias must be less than 50 characters'),
  original_url: z.string().url('Please enter a valid URL'),
  description: z.string().optional()
});

type CreateLinkForm = z.infer<typeof createLinkSchema>;

interface TrackingLink {
  id: string;
  alias: string;
  original_url: string;
  description?: string;
  created_at: string;
  click_count: number;
  is_active: boolean;
  trackingUrl: string;
  totalClicks: number;
  uniqueVisitors: number;
}

export default function Dashboard() {
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  
  const form = useForm<CreateLinkForm>({
    resolver: zodResolver(createLinkSchema),
    defaultValues: {
      alias: '',
      original_url: '',
      description: ''
    }
  });
  
  // Fetch links and analytics
  useEffect(() => {
    fetchLinks();
    fetchAnalytics();
  }, []);
  
  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links');
      const data = await response.json();
      if (data.success) {
        setLinks(data.links);
      }
    } catch (error) {
      console.error('Failed to fetch links:', error);
      toast.error('Failed to load links');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };
  
  const onSubmit = async (data: CreateLinkForm) => {
    setCreating(true);
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Tracking link created successfully!');
        form.reset();
        fetchLinks();
        fetchAnalytics();
      } else {
        toast.error(result.error || 'Failed to create link');
      }
    } catch (error) {
      console.error('Failed to create link:', error);
      toast.error('Failed to create link');
    } finally {
      setCreating(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };
  
  const generateQRCode = async (url: string) => {
    try {
      const response = await fetch('/api/qrcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          format: 'dataurl',
          size: 256
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Create download link
        const link = document.createElement('a');
        link.href = data.qrCode;
        link.download = `qrcode-${Date.now()}.png`;
        link.click();
        toast.success('QR Code downloaded!');
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Tracking Dashboard</h1>
        <p className="text-muted-foreground">
          Create and manage location-tracking links with detailed analytics
        </p>
      </div>
      
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MousePointer className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                  <p className="text-2xl font-bold">{analytics.overview.totalClicks.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Unique Visitors</p>
                  <p className="text-2xl font-bold">{analytics.overview.uniqueVisitors.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Countries</p>
                  <p className="text-2xl font-bold">{analytics.overview.countries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Avg/Day</p>
                  <p className="text-2xl font-bold">{analytics.overview.avgClicksPerDay}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create New Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Create Tracking Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alias">Link Alias</Label>
                <Input
                  id="alias"
                  placeholder="e.g., summer-campaign"
                  {...form.register('alias')}
                />
                {form.formState.errors.alias && (
                  <p className="text-sm text-red-600">{form.formState.errors.alias.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="original_url">Target URL</Label>
                <Input
                  id="original_url"
                  type="url"
                  placeholder="https://example.com"
                  {...form.register('original_url')}
                />
                {form.formState.errors.original_url && (
                  <p className="text-sm text-red-600">{form.formState.errors.original_url.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this tracking link..."
                  rows={3}
                  {...form.register('description')}
                />
              </div>
              
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? 'Creating...' : 'Create Tracking Link'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics && analytics.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentActivity.slice(0, 5).map((visit: any) => (
                  <div key={visit.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {visit.city ? `${visit.city}, ${visit.country}` : visit.country || 'Unknown Location'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {visit.device} • {visit.browser}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(visit.visited_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Links List */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LinkIcon className="mr-2 h-5 w-5" />
              Your Tracking Links ({links.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading links...</p>
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-8">
                <LinkIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tracking links created yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {links.map((link) => (
                  <div key={link.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold">{link.alias}</h3>
                          <Badge variant={link.is_active ? "default" : "secondary"}>
                            {link.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          → {getHostname(link.original_url)}
                        </p>
                        {link.description && (
                          <p className="text-sm text-muted-foreground">{link.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(link.trackingUrl)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateQRCode(link.trackingUrl)}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{link.totalClicks} clicks</span>
                        <span>{link.uniqueVisitors} unique</span>
                        <span>Created {formatDate(link.created_at)}</span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                        {link.trackingUrl}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}