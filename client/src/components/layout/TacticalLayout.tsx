import React from 'react';
import { SecureHeader } from './SecureHeader';
import { TimelineNav } from './TimelineNav';

interface TacticalLayoutProps {
    children: React.ReactNode;
}

export const TacticalLayout: React.FC<TacticalLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-void-black text-foreground font-body overflow-x-hidden selection:bg-terminal-green selection:text-void-black bg-grid-pattern relative">
            {/* Global FUI Overlay Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-void-black via-transparent to-void-black opacity-80"></div>
                <div className="scanline"></div>
            </div>

            <SecureHeader />

            <main className="relative z-10 pt-20 pb-24 px-4 container mx-auto min-h-screen flex flex-col">
                {children}
            </main>

            <TimelineNav />
        </div>
    );
};
