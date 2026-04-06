import type { ExplorerMessageSummary } from "../types";
import { useI18n } from "../../../i18n/react";
import { Button } from "../../../ui/button";
import { Modal } from "../../../ui/modal";

type RetryMessagesModalProps = {
  open: boolean;
  queueName?: string;
  selectedMessages: ExplorerMessageSummary[];
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  errorMessage?: string;
};

export function RetryMessagesModal({ open, queueName, selectedMessages, onClose, onConfirm, isPending, errorMessage }: RetryMessagesModalProps) {
  const { messages } = useI18n();
  const retryableCount = selectedMessages.filter((message) => message.canRetrySafely).length;
  const blockedCount = selectedMessages.length - retryableCount;
  const canRetry = retryableCount > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={messages.explorer.modals.retry.title}
      description={queueName ? `${queueName}. ${messages.explorer.modals.retry.descriptionSelected}` : messages.explorer.modals.retry.descriptionEmpty}
      footer={<div className="flex flex-wrap items-center justify-end gap-3"><Button type="button" variant="ghost" onClick={onClose}>{messages.common.cancel}</Button><Button type="button" onClick={() => void onConfirm()} disabled={isPending || !canRetry}>{isPending ? messages.explorer.modals.retry.pending : messages.explorer.modals.retry.button}</Button></div>}
    >
      <div className="space-y-4">
        <div className="app-panel-soft p-4 text-sm text-muted-foreground">
          <p>{messages.explorer.modals.retry.selected}: <span className="text-foreground">{selectedMessages.length}</span></p>
          <p>{messages.explorer.modals.retry.retrySafe}: <span className="text-foreground">{retryableCount}</span></p>
          <p>{messages.explorer.modals.retry.blocked}: <span className="text-foreground">{blockedCount}</span></p>
        </div>
        {blockedCount > 0 ? <div className="app-notice app-notice-warning text-sm">{messages.explorer.modals.retry.blockedWarning}</div> : null}
        {!canRetry ? <div className="app-notice app-notice-critical text-sm">{messages.explorer.modals.retry.noneRetryable}</div> : null}
        {errorMessage ? <div className="app-notice app-notice-critical text-sm">{errorMessage}</div> : null}
      </div>
    </Modal>
  );
}
