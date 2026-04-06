import { useEffect, useMemo, useState } from "react";
import type { QueueSummary } from "../../../types/queues";
import { useI18n } from "../../../i18n/react";
import { Button } from "../../../ui/button";
import { FilterableCombobox } from "../../../ui/filterable-combobox";
import { Modal } from "../../../ui/modal";

type MoveMessagesModalProps = {
  open: boolean;
  queueName?: string;
  selectedCount: number;
  queues: QueueSummary[];
  onClose: () => void;
  onSubmit: (destinationQueueName: string) => Promise<void>;
  isPending: boolean;
  errorMessage?: string;
};

export function MoveMessagesModal({ open, queueName, selectedCount, queues, onClose, onSubmit, isPending, errorMessage }: MoveMessagesModalProps) {
  const { messages } = useI18n();
  const destinationOptions = useMemo(() => queues.filter((queue) => queue.name !== queueName), [queues, queueName]);
  const [destinationQueueName, setDestinationQueueName] = useState("");

  useEffect(() => {
    if (open) setDestinationQueueName(destinationOptions[0]?.name ?? "");
  }, [open, destinationOptions]);

  const canSubmit = destinationQueueName.trim().length > 0 && selectedCount > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={messages.explorer.modals.move.title}
      description={queueName ? `${queueName}. ${messages.explorer.modals.move.descriptionSelected}` : messages.explorer.modals.move.descriptionEmpty}
      className="max-w-3xl"
      footer={<div className="flex flex-wrap items-center justify-end gap-3"><Button type="button" variant="ghost" onClick={onClose}>{messages.common.cancel}</Button><Button type="button" onClick={() => void onSubmit(destinationQueueName)} disabled={isPending || !canSubmit}>{isPending ? messages.explorer.modals.move.pending : messages.explorer.modals.move.button}</Button></div>}
    >
      <div className="space-y-4 min-h-[360px]">
        <div className="app-panel-soft p-4 text-sm text-muted-foreground">
          <p>{messages.explorer.modals.move.sourceQueue}: <span className="text-foreground">{queueName ?? messages.common.none}</span></p>
          <p>{messages.explorer.modals.move.selectedMessages}: <span className="text-foreground">{selectedCount}</span></p>
          <p>{messages.explorer.modals.move.destinationQueue}: <span className="text-foreground">{destinationQueueName || messages.common.none}</span></p>
        </div>

        <label className="space-y-2 text-sm text-foreground">
          <span>{messages.explorer.modals.move.destination}</span>
          <FilterableCombobox
            value={destinationQueueName}
            onChange={setDestinationQueueName}
            options={destinationOptions.map((queue) => queue.name)}
            placeholder={destinationOptions.length === 0 ? messages.explorer.modals.move.noDestinationQueues : messages.explorer.modals.move.selectDestinationQueue}
            disabled={destinationOptions.length === 0}
          />
        </label>

        {destinationOptions.length === 0 ? <div className="app-notice app-notice-warning text-sm">{messages.explorer.modals.move.needExtraQueue}</div> : null}
        {errorMessage ? <div className="app-notice app-notice-critical text-sm">{errorMessage}</div> : null}
      </div>
    </Modal>
  );
}
