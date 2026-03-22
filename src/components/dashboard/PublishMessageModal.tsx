import { useEffect, useState } from "react";
import type { QueueSummary } from "../../types/queues";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import { Textarea } from "../ui/textarea";

type PublishMessageModalProps = {
  open: boolean;
  queue?: QueueSummary;
  onClose: () => void;
  onSubmit: (payload: {
    body: string;
    durable: boolean;
    headers: Record<string, string>;
    count: number;
  }) => Promise<void>;
  isPending: boolean;
  errorMessage?: string;
};

function parseHeaders(rawHeaders: string) {
  return rawHeaders
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((result, line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        return result;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (key) {
        result[key] = value;
      }

      return result;
    }, {});
}

export function PublishMessageModal({
  open,
  queue,
  onClose,
  onSubmit,
  isPending,
  errorMessage,
}: PublishMessageModalProps) {
  const [body, setBody] = useState('{\n  "hello": "world"\n}');
  const [headersText, setHeadersText] = useState("content-type: application/json");
  const [durable, setDurable] = useState(true);
  const [count, setCount] = useState("1");

  useEffect(() => {
    if (open) {
      setBody('{\n  "hello": "world"\n}');
      setHeadersText("content-type: application/json");
      setDurable(true);
      setCount("1");
    }
  }, [open, queue?.name]);

  const parsedCount = Number(count);
  const isValidCount = Number.isFinite(parsedCount) && parsedCount > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publish"
      description={
        queue
          ? `Publica uno o varios mensajes de prueba en la queue ${queue.name}. El publish se enviara a su address asociada.`
          : "Selecciona una queue para publicar mensajes."
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="publish-message-form"
            disabled={isPending || !queue || !isValidCount}
          >
            {isPending ? "Publicando..." : "Publicar"}
          </Button>
        </div>
      }
    >
      <form
        id="publish-message-form"
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit({
            body,
            durable,
            headers: parseHeaders(headersText),
            count: parsedCount,
          });
        }}
      >
        <div className="app-notice app-notice-neutral text-sm">
          {queue ? (
            <>
              Se enviara a <span className="font-medium text-foreground">{queue.address}</span> y quedara visible en la queue <span className="font-medium text-foreground">{queue.name}</span>.
            </>
          ) : (
            "No hay queue seleccionada."
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
          <span className="text-sm text-foreground">Numero de envios</span>
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

        <label className="space-y-2 text-sm text-foreground">
          <span>Body</span>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="min-h-52 font-mono text-xs"
          />
        </label>

        <label className="space-y-2 text-sm text-foreground">
          <span>Headers</span>
          <Textarea
            value={headersText}
            onChange={(event) => setHeadersText(event.target.value)}
            className="min-h-28 font-mono text-xs"
            placeholder="content-type: application/json"
          />
        </label>

        <label className="app-toggle-shell flex items-center gap-3 rounded-[1.25rem] px-4 py-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={durable}
            onChange={(event) => setDurable(event.target.checked)}
            className="app-checkbox h-4 w-4 rounded border-[color:var(--border)] bg-transparent"
          />
          mensaje durable
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
