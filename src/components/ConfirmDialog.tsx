import { forwardRef, type ReactNode } from 'react';

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
}

// Reusable daisyUI confirmation modal. Open it via the forwarded ref: ref.current?.showModal().
// ESC and backdrop clicks close it through the native <form method="dialog"> pattern.
const ConfirmDialog = forwardRef<HTMLDialogElement, ConfirmDialogProps>(
  ({ title, message, confirmLabel, onConfirm }, ref) => {
    return (
      <dialog ref={ref} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="py-4 text-base-content/70">{message}</p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2">
              <button className="btn btn-sm">Cancel</button>
              <button className="btn btn-sm btn-error" onClick={onConfirm}>
                {confirmLabel}
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    );
  }
);

ConfirmDialog.displayName = 'ConfirmDialog';

export default ConfirmDialog;
