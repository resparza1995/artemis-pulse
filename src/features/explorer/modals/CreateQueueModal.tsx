import { useEffect, useState } from "react";
import { Button } from "../../../ui/button";
import { FilterableCombobox } from "../../../ui/filterable-combobox";
import { Dropdown } from "../../../ui/dropdown";
import { Input } from "../../../ui/input";
import { Modal } from "../../../ui/modal";

type CreateQueueModalProps = {
  open: boolean;
  initialAddress?: string;
  addresses: string[];
  onClose: () => void;
  onBack?: () => void;
  onSubmit: (payload: {
    address: string;
    queueName: string;
    routingType: "ANYCAST" | "MULTICAST";
    durable: boolean;
  }) => Promise<void>;
  isPending: boolean;
  errorMessage?: string;
};

export function CreateQueueModal({
  open,
  initialAddress,
  addresses,
  onClose,
  onBack,
  onSubmit,
  isPending,
  errorMessage,
}: CreateQueueModalProps) {
  const [address, setAddress] = useState(initialAddress ?? "");
  const [queueName, setQueueName] = useState("");
  const [routingType, setRoutingType] = useState<"ANYCAST" | "MULTICAST">("ANYCAST");
  const [durable, setDurable] = useState(true);

  useEffect(() => {
    if (open) {
      setAddress(initialAddress ?? "");
      setQueueName("");
      setRoutingType("ANYCAST");
      setDurable(true);
    }
  }, [initialAddress, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva queue"
      description="Crea una queue y, si hace falta, su address asociada para preparar pruebas desde la propia UI."
      className="max-w-3xl min-h-[36rem]"
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
            <Button type="submit" form="create-queue-form" disabled={isPending}>
              {isPending ? "Creando..." : "Crear queue"}
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="create-queue-form"
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit({ address, queueName, routingType, durable });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">
            <span>Address</span>
            <FilterableCombobox
              value={address}
              onChange={setAddress}
              options={addresses}
              placeholder="orders.in"
              autoFocus
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            <span>Queue name</span>
            <Input
              value={queueName}
              onChange={(event) => setQueueName(event.target.value)}
              placeholder="orders.in"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">
            <span>Routing type</span>
            <Dropdown
              value={routingType}
              onChange={(value) => setRoutingType(value as "ANYCAST" | "MULTICAST")}
              options={["ANYCAST", "MULTICAST"]}
            />
          </label>
          <label className="app-toggle-shell flex items-center gap-3 rounded-[1.25rem] px-4 py-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={durable}
              onChange={(event) => setDurable(event.target.checked)}
              className="app-checkbox h-4 w-4 rounded border-[color:var(--border)] bg-transparent"
            />
            queue durable
          </label>
        </div>

        {errorMessage ? (
          <div className="app-notice app-notice-critical text-sm">
            {errorMessage}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
