import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { LaptopIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'outline',
  size = 'icon',
  showLabel = false,
}) => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load the theme from localStorage or set to system preference initially
  useEffect(() => {
    const savedTheme = localStorage.getItem('sg-theme-preference');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [setTheme]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('sg-theme-preference', newTheme);
    
    // Show toast notification
    const themeLabels: Record<string, string> = {
      'light': 'Light mode activated',
      'dark': 'Dark mode activated',
      'system': 'Using system preference for theme'
    };
    
    toast({
      title: 'Theme Changed',
      description: themeLabels[newTheme] || 'Theme updated',
      duration: 2000,
    });
  };

  if (!mounted) {
    // Avoid rendering anything until the component has mounted to prevent hydration errors
    return <Button className={className} variant={variant} size={size} disabled />;
  }

  // Custom SVG Smiley Face components
  const LightSmiley = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
      <line x1="9" y1="9" x2="9.01" y2="9"></line>
      <line x1="15" y1="9" x2="15.01" y2="9"></line>
    </svg>
  );
  
  const DarkSmiley = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 13s1.5 2 4 2 4-2 4-2"></path>
      <line x1="9" y1="9" x2="9.01" y2="9"></line>
      <line x1="15" y1="9" x2="15.01" y2="9"></line>
      <line x1="12" y1="5" x2="12" y2="3"></line>
    </svg>
  );

  // Determine which icon to show based on the current theme
  const getThemeIcon = () => {
    if (theme === 'light') return <LightSmiley />;
    if (theme === 'dark') return <DarkSmiley />;
    return <LaptopIcon className="h-[1.2rem] w-[1.2rem]" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {getThemeIcon()}
          {showLabel && (
            <span className="ml-2">
              {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto'}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleThemeChange('light')}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center">
            <LightSmiley />
            <span className="ml-2">Light</span>
          </div>
          {theme === 'light' && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleThemeChange('dark')}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center">
            <DarkSmiley />
            <span className="ml-2">Dark</span>
          </div>
          {theme === 'dark' && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleThemeChange('system')}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center">
            <LaptopIcon className="h-4 w-4 mr-2" />
            <span>System</span>
          </div>
          {theme === 'system' && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;