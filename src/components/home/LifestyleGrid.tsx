"use client";

import { Event, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png";

// Reusable Bento Card Component
const BentoCard = ({
    className,
    children,
    href,
    image
}: {
    className?: string;
    children: React.ReactNode;
    href?: string;
    image?: string;
}) => {
    return (
        <div className={cn(
            "group relative overflow-hidden rounded-3xl bg-card border border-white/5 hover:border-primary/30 transition-all duration-500",
            className
        )}>
            {/* Background Image with Zoom Effect */}
            {image && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-60 group-hover:opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                </div>
            )}

            {/* Content Content */}
            <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-end">
                {href && (
                    <Link href={href} className="absolute inset-0 z-20 focus:outline-none">
                        <span className="sr-only">View Details</span>
                    </Link>
                )}

                {/* Hover Indicator */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <div className="bg-white/10 backdrop-blur-md p-2 rounded-full text-white">
                        <ArrowUpRight className="w-5 h-5" />
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
};

interface LifestyleGridProps {
    events: Event[];
    products: Product[];
}

const LifestyleGrid = ({ events, products }: LifestyleGridProps) => {
    const mainEvent = events && events[0];
    const secondaryEvent = events && events[1];
    const featuredProduct = products && products[0];

    return (
        <section className="py-24 px-4 bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-16 px-2">
                    <div>
                        <span className="text-primary text-xs font-bold tracking-[0.3em] uppercase mb-4 block">The Collection</span>
                        <h2 className="text-5xl md:text-8xl font-heading text-white uppercase tracking-tighter leading-[0.8]">
                            Curated <br /> Lifestyle
                        </h2>
                    </div>
                    <Link href="/events" className="hidden md:block text-white/60 hover:text-white transition-colors text-sm uppercase tracking-widest border-b border-transparent hover:border-white pb-1">
                        View All Experiences
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[350px]">
                    {/* Main Feature - Large Square */}
                    {mainEvent ? (
                        <BentoCard
                            className="md:col-span-2 md:row-span-2"
                            href={`/events`}
                            image={mainEvent.imageUrl || SGFlyerLogoPng.src}
                        >
                            <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-4 w-fit">
                                Featured Event
                            </span>
                            <h3 className="text-4xl md:text-5xl font-heading text-white uppercase mb-2 leading-none">
                                {mainEvent.title}
                            </h3>
                            <p className="text-gray-300 text-sm font-medium uppercase tracking-wide">
                                {new Date(mainEvent.date).toLocaleDateString()} • {mainEvent.location}
                            </p>
                        </BentoCard>
                    ) : (
                        // Fallback if no main event
                        <BentoCard className="md:col-span-2 md:row-span-2" image={SGFlyerLogoPng.src}>
                            <h3 className="text-4xl font-heading text-white uppercase">Experience the Vibe</h3>
                        </BentoCard>
                    )}

                    {/* Secondary Event - Tall */}
                    {secondaryEvent && (
                        <BentoCard
                            className="md:col-span-1 md:row-span-2 bg-gradient-to-b from-card to-black"
                            href={`/events`}
                            image={secondaryEvent.imageUrl || undefined}
                        >
                            <h3 className="text-2xl font-heading text-white uppercase mb-2 leading-none">
                                {secondaryEvent.title}
                            </h3>
                            <p className="text-primary text-xs font-bold uppercase tracking-widest">
                                Upcoming
                            </p>
                        </BentoCard>
                    )}

                    {/* Shop Item - Small */}
                    {featuredProduct && (
                        <BentoCard
                            className="md:col-span-1 md:row-span-1 bg-zinc-900"
                            href={`/shop`}
                            image={featuredProduct.imageUrl || SGFlyerLogoPng.src}
                        >
                            <div className="mt-auto">
                                <span className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">New Drop</span>
                                <h4 className="text-lg font-bold text-white leading-tight">{featuredProduct.title}</h4>
                            </div>
                        </BentoCard>
                    )}

                    {/* Soca Passport Link - Small */}
                    <BentoCard
                        className="md:col-span-1 md:row-span-1 group cursor-pointer"
                        href="/socapassport"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-900 to-blue-900 opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 flex flex-col items-center justify-center text-center h-full">
                            <h3 className="text-3xl font-heading text-white uppercase mb-2">Join The <br /> Movement</h3>
                            <p className="text-[10px] text-white/80 uppercase tracking-widest">Soca Passport</p>
                        </div>
                    </BentoCard>

                    {/* Carnival Planner Ad - Wide */}
                    <BentoCard
                        className="md:col-span-2 md:row-span-1 bg-black border-none"
                        href="https://carnival-planner.com"
                        image="/uploads/carnival-planner-ad.png"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10" />
                        <div className="relative z-20 flex flex-col justify-center h-full max-w-sm">
                            <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                Partner <ArrowUpRight className="w-3 h-3" />
                            </span>
                            <h3 className="text-3xl font-heading text-white uppercase mb-2 leading-none">
                                Simply Your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Carnival</span>
                            </h3>
                            <p className="text-sm text-gray-300 font-light mb-0">
                                The ultimate tool for planning flights, costumes, and events.
                            </p>
                        </div>
                    </BentoCard>
                </div>
            </div>
        </section>
    );
};

export default LifestyleGrid;
