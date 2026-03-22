import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";

type ConsumeMessagesModalProps = {
  open: boolean;
  queueName?: string;
  onClose: () => void;
  onSubmit: (count: number) => Promise<void>;
  isPending: boolean;
  errorMessage?: string;
};

export function ConsumeMessagesModal({
  open,
  queueName,
  onClose,
  onSubmit,
  isPending,
  errorMessage,
}: ConsumeMessagesModalProps) {
  const [count, setCount] = useState("1");

  useEffect(() => {
    if (open) {
      setCount("1");
    }
  }, [open, queueName]);

  const parsedCount = Number(count);
  const isValidCount = Number.isFinite(parsedCount) && parsedCount > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Consumer temporal"
      description={
        queueName
          ? `Consumira mensajes de ${queueName} leyendolos y eliminandolos de la cola.`
          : "Selecciona una queue para consumir mensajes."
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void onSubmit(parsedCount)}
            disabled={isPending || !queueName || !isValidCount}
          >
            {isPending ? "Consumiendo..." : "Consumir mensajes"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="app-notice app-notice-neutral text-sm">
          Este consumer es de prueba: lee hasta N mensajes usando browse y despues los elimina con confirmacion implicita.
        </div>

        <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
          <span className="text-sm text-foreground">Numero de mensajes</span>
          <Input
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(event) => setCount(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[1, 10, 25, 50].map((value) => (
            <Button
              key={value}
              type="button"
              variant="secondary"
              className="px-3"
              onClick={() => setCount(String(value))}
            >
              {value}
            </Button>
          ))}
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
