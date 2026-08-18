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
  const { data: livestreams = [], isLoading } = useQuery<Livestream[]>({
    queryKey: ['/api/livestreams'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/livestreams');
      return await response.json();
    }
  });

  // Create livestream mutation
  const createLivestream = useMutation({
    mutationFn: async (data: LivestreamFormData) => {
      const res = await apiRequest('POST', '/api/livestreams', data);
      return await res.json();
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
      const res = await apiRequest('PUT', `/api/livestreams/${id}`, data);
      return await res.json();
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
      const res = await apiRequest('DELETE', `/api/livestreams/${id}`);
      return await res.json();
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
      const res = await apiRequest('PUT', `/api/livestreams/${id}`, { isLive });
      return await res.json();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-gold-400">Livestream Broadcast Hub</h2>
          <p className="text-xs font-mono text-gray-400 mt-1">Configure and manage multi-platform live streaming events and embed codes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-obsidian font-bold rounded-xl text-xs shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Create Livestream
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-obsidian-card border border-gold-500/30 text-white rounded-2xl shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading text-white">
                {selectedLivestream ? 'Edit Livestream Stream' : 'Configure New Livestream'}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-gray-400">
                Configure your livestream platform details, OBS/RTMP keys, and embed player.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-xs font-mono text-gray-300">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="platform" className="text-xs font-mono text-gray-300">Platform</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => setFormData({ ...formData, platform: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/15 text-white rounded-xl text-xs">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent className="bg-obsidian-card border border-gold-500/30 text-white rounded-xl shadow-2xl">
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="twitch">Twitch</SelectItem>
                      <SelectItem value="instagram">Instagram Live</SelectItem>
                      <SelectItem value="facebook">Facebook Live</SelectItem>
                      <SelectItem value="tiktok">TikTok Live</SelectItem>
                      <SelectItem value="custom">Custom RTMP/HLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-xs font-mono text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="streamDate" className="text-xs font-mono text-gray-300">Stream Date & Time</Label>
                  <Input
                    id="streamDate"
                    type="datetime-local"
                    value={formData.streamDate}
                    onChange={(e) => setFormData({ ...formData, streamDate: e.target.value })}
                    required
                    className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="hostName" className="text-xs font-mono text-gray-300">Host / DJ Name</Label>
                  <Input
                    id="hostName"
                    value={formData.hostName}
                    onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                    className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="thumbnailUrl" className="text-xs font-mono text-gray-300">Cover Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="https://..."
                  className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                />
              </div>

              {/* Platform specific fields */}
              {formData.platform === 'youtube' && (
                <div>
                  <Label htmlFor="youtubeUrl" className="text-xs font-mono text-gray-300">YouTube URL</Label>
                  <Input
                    id="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                  />
                </div>
              )}

              {formData.platform === 'twitch' && (
                <div>
                  <Label htmlFor="twitchChannel" className="text-xs font-mono text-gray-300">Twitch Channel</Label>
                  <Input
                    id="twitchChannel"
                    value={formData.twitchChannel}
                    onChange={(e) => setFormData({ ...formData, twitchChannel: e.target.value })}
                    placeholder="channel_name"
                    className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                  />
                </div>
              )}

              {formData.platform === 'instagram' && (
                <div>
                  <Label htmlFor="instagramUsername" className="text-xs font-mono text-gray-300">Instagram Username</Label>
                  <Input
                    id="instagramUsername"
                    value={formData.instagramUsername}
                    onChange={(e) => setFormData({ ...formData, instagramUsername: e.target.value })}
                    placeholder="username"
                    className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                  />
                </div>
              )}

              {formData.platform === 'facebook' && (
                <div>
                  <Label htmlFor="facebookUrl" className="text-xs font-mono text-gray-300">Facebook URL</Label>
                  <Input
                    id="facebookUrl"
                    value={formData.facebookUrl}
                    onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                    placeholder="https://www.facebook.com/..."
                    className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                  />
                </div>
              )}

              {formData.platform === 'tiktok' && (
                <div>
                  <Label htmlFor="tiktokUsername" className="text-xs font-mono text-gray-300">TikTok Username</Label>
                  <Input
                    id="tiktokUsername"
                    value={formData.tiktokUsername}
                    onChange={(e) => setFormData({ ...formData, tiktokUsername: e.target.value })}
                    placeholder="@username"
                    className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                  />
                </div>
              )}

              {formData.platform === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="customStreamUrl" className="text-xs font-mono text-gray-300">Custom Stream URL</Label>
                    <Input
                      id="customStreamUrl"
                      value={formData.customStreamUrl}
                      onChange={(e) => setFormData({ ...formData, customStreamUrl: e.target.value })}
                      placeholder="https://your-stream-url.com"
                      className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="embedCode" className="text-xs font-mono text-gray-300">Embed Code (Optional)</Label>
                    <Textarea
                      id="embedCode"
                      value={formData.embedCode}
                      onChange={(e) => setFormData({ ...formData, embedCode: e.target.value })}
                      placeholder="<iframe>...</iframe>"
                      rows={2}
                      className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="streamUrl" className="text-xs font-mono text-gray-300">Stream URL / Direct Video Link</Label>
                <Input
                  id="streamUrl"
                  value={formData.streamUrl}
                  onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                  placeholder="https://..."
                  className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="isLive"
                  checked={formData.isLive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isLive: checked })}
                />
                <Label htmlFor="isLive" className="text-xs font-mono text-gold-400 font-bold uppercase">Broadcast Live Now</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-white/10">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/20 text-gray-300 rounded-xl text-xs">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createLivestream.isPending || updateLivestream.isPending}
                  className="bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-obsidian font-bold rounded-xl text-xs shadow-md"
                >
                  {selectedLivestream ? 'Update' : 'Create'} Livestream
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Livestreams Table */}
      <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-heading text-gold-400">Configured Livestreams</CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Manage your live streaming broadcasts and on-air statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto"></div>
              <p className="mt-3 text-xs font-mono text-gray-400">Loading broadcasts...</p>
            </div>
          ) : livestreams && livestreams.length > 0 ? (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5 border-b border-gold-500/20">
                  <TableRow>
                    <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Title</TableHead>
                    <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Platform</TableHead>
                    <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Host</TableHead>
                    <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Date</TableHead>
                    <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Status</TableHead>
                    <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {livestreams.map((livestream) => (
                    <TableRow key={livestream.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors text-xs">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Video className="w-4 h-4 text-gold-400 shrink-0" />
                          <span className="font-semibold text-white">{livestream.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 font-mono text-gray-300">
                          <span>{getPlatformIcon(livestream.platform)}</span>
                          <span className="capitalize">{livestream.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono">{livestream.hostName || '—'}</TableCell>
                      <TableCell className="text-gray-400 font-mono">
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
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                            livestream.isLive 
                              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' 
                              : 'bg-white/10 text-gray-400 border-white/15'
                          }`}>
                            {livestream.isLive ? 'Live' : 'Offline'}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleLive(livestream.id, livestream.isLive)}
                            className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-lg h-7 px-2"
                          >
                            {livestream.isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(livestream)}
                            className="border-white/20 text-gray-300 hover:bg-white/10 rounded-lg h-7 w-7 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(livestream.id)}
                            className="border-red-500/30 text-red-400 hover:bg-red-950/40 rounded-lg h-7 w-7 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Video className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-xs font-mono">No livestreams scheduled. Create your first broadcast above!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LivestreamManager;