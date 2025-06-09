import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SGFlyerLogoPng from "@assets/SGFLYERLOGO.png";

// Debug helper
console.log("Loading SplashScreen component");

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Auto-proceed to main app after logo animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      onComplete();
    }, 2500); // Show logo for 2.5 seconds
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
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
      <motion.div
        variants={logoVariants}
        initial="hidden"
        animate="visible"
        exit={animationComplete ? "exit" : "visible"}
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
    </div>
  );
};

export default SplashScreen;