import { useState } from 'react';
import { useDeletionState } from '../contexts/DeletionStateContext';
import { useToast } from './ToastProvider';
import Alert from './Alert';
import {
  findDuplicateTabs,
  countDuplicateTabs,
  getTabsToClose,
  type DuplicateMatchMode,
} from '../utils/duplicateDetection';

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

interface DuplicateTabsPanelProps {
  allTabs: chrome.tabs.Tab[];
}

const DuplicateTabsPanel = ({ allTabs }: DuplicateTabsPanelProps) => {
  const [matchMode, setMatchMode] = useState<DuplicateMatchMode>('normalized');
  const { setDeletingState } = useDeletionState();
  const { showToast } = useToast();

  const duplicates = findDuplicateTabs(allTabs, matchMode);
  const duplicateCount = countDuplicateTabs(duplicates);

  const handleCloseGroupDuplicates = async (tabs: chrome.tabs.Tab[]) => {
    const toClose = getTabsToClose(tabs);
    const ids = toClose.map(t => t.id!);
    ids.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: true }));
    try {
      await chrome.tabs.remove(ids);
      showToast(<Alert message={`Closed ${ids.length} duplicate tab(s).`} variant="success" />);
    } catch (error) {
      ids.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: false }));
      showToast(<Alert message={`Failed to close tabs: ${error instanceof Error ? error.message : String(error)}`} />);
    }
  };

  const handleCloseAllDuplicates = async () => {
    const allToClose: number[] = [];
    for (const tabs of duplicates.values()) {
      const toClose = getTabsToClose(tabs);
      allToClose.push(...toClose.map(t => t.id!));
    }
    allToClose.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: true }));
    try {
      await chrome.tabs.remove(allToClose);
      showToast(<Alert message={`Closed ${allToClose.length} duplicate tab(s).`} variant="success" />);
    } catch (error) {
      allToClose.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: false }));
      showToast(<Alert message={`Failed to close tabs: ${error instanceof Error ? error.message : String(error)}`} />);
    }
  };

  return (
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn btn-ghost relative">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
          <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h2A1.5 1.5 0 0 1 7 3.5v2A1.5 1.5 0 0 1 5.5 7h-2A1.5 1.5 0 0 1 2 5.5v-2ZM2 10.5A1.5 1.5 0 0 1 3.5 9h2A1.5 1.5 0 0 1 7 10.5v2A1.5 1.5 0 0 1 5.5 14h-2A1.5 1.5 0 0 1 2 12.5v-2ZM9 3.5A1.5 1.5 0 0 1 10.5 2h2A1.5 1.5 0 0 1 14 3.5v2A1.5 1.5 0 0 1 12.5 7h-2A1.5 1.5 0 0 1 9 5.5v-2ZM9 10.5A1.5 1.5 0 0 1 10.5 9h2a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5h-2A1.5 1.5 0 0 1 9 12.5v-2Z" />
        </svg>
        {duplicateCount > 0 && (
          <div className="badge badge-sm badge-warning absolute -top-1 -right-1">{duplicateCount}</div>
        )}
      </div>
      <div tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box z-50 w-96 p-4 shadow-lg max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Duplicate Tabs</h3>
          <label className="label cursor-pointer gap-2 text-xs">
            <span>{matchMode === 'exact' ? 'Exact' : 'Normalized'}</span>
            <input
              type="checkbox"
              className="toggle toggle-xs"
              checked={matchMode === 'normalized'}
              onChange={e => setMatchMode(e.target.checked ? 'normalized' : 'exact')}
            />
          </label>
        </div>

        {duplicates.size === 0 ? (
          <p className="text-sm text-base-content/60">No duplicate tabs found.</p>
        ) : (
          <>
            {duplicateCount > 1 && (
              <button className="btn btn-sm btn-error mb-3 w-full" onClick={handleCloseAllDuplicates}>
                Close all duplicates ({duplicateCount})
              </button>
            )}
            {Array.from(duplicates.entries()).map(([url, tabs]) => (
              <div key={url} className="mb-3 last:mb-0">
                <div className="text-xs text-base-content/60 truncate mb-1" title={url}>
                  {extractDomain(url)} ({tabs.length} tabs)
                </div>
                <ul className="space-y-1">
                  {tabs.map(tab => (
                    <li key={tab.id} className="flex items-center gap-2 text-sm">
                      {tab.favIconUrl ? (
                        <img className="size-4 shrink-0" src={tab.favIconUrl} alt="" onError={e => ((e.target as HTMLImageElement).src = '')} />
                      ) : (
                        <span className="size-4 shrink-0" />
                      )}
                      <span className="truncate flex-1" title={tab.title}>{tab.title}</span>
                      <span className="text-xs text-base-content/40 shrink-0">W{tab.windowId}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className="btn btn-xs btn-outline btn-error mt-1"
                  onClick={() => handleCloseGroupDuplicates(tabs)}
                >
                  Keep newest, close {tabs.length - 1}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default DuplicateTabsPanel;
