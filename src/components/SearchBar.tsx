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
    className="w-full p-2.5 mb-5 border border-gray-300 rounded-md text-base"
  />
);

export default SearchBar;
