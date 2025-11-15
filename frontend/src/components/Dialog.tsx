import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
}

export default function Dialog({ isOpen, onClose, title, children, maxWidth = '500px' }: DialogProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="card w-full max-w-[90vw] overflow-y-auto rounded-3xl border border-border/80 bg-card/95 shadow-soft backdrop-blur-xl"
                style={{ maxWidth }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-6 flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
                    <button
                        onClick={onClose}
                        aria-label="Fechar"
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card/70 text-muted transition hover:-translate-y-0.5 hover:text-foreground"
                    >
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
