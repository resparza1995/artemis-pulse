import { Button } from "../ui/button";
import { Modal } from "../ui/modal";

type ExplorerAdminModalProps = {
  open: boolean;
  selectedAddress?: string;
  selectedQueueName?: string;
  onClose: () => void;
  onOpenCreateAddress: () => void;
  onOpenCreateQueue: () => void;
  onOpenDeleteAddress: () => void;
};

export function ExplorerAdminModal({
  open,
  selectedAddress,
  selectedQueueName,
  onClose,
  onOpenCreateAddress,
  onOpenCreateQueue,
  onOpenDeleteAddress,
}: ExplorerAdminModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gestion rapida"
      description="Accesos directos para administrar addresses y queues sin salir de Explorer."
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="app-notice app-notice-neutral text-sm">
          Las addresses vacias no aparecen en el arbol lateral porque Explorer agrupa a partir de las queues. Puedes crearlas aqui y asociarles una queue despues.
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            className="app-panel-soft space-y-2 p-4 text-left transition hover:bg-[rgba(255,255,255,0.05)]"
            onClick={onOpenCreateAddress}
          >
            <p className="text-sm font-semibold text-foreground">Nueva address</p>
            <p className="text-sm text-muted-foreground">
              Crea una address independiente para pruebas o para preparar nuevas queues.
            </p>
          </button>

          <button
            type="button"
            className="app-panel-soft space-y-2 p-4 text-left transition hover:bg-[rgba(255,255,255,0.05)]"
            onClick={onOpenCreateQueue}
          >
            <p className="text-sm font-semibold text-foreground">Nueva queue</p>
            <p className="text-sm text-muted-foreground">
              Crea una queue en la address actual o en una nueva address.
            </p>
          </button>

          <button
            type="button"
            className="app-panel-soft space-y-2 p-4 text-left transition hover:bg-[rgba(255,255,255,0.05)]"
            onClick={onOpenDeleteAddress}
          >
            <p className="text-sm font-semibold text-foreground">Eliminar address</p>
            <p className="text-sm text-muted-foreground">
              Retira una address de pruebas. Si todavia tiene queues, Artemis rechazara la operacion.
            </p>
          </button>
        </div>

        <div className="app-panel-soft space-y-2 p-4 text-sm">
          <p className="font-semibold text-foreground">Contexto actual</p>
          <p className="text-muted-foreground">
            Address seleccionada: <span className="text-foreground">{selectedAddress ?? "ninguna"}</span>
          </p>
          <p className="text-muted-foreground">
            Queue seleccionada: <span className="text-foreground">{selectedQueueName ?? "ninguna"}</span>
          </p>
        </div>
      </div>
    </Modal>
  );
}


