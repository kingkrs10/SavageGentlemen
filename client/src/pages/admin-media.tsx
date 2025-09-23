import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Images, 
  Upload, 
  Plus, 
  Edit, 
  Trash, 
  Eye, 
  FileImage, 
  FileVideo, 
  Calendar, 
  Users,
  HardDrive,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  ArrowLeft
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SEOHead from "@/components/SEOHead";

interface MediaAsset {
  id: number;
  title: string;
  description: string | null;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string | null;
  fileSize: number;
  duration: number | null;
  isPublished: boolean;
  viewCount: number;
  uploadedAt: string;
  createdBy: number;
  collectionId: number;
}

interface MediaCollection {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  visibility: 'public' | 'private';
  isActive: boolean;
  coverImageUrl: string | null;
  assetCount: number;
  createdAt: string;
  createdBy: number;
  assets?: MediaAsset[];
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  url?: string;
  error?: string;
}

const AdminMediaPage = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('collections');
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<MediaCollection | null>(null);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  
  // Form states
  const [collectionForm, setCollectionForm] = useState({
    title: '',
    description: '',
    slug: '',
    visibility: 'public' as 'public' | 'private',
    isActive: true,
    coverImageUrl: ''
  });
  
  const [assetForm, setAssetForm] = useState({
    title: '',
    description: '',
    collectionId: selectedCollection || 0,
    isPublished: true
  });

  // Fetch collections - moved before auth check to fix hooks order
  const { data: collections, isLoading: collectionsLoading } = useQuery<MediaCollection[]>({
    queryKey: ['/api/media/collections'],
    enabled: user?.role === 'admin', // Only fetch if admin
  });

  // Fetch assets for selected collection
  const { data: selectedCollectionData } = useQuery<MediaCollection>({
    queryKey: ['/api/media/collections', selectedCollection],
    enabled: !!selectedCollection && user?.role === 'admin',
  });

  // Auto-select the first collection when collections are loaded
  useEffect(() => {
    if (collections && collections.length > 0 && selectedCollection === null) {
      setSelectedCollection(collections[0].id);
    }
  }, [collections, selectedCollection]);

  // Sync assetForm.collectionId with selectedCollection
  useEffect(() => {
    if (selectedCollection) {
      setAssetForm(prev => ({
        ...prev,
        collectionId: selectedCollection
      }));
    }
  }, [selectedCollection]);

  // Create collection mutation
  const createCollectionMutation = useMutation({
    mutationFn: async (data: typeof collectionForm) => {
      const response = await apiRequest('POST', '/api/media/collections', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media/collections'] });
      setShowCollectionDialog(false);
      resetCollectionForm();
      toast({ title: "Collection created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating collection", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update collection mutation
  const updateCollectionMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<typeof collectionForm> }) => {
      const response = await apiRequest('PUT', `/api/media/collections/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media/collections'] });
      setShowCollectionDialog(false);
      setEditingCollection(null);
      resetCollectionForm();
      toast({ title: "Collection updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating collection", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete collection mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/media/collections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media/collections'] });
      toast({ title: "Collection deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting collection", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Create/update asset mutation
  const saveAssetMutation = useMutation({
    mutationFn: async (data: { id?: number; assetData: any }) => {
      if (data.id) {
        const response = await apiRequest('PUT', `/api/media/assets/${data.id}`, data.assetData);
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/media/assets', data.assetData);
        return response.json();
      }
    },
    onSuccess: () => {
      if (selectedCollection) {
        queryClient.invalidateQueries({ queryKey: ['/api/media/collections', selectedCollection] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/media/collections'] });
      setShowAssetDialog(false);
      setEditingAsset(null);
      resetAssetForm();
      toast({ title: "Asset saved successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error saving asset", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/media/assets/${id}`);
    },
    onSuccess: () => {
      if (selectedCollection) {
        queryClient.invalidateQueries({ queryKey: ['/api/media/collections', selectedCollection] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/media/collections'] });
      toast({ title: "Asset deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting asset", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetCollectionForm = () => {
    setCollectionForm({
      title: '',
      description: '',
      slug: '',
      visibility: 'public',
      isActive: true,
      coverImageUrl: ''
    });
  };

  const resetAssetForm = () => {
    setAssetForm({
      title: '',
      description: '',
      collectionId: selectedCollection || 0,
      isPublished: true
    });
  };

  const handleEditCollection = (collection: MediaCollection) => {
    setEditingCollection(collection);
    setCollectionForm({
      title: collection.title,
      description: collection.description || '',
      slug: collection.slug,
      visibility: collection.visibility,
      isActive: collection.isActive,
      coverImageUrl: collection.coverImageUrl || ''
    });
    setShowCollectionDialog(true);
  };

  const handleEditAsset = (asset: MediaAsset) => {
    setEditingAsset(asset);
    setAssetForm({
      title: asset.title,
      description: asset.description || '',
      collectionId: asset.collectionId,
      isPublished: asset.isPublished
    });
    setShowAssetDialog(true);
  };

  const handleFileUpload = async (files: FileList, collectionId: number) => {
    const fileArray = Array.from(files);
    
    // Add files to upload queue
    const newUploads: UploadProgress[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));
    
    setUploads(prev => [...prev, ...newUploads]);

    // Upload each file
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const uploadIndex = uploads.length + i;
      
      try {
        // Create FormData with file and metadata
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.split('.')[0]);
        formData.append('description', '');
        formData.append('collectionId', collectionId.toString());
        formData.append('type', file.type.startsWith('video/') ? 'video' : 'image');
        formData.append('fileSize', file.size.toString());
        formData.append('isPublished', 'true');

        // Create a custom XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();
        
        // Set up progress tracking
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 90); // Reserve 90% for upload, 10% for processing
            setUploads(prev => prev.map((upload, idx) => 
              idx === uploadIndex ? { ...upload, progress: percentComplete } : upload
            ));
          }
        });

        // Set up response handlers
        const uploadPromise = new Promise<any>((resolve, reject) => {
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (error) {
                reject(new Error('Invalid response format'));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload was aborted'));
          });
        });

        // Get the base URL for the API request
        const baseUrl = window.location.origin;
        
        // Make the upload request
        xhr.open('POST', `${baseUrl}/api/media/assets/upload`);
        
        // Add authentication headers if available
        const userStr = localStorage.getItem('user');
        let token = null;
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            if (userData?.data?.data?.id) {
              xhr.setRequestHeader('user-id', userData.data.data.id.toString());
            }
            if (userData?.data?.data?.token) {
              token = userData.data.data.token;
              xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
          } catch (e) {
            console.error('Error parsing user data for headers:', e);
          }
        }

        xhr.send(formData);
        
        // Update progress to show processing
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex ? { ...upload, progress: 90, status: 'processing' } : upload
        ));

        // Wait for upload to complete
        const createdAsset = await uploadPromise;

        // Update progress to show completion
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex ? { 
            ...upload, 
            progress: 100, 
            status: 'completed',
            url: createdAsset.url
          } : upload
        ));

        // Refresh collections data to show the new asset
        queryClient.invalidateQueries({ queryKey: ['/api/media/collections'] });
        if (selectedCollection) {
          queryClient.invalidateQueries({ queryKey: ['/api/media/collections', selectedCollection] });
        }

        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded successfully.`
        });
        
      } catch (error: any) {
        console.error('Upload error:', error);
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex ? { 
            ...upload, 
            status: 'error',
            error: error.message || 'Upload failed'
          } : upload
        ));

        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}: ${error.message || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    }
  };

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, idx) => idx !== index));
  };

  // Generate slug from title
  useEffect(() => {
    if (!editingCollection) {
      const slug = collectionForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setCollectionForm(prev => ({ ...prev, slug }));
    }
  }, [collectionForm.title, editingCollection]);

  return (
    <div className="container mx-auto px-4 py-8">
      <SEOHead 
        title="Media Management - Admin - Savage Gentlemen"
        description="Admin interface for managing media collections, photos, and videos."
      />
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="p-2"
          data-testid="back-button"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Media Management</h1>
          <p className="text-muted-foreground">Manage photo and video collections</p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploads.map((upload, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{upload.file.name}</span>
                    <div className="flex items-center gap-2">
                      {upload.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {upload.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUpload(index)}
                        data-testid={`remove-upload-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={upload.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{upload.status}</span>
                    <span>{upload.progress}%</span>
                  </div>
                  {upload.error && (
                    <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Media Collections</h2>
            <Button 
              onClick={() => setShowCollectionDialog(true)}
              data-testid="create-collection-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Collection
            </Button>
          </div>

          {collectionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton className="aspect-video w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : collections && collections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center relative">
                    {collection.coverImageUrl ? (
                      <img 
                        src={collection.coverImageUrl} 
                        alt={collection.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Images className="w-12 h-12 text-primary/50" />
                    )}
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Badge variant={collection.visibility === 'public' ? 'default' : 'secondary'}>
                        {collection.visibility}
                      </Badge>
                      {!collection.isActive && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{collection.title}</h3>
                    {collection.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span>{collection.assetCount} assets</span>
                      <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedCollection(collection.id);
                          setActiveTab('assets');
                        }}
                        data-testid={`view-collection-${collection.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditCollection(collection)}
                        data-testid={`edit-collection-${collection.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteCollectionMutation.mutate(collection.id)}
                        data-testid={`delete-collection-${collection.id}`}
                      >
                        <Trash className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Images className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Collections</h3>
              <p className="text-muted-foreground mb-4">Create your first media collection to get started.</p>
              <Button onClick={() => setShowCollectionDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Collection
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Media Assets</h2>
              {selectedCollection && selectedCollectionData && (
                <p className="text-muted-foreground">Collection: {selectedCollectionData.title}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Select 
                value={selectedCollection?.toString() || ''} 
                onValueChange={(value) => setSelectedCollection(parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections?.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id.toString()}>
                      {collection.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setShowAssetDialog(true)}
                disabled={!selectedCollection}
                data-testid="add-asset-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Asset
              </Button>
            </div>
          </div>

          {selectedCollection && selectedCollectionData?.assets ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedCollectionData.assets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                    <img 
                      src={asset.thumbnailUrl || asset.url} 
                      alt={asset.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {asset.type === 'video' ? <FileVideo className="w-3 h-3" /> : <FileImage className="w-3 h-3" />}
                      </Badge>
                      {!asset.isPublished && (
                        <Badge variant="destructive" className="text-xs">Draft</Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm line-clamp-2 mb-2">{asset.title}</h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{asset.viewCount} views</span>
                      <span>{new Date(asset.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditAsset(asset)}
                        data-testid={`edit-asset-${asset.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteAssetMutation.mutate(asset.id)}
                        data-testid={`delete-asset-${asset.id}`}
                      >
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileImage className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Assets</h3>
              <p className="text-muted-foreground">
                {selectedCollection ? 'This collection has no assets yet.' : 'Select a collection to view assets.'}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Upload Media</h2>
            
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <Label>Select Collection</Label>
                    <Select 
                      value={selectedCollection?.toString() || ''} 
                      onValueChange={(value) => setSelectedCollection(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a collection" />
                      </SelectTrigger>
                      <SelectContent>
                        {collections?.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id.toString()}>
                            {collection.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Upload Files</Label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Drag and drop files here, or click to browse
                      </p>
                      <Input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={(e) => {
                          if (e.target.files && selectedCollection) {
                            handleFileUpload(e.target.files, selectedCollection);
                            e.target.value = ''; // Reset input
                          }
                        }}
                        disabled={!selectedCollection}
                        className="max-w-xs mx-auto"
                        data-testid="file-upload-input"
                      />
                    </div>
                    {!selectedCollection && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Please select a collection first
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Collection Dialog */}
      <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCollection ? 'Edit Collection' : 'Create Collection'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={collectionForm.title}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Collection title"
                data-testid="collection-title-input"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={collectionForm.slug}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="collection-slug"
                data-testid="collection-slug-input"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={collectionForm.description}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Collection description"
                data-testid="collection-description-input"
              />
            </div>
            <div>
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                value={collectionForm.coverImageUrl}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                data-testid="collection-cover-input"
              />
            </div>
            <div className="flex gap-4">
              <div>
                <Label>Visibility</Label>
                <Select 
                  value={collectionForm.visibility} 
                  onValueChange={(value: 'public' | 'private') => 
                    setCollectionForm(prev => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={collectionForm.isActive}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  data-testid="collection-active-checkbox"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCollectionDialog(false);
              setEditingCollection(null);
              resetCollectionForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingCollection) {
                  updateCollectionMutation.mutate({
                    id: editingCollection.id,
                    updates: collectionForm
                  });
                } else {
                  createCollectionMutation.mutate(collectionForm);
                }
              }}
              disabled={createCollectionMutation.isPending || updateCollectionMutation.isPending}
              data-testid="save-collection-button"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingCollection ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Dialog */}
      <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? 'Edit Asset' : 'Add Asset'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="assetTitle">Title</Label>
              <Input
                id="assetTitle"
                value={assetForm.title}
                onChange={(e) => setAssetForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Asset title"
                data-testid="asset-title-input"
              />
            </div>
            <div>
              <Label htmlFor="assetDescription">Description</Label>
              <Textarea
                id="assetDescription"
                value={assetForm.description}
                onChange={(e) => setAssetForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Asset description"
                data-testid="asset-description-input"
              />
            </div>
            <div>
              <Label>Collection</Label>
              <Select 
                value={assetForm.collectionId.toString()} 
                onValueChange={(value) => setAssetForm(prev => ({ ...prev, collectionId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections?.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id.toString()}>
                      {collection.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={assetForm.isPublished}
                onChange={(e) => setAssetForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                data-testid="asset-published-checkbox"
              />
              <Label htmlFor="isPublished">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAssetDialog(false);
              setEditingAsset(null);
              resetAssetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                saveAssetMutation.mutate({
                  id: editingAsset?.id,
                  assetData: assetForm
                });
              }}
              disabled={saveAssetMutation.isPending}
              data-testid="save-asset-button"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingAsset ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMediaPage;