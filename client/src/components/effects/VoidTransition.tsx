import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useTheme } from '@/context/ThemeContext';
import { playVoidSound, stopVoidSound } from '@/lib/void-sound';
import gsap from 'gsap';

interface VoidTransitionProps {
    onComplete?: () => void;
}

export const VoidTransition = ({ onComplete }: VoidTransitionProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLHeadingElement>(null);
    const subTextRef = useRef<HTMLParagraphElement>(null);
    const ringsRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<HTMLDivElement>(null);
    const [, navigate] = useLocation();
    const { setTheme } = useTheme();

    useEffect(() => {
        // Play the soothing frequency sound
        playVoidSound();

        const container = containerRef.current;
        const text = textRef.current;
        const subText = subTextRef.current;
        const rings = ringsRef.current;
        const particles = particlesRef.current;

        if (!container || !text || !subText || !rings || !particles) return;

        // Create ring elements dynamically
        for (let i = 0; i < 5; i++) {
            const ring = document.createElement('div');
            ring.className = 'void-ring';
            ring.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${60 + i * 80}px;
        height: ${60 + i * 80}px;
        border: 1px solid rgba(255, 255, 255, ${0.15 - i * 0.02});
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
      `;
            rings.appendChild(ring);
        }

        // Create particle elements
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 3 + 1;
            particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, ${Math.random() * 0.6 + 0.2});
        border-radius: 50%;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        opacity: 0;
      `;
            particles.appendChild(particle);
        }

        const ringElements = rings.querySelectorAll('.void-ring');
        const particleElements = particles.children;

        // Master timeline
        const tl = gsap.timeline({
            onComplete: () => {
                stopVoidSound();
                setTheme('tactical');
                setTimeout(() => {
                    navigate('/');
                    onComplete?.();
                }, 300);
            },
        });

        // Phase 1: Container fades in
        tl.to(container, {
            opacity: 1,
            duration: 0.4,
            ease: 'power2.inOut',
        });

        // Phase 2: Rings expand outward
        tl.to(
            ringElements,
            {
                scale: 1,
                opacity: 1,
                duration: 1.2,
                stagger: 0.15,
                ease: 'power2.out',
            },
            '-=0.2'
        );

        // Phase 3: Text glitch in
        tl.fromTo(
            text,
            {
                opacity: 0,
                y: 20,
                letterSpacing: '0.5em',
                filter: 'blur(10px)',
            },
            {
                opacity: 1,
                y: 0,
                letterSpacing: '0.3em',
                filter: 'blur(0px)',
                duration: 0.8,
                ease: 'power3.out',
            },
            '-=0.8'
        );

        // Sub text fades in
        tl.fromTo(
            subText,
            { opacity: 0, y: 10 },
            { opacity: 0.6, y: 0, duration: 0.6, ease: 'power2.out' },
            '-=0.4'
        );

        // Phase 4: Particles drift
        tl.to(
            particleElements,
            {
                opacity: (i: number) => Math.random() * 0.8 + 0.2,
                y: () => `${(Math.random() - 0.5) * 100}`,
                x: () => `${(Math.random() - 0.5) * 100}`,
                duration: 1.5,
                stagger: 0.03,
                ease: 'power1.inOut',
            },
            '-=1'
        );

        // Phase 5: Rings pulse
        tl.to(
            ringElements,
            {
                scale: 2,
                opacity: 0,
                duration: 1,
                stagger: 0.1,
                ease: 'power2.in',
            },
            '-=0.5'
        );

        // Phase 6: Everything white-out flash and fade
        tl.to(text, { opacity: 0, filter: 'blur(20px)', duration: 0.4 }, '-=0.6');
        tl.to(subText, { opacity: 0, duration: 0.3 }, '-=0.4');
        tl.to(
            container,
            {
                backgroundColor: '#000000',
                opacity: 0,
                duration: 0.8,
                ease: 'power2.inOut',
            },
            '-=0.2'
        );

        return () => {
            tl.kill();
            stopVoidSound();
        };
    }, [navigate, setTheme, onComplete]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden"
            style={{
                opacity: 0,
                backgroundColor: '#000000',
            }}
        >
            {/* Subtle radial gradient backdrop */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(circle at 50% 50%, rgba(100, 60, 255, 0.08) 0%, rgba(0,0,0,0) 60%)',
                }}
            />

            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('/noise.png')]" />

            {/* Ring container */}
            <div ref={ringsRef} className="absolute inset-0" />

            {/* Particle container */}
            <div ref={particlesRef} className="absolute inset-0" />

            {/* Central text */}
            <div className="relative z-10 text-center">
                <h1
                    ref={textRef}
                    className="text-5xl md:text-8xl font-heading text-white uppercase tracking-[0.3em]"
                    style={{
                        opacity: 0,
                        textShadow: '0 0 40px rgba(100, 60, 255, 0.4), 0 0 80px rgba(100, 60, 255, 0.2)',
                    }}
                >
                    ENTERING THE VOID
                </h1>
                <p
                    ref={subTextRef}
                    className="text-sm md:text-base text-white/60 uppercase tracking-[0.5em] mt-6"
                    style={{ opacity: 0 }}
                >
                    Reality is shifting
                </p>
            </div>
        </div>
    );
};
