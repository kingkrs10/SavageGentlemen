import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (newTheme: 'tactical' | 'luxury') => {
    setTheme(newTheme);
    
    const themeLabels: Record<string, string> = {
      'tactical': 'Tactical Dark mode activated',
      'luxury': 'Luxury Gold mode activated',
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

  const getThemeIcon = () => {
    if (theme === 'luxury') return <LightSmiley />;
    return <DarkSmiley />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {getThemeIcon()}
          {showLabel && (
            <span className="ml-2">
              {theme === 'luxury' ? 'Luxury' : 'Tactical'}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleThemeChange('tactical')}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center">
            <DarkSmiley />
            <span className="ml-2">Tactical Dark</span>
          </div>
          {theme === 'tactical' && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleThemeChange('luxury')}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center">
            <LightSmiley />
            <span className="ml-2">Luxury Gold</span>
          </div>
          {theme === 'luxury' && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


export default ThemeToggle;