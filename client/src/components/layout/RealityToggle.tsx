import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Eye, EyeOff } from 'lucide-react';

export const RealityToggle = () => {
    const { theme, toggleTheme } = useTheme();

    // Hide on luxury mode — Enter the Void is already on the landing page
    if (theme === 'luxury') return null;

    return (
        <button
            onClick={toggleTheme}
            className={`fixed bottom-6 right-4 md:bottom-8 md:right-8 z-[9999] px-3 py-2 rounded-full transition-all duration-500 group flex items-center gap-2 text-xs font-medium border ${theme === 'luxury'
                ? 'bg-black/40 text-white/70 hover:bg-black/60 border-white/10 backdrop-blur-md'
                : 'bg-black/30 text-terminal-green/70 border-terminal-green/30 hover:bg-black/50 hover:text-terminal-green hover:border-terminal-green/60 hover:shadow-[0_0_15px_rgba(0,255,153,0.3)] backdrop-blur-md'
                }`}
            aria-label="Toggle Reality"
        >
            {theme === 'luxury' ? (
                <>
                    <Eye size={14} className="group-hover:scale-110 transition-transform" />
                    <span>EXIT</span>
                </>
            ) : (
                <>
                    <EyeOff size={14} className="animate-pulse" />
                    <span>EXIT</span>
                </>
            )}
        </button>
    );
};
