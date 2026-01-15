"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png";
import { cn } from "@/lib/utils";

const ImmersiveStory = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

    const steps = [
        {
            title: "The Origin",
            description: "Born from the underground. Forged in the fires of carnival. We are the curators of a new era of Caribbean culture.",
        },
        {
            title: "The Experience",
            description: "It's not just an event. It's a memory etched in gold. Premium venues, top-tier entertainment, and an atmosphere that can't be replicated.",
        },
        {
            title: "The Legacy",
            description: "Join a community of connoisseurs. Savage Gentlemen is a lifestyle, a statement, and a promise of excellence.",
        },
    ];

    return (
        <section ref={containerRef} className="relative h-[250vh] bg-background">
            {/* Sticky Background */}
            <div className="sticky top-0 h-screen w-full overflow-hidden">
                <motion.div
                    style={{ scale, opacity }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900/40 to-zinc-950 z-10" />
                    <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10" />
                    {/* Abstract Cinematic Background */}
                    <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black" />
                    <img
                        src={SGFlyerLogoPng.src}
                        alt="Background Crest"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] object-contain opacity-25 grayscale blur-sm mix-blend-soft-light"
                    />
                </motion.div>
            </div>

            {/* Scrolling Content */}
            <div className="relative z-10 -mt-[250vh]">
                {steps.map((step, index) => (
                    <div key={index} className="h-screen flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            viewport={{ once: false, margin: "-20%" }}
                            className="max-w-2xl text-center space-y-6 p-8 md:p-12 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl"
                        >
                            <h3 className="text-sm font-bold text-primary uppercase tracking-[0.3em] mb-2">
                                Chapter 0{index + 1}
                            </h3>
                            <h2 className="text-5xl md:text-7xl font-heading text-white uppercase tracking-tighter leading-none">
                                {step.title}
                            </h2>
                            <p className="text-lg md:text-xl text-gray-300 font-light leading-relaxed">
                                {step.description}
                            </p>
                        </motion.div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ImmersiveStory;
