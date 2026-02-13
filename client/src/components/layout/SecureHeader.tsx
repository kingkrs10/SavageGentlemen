import React from 'react';
import { Shield, Radio, Lock } from 'lucide-react';
import { Link } from 'wouter';

export const SecureHeader = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-void-black/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 holo-border border-b-only">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <a className="font-heading text-2xl tracking-tighter text-foreground glitch-text hover:text-terminal-green transition-colors cursor-pointer" data-text="SAVGENT">SAVGENT</a>
                </Link>
                <div className="h-4 w-[1px] bg-white/20"></div>
                <div className="flex items-center gap-2">
                    <Radio size={12} className="text-terminal-green animate-pulse" />
                    <span className="font-mono text-[10px] tracking-widest text-terminal-green opacity-80">SYSTEM: ONLINE</span>
                </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-[10px] tracking-widest text-white/40">
                <div className="hidden md:flex items-center gap-2">
                    <span>LOC: SECTOR 7</span>
                    <span className="text-white/10">|</span>
                    <span>GRID: ACTIVE</span>
                </div>

                <Link href="/auth">
                    <button className="flex items-center gap-2 text-white/60 hover:text-terminal-green transition-all duration-300 border border-white/10 hover:border-terminal-green/50 px-3 py-1 rounded bg-white/5 hover:bg-terminal-green/10">
                        <Shield size={12} />
                        <span>SECURE ACCESS</span>
                    </button>
                </Link>
            </div>
        </header>
    );
};
