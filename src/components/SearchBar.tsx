interface SearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const SearchBar = ({ searchQuery, onSearchQueryChange }: SearchBarProps) => (
  <input
    id="search-bar"
    type="search"
    placeholder="Search tabs..."
    value={searchQuery}
    onChange={e => onSearchQueryChange(e.target.value)}
    className="p-2.5 border border-gray-300 text-base w-full lg:basis-[50%]"
  />
);

export default SearchBar;
