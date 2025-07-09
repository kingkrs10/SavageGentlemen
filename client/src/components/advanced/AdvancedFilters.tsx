import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Filter, X, Search, MapPin, DollarSign, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface FilterState {
  search: string;
  category: string;
  priceRange: [number, number];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  location: string;
  capacity: string;
  status: string[];
  featured: boolean;
  freeOnly: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFiltersChange,
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    priceRange: [0, 200],
    dateRange: {
      from: undefined,
      to: undefined
    },
    location: '',
    capacity: '',
    status: [],
    featured: false,
    freeOnly: false,
    sortBy: 'date',
    sortOrder: 'desc',
    ...initialFilters
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      search: '',
      category: '',
      priceRange: [0, 200],
      dateRange: { from: undefined, to: undefined },
      location: '',
      capacity: '',
      status: [],
      featured: false,
      freeOnly: false,
      sortBy: 'date',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 200) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.location) count++;
    if (filters.capacity) count++;
    if (filters.status.length > 0) count++;
    if (filters.featured) count++;
    if (filters.freeOnly) count++;
    return count;
  };

  const categories = [
    'Music',
    'Entertainment',
    'Sports',
    'Business',
    'Education',
    'Food & Drink',
    'Arts & Culture',
    'Community',
    'Technology',
    'Health & Wellness'
  ];

  const locations = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA',
    'San Antonio, TX',
    'San Diego, CA',
    'Dallas, TX',
    'Austin, TX',
    'Toronto, ON',
    'Montreal, QC',
    'Vancouver, BC',
    'London, UK',
    'Online'
  ];

  const statusOptions = [
    { id: 'active', label: 'Active' },
    { id: 'sold_out', label: 'Sold Out' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'postponed', label: 'Postponed' },
    { id: 'early_bird', label: 'Early Bird' },
    { id: 'last_chance', label: 'Last Chance' }
  ];

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Quick Filters Row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="h-8"
            />
          </div>
          
          <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>

          {getActiveFiltersCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Price Range */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Price Range</span>
                </Label>
                <div className="px-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilter('priceRange', value)}
                    max={500}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>${filters.priceRange[0]}</span>
                    <span>${filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Date Range</span>
                </Label>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        {filters.dateRange.from ? format(filters.dateRange.from, 'MMM dd') : 'From'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from}
                        onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, from: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        {filters.dateRange.to ? format(filters.dateRange.to, 'MMM dd') : 'To'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to}
                        onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, to: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Capacity</span>
                </Label>
                <Select value={filters.capacity} onValueChange={(value) => updateFilter('capacity', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any size</SelectItem>
                    <SelectItem value="small">Small (< 50)</SelectItem>
                    <SelectItem value="medium">Medium (50-200)</SelectItem>
                    <SelectItem value="large">Large (200-1000)</SelectItem>
                    <SelectItem value="xl">Extra Large (1000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status Checkboxes */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <div key={status.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={status.id}
                      checked={filters.status.includes(status.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter('status', [...filters.status, status.id]);
                        } else {
                          updateFilter('status', filters.status.filter(s => s !== status.id));
                        }
                      }}
                    />
                    <Label htmlFor={status.id} className="text-sm font-normal">
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Toggle Filters */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={filters.featured}
                  onCheckedChange={(checked) => updateFilter('featured', checked)}
                />
                <Label htmlFor="featured">Featured only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="freeOnly"
                  checked={filters.freeOnly}
                  onCheckedChange={(checked) => updateFilter('freeOnly', checked)}
                />
                <Label htmlFor="freeOnly">Free events only</Label>
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-4">
              <Label>Sort by:</Label>
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.sortOrder} onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};