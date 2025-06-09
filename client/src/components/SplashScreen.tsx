import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SGFlyerLogoPng from "@assets/SGFLYERLOGO.png";

// Debug helper
console.log("Loading SplashScreen component");

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [showLogo, setShowLogo] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Auto-proceed to main app
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      onComplete();
    }, 2000); // Show logo for 2 seconds
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  // Handle the end of the logo animation and dismiss splash screen
  useEffect(() => {
    if (videoEnded && !animationComplete) {
      // After video ends, wait for logo animation then dismiss splash
      const timer = setTimeout(() => {
        console.log("Logo animation complete, dismissing splash screen");
        setAnimationComplete(true);
        onComplete(); // Signal the parent component to dismiss splash
      }, 3000); // Time for logo animation to play
      
      return () => clearTimeout(timer);
    }
  }, [videoEnded, animationComplete, onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden">
      {!videoEnded ? (
        <div className="w-full h-full absolute top-0 left-0">
          {/* Background overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-10"></div>
          
          {/* Video with improved mobile centering */}
          <video 
            className="w-full h-full object-cover object-center"
            autoPlay 
            muted 
            playsInline
            onEnded={handleVideoEnd}
            onError={handleVideoEnd}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              minWidth: '100%',
              minHeight: '100%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <source src={IntroVideo} type="video/mp4" />
          </video>
          
          {/* Logo overlay during video */}
          <div className="absolute top-10 left-0 right-0 flex justify-center z-20">
            <img 
              src={SGFlyerLogoPng} 
              alt="Savage Gentlemen Logo" 
              className="h-20 object-contain" 
            />
          </div>
        </div>
      ) : (
        <>
          {/* Logo animation after video */}
          <motion.div
            className="w-[250px] h-[250px]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.8,
              repeat: 1,
              repeatType: "reverse",
              repeatDelay: 0.3,
            }}
          >
            <img 
              src={SGFlyerLogoPng}
              alt="Savage Gentlemen Logo" 
              className="w-full h-full object-contain" 
            />
          </motion.div>
          
          <motion.h1
            className="mt-6 text-4xl md:text-5xl font-heading text-white uppercase tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            SAVAGE GENTLEMEN
          </motion.h1>
          
          <motion.p
            className="mt-3 text-accent font-accent text-xl md:text-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            Caribbean-American Experience
          </motion.p>
          
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <div className="px-4 py-2 border border-primary/50 bg-black/50 text-white/80 text-sm tracking-widest uppercase">
              Loading Experience...
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default SplashScreen;
