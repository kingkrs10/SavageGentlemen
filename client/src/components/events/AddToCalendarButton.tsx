import React, { useState } from 'react';
import { Calendar, CalendarPlus, ChevronDown, Apple, Smartphone, Clock } from 'lucide-react';
import { FaGoogle, FaMicrosoft, FaYahoo } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Event } from '@/lib/types';
import { 
  saveEventToCalendar, 
  getGoogleCalendarUrl, 
  getOutlookCalendarUrl, 
  getYahooCalendarUrl,
  getAppleCalendarUrl
} from '@/lib/calendarService';
import { useToast } from '@/hooks/use-toast';

interface AddToCalendarButtonProps {
  event: Event;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
  showOneClickButton?: boolean;
  oneClickProvider?: 'google' | 'outlook' | 'yahoo' | 'apple' | 'download';
}

const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({ 
  event, 
  variant = 'outline',
  size = 'default',
  className = '',
  showOneClickButton = true,
  oneClickProvider = 'google',
}) => {
  const { toast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSaveToIcs = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      saveEventToCalendar(event);
      toast({
        title: 'Success',
        description: 'Event saved to calendar file. Check your downloads.',
      });
    } catch (error) {
      console.error('Error saving to calendar:', error);
      toast({
        title: 'Error',
        description: 'Failed to save event to calendar.',
        variant: 'destructive',
      });
    }
  };

  const openExternalCalendar = (url: string, provider: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    toast({
      title: 'Calendar Opened',
      description: `Event details sent to ${provider}. Please complete the addition in the new tab.`,
    });
  };

  // Handler for one-click button
  const handleOneClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Choose the right provider based on the prop
    switch(oneClickProvider) {
      case 'google':
        openExternalCalendar(getGoogleCalendarUrl(event), 'Google Calendar');
        break;
      case 'outlook':
        openExternalCalendar(getOutlookCalendarUrl(event), 'Outlook Calendar');
        break;
      case 'yahoo':
        openExternalCalendar(getYahooCalendarUrl(event), 'Yahoo Calendar');
        break;
      case 'apple':
      case 'download':
      default:
        handleSaveToIcs(e);
    }
  };

  // Determine which icon to show for the one-click button
  const getOneClickIcon = () => {
    switch(oneClickProvider) {
      case 'google': return <FaGoogle className="h-4 w-4" />;
      case 'outlook': return <FaMicrosoft className="h-4 w-4" />;
      case 'yahoo': return <FaYahoo className="h-4 w-4" />;
      case 'apple': return <Apple className="h-4 w-4" />;
      case 'download': 
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  // Format the event date for display
  const formatEventDate = () => {
    let eventDate: Date;
    
    // Handle different date formats
    if (typeof event.date === 'string') {
      eventDate = new Date(event.date);
    } else {
      eventDate = event.date;
    }
    
    // Format date and time
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // If set to show the one-click button, render a simpler version
  if (showOneClickButton && size === 'sm') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size="icon"
              className={className}
              onClick={handleOneClick}
            >
              <CalendarPlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Add to Calendar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // For one-click with text label
  if (showOneClickButton) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
        onClick={handleOneClick}
      >
        <CalendarPlus className="h-4 w-4" />
        <span>Add to Calendar</span>
      </Button>
    );
  }

  // Full dropdown menu version
  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`flex items-center gap-2 ${className}`}
        >
          <CalendarPlus className="h-4 w-4" />
          <span>Add to Calendar</span>
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-medium">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{formatEventDate()}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="flex items-center gap-2" onClick={handleSaveToIcs}>
          <Calendar className="h-4 w-4" />
          <span>Download .ics file</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openExternalCalendar(getGoogleCalendarUrl(event), 'Google Calendar');
          }}
        >
          <FaGoogle className="h-4 w-4" />
          <span>Google Calendar</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openExternalCalendar(getOutlookCalendarUrl(event), 'Outlook Calendar');
          }}
        >
          <FaMicrosoft className="h-4 w-4" />
          <span>Outlook Calendar</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openExternalCalendar(getYahooCalendarUrl(event), 'Yahoo Calendar');
          }}
        >
          <FaYahoo className="h-4 w-4" />
          <span>Yahoo Calendar</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="flex items-center gap-2"
          onClick={handleSaveToIcs}
        >
          <Apple className="h-4 w-4" />
          <span>Apple Calendar</span>
          <span className="text-xs text-muted-foreground ml-auto">(Download)</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2"
          onClick={handleSaveToIcs}
        >
          <Smartphone className="h-4 w-4" />
          <span>Other Calendar</span>
          <span className="text-xs text-muted-foreground ml-auto">(Download)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddToCalendarButton;