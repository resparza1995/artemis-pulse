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

export function PurgeQueueModal({
  open,
  queueName,
  onClose,
  onConfirm,
  isPending,
  errorMessage,
}: PurgeQueueModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Limpiar cola"
      description={
        queueName
          ? `Se eliminaran todos los mensajes de ${queueName}. Esta accion es destructiva.`
          : "Selecciona una queue para poder limpiarla."
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
            disabled={isPending || !queueName}
          >
            {isPending ? "Limpiando..." : "Limpiar cola"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="app-notice app-notice-warning text-sm">
          Esta accion elimina todos los mensajes visibles y pendientes de la queue. Usala solo para pruebas o limpieza consciente.
        </div>
        {errorMessage ? (
          <div className="app-notice app-notice-critical text-sm">
            {errorMessage}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
