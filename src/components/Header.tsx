import SearchBar from './SearchBar';
import ThemeSwitcher from './ThemeSwitcher';

interface HeaderProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const Header = ({ searchQuery, onSearchQueryChange }: HeaderProps) => (
  <header>
    <span className="flex justify-stretch items-baseline gap-4">
      <SearchBar searchQuery={searchQuery} onSearchQueryChange={onSearchQueryChange} />
      <ThemeSwitcher />
    </span>
  </header>
);

export default Header;
