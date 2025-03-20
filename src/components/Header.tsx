import SearchBar from './SearchBar';
import ThemeSwitcher from './ThemeSwitcher';

interface HeaderProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const Header = ({ searchQuery, onSearchQueryChange }: HeaderProps) => (
  <header className="manager-header-container">
    <SearchBar searchQuery={searchQuery} onSearchQueryChange={onSearchQueryChange} />
    <ThemeSwitcher />
  </header>
);

export default Header;
