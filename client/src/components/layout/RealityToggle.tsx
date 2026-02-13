import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Eye, EyeOff } from 'lucide-react';

export const RealityToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`fixed bottom-24 right-6 md:bottom-12 md:right-12 z-[9999] px-6 py-4 rounded-full transition-all duration-500 shadow-2xl group flex items-center gap-3 font-bold border-2 ${theme === 'luxury'
                    ? 'bg-black text-white hover:bg-gray-900 border-black'
                    : 'bg-black text-terminal-green border-terminal-green hover:shadow-[0_0_30px_rgba(0,255,153,0.6)]'
                }`}
            aria-label="Toggle Reality"
        >
            {theme === 'luxury' ? (
                <>
                    <Eye size={24} className="group-hover:scale-110 transition-transform" />
                    <span>ENTER THE VOID</span>
                </>
            ) : (
                <>
                    <EyeOff size={24} className="animate-pulse" />
                    <span>EXIT SIMULATION</span>
                </>
            )}
        </button>
    );
};
