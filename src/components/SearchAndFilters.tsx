
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, MapPin, Calendar, Users, DollarSign } from "lucide-react";

interface SearchAndFiltersProps {
  onSearch: (query: string) => void;
  onSort: (sortBy: string) => void;
  onFilterByPrice: (priceRange: string) => void;
  onFilterByDate: (dateRange: string) => void;
  searchQuery: string;
  sortBy: string;
  priceFilter: string;
  dateFilter: string;
}

export const SearchAndFilters = ({
  onSearch,
  onSort,
  onFilterByPrice,
  onFilterByDate,
  searchQuery,
  sortBy,
  priceFilter,
  dateFilter
}: SearchAndFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search events by title, venue, or description..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Sort by Popularity */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Sort by
              </label>
              <Select value={sortBy} onValueChange={onSort}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popularity">Most Popular</SelectItem>
                  <SelectItem value="date-asc">Date (Earliest)</SelectItem>
                  <SelectItem value="date-desc">Date (Latest)</SelectItem>
                  <SelectItem value="price-low">Price (Low to High)</SelectItem>
                  <SelectItem value="price-high">Price (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price Range
              </label>
              <Select value={priceFilter} onValueChange={onFilterByPrice}>
                <SelectTrigger>
                  <SelectValue placeholder="All prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free Events</SelectItem>
                  <SelectItem value="0-1000">KSh 0 - 1,000</SelectItem>
                  <SelectItem value="1000-3000">KSh 1,000 - 3,000</SelectItem>
                  <SelectItem value="3000-5000">KSh 3,000 - 5,000</SelectItem>
                  <SelectItem value="5000+">KSh 5,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </label>
              <Select value={dateFilter} onValueChange={onFilterByDate}>
                <SelectTrigger>
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="next-month">Next Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </label>
              <Input
                placeholder="Enter city or venue..."
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(searchQuery || sortBy !== 'newest' || priceFilter !== 'all' || dateFilter !== 'all') && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Search: "{searchQuery}"
                </span>
              )}
              {sortBy !== 'newest' && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Sort: {sortBy.replace('-', ' ')}
                </span>
              )}
              {priceFilter !== 'all' && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                  Price: {priceFilter === 'free' ? 'Free' : `KSh ${priceFilter.replace('-', ' - ')}`}
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                  Date: {dateFilter.replace('-', ' ')}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
