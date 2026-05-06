import { useRef, useState } from 'react';
import type { SavedTabGroup } from '../types/savedTabs';
import { useToast } from './ToastProvider';
import Alert from './Alert';
import FaviconImage from './FaviconImage';
import { formatGroupName } from '../utils/savedTabs';

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

interface SavedTabsViewProps {
  savedTabGroups: SavedTabGroup[];
  onBack: () => void;
  onRestoreGroup: (id: string) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}

const SavedTabsView = ({ savedTabGroups, onBack, onRestoreGroup, onDeleteGroup, onClearAll }: SavedTabsViewProps) => {
  const { showToast } = useToast();
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const clearAllDialogRef = useRef<HTMLDialogElement>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleRestoreGroup = async (id: string) => {
    const group = savedTabGroups.find(g => g.id === id);
    if (!group) return;
    try {
      await onRestoreGroup(id);
      showToast(<Alert message={`Restored ${group.tabs.length} tab(s) in a new window.`} variant="success" />);
    } catch (error) {
      showToast(<Alert message={`Failed to restore: ${error instanceof Error ? error.message : String(error)}`} />);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await onDeleteGroup(id);
      showToast(<Alert message="Deleted saved group." variant="success" />);
    } catch (error) {
      showToast(<Alert message={`Failed to delete: ${error instanceof Error ? error.message : String(error)}`} />);
    }
  };

  const handleClearAll = async () => {
    try {
      await onClearAll();
      showToast(<Alert message="All saved groups cleared." variant="success" />);
    } catch (error) {
      showToast(<Alert message={`Failed to clear: ${error instanceof Error ? error.message : String(error)}`} />);
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
          <h2 className="text-lg font-bold whitespace-nowrap">Saved Tabs</h2>
        </div>
        {savedTabGroups.length > 0 && (
          <button className="btn btn-sm btn-error btn-outline" onClick={() => clearAllDialogRef.current?.showModal()}>
            Clear all
          </button>
        )}
      </div>

      {savedTabGroups.length === 0 ? (
        <div className="text-center py-16 text-base-content/60">
          <p className="text-lg">No saved tabs.</p>
          <p className="text-sm mt-2">Use &quot;Save all&quot; in Inactive Tabs to save tabs here.</p>
        </div>
      ) : (
        <div>
          {savedTabGroups.map(group => (
            <div key={group.id} className="collapse collapse-arrow bg-base-200 border-base-300 border rounded-lg mb-4">
              <input
                id={`saved-group-collapse-${group.id}`}
                type="checkbox"
                defaultChecked={true}
              />
              <div className="collapse-title">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatGroupName(group.savedAt)}</span>
                  <span className="badge badge-sm badge-neutral">{group.tabs.length} tabs</span>
                </div>
              </div>
              <div className="collapse-content">
                <div className="flex gap-2 justify-end mb-3">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleRestoreGroup(group.id)}
                  >
                    Restore all
                  </button>
                  <button
                    className="btn btn-sm btn-ghost btn-error"
                    onClick={() => {
                      setPendingDeleteId(group.id);
                      deleteDialogRef.current?.showModal();
                    }}
                  >
                    Delete
                  </button>
                </div>
                <ul className="list">
                  {group.tabs.map((tab, i) => (
                    <li key={i} className="list-row rounded-none items-center p-2 even:bg-base-300">
                      <div>
                        <FaviconImage src={tab.favIconUrl} />
                      </div>
                      <div className="list-col-grow min-w-0">
                        <a
                          className="truncate block hover:underline"
                          href={tab.url}
                          target="_blank"
                          rel="noreferrer"
                          title={tab.title}
                        >
                          {tab.title || extractDomain(tab.url)}
                        </a>
                        <div className="text-xs text-base-content/50">{extractDomain(tab.url)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
      <dialog ref={deleteDialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Delete saved group?</h3>
          <p className="py-4 text-base-content/70">This cannot be undone.</p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2">
              <button className="btn btn-sm">Cancel</button>
              <button
                className="btn btn-sm btn-error"
                onClick={() => {
                  if (pendingDeleteId) handleDeleteGroup(pendingDeleteId);
                }}
              >
                Delete
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <dialog ref={clearAllDialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Clear all saved groups?</h3>
          <p className="py-4 text-base-content/70">This cannot be undone.</p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2">
              <button className="btn btn-sm">Cancel</button>
              <button className="btn btn-sm btn-error" onClick={handleClearAll}>
                Clear all
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default SavedTabsView;
