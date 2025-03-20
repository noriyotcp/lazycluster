import React from 'react';

interface SearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const SearchBar = ({ searchQuery, onSearchQueryChange }: SearchBarProps) => (
  <input
    type="text"
    placeholder="Search tabs..."
    value={searchQuery}
    onChange={e => onSearchQueryChange(e.target.value)}
    className="search-input"
  />
);

export default SearchBar;
