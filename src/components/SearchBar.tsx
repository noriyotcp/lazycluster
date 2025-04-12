import { forwardRef } from 'react';

interface SearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({ searchQuery, onSearchQueryChange }, ref) => (
  <label className="input w-full lg:basis-[50%] rounded-none">
    <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
      </g>
    </svg>
    <input
      id="search-bar"
      type="search"
      placeholder="Search tabs..."
      value={searchQuery}
      onChange={e => onSearchQueryChange(e.target.value)}
      className="grow p-2.5 text-base"
      ref={ref}
    />
    <kbd className="kbd kbd-sm rounded-none bg-transparent">/</kbd>
  </label>
));

SearchBar.displayName = 'SearchBar'; // Add display name for better debugging

export default SearchBar;
