import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";

export default function NotFound() {
  const [, navigate] = useLocation();
  
  return (
    <>
      <SEOHead 
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Navigate back to the Savage Gentlemen homepage."
      />
      <div className="min-h-[80vh] w-full flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 border-red-500/30 bg-background/95">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center text-center mb-6 gap-3">
              <div className="w-16 h-16 text-red-500 mb-2">
                <AlertTriangle className="w-full h-full" />
              </div>
              <h1 className="text-3xl font-bold text-white">Page Not Found</h1>
              <div className="w-16 h-1 bg-red-500 rounded-full my-2"></div>
              <p className="mt-2 text-gray-400">
                Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or doesn't exist.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pb-8">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto" 
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button 
              className="w-full sm:w-auto" 
              onClick={() => navigate("/")}
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
