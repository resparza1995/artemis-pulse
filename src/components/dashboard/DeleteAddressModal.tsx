import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { FilterableCombobox } from "../ui/filterable-combobox";
import { Modal } from "../ui/modal";

type DeleteAddressModalProps = {
  open: boolean;
  initialAddress?: string;
  addresses: string[];
  onClose: () => void;
  onBack?: () => void;
  onConfirm: (payload: { address: string; force: boolean }) => Promise<void>;
  isPending: boolean;
  errorMessage?: string;
};

export function DeleteAddressModal({
  open,
  initialAddress,
  addresses,
  onClose,
  onBack,
  onConfirm,
  isPending,
  errorMessage,
}: DeleteAddressModalProps) {
  const [address, setAddress] = useState(initialAddress ?? "");
  const [force, setForce] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialAddress && addresses.includes(initialAddress)) {
        setAddress(initialAddress);
      } else {
        setAddress(addresses[0] ?? "");
      }
      setForce(false);
    }
  }, [addresses, initialAddress, open]);

  const canDelete = address.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar address"
      description="El broker rechazara la operacion si la address todavia tiene queues asociadas. Selecciona una address y confirma."
      className="max-w-3xl min-h-[34rem]"
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
              onClick={() => void onConfirm({ address, force })}
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
          Usa esta accion solo cuando quieras retirar una address de pruebas. Si tiene queues
          enlazadas, primero elimina esas queues o usa la opcion de forzar.
        </div>

        <label className="space-y-2 text-sm text-foreground">
          <span>Address</span>
          <FilterableCombobox
            value={address}
            onChange={setAddress}
            options={addresses}
            placeholder="orders.events"
            autoFocus
          />
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-4 py-3 text-sm transition hover:bg-[color:var(--surface-hover)]">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
            className="app-checkbox mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[color:var(--border)] bg-transparent"
          />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium leading-none">Eliminar colas asociadas</span>
            <span className="text-xs opacity-55">
              Borra todas las colas de esta address y sus mensajes antes de eliminarla.
            </span>
          </div>
        </label>

        {addresses.length === 0 ? (
          <div className="app-notice app-notice-neutral text-sm">
            No hay addresses disponibles para eliminar.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="app-notice app-notice-critical text-sm">{errorMessage}</div>
        ) : null}
      </div>
    </Modal>
  );
}
