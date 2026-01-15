"use client";

import { useEffect } from "react";
import { Event, Product, Livestream } from "@/lib/types";
import CinematicHero from "@/components/home/CinematicHero";
import ImmersiveStory from "@/components/home/ImmersiveStory";
import LifestyleGrid from "@/components/home/LifestyleGrid";
import MinimalNav from "@/components/layout/MinimalNav";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface HomeClientProps {
    initialFeaturedEvents: Event[];
    initialFeaturedProducts: Product[];
    initialLivestream: Livestream | undefined;
    initialPosts: any[];
}

const HomeClient = ({
    initialFeaturedEvents,
    initialFeaturedProducts,
    initialLivestream,
    initialPosts
}: HomeClientProps) => {
    const router = useRouter();

    // Smooth scroll setup could go here if using Lenis

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white overflow-x-hidden">
            <MinimalNav />

            <CinematicHero />

            <ImmersiveStory />

            <LifestyleGrid
                events={initialFeaturedEvents}
                products={initialFeaturedProducts}
            />

            {/* Final CTA / Footer Tease */}
            <section className="py-32 bg-background flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-void-gradient" />
                <div className="relative z-10 max-w-4xl mx-auto">
                    <p className="text-primary text-sm font-bold tracking-[0.4em] uppercase mb-6">
                        The Night is Yours
                    </p>
                    <h2 className="text-6xl md:text-9xl font-heading text-white/90 uppercase tracking-tighter mb-10 leading-[0.85]">
                        Savage <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Vibes</span>
                    </h2>
                    <Button
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-white text-lg px-12 py-8 rounded-full shadow-neon font-heading tracking-widest transition-all duration-300 hover:scale-105"
                        onClick={() => router.push('/events')}
                    >
                        Explore Events
                    </Button>
                </div>
            </section>

            {/* Simple Footer (Placeholder for global footer) */}
            <footer className="py-12 bg-black border-t border-white/5 text-center">
                <p className="text-gray-500 text-xs uppercase tracking-widest">
                    © {new Date().getFullYear()} Savage Gentlemen. All Rights Reserved.
                </p>
            </footer>
        </main>
    );
};

export default HomeClient;
