import { forwardRef } from 'react';

interface SearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({ searchQuery, onSearchQueryChange }, ref) => (
  <input
    id="search-bar"
    type="search"
    placeholder="Search tabs..."
    value={searchQuery}
    onChange={e => onSearchQueryChange(e.target.value)}
    className="p-2.5 border border-gray-300 text-base w-full lg:basis-[50%]"
    ref={ref}
  />
));

SearchBar.displayName = 'SearchBar'; // Add display name for better debugging

export default SearchBar;
