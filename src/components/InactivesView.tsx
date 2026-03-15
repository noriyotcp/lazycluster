import { useDeletionState } from '../contexts/DeletionStateContext';
import { useTabFocusContext } from '../contexts/TabFocusContext';
import { useToast } from './ToastProvider';
import Alert from './Alert';
import {
  findInactiveTabs,
  sortByInactivity,
  formatInactiveDuration,
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
  windowLabels: Map<number, string>;
  onBack: () => void;
  thresholdMs: number;
  onThresholdChange: (thresholdMs: number) => void;
}

const InactivesView = ({ allTabs, windowLabels, onBack, thresholdMs, onThresholdChange }: InactivesViewProps) => {
  const { setDeletingState } = useDeletionState();
  const { focusActiveTab } = useTabFocusContext();
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
            onChange={e => onThresholdChange(Number(e.target.value))}
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

          <ul className="list">
            {inactiveTabs.map(tab => (
              <li key={tab.id} className="list-row items-center p-2 even:bg-base-200">
                <div>
                  {tab.favIconUrl ? (
                    <img className="size-4" src={tab.favIconUrl} alt="" onError={e => ((e.target as HTMLImageElement).src = '')} />
                  ) : (
                    <span className="size-4 inline-block" />
                  )}
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
                    {extractDomain(tab.url || '')} · <a
                      className="cursor-pointer hover:underline"
                      onClick={() => chrome.windows.update(tab.windowId, { focused: true })}
                    >{windowLabels.get(tab.windowId) ?? `W${tab.windowId}`}</a> · {tab.lastAccessed ? formatInactiveDuration(tab.lastAccessed) : ''}
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
