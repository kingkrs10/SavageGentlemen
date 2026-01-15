"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const CinematicHero = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    // Parallax effects
    const yText = useTransform(scrollY, [0, 500], [0, 200]);
    const opacityText = useTransform(scrollY, [0, 300], [1, 0]);
    const scaleVideo = useTransform(scrollY, [0, 1000], [1, 1.2]);

    return (
        <div ref={containerRef} className="relative h-screen w-full overflow-hidden bg-black">
            {/* Background Video */}
            <motion.div
                className="absolute inset-0 z-0"
                style={{ scale: scaleVideo }}
            >
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover opacity-60"
                >
                    <source src="/videos/brand-video.mp4" type="video/mp4" />
                </video>
                {/* Cinematic Gradient Overlays */}
                <div className="absolute inset-0 bg-void-gradient opacity-40 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent h-full w-full" />
            </motion.div>

            {/* Hero Content */}
            <motion.div
                className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center"
                style={{ y: yText, opacity: opacityText }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                >
                    <h2 className="text-sm md:text-base font-bold tracking-[0.3em] uppercase text-primary mb-4 drop-shadow-md">
                        Est. MMXVI
                    </h2>
                </motion.div>

                <motion.h1
                    className="font-heading text-7xl md:text-[10rem] leading-[0.85] text-white uppercase tracking-tighter mb-6 mix-blend-overlay opacity-90"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                >
                    Savage <br /> Gentlemen
                </motion.h1>

                <motion.p
                    className="max-w-xl text-lg md:text-xl text-gray-300 font-light tracking-wide mb-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                >
                    Where high culture meets the underground. <br />
                    <span className="text-white/60 text-sm mt-2 block">Curated Nightlife • Premium Apparel • Exclusive Events</span>
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1.2 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <Button
                        variant="default"
                        size="lg"
                        className="bg-white text-black hover:bg-gray-200 rounded-full px-8 py-6 text-sm font-bold uppercase tracking-widest"
                    >
                        Shop Collection
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm rounded-full px-8 py-6 text-sm font-bold uppercase tracking-widest"
                    >
                        Upcoming Events
                    </Button>
                </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-white/50"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
                <span className="text-[10px] uppercase tracking-[0.2em] mb-2 block text-center">Scroll</span>
                <ChevronDown className="w-6 h-6 mx-auto opacity-70" />
            </motion.div>
        </div>
    );
};

export default CinematicHero;
