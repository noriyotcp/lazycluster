const KeyboardShortcutsModal = () => {
  const shortcuts = {
    'Global Shortcuts': [
      { key: '/', description: 'Focus search bar' },
      { key: '?', description: 'Show keyboard shortcuts (this modal)' },
      { key: 'w + 0', description: 'Jump to current window' },
      { key: 'w + 1-9', description: 'Jump to Window Group by number' },
      { key: 'ESC', description: 'Cancel window jump sequence' },
    ],
    'Tab Navigation': [
      { key: 'j', description: 'Move to next tab (down)' },
      { key: 'k', description: 'Move to previous tab (up)' },
      { key: 'gg', description: 'Jump to first tab (press g twice)' },
      { key: 'Shift + g', description: 'Jump to last tab' },
      { key: 'G', description: 'Jump to last tab' },
    ],
    'Tab Actions': [{ key: 'Space', description: 'Toggle tab selection' }],
  };

  return (
    <dialog id="keyboard-shortcuts-modal" className="modal">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Keyboard Shortcuts</h3>

        <div className="space-y-6">
          {Object.entries(shortcuts).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm opacity-70 mb-2">{category}</h4>
              <div className="space-y-1">
                {items.map(({ key, description }) => (
                  <div key={key} className="flex items-center gap-4 py-1">
                    <kbd className="kbd kbd-sm min-w-[80px] text-center">{key}</kbd>
                    <span className="text-sm">{description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-action">
          <form method="dialog">
            <button className="btn btn-sm">Close</button>
          </form>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default KeyboardShortcutsModal;
