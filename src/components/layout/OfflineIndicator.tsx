import { WifiOff } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  return (
    <div className={cn("offline-indicator", !isOnline && "show")}>
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Some features may be limited.</span>
      </div>
    </div>
  );
}