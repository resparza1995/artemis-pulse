import { useEffect, useState } from "react";
import { useI18n } from "../../../i18n/react";
import { Button } from "../../../ui/button";
import { FilterableCombobox } from "../../../ui/filterable-combobox";
import { Modal } from "../../../ui/modal";

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
  const { messages } = useI18n();
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
      title={messages.explorer.modals.deleteAddress.title}
      description={messages.explorer.modals.deleteAddress.description}
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
            <Button
              type="button"
              variant="destructive"
              onClick={() => void onConfirm({ address, force })}
              disabled={isPending || !canDelete}
            >
              {isPending ? messages.explorer.modals.deleteAddress.pending : messages.explorer.modals.deleteAddress.button}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="app-notice app-notice-warning text-sm">{messages.explorer.modals.deleteAddress.warning}</div>

        <label className="space-y-2 text-sm text-foreground">
          <span>{messages.explorer.modals.deleteAddress.address}</span>
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
            <span className="font-medium leading-none">{messages.explorer.modals.deleteAddress.forceLabel}</span>
            <span className="text-xs opacity-55">{messages.explorer.modals.deleteAddress.forceHint}</span>
          </div>
        </label>

        {addresses.length === 0 ? (
          <div className="app-notice app-notice-neutral text-sm">{messages.explorer.modals.deleteAddress.noAddresses}</div>
        ) : null}

        {errorMessage ? <div className="app-notice app-notice-critical text-sm">{errorMessage}</div> : null}
      </div>
    </Modal>
  );
}
