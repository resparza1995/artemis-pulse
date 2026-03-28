import type { QueueSummary } from "../../../types/queues";
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

export function DeleteQueueModal({
  open,
  queue,
  onClose,
  onConfirm,
  isPending,
  errorMessage,
}: DeleteQueueModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar queue"
      description={
        queue
          ? `Se eliminara la queue ${queue.name}. La address ${queue.address} se conserva.`
          : "Selecciona una queue para poder eliminarla."
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={isPending || !queue}
          >
            {isPending ? "Eliminando..." : "Eliminar queue"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="app-notice app-notice-warning text-sm">
          Esta accion elimina la queue del broker. Si todavia quedan mensajes, tambien desapareceran con la queue.
        </div>

        {queue ? (
          <div className="app-notice app-notice-neutral text-sm">
            <div>
              Queue: <span className="font-medium text-foreground">{queue.name}</span>
            </div>
            <div>
              Address: <span className="font-medium text-foreground">{queue.address}</span>
            </div>
            <div>
              Mensajes pendientes: <span className="font-medium text-foreground">{queue.messageCount}</span>
            </div>
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
