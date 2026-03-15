import { useState } from 'react';
import { useDeletionState } from '../contexts/DeletionStateContext';
import { useToast } from './ToastProvider';
import Alert from './Alert';
import {
  findInactiveTabs,
  sortByInactivity,
  formatInactiveDuration,
  DEFAULT_INACTIVE_THRESHOLD_MS,
  INACTIVE_THRESHOLD_PRESETS,
} from '../utils/inactiveDetection';

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

interface InactiveTabsPanelProps {
  allTabs: chrome.tabs.Tab[];
}

const InactiveTabsPanel = ({ allTabs }: InactiveTabsPanelProps) => {
  const [thresholdMs, setThresholdMs] = useState(DEFAULT_INACTIVE_THRESHOLD_MS);
  const { setDeletingState } = useDeletionState();
  const { showToast } = useToast();

  const inactiveTabs = sortByInactivity(findInactiveTabs(allTabs, thresholdMs));

  const handleCloseTab = async (tabId: number) => {
    setDeletingState({ type: 'tab', id: tabId, isDeleting: true });
    try {
      await chrome.tabs.remove(tabId);
      showToast(<Alert message="Closed inactive tab." variant="success" />);
    } catch (error) {
      setDeletingState({ type: 'tab', id: tabId, isDeleting: false });
      showToast(<Alert message={`Failed to close tab: ${error instanceof Error ? error.message : String(error)}`} />);
    }
  };

  const handleCloseAll = async () => {
    const ids = inactiveTabs.map(t => t.id!);
    ids.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: true }));
    try {
      await chrome.tabs.remove(ids);
      showToast(<Alert message={`Closed ${ids.length} inactive tab(s).`} variant="success" />);
    } catch (error) {
      ids.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: false }));
      showToast(<Alert message={`Failed to close tabs: ${error instanceof Error ? error.message : String(error)}`} />);
    }
  };

  return (
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn btn-ghost relative">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
          <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
        </svg>
        {inactiveTabs.length > 0 && (
          <div className="badge badge-sm badge-info absolute -top-1 -right-1">{inactiveTabs.length}</div>
        )}
      </div>
      <div tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box z-50 w-96 p-4 shadow-lg max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Inactive Tabs</h3>
          <select
            className="select select-xs"
            value={thresholdMs}
            onChange={e => setThresholdMs(Number(e.target.value))}
          >
            {INACTIVE_THRESHOLD_PRESETS.map(preset => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {inactiveTabs.length === 0 ? (
          <p className="text-sm text-base-content/60">No inactive tabs found.</p>
        ) : (
          <>
            <button className="btn btn-sm btn-error mb-3 w-full" onClick={handleCloseAll}>
              Close all ({inactiveTabs.length})
            </button>
            <ul className="space-y-1">
              {inactiveTabs.map(tab => (
                <li key={tab.id} className="flex items-center gap-2 text-sm">
                  {tab.favIconUrl ? (
                    <img className="size-4 shrink-0" src={tab.favIconUrl} alt="" onError={e => ((e.target as HTMLImageElement).src = '')} />
                  ) : (
                    <span className="size-4 shrink-0" />
                  )}
                  <span className="truncate flex-1" title={tab.title}>{tab.title || extractDomain(tab.url || '')}</span>
                  <span className="text-xs text-base-content/40 shrink-0">
                    {tab.lastAccessed ? formatInactiveDuration(tab.lastAccessed) : ''}
                  </span>
                  <button className="btn btn-xs btn-outline btn-error shrink-0" onClick={() => handleCloseTab(tab.id!)}>
                    Close
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default InactiveTabsPanel;
