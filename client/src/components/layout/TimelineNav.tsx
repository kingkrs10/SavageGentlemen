import React from 'react';
import { Home, Brain, Map, Activity, User } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export const TimelineNav = () => {
    const [location] = useLocation();

    const navItems = [
        { label: 'BASE', icon: Home, path: '/' },
        { label: 'SENSEI', icon: Brain, path: '/apps/language-sensei' },
        { label: 'SURVIVAL', icon: Map, path: '/apps/survival-map' },
        { label: 'INTEL', icon: Activity, path: '/intel' },
        { label: 'ID', icon: User, path: '/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-void-black/90 backdrop-blur-lg border-t border-terminal-green/20">
            {/* Scanning Line Effect on Top Border */}
            <div className="absolute top-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-terminal-green to-transparent opacity-50 animate-pulse"></div>

            <div className="container mx-auto h-full flex items-center justify-around md:justify-center md:gap-16 px-4">
                {navItems.map((item) => {
                    const isActive = location === item.path;
                    const Icon = item.icon;

                    return (
                        <Link key={item.path} href={item.path}>
                            <div className={`cursor-pointer group flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-terminal-green translate-y-[-4px]' : 'text-white/20 hover:text-white/60'}`}>
                                <div className={`p-2 rounded-lg transition-all ${isActive ? 'bg-terminal-green/10 shadow-[0_0_15px_rgba(0,255,153,0.3)]' : ''}`}>
                                    <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
                                </div>
                                <span className="text-[10px] font-mono tracking-[0.2em]">{item.label}</span>
                                {isActive && <div className="w-1 h-1 rounded-full bg-terminal-green mt-1"></div>}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
