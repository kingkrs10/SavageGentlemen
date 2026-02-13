import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Eye, EyeOff } from 'lucide-react';

export const RealityToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[100] p-3 rounded-full transition-all duration-500 shadow-2xl group ${theme === 'luxury'
                    ? 'bg-white text-black hover:bg-gray-100 border border-gray-200 hover:rotate-180'
                    : 'bg-black text-terminal-green border border-terminal-green hover:shadow-[0_0_20px_rgba(0,255,153,0.5)] hover:bg-terminal-green/10'
                }`}
            aria-label="Toggle Reality"
            title="Press ESC to Toggle Reality"
        >
            {theme === 'luxury' ? (
                <Eye size={20} className="group-hover:scale-110 transition-transform" />
            ) : (
                <EyeOff size={20} className="animate-pulse" />
            )}

            {/* Tooltip hint */}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-mono bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {theme === 'luxury' ? 'REVEAL TRUTH (ESC)' : 'CLOAK MODE (ESC)'}
            </span>
        </button>
    );
};
