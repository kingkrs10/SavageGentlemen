import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SGFlyerLogoPng from "@assets/SGFLYERLOGO.png";
import IntroVideo from "@/assets/videos/intro.mp4";

// Debug helper
console.log("Loading SplashScreen component");

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [videoEnded, setVideoEnded] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Handle video end and trigger logo animation
  const handleVideoEnd = () => {
    console.log("Video ended, showing logo animation");
    setVideoEnded(true);
  };
  
  // Auto-proceed to logo after video or if video fails to load (fallback)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!videoEnded) {
        console.log("Video play timeout reached, forcing logo animation");
        setVideoEnded(true);
      }
    }, 8000); // Fallback timeout for video
    
    return () => clearTimeout(timer);
  }, [videoEnded]);
  
  // Handle the end of the logo animation and dismiss splash screen
  useEffect(() => {
    if (videoEnded && !animationComplete) {
      const timer = setTimeout(() => {
        setAnimationComplete(true);
        onComplete();
      }, 1000); // Wait 1 second after video ends before calling onComplete
      
      return () => clearTimeout(timer);
    }
  }, [videoEnded, animationComplete, onComplete]);
  
  const logoVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 1.5,
        ease: "easeOut"
      }
    },
    exit: { 
      scale: 1.2, 
      opacity: 0,
      transition: { 
        duration: 0.8,
        ease: "easeIn" 
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Background video - only show if video hasn't ended */}
      {!videoEnded && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={IntroVideo}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoEnd}
          style={{ 
            filter: 'brightness(1.1)',
            playbackRate: 2.0 // 1x speed increase (normal is 1.0, so 2.0 is 1x faster)
          }}
          onLoadedData={(e) => {
            const video = e.target as HTMLVideoElement;
            video.playbackRate = 2.0; // Ensure 1x speed increase
            video.currentTime = 0.5; // Start slightly after beginning to skip player logos
          }}
          preload="auto"
        />
      )}
      
      {/* Logo animation - show after video ends */}
      {videoEnded && (
        <motion.div
          variants={logoVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex flex-col items-center"
        >
          <img 
            src={SGFlyerLogoPng} 
            alt="Savage Gentlemen" 
            className="w-32 h-32 object-contain"
          />
          <motion.h1 
            className="text-white text-2xl font-bold mt-4 tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            SAVAGE GENTLEMEN
          </motion.h1>
        </motion.div>
      )}
    </div>
  );
};

export default SplashScreen;