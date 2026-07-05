import { useState } from 'react';
import { useTabFocusContext } from '../contexts/TabFocusContext';
import { useCloseTabs } from '../hooks/useCloseTabs';
import ViewHeader from './ViewHeader';
import EmptyState from './EmptyState';
import FaviconImage from './FaviconImage';
import {
  findDuplicateTabs,
  countDuplicateTabs,
  getTabsToClose,
  type DuplicateMatchMode,
} from '../utils/duplicateDetection';
import { extractDomain } from '../utils/url';
import { focusWindow } from '../utils/windowActions';

interface DuplicatesViewProps {
  allTabs: chrome.tabs.Tab[];
  windowLabels: Map<number, string>;
  onBack: () => void;
}

const DuplicatesView = ({ allTabs, windowLabels, onBack }: DuplicatesViewProps) => {
  const [matchMode, setMatchMode] = useState<DuplicateMatchMode>('normalized');
  const { focusActiveTab } = useTabFocusContext();
  const { closeTabs } = useCloseTabs();

  const duplicates = findDuplicateTabs(allTabs, matchMode);
  const duplicateCount = countDuplicateTabs(duplicates);

  const handleCloseGroupDuplicates = async (groupTabs: chrome.tabs.Tab[]) => {
    const toClose = getTabsToClose(groupTabs);
    const ids = toClose.map(t => t.id!);
    await closeTabs(ids, {
      successMessage: `Closed ${ids.length} duplicate tab(s).`,
      errorMessage: 'Failed to close tabs',
    });
  };

  const handleCloseAllDuplicates = async () => {
    const allToClose: number[] = [];
    for (const groupTabs of duplicates.values()) {
      const toClose = getTabsToClose(groupTabs);
      allToClose.push(...toClose.map(t => t.id!));
    }
    await closeTabs(allToClose, {
      successMessage: `Closed ${allToClose.length} duplicate tab(s).`,
      errorMessage: 'Failed to close tabs',
    });
  };

  return (
    <div className="mt-4">
      <ViewHeader title="Duplicate Tabs" onBack={onBack}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="tooltip tooltip-left"
              data-tip="Smart: ignores #fragments, trailing slashes, and tracking params. Title: matches same page title on same domain."
            >
              <span className="text-base-content/40 cursor-help text-sm">?</span>
            </div>
            <div className="join">
              <button
                className={`btn btn-xs join-item ${matchMode === 'normalized' ? 'btn-warning' : ''}`}
                onClick={() => setMatchMode('normalized')}
              >
                Smart
              </button>
              <button
                className={`btn btn-xs join-item ${matchMode === 'title-domain' ? 'btn-warning' : ''}`}
                onClick={() => setMatchMode('title-domain')}
              >
                Title
              </button>
            </div>
          </div>
          {duplicateCount > 0 && (
            <button className="btn btn-sm btn-error" onClick={handleCloseAllDuplicates}>
              Close all duplicates ({duplicateCount})
            </button>
          )}
        </div>
      </ViewHeader>

      {duplicates.size === 0 ? (
        <EmptyState
          title="No duplicate tabs found."
          hint={
            matchMode === 'normalized'
              ? 'Try switching to Title mode to catch more duplicates.'
              : 'All your tabs have unique titles per domain.'
          }
        />
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
                        <th className="w-36">Window</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupTabs.map(tab => (
                        <tr key={tab.id}>
                          <td>
                            <FaviconImage src={tab.favIconUrl} className="size-4 min-w-4 min-h-4 object-contain" />
                          </td>
                          <td className="max-w-md truncate" title={tab.title}>
                            <a
                              className="cursor-pointer hover:underline"
                              href={tab.url}
                              onClick={e => {
                                e.preventDefault();
                                if (tab.id && tab.windowId) focusActiveTab(tab.id, tab.windowId);
                              }}
                            >
                              {tab.title}
                            </a>
                          </td>
                          <td className="text-base-content/60 truncate">{extractDomain(tab.url || '')}</td>
                          <td className="text-base-content/60">
                            <button
                              type="button"
                              className="link link-hover cursor-pointer"
                              onClick={() => focusWindow(tab.windowId)}
                            >
                              {windowLabels.get(tab.windowId) ?? `W${tab.windowId}`}
                            </button>
                          </td>
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
