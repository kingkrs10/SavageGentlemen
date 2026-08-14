import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Video,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  Play,
  Pause,
  Sliders,
  Sparkles,
  Link as LinkIcon,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BrandVideo from "@/assets/videos/brand-video.mp4";

interface VideoConfig {
  videoUrl: string;
  posterUrl?: string;
  opacity: number;
  contrast: number;
  brightness: number;
  isDefault: boolean;
  updatedAt?: string;
}

export const BackgroundVideoManager = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState<string>("");
  const [opacity, setOpacity] = useState<number>(0.45);
  const [contrast, setContrast] = useState<number>(125);
  const [brightness, setBrightness] = useState<number>(90);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const { data: config, isLoading } = useQuery<VideoConfig>({
    queryKey: ["/api/settings/background-video"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/settings/background-video");
      return res.json();
    },
  });

  useEffect(() => {
    if (config) {
      setCustomUrl(config.videoUrl || "");
      setOpacity(config.opacity ?? 0.45);
      setContrast(config.contrast ?? 125);
      setBrightness(config.brightness ?? 90);
    }
  }, [config]);

  const activeVideoSource = filePreviewUrl || customUrl || BrandVideo;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setFilePreviewUrl(objectUrl);
      toast({
        title: "Video File Selected",
        description: `Ready to upload: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
      });
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("video", selectedFile);
      formData.append("opacity", opacity.toString());
      formData.append("contrast", contrast.toString());
      formData.append("brightness", brightness.toString());

      const res = await fetch("/api/settings/background-video/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      toast({
        title: "Video Uploaded Successfully!",
        description: "Your new background video is now live across the site.",
      });

      setSelectedFile(null);
      setFilePreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ["/api/settings/background-video"] });
    } catch (err: any) {
      toast({
        title: "Upload Error",
        description: err.message || "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await apiRequest("PUT", "/api/settings/background-video", {
        videoUrl: customUrl.trim(),
        opacity,
        contrast,
        brightness,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      toast({
        title: "Settings Saved",
        description: "Background video configuration updated.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/settings/background-video"] });
    } catch (err: any) {
      toast({
        title: "Save Error",
        description: err.message || "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const handleResetDefault = async () => {
    if (!confirm("Reset background video back to the default Savage Gentlemen brand video?")) return;

    try {
      const res = await apiRequest("POST", "/api/settings/background-video/reset");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");

      setSelectedFile(null);
      setFilePreviewUrl(null);
      setCustomUrl("");
      setOpacity(0.45);
      setContrast(125);
      setBrightness(90);

      toast({
        title: "Reset Complete",
        description: "Default brand video has been restored.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/settings/background-video"] });
    } catch (err: any) {
      toast({
        title: "Reset Error",
        description: err.message || "Failed to reset video",
        variant: "destructive",
      });
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <Card className="border-gold-500/20 bg-obsidian-card text-white shadow-xl">
      <CardHeader className="border-b border-white/10 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/30 text-xs font-mono font-bold uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Theme & Visual Engine
            </div>
            <CardTitle className="text-2xl font-bold font-heading text-white">
              Site Background Video Manager
            </CardTitle>
            <CardDescription className="text-white/60 text-xs mt-1">
              Upload custom video backgrounds or set external stream URLs displayed on the Home hero stage and event backdrops.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefault}
              className="border-white/20 text-white/70 hover:text-white text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Default
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-8">
        {/* Preview Screen */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-gold-400" />
              Live Stage Preview
            </Label>
            <div className="flex items-center gap-2">
              {config?.isDefault && !filePreviewUrl && !customUrl ? (
                <Badge variant="outline" className="text-gold-400 border-gold-500/40 text-[10px] font-mono">
                  Default Brand Video Active
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                  Custom Video Active
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayback}
                className="h-7 px-2 text-xs text-white/60 hover:text-white"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
            </div>
          </div>

          <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-obsidian-dark border border-gold-500/20 shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              key={activeVideoSource}
              src={activeVideoSource}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-all duration-300"
              style={{
                opacity: opacity,
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              }}
            />
            {/* Ambient Overlays to match Home Stage */}
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent pointer-events-none" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-40 bg-gold-500/15 rounded-full blur-3xl pointer-events-none" />
            
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-white/80 pointer-events-none">
              <span className="bg-obsidian/80 px-2.5 py-1 rounded-full border border-white/10">
                Opacity: {Math.round(opacity * 100)}% | Brightness: {brightness}% | Contrast: {contrast}%
              </span>
              <span className="bg-obsidian/80 px-2.5 py-1 rounded-full border border-white/10 truncate max-w-xs">
                Source: {filePreviewUrl ? "Local File Preview" : (customUrl ? customUrl : "Brand Video")}
              </span>
            </div>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
          {/* Method 1: Upload Video File */}
          <div className="space-y-4 p-5 rounded-2xl border border-white/10 bg-obsidian-dark/60">
            <div className="flex items-center gap-2 text-gold-400 font-bold text-sm">
              <Upload className="w-4 h-4" />
              Upload New Video (.mp4, .webm, .mov)
            </div>
            <p className="text-xs text-white/50">
              Upload a 1080p or 4K cinematic video clip up to 100MB to store directly on your server.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gold-500/30 hover:border-gold-500/60 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-gold-500/5 group"
            >
              <Video className="w-8 h-8 text-gold-400/60 group-hover:text-gold-400 mx-auto mb-2 transition-colors" />
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-emerald-400 font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Click to choose different file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Click or Drag & Drop Video</p>
                  <p className="text-[10px] text-white/40 font-mono">MP4, WEBM, MOV up to 100MB</p>
                </div>
              )}
            </div>

            {selectedFile && (
              <Button
                onClick={handleUploadFile}
                disabled={isUploading}
                className="w-full bg-gold-500 hover:bg-gold-400 text-obsidian font-bold text-xs uppercase tracking-wider gap-2 shadow-lg"
              >
                <Upload className={`w-3.5 h-3.5 ${isUploading ? "animate-spin" : ""}`} />
                {isUploading ? "Uploading & Activating Video..." : "Upload & Set as Active Background"}
              </Button>
            )}
          </div>

          {/* Method 2: Direct Video URL & Display Settings */}
          <div className="space-y-6 p-5 rounded-2xl border border-white/10 bg-obsidian-dark/60">
            <div className="space-y-2">
              <Label htmlFor="video-url" className="flex items-center gap-2 text-gold-400 font-bold text-sm">
                <LinkIcon className="w-4 h-4" />
                Direct Video Link / CDN URL
              </Label>
              <p className="text-xs text-white/50">
                Or paste a hosted direct MP4 video link (e.g. S3, Cloudflare, Vimeo direct URL).
              </p>
              <Input
                id="video-url"
                type="url"
                placeholder="https://your-domain.com/videos/carnival-hero.mp4"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="bg-obsidian border-white/20 text-xs font-mono"
              />
            </div>

            {/* Display Adjustments */}
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Sliders className="w-3.5 h-3.5 text-gold-400" />
                Video Filter Adjustments
              </div>

              {/* Opacity Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-white/70">
                  <span>Video Opacity</span>
                  <span className="text-gold-400 font-bold">{Math.round(opacity * 100)}%</span>
                </div>
                <Slider
                  value={[opacity]}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  onValueChange={(val) => setOpacity(val[0])}
                  className="py-1"
                />
              </div>

              {/* Brightness Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-white/70">
                  <span>Brightness</span>
                  <span className="text-gold-400 font-bold">{brightness}%</span>
                </div>
                <Slider
                  value={[brightness]}
                  min={50}
                  max={150}
                  step={5}
                  onValueChange={(val) => setBrightness(val[0])}
                  className="py-1"
                />
              </div>

              {/* Contrast Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-white/70">
                  <span>Contrast</span>
                  <span className="text-gold-400 font-bold">{contrast}%</span>
                </div>
                <Slider
                  value={[contrast]}
                  min={80}
                  max={180}
                  step={5}
                  onValueChange={(val) => setContrast(val[0])}
                  className="py-1"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveSettings}
              className="w-full bg-gold-500/20 hover:bg-gold-500 text-gold-300 hover:text-obsidian border border-gold-500/40 font-bold text-xs uppercase tracking-wider gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              Save URL & Display Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
