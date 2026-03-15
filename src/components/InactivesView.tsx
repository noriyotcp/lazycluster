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

interface InactivesViewProps {
  allTabs: chrome.tabs.Tab[];
  onBack: () => void;
}

const InactivesView = ({ allTabs, onBack }: InactivesViewProps) => {
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
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 shrink-0">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <path fillRule="evenodd" d="M14 8a.75.75 0 0 1-.75.75H4.56l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <h2 className="text-lg font-bold whitespace-nowrap">Inactive Tabs</h2>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="select select-sm"
            value={thresholdMs}
            onChange={e => setThresholdMs(Number(e.target.value))}
          >
            {INACTIVE_THRESHOLD_PRESETS.map(preset => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          {inactiveTabs.length > 0 && (
            <button className="btn btn-sm btn-error" onClick={handleCloseAll}>
              Close all ({inactiveTabs.length})
            </button>
          )}
        </div>
      </div>

      {inactiveTabs.length === 0 ? (
        <div className="text-center py-16 text-base-content/60">
          <p className="text-lg">No inactive tabs found.</p>
          <p className="text-sm mt-2">
            All your tabs have been accessed within the last {INACTIVE_THRESHOLD_PRESETS.find(p => p.value === thresholdMs)?.label ?? 'selected period'}.
          </p>
        </div>
      ) : (
        <>
          <div className="stats shadow mb-4">
            <div className="stat">
              <div className="stat-title">Inactive tabs</div>
              <div className="stat-value text-warning">{inactiveTabs.length}</div>
              <div className="stat-desc">
                Not accessed for {INACTIVE_THRESHOLD_PRESETS.find(p => p.value === thresholdMs)?.label ?? ''}+
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th className="w-8" />
                  <th>Title</th>
                  <th className="w-48">Domain</th>
                  <th className="w-20">Window</th>
                  <th className="w-24">Inactive</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {inactiveTabs.map(tab => (
                  <tr key={tab.id}>
                    <td>
                      {tab.favIconUrl ? (
                        <img className="size-4" src={tab.favIconUrl} alt="" onError={e => ((e.target as HTMLImageElement).src = '')} />
                      ) : (
                        <span className="size-4 inline-block" />
                      )}
                    </td>
                    <td className="max-w-md truncate" title={tab.title}>
                      {tab.title || extractDomain(tab.url || '')}
                    </td>
                    <td className="text-base-content/60 truncate">{extractDomain(tab.url || '')}</td>
                    <td className="text-base-content/60">W{tab.windowId}</td>
                    <td className="text-base-content/60">
                      {tab.lastAccessed ? formatInactiveDuration(tab.lastAccessed) : ''}
                    </td>
                    <td>
                      <button className="btn btn-xs btn-outline btn-error" onClick={() => handleCloseTab(tab.id!)}>
                        Close
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default InactivesView;
