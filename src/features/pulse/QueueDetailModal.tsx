import type { QueueSummary } from "../../types/queues";
import { Modal } from "../../ui/modal";
import { QueueDetailPanel } from "./QueueDetailPanel";

type QueueDetailModalProps = {
  open: boolean;
  queue?: QueueSummary;
  brokerLabel: string;
  totalQueues: number;
  backlogQueues: number;
  criticalQueues: number;
  onClose: () => void;
};

export function QueueDetailModal({
  open,
  queue,
  brokerLabel,
  totalQueues,
  backlogQueues,
  criticalQueues,
  onClose,
}: QueueDetailModalProps) {
  return (
    <Modal
      open={open}
      title={queue ? queue.name : "Queue detail"}
      description={
        queue
          ? `Estado operativo de ${queue.name} y snapshot del broker.`
          : "Selecciona una cola en Broker view para ver su lectura operativa."
      }
      onClose={onClose}
      className="max-w-3xl"
    >
      <QueueDetailPanel
        queue={queue}
        brokerLabel={brokerLabel}
        totalQueues={totalQueues}
        backlogQueues={backlogQueues}
        criticalQueues={criticalQueues}
        withCard={false}
        showHeader={false}
      />
    </Modal>
  );
}
