import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Images, Play, Eye, Calendar, Lock, AlertTriangle } from "lucide-react";
import { useUser } from "@/context/UserContext";
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

const MediaPage = () => {
  const { user } = useUser();
  const [selectedCollection, setSelectedCollection] = useState<MediaCollection | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [viewerMode, setViewerMode] = useState<'collections' | 'assets' | 'viewer'>('collections');

  // Disable right-click and keyboard shortcuts for security
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, Ctrl+A, Ctrl+P, Print Screen
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'a') ||
        (e.ctrlKey && e.key === 'p') ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        return false;
      }
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  // Fetch media collections
  const { data: collections, isLoading: collectionsLoading } = useQuery<MediaCollection[]>({
    queryKey: ['/api/media/collections'],
    enabled: viewerMode === 'collections',
  });

  // Fetch assets for selected collection
  const { data: collectionWithAssets, isLoading: assetsLoading } = useQuery<MediaCollection>({
    queryKey: [`/api/media/collections/${selectedCollection?.id}`],
    enabled: viewerMode === 'assets' && selectedCollection !== null,
  });

  const handleCollectionClick = (collection: MediaCollection) => {
    setSelectedCollection(collection);
    setViewerMode('assets');
  };

  const handleAssetClick = (asset: MediaAsset) => {
    setSelectedAsset(asset);
    setViewerMode('viewer');
  };

  const handleBackToCollections = () => {
    setSelectedCollection(null);
    setViewerMode('collections');
  };

  const handleBackToAssets = () => {
    setSelectedAsset(null);
    setViewerMode('assets');
  };

  // Security warning for non-authenticated users
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEOHead 
          title="Media - Savage Gentlemen"
          description="Exclusive photos and videos from Savage Gentlemen events and community."
        />
        <div className="max-w-2xl mx-auto text-center py-12">
          <Lock className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">Media Library</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to access our exclusive photo and video collections from events and community moments.
          </p>
          <Button 
            onClick={() => window.dispatchEvent(new CustomEvent('sg:open-auth-modal'))}
            className="bg-primary hover:bg-primary/90"
          >
            Sign In to View Media
          </Button>
        </div>
      </div>
    );
  }

  // Collections view
  if (viewerMode === 'collections') {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEOHead 
          title="Media Collections - Savage Gentlemen"
          description="Browse exclusive photo and video collections from Savage Gentlemen events."
        />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Images className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Media Collections</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Explore our exclusive photo and video collections from events, behind-the-scenes moments, and community highlights.
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">Protected Content</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                This content is protected and for viewing only. Screenshots, downloads, and sharing are disabled.
              </p>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        {collectionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
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
            {collections
              .filter((collection) => {
                // Only show public, active collections to non-admin users
                if (user?.role !== 'admin') {
                  return collection.visibility === 'public' && collection.isActive;
                }
                // Admin users can see all collections
                return true;
              })
              .map((collection) => (
              <Card 
                key={collection.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => handleCollectionClick(collection)}
                data-testid={`collection-card-${collection.id}`}
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center relative overflow-hidden">
                  {collection.coverImageUrl ? (
                    <img 
                      src={collection.coverImageUrl} 
                      alt={collection.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  ) : (
                    <Images className="w-12 h-12 text-primary/50" />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  {collection.visibility === 'private' && user?.role === 'admin' && (
                    <Badge variant="secondary" className="absolute top-2 left-2">
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{collection.title}</h3>
                  {collection.description && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{collection.assetCount} items</span>
                    <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Images className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Collections Available</h3>
            <p className="text-muted-foreground">
              Check back later for new photo and video collections.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Assets view
  if (viewerMode === 'assets' && selectedCollection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEOHead 
          title={`${selectedCollection.title} - Media - Savage Gentlemen`}
          description={selectedCollection.description || `Browse ${selectedCollection.title} photo and video collection.`}
        />
        
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={handleBackToCollections}
            className="mb-4"
            data-testid="back-to-collections-button"
          >
            ← Back to Collections
          </Button>
          <h1 className="text-3xl font-bold mb-2">{selectedCollection.title}</h1>
          {selectedCollection.description && (
            <p className="text-muted-foreground">{selectedCollection.description}</p>
          )}
        </div>

        {/* Assets Grid */}
        {assetsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : collectionWithAssets?.assets && collectionWithAssets.assets.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {collectionWithAssets.assets
              .filter((asset) => {
                // Only show published assets to non-admin users
                if (user?.role !== 'admin') {
                  return asset.isPublished;
                }
                // Admin users can see all assets
                return true;
              })
              .map((asset) => (
              <Card 
                key={asset.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => handleAssetClick(asset)}
                data-testid={`asset-card-${asset.id}`}
              >
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
                  <img 
                    src={asset.thumbnailUrl || asset.url} 
                    alt={asset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {asset.type === 'video' ? (
                      <Play className="w-6 h-6 text-white" />
                    ) : (
                      <Eye className="w-6 h-6 text-white" />
                    )}
                  </div>
                  {asset.type === 'video' && (
                    <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                      {asset.duration ? `${Math.round(asset.duration / 60)}:${String(Math.round(asset.duration % 60)).padStart(2, '0')}` : 'Video'}
                    </Badge>
                  )}
                  {!asset.isPublished && user?.role === 'admin' && (
                    <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                      Draft
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h4 className="font-medium text-sm line-clamp-2 mb-1">{asset.title}</h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {asset.viewCount}
                    </span>
                    <span>{new Date(asset.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Images className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Media Found</h3>
            <p className="text-muted-foreground">
              This collection doesn't have any published media yet.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Media viewer
  if (viewerMode === 'viewer' && selectedAsset) {
    // Additional security check: don't show unpublished assets to non-admin users
    if (!selectedAsset.isPublished && user?.role !== 'admin') {
      return (
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={handleBackToAssets}
            className="mb-4"
          >
            ← Back to Collection
          </Button>
          <div className="max-w-2xl mx-auto text-center py-12">
            <Lock className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold mb-4">Content Not Available</h1>
            <p className="text-muted-foreground">
              This content is not yet published or you don't have permission to view it.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="container mx-auto px-4 py-8">
        <SEOHead 
          title={`${selectedAsset.title} - ${selectedCollection?.title} - Savage Gentlemen`}
          description={selectedAsset.description || `View ${selectedAsset.title} from ${selectedCollection?.title} collection.`}
        />
        
        <Button 
          variant="ghost" 
          onClick={handleBackToAssets}
          className="mb-4"
          data-testid="back-to-assets-button"
        >
          ← Back to Collection
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="bg-black rounded-lg overflow-hidden mb-6 relative">
            {/* Watermark overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none select-none">
              <div className="absolute top-4 left-4 text-white/30 text-xs font-medium">
                © SAVAGE GENTLEMEN
              </div>
              <div className="absolute bottom-4 right-4 text-white/30 text-xs font-medium">
                PROTECTED CONTENT
              </div>
            </div>
            
            {selectedAsset.type === 'image' ? (
              <img 
                src={selectedAsset.url} 
                alt={selectedAsset.title}
                className="w-full h-auto max-h-[70vh] object-contain select-none pointer-events-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                data-testid={`image-viewer-${selectedAsset.id}`}
              />
            ) : (
              <video 
                src={selectedAsset.url} 
                controls
                className="w-full h-auto max-h-[70vh] select-none"
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                data-testid={`video-viewer-${selectedAsset.id}`}
              >
                Your browser does not support video playback.
              </video>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl font-bold">{selectedAsset.title}</h1>
            {selectedAsset.description && (
              <p className="text-muted-foreground">{selectedAsset.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {selectedAsset.viewCount} views
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(selectedAsset.uploadedAt).toLocaleDateString()}
              </span>
              {selectedAsset.fileSize && (
                <span>
                  {(selectedAsset.fileSize / 1024 / 1024).toFixed(1)} MB
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MediaPage;