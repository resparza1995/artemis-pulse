import type { ExplorerMessageSummary } from "../types";
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

export function RetryMessagesModal({
  open,
  queueName,
  selectedMessages,
  onClose,
  onConfirm,
  isPending,
  errorMessage,
}: RetryMessagesModalProps) {
  const retryableCount = selectedMessages.filter((message) => message.canRetrySafely).length;
  const blockedCount = selectedMessages.length - retryableCount;
  const canRetry = retryableCount > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Retry mensajes"
      description={
        queueName
          ? `Reintentara mensajes seleccionados desde ${queueName} hacia su destino original cuando el metadato este disponible.`
          : "Selecciona una queue para reintentar mensajes."
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void onConfirm()} disabled={isPending || !canRetry}>
            {isPending ? "Reintentando..." : "Retry"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="app-panel-soft p-4 text-sm text-muted-foreground">
          <p>
            Seleccionados: <span className="text-foreground">{selectedMessages.length}</span>
          </p>
          <p>
            Retry seguro: <span className="text-foreground">{retryableCount}</span>
          </p>
          <p>
            Sin destino original resoluble: <span className="text-foreground">{blockedCount}</span>
          </p>
        </div>

        {blockedCount > 0 ? (
          <div className="app-notice app-notice-warning text-sm">
            Algunos mensajes no exponen su destino original. Esos mensajes no se reintentaran y deberian moverse manualmente con `Move`.
          </div>
        ) : null}

        {!canRetry ? (
          <div className="app-notice app-notice-critical text-sm">
            Ninguno de los mensajes seleccionados se puede reintentar de forma segura.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="app-notice app-notice-critical text-sm">
            {errorMessage}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
