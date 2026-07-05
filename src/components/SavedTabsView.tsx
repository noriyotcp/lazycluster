import { useRef, useState } from 'react';
import type { SavedTabGroup } from '../types/savedTabs';
import { useToast } from './ToastProvider';
import Alert from './Alert';
import ViewHeader from './ViewHeader';
import EmptyState from './EmptyState';
import ConfirmDialog from './ConfirmDialog';
import FaviconImage from './FaviconImage';
import { formatGroupName } from '../utils/savedTabs';
import { extractDomain } from '../utils/url';

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
      <ViewHeader title="Saved Tabs" onBack={onBack}>
        {savedTabGroups.length > 0 && (
          <button className="btn btn-sm btn-error btn-outline" onClick={() => clearAllDialogRef.current?.showModal()}>
            Clear all
          </button>
        )}
      </ViewHeader>

      {savedTabGroups.length === 0 ? (
        <EmptyState title="No saved tabs." hint={<>Use &quot;Save all&quot; in Inactive Tabs to save tabs here.</>} />
      ) : (
        <div>
          {savedTabGroups.map(group => (
            <div key={group.id} className="collapse collapse-arrow bg-base-200 border-base-300 border rounded-lg mb-4">
              <input id={`saved-group-collapse-${group.id}`} type="checkbox" defaultChecked={true} />
              <div className="collapse-title">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatGroupName(group.savedAt)}</span>
                  <span className="badge badge-sm badge-neutral">{group.tabs.length} tabs</span>
                </div>
              </div>
              <div className="collapse-content">
                <div className="flex gap-2 justify-end mb-3">
                  <button className="btn btn-sm btn-success" onClick={() => handleRestoreGroup(group.id)}>
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
                    <li key={`${tab.url}-${i}`} className="list-row rounded-none items-center p-2 even:bg-base-300">
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
      <ConfirmDialog
        ref={deleteDialogRef}
        title="Delete saved group?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (pendingDeleteId) handleDeleteGroup(pendingDeleteId);
        }}
      />

      <ConfirmDialog
        ref={clearAllDialogRef}
        title="Clear all saved groups?"
        message="This cannot be undone."
        confirmLabel="Clear all"
        onConfirm={handleClearAll}
      />
    </div>
  );
};

export default SavedTabsView;
