import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import Dialog from './Dialog';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    confirmDisabled?: boolean;
    icon?: ReactNode;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'warning',
    confirmDisabled = false,
    icon,
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const variants = {
        danger: {
            icon: 'bg-danger/15 text-danger',
            button: 'btn-danger',
        },
        warning: {
            icon: 'bg-warning/15 text-warning',
            button: 'btn-warning',
        },
        info: {
            icon: 'bg-primary/15 text-primary',
            button: 'btn-primary',
        },
    } as const;

    const currentVariant = variants[variant];

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={title} maxWidth="400px">
            <div className="space-y-6">
                <div className="flex items-start gap-4 rounded-2xl bg-surface/80 p-4">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${currentVariant.icon}`}>
                        {icon || <AlertTriangle size={22} strokeWidth={2} />}
                    </span>
                    <p className="text-base leading-relaxed text-foreground">{message}</p>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button onClick={onClose} className="btn btn-outline">
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`btn ${currentVariant.button}`}
                        autoFocus
                        disabled={confirmDisabled}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Dialog>
    );
}
