import { useEffect, useState } from "react";
import { useI18n } from "../../../i18n/react";
import { Button } from "../../../ui/button";
import { Dropdown } from "../../../ui/dropdown";
import { Input } from "../../../ui/input";
import { Modal } from "../../../ui/modal";

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
  const { messages } = useI18n();
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
      title={messages.explorer.modals.createAddress.title}
      description={messages.explorer.modals.createAddress.description}
      className="max-w-3xl min-h-[34rem]"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {onBack ? (
              <Button type="button" variant="ghost" onClick={onBack} disabled={isPending}>
                {messages.common.back}
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              {messages.common.cancel}
            </Button>
            <Button type="submit" form="create-address-form" disabled={isPending}>
              {isPending ? messages.explorer.modals.createAddress.pending : messages.explorer.modals.createAddress.button}
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
          <span>{messages.explorer.modals.createAddress.address}</span>
          <Input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="orders.events"
            autoFocus
          />
        </label>

        <label className="space-y-2 text-sm text-foreground">
          <span>{messages.explorer.modals.createAddress.routingType}</span>
          <Dropdown
            value={routingType}
            onChange={(value) => setRoutingType(value as "ANYCAST" | "MULTICAST")}
            options={["ANYCAST", "MULTICAST"]}
          />
        </label>

        {errorMessage ? <div className="app-notice app-notice-critical text-sm">{errorMessage}</div> : null}
      </form>
    </Modal>
  );
}
