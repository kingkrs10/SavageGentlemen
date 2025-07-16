import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Play, 
  Pause, 
  Eye,
  Calendar,
  Users,
  Video
} from 'lucide-react';

interface Livestream {
  id: number;
  title: string;
  description: string | null;
  streamDate: string;
  thumbnailUrl: string | null;
  isLive: boolean;
  hostName: string | null;
  platform: string;
  youtubeUrl: string | null;
  twitchChannel: string | null;
  instagramUsername: string | null;
  facebookUrl: string | null;
  tiktokUsername: string | null;
  customStreamUrl: string | null;
  embedCode: string | null;
  streamUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LivestreamFormData {
  title: string;
  description: string;
  streamDate: string;
  thumbnailUrl: string;
  isLive: boolean;
  hostName: string;
  platform: string;
  youtubeUrl: string;
  twitchChannel: string;
  instagramUsername: string;
  facebookUrl: string;
  tiktokUsername: string;
  customStreamUrl: string;
  embedCode: string;
  streamUrl: string;
}

const LivestreamManager: React.FC = () => {
  const { toast } = useToast();
  const [selectedLivestream, setSelectedLivestream] = useState<Livestream | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<LivestreamFormData>({
    title: '',
    description: '',
    streamDate: '',
    thumbnailUrl: '',
    isLive: false,
    hostName: '',
    platform: 'youtube',
    youtubeUrl: '',
    twitchChannel: '',
    instagramUsername: '',
    facebookUrl: '',
    tiktokUsername: '',
    customStreamUrl: '',
    embedCode: '',
    streamUrl: ''
  });

  // Fetch all livestreams
  const { data: livestreams, isLoading } = useQuery<Livestream[]>({
    queryKey: ['/api/livestreams'],
    queryFn: async () => {
      const response = await apiRequest('/api/livestreams');
      return response;
    }
  });

  // Create livestream mutation
  const createLivestream = useMutation({
    mutationFn: async (data: LivestreamFormData) => {
      return await apiRequest('/api/livestreams', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Livestream created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/livestreams'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create livestream",
        variant: "destructive"
      });
    }
  });

  // Update livestream mutation
  const updateLivestream = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: LivestreamFormData }) => {
      return await apiRequest(`/api/livestreams/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Livestream updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/livestreams'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update livestream",
        variant: "destructive"
      });
    }
  });

  // Delete livestream mutation
  const deleteLivestream = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/livestreams/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Livestream deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/livestreams'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete livestream",
        variant: "destructive"
      });
    }
  });

  // Toggle live status mutation
  const toggleLiveStatus = useMutation({
    mutationFn: async ({ id, isLive }: { id: number; isLive: boolean }) => {
      return await apiRequest(`/api/livestreams/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isLive })
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Live status updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/livestreams'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update live status",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      streamDate: '',
      thumbnailUrl: '',
      isLive: false,
      hostName: '',
      platform: 'youtube',
      youtubeUrl: '',
      twitchChannel: '',
      instagramUsername: '',
      facebookUrl: '',
      tiktokUsername: '',
      customStreamUrl: '',
      embedCode: '',
      streamUrl: ''
    });
    setSelectedLivestream(null);
  };

  const handleEdit = (livestream: Livestream) => {
    setSelectedLivestream(livestream);
    setFormData({
      title: livestream.title,
      description: livestream.description || '',
      streamDate: new Date(livestream.streamDate).toISOString().slice(0, 16),
      thumbnailUrl: livestream.thumbnailUrl || '',
      isLive: livestream.isLive,
      hostName: livestream.hostName || '',
      platform: livestream.platform,
      youtubeUrl: livestream.youtubeUrl || '',
      twitchChannel: livestream.twitchChannel || '',
      instagramUsername: livestream.instagramUsername || '',
      facebookUrl: livestream.facebookUrl || '',
      tiktokUsername: livestream.tiktokUsername || '',
      customStreamUrl: livestream.customStreamUrl || '',
      embedCode: livestream.embedCode || '',
      streamUrl: livestream.streamUrl || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedLivestream) {
      updateLivestream.mutate({ id: selectedLivestream.id, data: formData });
    } else {
      createLivestream.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this livestream?')) {
      deleteLivestream.mutate(id);
    }
  };

  const handleToggleLive = (id: number, currentStatus: boolean) => {
    toggleLiveStatus.mutate({ id, isLive: !currentStatus });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return '📺';
      case 'twitch': return '🟣';
      case 'instagram': return '📸';
      case 'facebook': return '🔵';
      case 'tiktok': return '🎵';
      default: return '🎥';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Livestream Management</h2>
          <p className="text-gray-600">Create and manage live streaming events</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create Livestream
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedLivestream ? 'Edit Livestream' : 'Create New Livestream'}
              </DialogTitle>
              <DialogDescription>
                Configure your livestream settings and platform details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hostName">Host Name</Label>
                  <Input
                    id="hostName"
                    value={formData.hostName}
                    onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="streamDate">Stream Date & Time</Label>
                  <Input
                    id="streamDate"
                    type="datetime-local"
                    value={formData.streamDate}
                    onChange={(e) => setFormData({ ...formData, streamDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="twitch">Twitch</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>

              {/* Platform-specific fields */}
              {formData.platform === 'youtube' && (
                <div>
                  <Label htmlFor="youtubeUrl">YouTube URL</Label>
                  <Input
                    id="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              )}

              {formData.platform === 'twitch' && (
                <div>
                  <Label htmlFor="twitchChannel">Twitch Channel</Label>
                  <Input
                    id="twitchChannel"
                    value={formData.twitchChannel}
                    onChange={(e) => setFormData({ ...formData, twitchChannel: e.target.value })}
                    placeholder="channel_name"
                  />
                </div>
              )}

              {formData.platform === 'instagram' && (
                <div>
                  <Label htmlFor="instagramUsername">Instagram Username</Label>
                  <Input
                    id="instagramUsername"
                    value={formData.instagramUsername}
                    onChange={(e) => setFormData({ ...formData, instagramUsername: e.target.value })}
                    placeholder="username"
                  />
                </div>
              )}

              {formData.platform === 'facebook' && (
                <div>
                  <Label htmlFor="facebookUrl">Facebook URL</Label>
                  <Input
                    id="facebookUrl"
                    value={formData.facebookUrl}
                    onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                    placeholder="https://www.facebook.com/..."
                  />
                </div>
              )}

              {formData.platform === 'tiktok' && (
                <div>
                  <Label htmlFor="tiktokUsername">TikTok Username</Label>
                  <Input
                    id="tiktokUsername"
                    value={formData.tiktokUsername}
                    onChange={(e) => setFormData({ ...formData, tiktokUsername: e.target.value })}
                    placeholder="@username"
                  />
                </div>
              )}

              {formData.platform === 'custom' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customStreamUrl">Custom Stream URL</Label>
                    <Input
                      id="customStreamUrl"
                      value={formData.customStreamUrl}
                      onChange={(e) => setFormData({ ...formData, customStreamUrl: e.target.value })}
                      placeholder="https://your-stream-url.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="embedCode">Embed Code (Optional)</Label>
                    <Textarea
                      id="embedCode"
                      value={formData.embedCode}
                      onChange={(e) => setFormData({ ...formData, embedCode: e.target.value })}
                      placeholder="<iframe>...</iframe>"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="isLive"
                  checked={formData.isLive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isLive: checked })}
                />
                <Label htmlFor="isLive">Currently Live</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createLivestream.isPending || updateLivestream.isPending}
                >
                  {selectedLivestream ? 'Update' : 'Create'} Livestream
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Livestreams Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Livestreams</CardTitle>
          <CardDescription>
            Manage your live streaming events and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading livestreams...</div>
          ) : livestreams && livestreams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {livestreams.map((livestream) => (
                  <TableRow key={livestream.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Video className="w-4 h-4" />
                        <span className="font-medium">{livestream.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{getPlatformIcon(livestream.platform)}</span>
                        <span className="capitalize">{livestream.platform}</span>
                      </div>
                    </TableCell>
                    <TableCell>{livestream.hostName || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(livestream.streamDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={livestream.isLive ? "default" : "secondary"}>
                          {livestream.isLive ? 'Live' : 'Offline'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleLive(livestream.id, livestream.isLive)}
                        >
                          {livestream.isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(livestream)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(livestream.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No livestreams found. Create your first livestream!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LivestreamManager;