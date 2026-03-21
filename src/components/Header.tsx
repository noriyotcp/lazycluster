import React from 'react';
import SearchBar from './SearchBar';
import ThemeSwitcher from './ThemeSwitcher';
import TabCountBadge from './TabCountBadge';
import { useTabSelectionContext } from '../../src/contexts/TabSelectionContext';
import { useDeletionState } from '../contexts/DeletionStateContext';
import { useToast } from '../../src/components/ToastProvider';
import Alert from '../../src/components/Alert';
import { useTotalTabCount } from '../hooks/useTotalTabCount';
import { findDuplicateTabs, countDuplicateTabs } from '../utils/duplicateDetection';
import { findInactiveTabs } from '../utils/inactiveDetection';

export type ViewMode = 'tabs' | 'duplicates' | 'inactives';

interface HeaderProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchBarRef: React.RefObject<HTMLInputElement | null>;
  allTabs: chrome.tabs.Tab[];
  viewMode: ViewMode;
  onViewChange: (view: ViewMode) => void;
  inactiveThresholdMs: number;
}

const Header = ({ searchQuery, onSearchQueryChange, searchBarRef, allTabs, viewMode, onViewChange, inactiveThresholdMs }: HeaderProps) => {
  const { selectedTabIds, removeTabsFromSelection } = useTabSelectionContext();
  const { setDeletingState } = useDeletionState();
  const { showToast } = useToast();
  const totalTabCount = useTotalTabCount();

  const duplicateCount = countDuplicateTabs(findDuplicateTabs(allTabs, 'normalized'));
  const inactiveCount = findInactiveTabs(allTabs, inactiveThresholdMs).length;

  const handleCloseSelectedTabs = async () => {
    const tabsToClose = Array.from(selectedTabIds); // Convert Set to array
    // Mark all tabs as deleting
    tabsToClose.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: true }));
    try {
      await chrome.tabs.remove(tabsToClose);
      // Success: remove all from selection
      removeTabsFromSelection(tabsToClose);
      showToast(<Alert message={`Selected ${tabsToClose.length} tabs closed successfully.`} variant="success" />);
    } catch (error) {
      // Reset deleting state for all tabs that failed to close
      tabsToClose.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: false }));
      // On error, don't update selection - let syncWithExistingTabs handle cleanup
      // This prevents state inconsistency when tab removal fails
      showToast(<Alert message={`Error closing tabs: ${error instanceof Error ? error.message : String(error)}`} />);
      console.error('Error closing tabs:', error);
    }
  };

  const toggleView = (view: 'duplicates' | 'inactives') => {
    onViewChange(viewMode === view ? 'tabs' : view);
  };

  return (
    <header className="sticky top-0 z-50 bg-(--color-base-100) shadow-md p-5 pt-2.5 pb-2.5">
      <span className="flex justify-between items-center gap-x-4">
        <SearchBar searchQuery={searchQuery} onSearchQueryChange={onSearchQueryChange} ref={searchBarRef} />
        <div className="flex items-center gap-x-4">
          <TabCountBadge count={totalTabCount} />
          <button
            className={`btn btn-ghost relative ${viewMode === 'duplicates' ? 'btn-active' : ''}`}
            onClick={() => toggleView('duplicates')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h2A1.5 1.5 0 0 1 7 3.5v2A1.5 1.5 0 0 1 5.5 7h-2A1.5 1.5 0 0 1 2 5.5v-2ZM2 10.5A1.5 1.5 0 0 1 3.5 9h2A1.5 1.5 0 0 1 7 10.5v2A1.5 1.5 0 0 1 5.5 14h-2A1.5 1.5 0 0 1 2 12.5v-2ZM9 3.5A1.5 1.5 0 0 1 10.5 2h2A1.5 1.5 0 0 1 14 3.5v2A1.5 1.5 0 0 1 12.5 7h-2A1.5 1.5 0 0 1 9 5.5v-2ZM9 10.5A1.5 1.5 0 0 1 10.5 9h2a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5h-2A1.5 1.5 0 0 1 9 12.5v-2Z" />
            </svg>
            {duplicateCount > 0 && (
              <div className="badge badge-sm badge-warning absolute -top-1 -right-1">{duplicateCount}</div>
            )}
          </button>
          <button
            className={`btn btn-ghost relative ${viewMode === 'inactives' ? 'btn-active' : ''}`}
            onClick={() => toggleView('inactives')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
            </svg>
            {inactiveCount > 0 && (
              <div className="badge badge-sm badge-info absolute -top-1 -right-1">{inactiveCount}</div>
            )}
          </button>
          <button className="btn btn-ghost" onClick={handleCloseSelectedTabs} disabled={selectedTabIds.size === 0}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <path
                fillRule="evenodd"
                d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z"
                clipRule="evenodd"
              />
            </svg>
            {selectedTabIds.size > 0 && <div className="badge badge-sm">{selectedTabIds.size}</div>}
          </button>
          <ThemeSwitcher />
        </div>
      </span>
    </header>
  );
};

export default Header;
