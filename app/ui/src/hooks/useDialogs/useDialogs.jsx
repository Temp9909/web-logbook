import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const DialogsContext = createContext(null);

const dialogToneClass = (severity) => severity === 'error' ? ' destructive' : '';

const DialogFrame = ({ open, title, children, actions, onBackdrop }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onBackdrop?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onBackdrop]);

  if (!open) return null;
  return (
    <div className="apple-confirm-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onBackdrop?.();
    }}>
      <div className="apple-confirm-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="apple-confirm-title">{title}</div>
        <div className="apple-confirm-content">{children}</div>
        <div className="apple-confirm-actions">{actions}</div>
      </div>
    </div>
  );
};

const AlertDialog = ({ open, onClose, payload }) => {
  const { msg, title = 'Alert', okText = 'Done', severity } = payload;
  return (
    <DialogFrame
      open={open}
      title={title}
      onBackdrop={() => onClose()}
      actions={<button type="button" className={`apple-confirm-button primary${dialogToneClass(severity)}`} onClick={() => onClose()} autoFocus>{okText}</button>}
    >
      {msg}
    </DialogFrame>
  );
};

const ConfirmDialog = ({ open, onClose, payload }) => {
  const { msg, title = 'Confirm', okText, cancelText, severity } = payload;
  const destructive = severity === 'error';
  // Destructive actions deliberately use the same Apple-style Back / Done pair
  // everywhere so a browser-native confirm is never shown for delete flows.
  const backLabel = destructive ? 'Back' : (cancelText || 'Back');
  const doneLabel = destructive ? 'Done' : (okText || 'Done');

  return (
    <DialogFrame
      open={open}
      title={title}
      onBackdrop={() => onClose(false)}
      actions={<>
        <button type="button" className="apple-confirm-button back" onClick={() => onClose(false)} autoFocus>{backLabel}</button>
        <button type="button" className={`apple-confirm-button primary${destructive ? ' destructive' : ''}`} onClick={() => onClose(true)}>{doneLabel}</button>
      </>}
    >
      {msg}
    </DialogFrame>
  );
};

export const DialogsProvider = ({ children }) => {
  const [stack, setStack] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((Component, payload) => {
    return new Promise((resolve) => {
      const id = ++idRef.current;
      setStack((prev) => [...prev, { id, Component, payload, open: true, resolve }]);
    });
  }, []);

  const dismiss = useCallback((id, result) => {
    setStack((prev) => prev.map((d) => (d.id === id ? { ...d, open: false } : d)));
    setTimeout(() => {
      setStack((prev) => {
        const entry = prev.find((d) => d.id === id);
        if (entry) entry.resolve(result);
        return prev.filter((d) => d.id !== id);
      });
    }, 180);
  }, []);

  const alert = useCallback((msg, options = {}) => push(AlertDialog, { msg, ...options }), [push]);
  const confirm = useCallback((msg, options = {}) => push(ConfirmDialog, { msg, ...options }), [push]);
  const open = useCallback((Component, payload) => push(Component, payload), [push]);

  const close = useCallback(
    (_dialogPromise, result) => {
      setStack((prev) => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        dismiss(last.id, result);
        return prev;
      });
      return Promise.resolve();
    },
    [dismiss]
  );

  const api = { alert, confirm, open, close };

  return (
    <DialogsContext.Provider value={api}>
      {children}
      {stack.map(({ id, Component, payload, open: isOpen }) => (
        <Component
          key={id}
          open={isOpen}
          onClose={(result) => dismiss(id, result)}
          payload={payload}
        />
      ))}
    </DialogsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDialogs = () => {
  const ctx = useContext(DialogsContext);
  if (!ctx) throw new Error('useDialogs must be used within a <DialogsProvider>');
  return ctx;
};

// eslint-disable-next-line react-refresh/only-export-components
export default useDialogs;
