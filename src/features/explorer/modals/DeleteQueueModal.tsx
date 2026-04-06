import type { QueueSummary } from "../../../types/queues";
import { useI18n } from "../../../i18n/react";
import { Button } from "../../../ui/button";
import { Modal } from "../../../ui/modal";

type DeleteQueueModalProps = {
  open: boolean;
  queue?: QueueSummary;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  errorMessage?: string;
};

export function DeleteQueueModal({ open, queue, onClose, onConfirm, isPending, errorMessage }: DeleteQueueModalProps) {
  const { messages } = useI18n();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={messages.explorer.modals.deleteQueue.title}
      description={queue ? `${queue.name}. ${messages.explorer.modals.deleteQueue.descriptionSelected}` : messages.explorer.modals.deleteQueue.descriptionEmpty}
      footer={<div className="flex flex-wrap items-center justify-end gap-3"><Button type="button" variant="ghost" onClick={onClose}>{messages.common.cancel}</Button><Button type="button" variant="destructive" onClick={() => void onConfirm()} disabled={isPending || !queue}>{isPending ? messages.explorer.modals.deleteQueue.pending : messages.explorer.modals.deleteQueue.button}</Button></div>}
    >
      <div className="space-y-4">
        <div className="app-notice app-notice-warning text-sm">{messages.explorer.modals.deleteQueue.warning}</div>
        {queue ? (
          <div className="app-notice app-notice-neutral text-sm">
            <div>{messages.explorer.modals.deleteQueue.queue}: <span className="font-medium text-foreground">{queue.name}</span></div>
            <div>{messages.explorer.modals.deleteQueue.address}: <span className="font-medium text-foreground">{queue.address}</span></div>
            <div>{messages.explorer.modals.deleteQueue.pendingMessages}: <span className="font-medium text-foreground">{queue.messageCount}</span></div>
          </div>
        ) : null}
        {errorMessage ? <div className="app-notice app-notice-critical text-sm">{errorMessage}</div> : null}
      </div>
    </Modal>
  );
}
