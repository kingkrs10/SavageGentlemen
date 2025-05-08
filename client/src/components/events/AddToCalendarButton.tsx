import React, { useState } from 'react';
import { Calendar, CalendarPlus, ChevronDown, Apple, Smartphone } from 'lucide-react';
import { FaGoogle, FaMicrosoft, FaYahoo } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Event } from '@/lib/types';
import { 
  saveEventToCalendar, 
  getGoogleCalendarUrl, 
  getOutlookCalendarUrl, 
  getYahooCalendarUrl 
} from '@/lib/calendarService';
import { useToast } from '@/hooks/use-toast';

interface AddToCalendarButtonProps {
  event: Event;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
}

const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({ 
  event, 
  variant = 'outline',
  size = 'default',
  className = '',
}) => {
  const { toast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSaveToIcs = (e: React.MouseEvent) => {
    e.preventDefault();
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

  const openExternalCalendar = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="flex items-center gap-2" onClick={handleSaveToIcs}>
          <Calendar className="h-4 w-4" />
          <span>Download .ics file</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2" 
          onClick={() => openExternalCalendar(getGoogleCalendarUrl(event))}
        >
          <FaGoogle className="h-4 w-4" />
          <span>Google Calendar</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2" 
          onClick={() => openExternalCalendar(getOutlookCalendarUrl(event))}
        >
          <FaMicrosoft className="h-4 w-4" />
          <span>Outlook Calendar</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2"
          onClick={() => openExternalCalendar(getYahooCalendarUrl(event))}
        >
          <FaYahoo className="h-4 w-4" />
          <span>Yahoo Calendar</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2"
          onClick={handleSaveToIcs}
        >
          <Apple className="h-4 w-4" />
          <span>Apple Calendar</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2"
          onClick={handleSaveToIcs}
        >
          <Smartphone className="h-4 w-4" />
          <span>Other Calendar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddToCalendarButton;