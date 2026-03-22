import type { QueueSummary } from "../../types/queues";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { QueueHealthBadge } from "./QueueHealthBadge";

type QueueTableProps = {
  queues: QueueSummary[];
  selectedQueueName?: string;
  onSelectQueue?: (queue: QueueSummary) => void;
};

const numberFormatter = new Intl.NumberFormat("es-ES");
const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function QueueTable({
  queues,
  selectedQueueName,
  onSelectQueue,
}: QueueTableProps) {
  return (
    <Card>
      <CardHeader className="gap-2 border-b border-[color:var(--border)] pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Broker view</CardTitle>
            <CardDescription>
              Selecciona una cola para ver su estado operativo en detalle.
            </CardDescription>
          </div>
          <Badge variant="neutral">{queues.length} visibles</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {queues.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center px-6 py-10 text-center text-sm text-muted-foreground">
            No hay colas que coincidan con los filtros actuales.
          </div>
        ) : (
          <div className="app-table-shell overflow-x-auto rounded-none border-x-0 border-b-0 border-t-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Mensajes</TableHead>
                  <TableHead className="text-right">Consumidores</TableHead>
                  <TableHead className="text-right">En entrega</TableHead>
                  <TableHead className="text-right">Programados</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ultima actualizacion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queues.map((queue) => {
                  const isSelected = queue.name === selectedQueueName;

                  return (
                    <TableRow
                      key={queue.name}
                      data-state={isSelected ? "selected" : undefined}
                      className="cursor-pointer"
                      onClick={() => onSelectQueue?.(queue)}
                    >
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">{queue.name}</p>
                          <p className="text-xs text-muted-foreground">{queue.address}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {queue.isDlq ? (
                          <Badge variant="outline">DLQ</Badge>
                        ) : (
                          <Badge variant="neutral">queue</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {numberFormatter.format(queue.messageCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {numberFormatter.format(queue.consumerCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {numberFormatter.format(queue.deliveringCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {numberFormatter.format(queue.scheduledCount)}
                      </TableCell>
                      <TableCell>
                        <QueueHealthBadge status={queue.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {dateFormatter.format(new Date(queue.lastUpdatedAt))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
