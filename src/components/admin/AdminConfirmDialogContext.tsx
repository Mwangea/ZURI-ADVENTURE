/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type AdminConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type AdminConfirmContextValue = {
  confirm: (options: AdminConfirmOptions) => Promise<boolean>;
};

const AdminConfirmContext = createContext<AdminConfirmContextValue | null>(null);

export function AdminConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<AdminConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: AdminConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setDialog(options);
      setOpen(true);
    });
  }, []);

  const finish = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOpen(false);
    setDialog(null);
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <AdminConfirmContext.Provider value={value}>
      {children}
      {open && dialog ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) finish(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-kaleo-earth/10 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
          >
            <h2 id="admin-confirm-title" className="font-display text-xl text-kaleo-earth">
              {dialog.title ?? 'Confirm'}
            </h2>
            <p className="mt-3 font-body text-sm text-kaleo-earth/80">{dialog.message}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-kaleo-earth/30 px-4 py-2 font-body text-xs uppercase tracking-wider"
                onClick={() => finish(false)}
              >
                {dialog.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                className="rounded-full bg-red-600 px-4 py-2 font-body text-xs uppercase tracking-wider text-white hover:bg-red-700"
                onClick={() => finish(true)}
              >
                {dialog.confirmLabel ?? 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminConfirmContext.Provider>
  );
}

export function useAdminConfirm() {
  const ctx = useContext(AdminConfirmContext);
  if (!ctx) {
    throw new Error('useAdminConfirm must be used within AdminConfirmDialogProvider');
  }
  return ctx;
}
