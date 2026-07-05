import { useDeletionState } from '../contexts/DeletionStateContext';
import { useTabFocusContext } from '../contexts/TabFocusContext';
import { useToast } from './ToastProvider';
import { useCloseTabs } from '../hooks/useCloseTabs';
import Alert from './Alert';
import ViewHeader from './ViewHeader';
import EmptyState from './EmptyState';
import FaviconImage from './FaviconImage';
import {
  findInactiveTabs,
  sortByInactivity,
  formatInactiveDuration,
  INACTIVE_THRESHOLD_PRESETS,
} from '../utils/inactiveDetection';
import type { SavedTabGroup } from '../types/savedTabs';
import { extractDomain } from '../utils/url';
import { focusWindow } from '../utils/windowActions';

interface InactivesViewProps {
  allTabs: chrome.tabs.Tab[];
  windowLabels: Map<number, string>;
  onBack: () => void;
  thresholdMs: number;
  onThresholdChange: (thresholdMs: number) => void;
  onSaveAll: (tabs: chrome.tabs.Tab[]) => Promise<SavedTabGroup>;
}

const InactivesView = ({
  allTabs,
  windowLabels,
  onBack,
  thresholdMs,
  onThresholdChange,
  onSaveAll,
}: InactivesViewProps) => {
  const { setDeletingState } = useDeletionState();
  const { focusActiveTab } = useTabFocusContext();
  const { showToast } = useToast();
  const { closeTabs } = useCloseTabs();

  const inactiveTabs = sortByInactivity(findInactiveTabs(allTabs, thresholdMs));

  const handleCloseTab = async (tabId: number) => {
    await closeTabs([tabId], {
      successMessage: 'Closed inactive tab.',
      errorMessage: 'Failed to close tab',
    });
  };

  const handleCloseAll = async () => {
    const ids = inactiveTabs.map(t => t.id!);
    await closeTabs(ids, {
      successMessage: `Closed ${ids.length} inactive tab(s).`,
      errorMessage: 'Failed to close tabs',
    });
  };

  const handleSaveAll = async () => {
    const ids = inactiveTabs.map(t => t.id!);
    // Mark as deleting before the save so the tabs appear inert while it runs.
    ids.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: true }));
    let group;
    try {
      group = await onSaveAll(inactiveTabs);
    } catch (error) {
      ids.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: false }));
      showToast(<Alert message={`Failed to save tabs: ${error instanceof Error ? error.message : String(error)}`} />);
      return;
    }
    await closeTabs(ids, {
      successMessage: `Saved ${group.tabs.length} tab(s) and closed.`,
      errorMessage: 'Tabs saved but could not close them',
    });
  };

  return (
    <div className="mt-4">
      <ViewHeader title="Inactive Tabs" onBack={onBack}>
        <div className="flex items-center gap-3">
          <select
            className="select select-sm [&>option]:[padding-inline:0]"
            value={thresholdMs}
            onChange={e => onThresholdChange(Number(e.target.value))}
          >
            {INACTIVE_THRESHOLD_PRESETS.map(preset => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          {inactiveTabs.length > 0 && (
            <>
              <button className="btn btn-sm btn-warning" onClick={handleSaveAll}>
                Save all ({inactiveTabs.length})
              </button>
              <button className="btn btn-sm btn-error" onClick={handleCloseAll}>
                Close all ({inactiveTabs.length})
              </button>
            </>
          )}
        </div>
      </ViewHeader>

      {inactiveTabs.length === 0 ? (
        <EmptyState
          title="No inactive tabs found."
          hint={
            <>
              All your tabs have been accessed within the last{' '}
              {INACTIVE_THRESHOLD_PRESETS.find(p => p.value === thresholdMs)?.label ?? 'selected period'}.
            </>
          }
        />
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

          <ul className="list">
            {inactiveTabs.map(tab => (
              <li key={tab.id} className="list-row rounded-none items-center p-2 even:bg-base-200">
                <div>
                  <FaviconImage src={tab.favIconUrl} />
                </div>
                <div className="list-col-grow min-w-0">
                  <a
                    className="truncate block cursor-pointer hover:underline"
                    title={tab.title}
                    href={tab.url}
                    onClick={e => {
                      e.preventDefault();
                      if (tab.id && tab.windowId) focusActiveTab(tab.id, tab.windowId);
                    }}
                  >
                    {tab.title || extractDomain(tab.url || '')}
                  </a>
                  <div className="text-xs text-base-content/50">
                    {extractDomain(tab.url || '')} ·{' '}
                    <button
                      type="button"
                      className="link link-hover cursor-pointer"
                      onClick={() => focusWindow(tab.windowId)}
                    >
                      {windowLabels.get(tab.windowId) ?? `W${tab.windowId}`}
                    </button>{' '}
                    · {tab.lastAccessed ? formatInactiveDuration(tab.lastAccessed) : ''}
                  </div>
                </div>
                <button className="btn btn-xs btn-outline btn-error shrink-0" onClick={() => handleCloseTab(tab.id!)}>
                  Close
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default InactivesView;
