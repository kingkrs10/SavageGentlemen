import React from 'react';
import { Livestream } from '@/lib/types';
import { Play, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MultiPlatformPlayerProps {
  livestream: Livestream;
  onPlay?: () => void;
}

const MultiPlatformPlayer: React.FC<MultiPlatformPlayerProps> = ({ 
  livestream,
  onPlay
}) => {
  // Helper function to create embeds based on platform
  const renderEmbed = () => {
    // If not live yet, just show the thumbnail
    if (!livestream.isLive) {
      return (
        <div className="relative w-full aspect-video bg-gray-900">
          <img 
            src={livestream.thumbnailUrl || '/placeholder-stream.jpg'} 
            alt={livestream.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-black bg-opacity-40">
            <p className="text-white text-lg mb-2">Stream starts at:</p>
            <p className="text-white font-bold text-xl mb-4">
              {new Date(livestream.streamDate).toLocaleString()}
            </p>
          </div>
        </div>
      );
    }

    // Platform-specific embeds
    switch(livestream.platform) {
      case 'youtube':
        if (!livestream.youtubeUrl) return <ErrorMessage platform="YouTube" />;
        
        // Extract video ID from YouTube URL
        const getYouTubeId = (url: string) => {
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
          const match = url.match(regExp);
          return (match && match[2].length === 11) ? match[2] : null;
        };
        
        const videoId = getYouTubeId(livestream.youtubeUrl);
        if (!videoId) return <ErrorMessage platform="YouTube" />;
        
        return (
          <div className="w-full aspect-video">
            <iframe 
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={livestream.title}
            ></iframe>
          </div>
        );
        
      case 'twitch':
        if (!livestream.twitchChannel) return <ErrorMessage platform="Twitch" />;
        
        return (
          <div className="w-full aspect-video">
            <iframe 
              src={`https://player.twitch.tv/?channel=${livestream.twitchChannel}&parent=${window.location.hostname}`}
              className="w-full h-full"
              allowFullScreen
              title={livestream.title}
            ></iframe>
          </div>
        );
        
      case 'facebook':
        if (!livestream.facebookUrl) return <ErrorMessage platform="Facebook" />;
        
        return (
          <div className="w-full aspect-video">
            <iframe 
              src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(livestream.facebookUrl)}&show_text=false`}
              className="w-full h-full"
              scrolling="no"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              title={livestream.title}
            ></iframe>
          </div>
        );
      
      case 'instagram':
        if (!livestream.instagramUsername) return <ErrorMessage platform="Instagram" />;
        
        return (
          <div className="w-full aspect-video flex flex-col items-center justify-center bg-gray-900">
            <p className="text-lg mb-4">Instagram Live Stream</p>
            <Button 
              className="sg-btn" 
              onClick={() => window.open(`https://www.instagram.com/${livestream.instagramUsername}/live/`, '_blank')}
            >
              Open Instagram Live
            </Button>
            <p className="text-sm mt-4">Instagram does not support embedded live streams</p>
          </div>
        );
        
      case 'tiktok':
        if (!livestream.tiktokUsername) return <ErrorMessage platform="TikTok" />;
        
        return (
          <div className="w-full aspect-video flex flex-col items-center justify-center bg-gray-900">
            <p className="text-lg mb-4">TikTok Live Stream</p>
            <Button 
              className="sg-btn" 
              onClick={() => window.open(`https://www.tiktok.com/@${livestream.tiktokUsername}/live`, '_blank')}
            >
              Open TikTok Live
            </Button>
            <p className="text-sm mt-4">TikTok does not support embedded live streams</p>
          </div>
        );
        
      case 'custom':
        // Try embedding a custom video stream or use an embed code if provided
        if (livestream.embedCode) {
          return (
            <div 
              className="w-full aspect-video" 
              dangerouslySetInnerHTML={{ __html: livestream.embedCode }}
            />
          );
        }
        
        if (livestream.customStreamUrl) {
          // Is it a direct video URL?
          if (livestream.customStreamUrl.match(/\.(mp4|webm|ogg)$/i)) {
            return (
              <div className="w-full aspect-video relative overflow-hidden">
                <video 
                  src={livestream.customStreamUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-cover object-center" 
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    minWidth: '100%',
                    minHeight: '100%',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              </div>
            );
          }
          
          // Otherwise try a generic iframe (this might not work for all sources)
          return (
            <div className="w-full aspect-video">
              <iframe 
                src={livestream.customStreamUrl}
                className="w-full h-full"
                allowFullScreen
                title={livestream.title}
              ></iframe>
            </div>
          );
        }
        
        // Fall back to thumbnail display if no custom URL or embed code is available
        return (
          <div className="relative w-full aspect-video bg-gray-900">
            <img 
              src={livestream.thumbnailUrl || '/placeholder-stream.jpg'} 
              alt={livestream.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-black bg-opacity-40">
              <div className="bg-black bg-opacity-50 px-4 py-2 rounded-full flex items-center mb-3">
                <span className="animate-pulse inline-block w-3 h-3 bg-red-600 rounded-full mr-2"></span>
                <span className="text-white font-semibold">LIVE</span>
              </div>
              <Button
                size="icon"
                className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center"
                onClick={onPlay}
              >
                <Play className="h-8 w-8" />
              </Button>
            </div>
          </div>
        );
        
      default:
        return <ErrorMessage platform="this platform" />;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {renderEmbed()}
    </div>
  );
};

// Error message component shown when a platform URL is missing
const ErrorMessage = ({ platform }: { platform: string }) => (
  <div className="flex flex-col items-center justify-center bg-gray-900 w-full aspect-video">
    <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
    <h3 className="text-xl font-bold mb-2">Stream Unavailable</h3>
    <p className="text-center max-w-md mb-4">
      The {platform} stream URL is missing or invalid. Please contact the stream administrator.
    </p>
  </div>
);

export default MultiPlatformPlayer;