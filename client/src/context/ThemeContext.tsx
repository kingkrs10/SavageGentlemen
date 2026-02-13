import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'tactical' | 'luxury';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    isTransitioning: boolean;
    setIsTransitioning: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize from localStorage or default to 'luxury'
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme');
        return (saved === 'tactical' || saved === 'luxury') ? saved : 'luxury';
    });
    const [isTransitioning, setIsTransitioning] = useState(false);

    const toggleTheme = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);

        // The actual theme switch happens halfway through the glitch animation
        setTimeout(() => {
            setTheme(prev => prev === 'tactical' ? 'luxury' : 'tactical');
        }, 800);

        // Animation cleanup happens in GlitchTransition component
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                toggleTheme();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTransitioning]);

    useEffect(() => {
        // Persist theme choice
        localStorage.setItem('theme', theme);

        // Apply theme class to body
        document.body.classList.remove('theme-luxury', 'theme-tactical');
        document.body.classList.add(`theme-${theme}`);

        // Also toggle dark mode class for Tailwind
        if (theme === 'tactical') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
    }, [theme]);

    // Initial setup
    useEffect(() => {
        document.body.classList.add('theme-luxury');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isTransitioning, setIsTransitioning }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
