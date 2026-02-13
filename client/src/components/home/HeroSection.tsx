import React from 'react';
import { ArrowRight, Terminal, Map } from 'lucide-react';
import { Link } from 'wouter';

export const HeroSection = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center relative w-full pt-10">

            <div className="z-10 relative max-w-5xl mx-auto px-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-terminal-green/30 bg-terminal-green/5 text-terminal-green font-mono text-xs tracking-widest mb-8 animate-fade-in-up">
                    <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse"></span>
                    SYSTEM V2.0 ONLINE
                </div>

                <h1 className="text-5xl md:text-8xl font-heading tracking-tighter mb-8 leading-tight animate-fade-in-up animate-delay-100">
                    THE FUTURE OF <br />
                    <span className="glitch-text text-transparent bg-clip-text bg-gradient-to-r from-terminal-green to-hologram-blue" data-text="SURVIVAL">SURVIVAL</span>
                </h1>

                <p className="text-lg md:text-xl font-mono text-white/60 mb-12 max-w-2xl mx-auto animate-fade-in-up animate-delay-200">
                    Advanced linguistic programming and tactical intelligence protocols.
                    Upgrade your capabilities.
                </p>

                <div className="flex flex-col md:flex-row gap-6 justify-center w-full max-w-xl mx-auto animate-fade-in-up animate-delay-300">
                    <Link href="/apps/language-sensei">
                        <a className="flex-1 w-full px-8 py-4 bg-terminal-green/10 border border-terminal-green text-terminal-green font-mono tracking-widest hover:bg-terminal-green hover:text-void-black transition-all duration-300 flex items-center justify-center gap-4 group cursor-pointer clip-corner">
                            <Terminal size={18} />
                            LANGUAGE SENSEI
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </Link>

                    <Link href="/apps/survival-map">
                        <a className="flex-1 w-full px-8 py-4 bg-void-black border border-white/20 text-white font-mono tracking-widest hover:border-hologram-blue hover:text-hologram-blue transition-all duration-300 flex items-center justify-center gap-4 group cursor-pointer clip-corner">
                            <Map size={18} />
                            SURVIVAL MAP
                        </a>
                    </Link>
                </div>
            </div>

            {/* Background Elements */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full z-0 pointer-events-none animate-spin-slow opacity-20 hidden md:block"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-terminal-green/10 rotate-45 z-0 pointer-events-none hidden md:block"></div>
        </div>
    );
};
