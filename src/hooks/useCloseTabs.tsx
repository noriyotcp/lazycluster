import { useCallback } from 'react';
import { useDeletionState } from '../contexts/DeletionStateContext';
import { useToast } from '../components/ToastProvider';
import Alert from '../components/Alert';

interface CloseTabsOptions {
  // Toast shown after the tabs are removed successfully.
  successMessage: string;
  // Prefix for the failure toast; the error detail is appended as `${errorMessage}: <detail>`.
  errorMessage: string;
}

const formatError = (error: unknown): string => (error instanceof Error ? error.message : String(error));

// Shared "mark as deleting -> remove -> rollback on failure -> toast" cycle used across views.
// Deliberately no `finally` reset on success: items stay inert until the next UPDATE_TABS
// removes them. Returns true on success so call sites can run their own follow-ups.
export const useCloseTabs = () => {
  const { setDeletingState } = useDeletionState();
  const { showToast } = useToast();

  const closeTabs = useCallback(
    async (ids: number[], { successMessage, errorMessage }: CloseTabsOptions): Promise<boolean> => {
      ids.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: true }));
      try {
        await chrome.tabs.remove(ids);
        showToast(<Alert message={successMessage} variant="success" />);
        return true;
      } catch (error) {
        ids.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: false }));
        showToast(<Alert message={`${errorMessage}: ${formatError(error)}`} />);
        console.error(`${errorMessage}:`, error);
        return false;
      }
    },
    [setDeletingState, showToast]
  );

  return { closeTabs };
};
