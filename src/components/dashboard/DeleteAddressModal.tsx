import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";

type DeleteAddressModalProps = {
  open: boolean;
  initialAddress?: string;
  onClose: () => void;
  onBack?: () => void;
  onConfirm: (address: string) => Promise<void>;
  isPending: boolean;
  errorMessage?: string;
};

export function DeleteAddressModal({
  open,
  initialAddress,
  onClose,
  onBack,
  onConfirm,
  isPending,
  errorMessage,
}: DeleteAddressModalProps) {
  const [address, setAddress] = useState(initialAddress ?? "");

  useEffect(() => {
    if (open) {
      setAddress(initialAddress ?? "");
    }
  }, [initialAddress, open]);

  const canDelete = address.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar address"
      description="El broker rechazara la operacion si la address todavia tiene queues asociadas. Puedes editar el nombre antes de confirmar."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {onBack ? (
              <Button type="button" variant="ghost" onClick={onBack} disabled={isPending}>
                Atras
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void onConfirm(address)}
              disabled={isPending || !canDelete}
            >
              {isPending ? "Eliminando..." : "Eliminar address"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="app-notice app-notice-warning text-sm">
          Usa esta accion solo cuando quieras retirar una address de pruebas. Si tiene queues enlazadas, primero elimina esas queues.
        </div>

        <label className="space-y-2 text-sm text-foreground">
          <span>Address</span>
          <Input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="orders.events"
            autoFocus
          />
        </label>

        {errorMessage ? (
          <div className="app-notice app-notice-critical text-sm">
            {errorMessage}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
