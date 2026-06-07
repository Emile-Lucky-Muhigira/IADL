'use client';
import { Modal } from './modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title = 'Please confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3">
        {danger && <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />}
        <div className="text-sm text-gray-700 dark:text-gray-300">{message}</div>
      </div>
      <div className="flex gap-3 pt-5">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`${danger ? 'btn-danger' : 'btn-primary'} flex-1`}
        >
          {loading ? 'Working…' : confirmLabel}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary flex-1">
          {cancelLabel}
        </button>
      </div>
    </Modal>
  );
}
