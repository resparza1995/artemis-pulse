import { useEffect, useState } from "react";
import { useI18n } from "../../../i18n/react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Modal } from "../../../ui/modal";

type ConsumeMessagesModalProps = {
  open: boolean;
  queueName?: string;
  onClose: () => void;
  onSubmit: (count: number) => Promise<void>;
  isPending: boolean;
  errorMessage?: string;
};

export function ConsumeMessagesModal({ open, queueName, onClose, onSubmit, isPending, errorMessage }: ConsumeMessagesModalProps) {
  const { messages } = useI18n();
  const [count, setCount] = useState("1");

  useEffect(() => {
    if (open) setCount("1");
  }, [open, queueName]);

  const parsedCount = Number(count);
  const isValidCount = Number.isFinite(parsedCount) && parsedCount > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={messages.explorer.modals.consume.title}
      description={queueName ? `${queueName}. ${messages.explorer.modals.consume.descriptionSelected}` : messages.explorer.modals.consume.descriptionEmpty}
      footer={<div className="flex flex-wrap items-center justify-end gap-3"><Button type="button" variant="ghost" onClick={onClose}>{messages.common.cancel}</Button><Button type="button" onClick={() => void onSubmit(parsedCount)} disabled={isPending || !queueName || !isValidCount}>{isPending ? messages.explorer.modals.consume.pending : messages.explorer.modals.consume.button}</Button></div>}
    >
      <div className="space-y-4">
        <div className="app-notice app-notice-neutral text-sm">{messages.explorer.modals.consume.hint}</div>
        <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
          <span className="text-sm text-foreground">{messages.explorer.modals.consume.numberOfMessages}</span>
          <Input type="number" min="1" max="100" value={count} onChange={(event) => setCount(event.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">{[1, 10, 25, 50].map((value) => <Button key={value} type="button" variant="secondary" className="px-3" onClick={() => setCount(String(value))}>{value}</Button>)}</div>
        {errorMessage ? <div className="app-notice app-notice-critical text-sm">{errorMessage}</div> : null}
      </div>
    </Modal>
  );
}
