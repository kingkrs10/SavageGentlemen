import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Event card loading skeleton
export const EventCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="p-0">
      <Skeleton className="h-48 w-full" />
    </CardHeader>
    <CardContent className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-6 w-16" />
      </div>
    </CardContent>
  </Card>
);

// Product card loading skeleton
export const ProductCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="p-0">
      <Skeleton className="h-40 w-full" />
    </CardHeader>
    <CardContent className="p-3 space-y-2">
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-12" />
      </div>
    </CardContent>
  </Card>
);

// List item skeleton
export const ListItemSkeleton = () => (
  <div className="flex items-center space-x-3 p-4 border rounded-lg">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-8 w-20" />
  </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ cols = 4 }: { cols?: number }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-2">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// Page loading skeleton
export const PageLoadingSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

// Form loading skeleton
export const FormLoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-24 w-full" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
    <div className="flex justify-end space-x-2">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

// Mobile optimized loading spinner
export const MobileLoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    <p className="text-sm text-muted-foreground text-center">{message}</p>
  </div>
);

// Error state component
export const ErrorState = ({ 
  title = "Something went wrong", 
  message = "Please try again later.",
  onRetry 
}: { 
  title?: string;
  message?: string;
  onRetry?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
      <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{message}</p>
    </div>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);