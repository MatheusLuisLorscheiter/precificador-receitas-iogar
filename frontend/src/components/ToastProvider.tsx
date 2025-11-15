import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
    title?: string;
    description: string;
    variant?: ToastVariant;
    duration?: number;
}

interface ToastItem extends ToastOptions {
    id: number;
}

interface ToastContextValue {
    pushToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const variantStyles: Record<ToastVariant, string> = {
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
    error: 'border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-100',
    info: 'border-sky-500/40 bg-sky-500/10 text-sky-900 dark:text-sky-100',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100',
};

const variantIcons: Record<ToastVariant, JSX.Element> = {
    success: <CheckCircle2 size={20} />,
    error: <XCircle size={20} />,
    info: <Info size={20} />,
    warning: <AlertTriangle size={20} />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const pushToast = useCallback((options: ToastOptions) => {
        const toast: ToastItem = {
            id: Date.now() + Math.random(),
            variant: options.variant ?? 'info',
            duration: options.duration ?? 4500,
            title: options.title,
            description: options.description,
        };
        setToasts((prev) => [...prev, toast]);
        window.setTimeout(() => removeToast(toast.id), toast.duration);
    }, [removeToast]);

    const contextValue = useMemo(() => ({ pushToast }), [pushToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            {createPortal(
                <div className="pointer-events-none fixed inset-x-0 top-6 z-[9999] flex flex-col items-center gap-3 px-4 sm:items-end sm:px-6">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur transition-all ${variantStyles[toast.variant ?? 'info']}`}
                        >
                            <div className="mt-1 shrink-0">
                                {variantIcons[toast.variant ?? 'info']}
                            </div>
                            <div className="flex-1 text-sm">
                                {toast.title && <p className="font-semibold">{toast.title}</p>}
                                <p className="text-sm/5 opacity-90">{toast.description}</p>
                            </div>
                            <button
                                type="button"
                                className="rounded-full p-1 text-current/70 transition hover:bg-white/20 hover:text-current"
                                onClick={() => removeToast(toast.id)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
