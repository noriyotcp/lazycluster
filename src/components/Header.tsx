import React from 'react';
import SearchBar from './SearchBar';
import ThemeSwitcher from './ThemeSwitcher';

interface HeaderProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const Header = ({ searchQuery, onSearchQueryChange, theme, onThemeToggle }: HeaderProps) => (
  <header className="manager-header-container">
    <SearchBar searchQuery={searchQuery} onSearchQueryChange={onSearchQueryChange} />
    <ThemeSwitcher theme={theme} onThemeToggle={onThemeToggle} />
  </header>
);

export default Header;
