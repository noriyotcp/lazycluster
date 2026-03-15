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

interface DuplicatesViewProps {
  allTabs: chrome.tabs.Tab[];
  onBack: () => void;
}

const DuplicatesView = ({ allTabs, onBack }: DuplicatesViewProps) => {
  const [matchMode, setMatchMode] = useState<DuplicateMatchMode>('normalized');
  const { setDeletingState } = useDeletionState();
  const { showToast } = useToast();

  const duplicates = findDuplicateTabs(allTabs, matchMode);
  const duplicateCount = countDuplicateTabs(duplicates);

  const handleCloseGroupDuplicates = async (groupTabs: chrome.tabs.Tab[]) => {
    const toClose = getTabsToClose(groupTabs);
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
    for (const groupTabs of duplicates.values()) {
      const toClose = getTabsToClose(groupTabs);
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
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <path fillRule="evenodd" d="M14 8a.75.75 0 0 1-.75.75H4.56l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <h2 className="text-lg font-bold">Duplicate Tabs</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="tooltip tooltip-left" data-tip="Smart: ignores #fragments, trailing slashes, and tracking params (utm_*)">
              <span className="text-base-content/40 cursor-help text-sm">?</span>
            </div>
            <div className="join">
              <button
                className={`btn btn-xs join-item ${matchMode === 'exact' ? 'btn-active' : ''}`}
                onClick={() => setMatchMode('exact')}
              >
                Exact URL
              </button>
              <button
                className={`btn btn-xs join-item ${matchMode === 'normalized' ? 'btn-active' : ''}`}
                onClick={() => setMatchMode('normalized')}
              >
                Smart
              </button>
            </div>
          </div>
          {duplicateCount > 0 && (
            <button className="btn btn-sm btn-error" onClick={handleCloseAllDuplicates}>
              Close all duplicates ({duplicateCount})
            </button>
          )}
        </div>
      </div>

      {duplicates.size === 0 ? (
        <div className="text-center py-16 text-base-content/60">
          <p className="text-lg">No duplicate tabs found.</p>
          <p className="text-sm mt-2">
            {matchMode === 'exact' ? 'Try switching to Normalized mode to catch more duplicates.' : 'All your tabs have unique URLs.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(duplicates.entries()).map(([url, groupTabs]) => (
            <div key={url} className="card bg-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <h3 className="card-title text-sm">
                    {extractDomain(url)}
                    <span className="badge badge-sm badge-warning">{groupTabs.length} tabs</span>
                  </h3>
                  <button
                    className="btn btn-xs btn-outline btn-error"
                    onClick={() => handleCloseGroupDuplicates(groupTabs)}
                  >
                    Keep newest, close {groupTabs.length - 1}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-zebra table-sm">
                    <thead>
                      <tr>
                        <th className="w-8" />
                        <th>Title</th>
                        <th className="w-48">Domain</th>
                        <th className="w-20">Window</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupTabs.map(tab => (
                        <tr key={tab.id}>
                          <td>
                            {tab.favIconUrl ? (
                              <img className="size-4" src={tab.favIconUrl} alt="" onError={e => ((e.target as HTMLImageElement).src = '')} />
                            ) : (
                              <span className="size-4 inline-block" />
                            )}
                          </td>
                          <td className="max-w-md truncate" title={tab.title}>{tab.title}</td>
                          <td className="text-base-content/60 truncate">{extractDomain(tab.url || '')}</td>
                          <td className="text-base-content/60">W{tab.windowId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DuplicatesView;
