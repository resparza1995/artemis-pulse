import { useI18n } from "../../../i18n/react";
import { Button } from "../../../ui/button";
import { Modal } from "../../../ui/modal";

type PurgeQueueModalProps = {
  open: boolean;
  queueName?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  errorMessage?: string;
};

export function PurgeQueueModal({ open, queueName, onClose, onConfirm, isPending, errorMessage }: PurgeQueueModalProps) {
  const { messages } = useI18n();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={messages.explorer.modals.purge.title}
      description={queueName ? `${queueName}. ${messages.explorer.modals.purge.descriptionSelected}` : messages.explorer.modals.purge.descriptionEmpty}
      footer={<div className="flex flex-wrap items-center justify-end gap-3"><Button type="button" variant="ghost" onClick={onClose}>{messages.common.cancel}</Button><Button type="button" variant="destructive" onClick={() => void onConfirm()} disabled={isPending || !queueName}>{isPending ? messages.explorer.modals.purge.pending : messages.explorer.modals.purge.button}</Button></div>}
    >
      <div className="space-y-4">
        <div className="app-notice app-notice-warning text-sm">{messages.explorer.modals.purge.warning}</div>
        {errorMessage ? <div className="app-notice app-notice-critical text-sm">{errorMessage}</div> : null}
      </div>
    </Modal>
  );
}
