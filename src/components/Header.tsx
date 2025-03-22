import SearchBar from './SearchBar';
import ThemeSwitcher from './ThemeSwitcher';

interface HeaderProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const Header = ({ searchQuery, onSearchQueryChange }: HeaderProps) => (
  <header className="sticky top-0 z-50 bg-(--color-base-100) shadow-md p-5 pt-2.5 pb-2.5">
    <span className="flex justify-between items-center gap-x-4">
      <SearchBar searchQuery={searchQuery} onSearchQueryChange={onSearchQueryChange} />
      <ThemeSwitcher />
    </span>
  </header>
);

export default Header;
