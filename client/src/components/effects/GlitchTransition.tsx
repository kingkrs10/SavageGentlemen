import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import gsap from 'gsap';

export const GlitchTransition = () => {
    const { isTransitioning, setIsTransitioning } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isTransitioning) return;

        // Safety fallback timer to guarantee transition ends even if GSAP is interrupted
        const safetyTimer = setTimeout(() => {
            setIsTransitioning(false);
        }, 1000);

        if (containerRef.current && overlayRef.current) {
            try {
                const tl = gsap.timeline({
                    onComplete: () => {
                        setIsTransitioning(false);
                    }
                });

                // Initial Flash
                tl.to(containerRef.current, {
                    opacity: 1,
                    duration: 0.1,
                    ease: 'power4.in'
                })
                // Glitch Shake & Distortion
                .to(containerRef.current, {
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                    duration: 0.1
                })
                .to(containerRef.current, {
                    clipPath: 'polygon(0 15%, 100% 15%, 100% 85%, 0 85%)',
                    duration: 0.1
                })
                .to(containerRef.current, {
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                    duration: 0.1
                })
                // Color Flash Overlay
                .to(overlayRef.current, {
                    opacity: 1,
                    duration: 0.1,
                    backgroundColor: '#ffffff'
                })
                .to(overlayRef.current, {
                    opacity: 0,
                    duration: 0.4
                })
                // Fade Out Container
                .to(containerRef.current, {
                    opacity: 0,
                    duration: 0.3
                });
            } catch (err) {
                console.error("GlitchTransition error:", err);
                setIsTransitioning(false);
            }
        }

        return () => clearTimeout(safetyTimer);
    }, [isTransitioning, setIsTransitioning]);


    if (!isTransitioning) return null;

    return (
        <div ref={containerRef} className="fixed inset-0 z-[9999] pointer-events-none opacity-0 bg-black flex items-center justify-center overflow-hidden">
            {/* Static Noise */}
            <div className="absolute inset-0 opacity-20 bg-[url('/noise.png')] animate-pulse"></div>

            {/* Flash Overlay */}
            <div ref={overlayRef} className="absolute inset-0 bg-white opacity-0 mix-blend-difference"></div>

            {/* Glitch Rectangles */}
            <div className="w-full h-20 bg-terminal-green absolute top-1/4 left-0 transform -skew-x-12 opacity-50 mix-blend-multiply"></div>
            <div className="w-full h-40 bg-neon-amber absolute bottom-1/3 right-0 transform skew-x-12 opacity-50 mix-blend-color-dodge"></div>

            <h1 className="text-9xl font-heading text-white mix-blend-difference glitch-text">REALITY SHIFT</h1>
        </div>
    );
};
