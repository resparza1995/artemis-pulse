import type { ReactNode } from "react";
import { Building2, FolderPlus, Trash2 } from "lucide-react";
import { useI18n } from "../../i18n/react";
import { Button } from "../../ui/button";
import { Modal } from "../../ui/modal";

type ExplorerAdminModalProps = {
  open: boolean;
  selectedAddress?: string;
  selectedQueueName?: string;
  onClose: () => void;
  onOpenCreateAddress: () => void;
  onOpenCreateQueue: () => void;
  onOpenDeleteAddress: () => void;
};

function ActionCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="app-panel-soft flex h-full flex-col gap-3 p-4 text-left transition hover:bg-[rgba(255,255,255,0.05)]"
      onClick={onClick}
    >
      <div className="app-icon-chip flex h-10 w-10 items-center justify-center">{icon}</div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

export function ExplorerAdminModal({
  open,
  selectedAddress,
  selectedQueueName,
  onClose,
  onOpenCreateAddress,
  onOpenCreateQueue,
  onOpenDeleteAddress,
}: ExplorerAdminModalProps) {
  const { messages } = useI18n();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={messages.explorer.admin.title}
      description={messages.explorer.admin.description}
      className="max-w-3xl"
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            {messages.common.close}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <ActionCard
            title={messages.explorer.admin.createAddressTitle}
            description={messages.explorer.admin.createAddressDescription}
            icon={<Building2 className="h-4 w-4 text-primary" />}
            onClick={onOpenCreateAddress}
          />
          <ActionCard
            title={messages.explorer.admin.createQueueTitle}
            description={messages.explorer.admin.createQueueDescription}
            icon={<FolderPlus className="h-4 w-4 text-primary" />}
            onClick={onOpenCreateQueue}
          />
          <ActionCard
            title={messages.explorer.admin.deleteAddressTitle}
            description={messages.explorer.admin.deleteAddressDescription}
            icon={<Trash2 className="h-4 w-4 text-primary" />}
            onClick={onOpenDeleteAddress}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="app-panel-soft space-y-2 p-4 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {messages.explorer.admin.currentAddress}
            </p>
            <p className="font-medium text-foreground">{selectedAddress ?? messages.common.none}</p>
          </div>
          <div className="app-panel-soft space-y-2 p-4 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {messages.explorer.admin.currentQueue}
            </p>
            <p className="font-medium text-foreground">{selectedQueueName ?? messages.common.none}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
