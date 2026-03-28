import { useEffect, useMemo, useState } from "react";
import type { QueueSummary } from "../../../types/queues";
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

export function MoveMessagesModal({
  open,
  queueName,
  selectedCount,
  queues,
  onClose,
  onSubmit,
  isPending,
  errorMessage,
}: MoveMessagesModalProps) {
  const destinationOptions = useMemo(
    () => queues.filter((queue) => queue.name !== queueName),
    [queues, queueName],
  );
  const [destinationQueueName, setDestinationQueueName] = useState("");

  useEffect(() => {
    if (open) {
      setDestinationQueueName(destinationOptions[0]?.name ?? "");
    }
  }, [open, destinationOptions]);

  const canSubmit = destinationQueueName.trim().length > 0 && selectedCount > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Move mensajes"
      description={
        queueName
          ? `Movera mensajes desde ${queueName} a otra queue del broker.`
          : "Selecciona una queue para mover mensajes."
      }
      className="max-w-3xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void onSubmit(destinationQueueName)} disabled={isPending || !canSubmit}>
            {isPending ? "Moviendo..." : "Mover mensajes"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="app-panel-soft p-4 text-sm text-muted-foreground">
          <p>
            Queue origen: <span className="text-foreground">{queueName ?? "ninguna"}</span>
          </p>
          <p>
            Mensajes seleccionados: <span className="text-foreground">{selectedCount}</span>
          </p>
          <p>
            Queue destino: <span className="text-foreground">{destinationQueueName || "sin elegir"}</span>
          </p>
        </div>

        <label className="space-y-2 text-sm text-foreground">
          <span>Destino</span>
          <FilterableCombobox
            value={destinationQueueName}
            onChange={setDestinationQueueName}
            options={destinationOptions.map((queue) => queue.name)}
            placeholder={
              destinationOptions.length === 0
                ? "No hay queues destino disponibles"
                : "Selecciona queue destino"
            }
            disabled={destinationOptions.length === 0}
          />
        </label>

        {destinationOptions.length === 0 ? (
          <div className="app-notice app-notice-warning text-sm">
            Necesitas al menos una queue adicional para poder mover mensajes.
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
