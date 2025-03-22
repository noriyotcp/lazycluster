interface SearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const SearchBar = ({ searchQuery, onSearchQueryChange }: SearchBarProps) => (
  <input
    type="search"
    placeholder="Search tabs..."
    value={searchQuery}
    onChange={e => onSearchQueryChange(e.target.value)}
    className="p-2.5 border border-gray-300 rounded-md text-base w-full md:basis-[50%]"
  />
);

export default SearchBar;
