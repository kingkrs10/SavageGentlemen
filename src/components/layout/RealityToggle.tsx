"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Shield, Eye, EyeOff } from "lucide-react";

export function RealityToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isSimulation = theme === "dark" || theme === "system";

    const toggleReality = () => {
        setTheme(isSimulation ? "light" : "dark");
    };

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleReality}
            className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/10 hover:bg-black/20 border border-white/5 backdrop-blur-sm transition-all duration-300 group"
        >
            <div className="relative flex items-center justify-center w-4 h-4">
                <AnimatePresence mode="wait">
                    {isSimulation ? (
                        <motion.div
                            key="sim"
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                        >
                            <Terminal className="w-3 h-3 text-primary/70 group-hover:text-primary transition-colors" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="real"
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                        >
                            <Shield className="w-3 h-3 text-accent/70 group-hover:text-accent transition-colors" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <span className="text-[10px] uppercase tracking-widest font-medium text-white/40 group-hover:text-white/70 transition-colors">
                {isSimulation ? "Exit Simulation" : "Enter Reality"}
            </span>
        </motion.button>
    );
}
