import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Dropdown } from "../ui/dropdown";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";

type CreateAddressModalProps = {
  open: boolean;
  initialAddress?: string;
  onClose: () => void;
  onBack?: () => void;
  onSubmit: (payload: {
    address: string;
    routingType: "ANYCAST" | "MULTICAST";
  }) => Promise<void>;
  isPending: boolean;
  errorMessage?: string;
};

export function CreateAddressModal({
  open,
  initialAddress,
  onClose,
  onBack,
  onSubmit,
  isPending,
  errorMessage,
}: CreateAddressModalProps) {
  const [address, setAddress] = useState(initialAddress ?? "");
  const [routingType, setRoutingType] = useState<"ANYCAST" | "MULTICAST">("ANYCAST");

  useEffect(() => {
    if (open) {
      setAddress(initialAddress ?? "");
      setRoutingType("ANYCAST");
    }
  }, [initialAddress, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva address"
      description="Crea una address independiente para preparar pruebas."
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
            <Button type="submit" form="create-address-form" disabled={isPending}>
              {isPending ? "Creando..." : "Crear address"}
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="create-address-form"
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit({ address, routingType });
        }}
      >
        <label className="space-y-2 text-sm text-foreground">
          <span>Address</span>
          <Input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="orders.events"
            autoFocus
          />
        </label>

        <label className="space-y-2 text-sm text-foreground">
          <span>Routing type</span>
          <Dropdown
            value={routingType}
            onChange={(value) => setRoutingType(value as "ANYCAST" | "MULTICAST")}
            options={["ANYCAST", "MULTICAST"]}
          />
        </label>

        {errorMessage ? (
          <div className="app-notice app-notice-critical text-sm">
            {errorMessage}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
