import React from 'react';
import SearchBar from './SearchBar';
import ThemeSwitcher from './ThemeSwitcher';
import { useTabSelectionContext } from '../../src/contexts/TabSelectionContext';
import { useToast } from '../../src/components/ToastProvider';
import Alert from '../../src/components/Alert';

interface HeaderProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchBarRef: React.RefObject<HTMLInputElement | null>;
}

const Header = ({ searchQuery, onSearchQueryChange, searchBarRef }: HeaderProps) => {
  const { selectedTabIds, clearSelection } = useTabSelectionContext();
  const { showToast } = useToast();

  const handleCloseSelectedTabs = async () => {
    try {
      await chrome.tabs.remove(selectedTabIds);
      clearSelection();
      showToast(<Alert message="Selected tabs closed successfully." variant="success" />);
    } catch (error) {
      showToast(<Alert message={`Error closing tabs: ${error instanceof Error ? error.message : String(error)}`} />);
      console.error('Error closing tabs:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-(--color-base-100) shadow-md p-5 pt-2.5 pb-2.5">
      <span className="flex justify-between items-center gap-x-4">
        <SearchBar searchQuery={searchQuery} onSearchQueryChange={onSearchQueryChange} ref={searchBarRef} />
        <div className="flex items-center gap-x-4">
          <button className="btn btn-ghost" onClick={handleCloseSelectedTabs}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <path
                fillRule="evenodd"
                d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <ThemeSwitcher />
        </div>
      </span>
    </header>
  );
};

export default Header;
