import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LogoSvg from "@/assets/logo.svg";
import SGLogo from "@/assets/sg-logo.png";
import IntroVideo from "@/assets/videos/intro.mp4";

const SplashScreen = () => {
  const [videoEnded, setVideoEnded] = useState(false);
  
  // Auto-proceed to logo after video or if video fails to load
  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoEnded(true);
    }, 5000); // Fallback timeout
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden">
      {!videoEnded ? (
        <div className="w-full h-full absolute top-0 left-0">
          <video 
            className="w-full h-full object-cover"
            autoPlay 
            muted 
            playsInline
            onEnded={() => setVideoEnded(true)}
            onError={() => setVideoEnded(true)}
          >
            <source src={IntroVideo} type="video/mp4" />
          </video>
        </div>
      ) : (
        <>
          <motion.div
            className="w-[200px] h-[200px]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              repeat: 2,
              repeatType: "reverse",
              repeatDelay: 0.5,
            }}
          >
            <img 
              src={SGLogo}
              alt="Savage Gentlemen Logo" 
              className="w-full h-full" 
            />
          </motion.div>
          
          <motion.h1
            className="mt-6 text-4xl font-heading text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            SAVAGE GENTLEMEN
          </motion.h1>
          
          <motion.p
            className="mt-2 text-accent font-accent text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            Caribbean-American Experience
          </motion.p>
        </>
      )}
    </div>
  );
};

export default SplashScreen;
