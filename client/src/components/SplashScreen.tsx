import { useEffect } from "react";
import { motion } from "framer-motion";
import SGFlyerLogoPng from "@assets/SGFLYERLOGO.png";

console.log("Loading SplashScreen component");

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
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