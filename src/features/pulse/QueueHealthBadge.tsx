import { AlertTriangle, CheckCircle2, Siren } from "lucide-react";
import type { QueueStatus } from "../../lib/queue-status";
import { useI18n } from "../../i18n/react";
import { Badge } from "../../ui/badge";

type QueueHealthBadgeProps = {
  status: QueueStatus;
};

export function QueueHealthBadge({ status }: QueueHealthBadgeProps) {
  const { messages } = useI18n();

  if (status === "critical") {
    return <Badge variant="critical" className="gap-1.5"><Siren className="h-3 w-3" />{messages.common.critical}</Badge>;
  }

  if (status === "warning") {
    return <Badge variant="warning" className="gap-1.5"><AlertTriangle className="h-3 w-3" />{messages.common.warning}</Badge>;
  }

  return <Badge variant="success" className="gap-1.5"><CheckCircle2 className="h-3 w-3" />{messages.common.healthy}</Badge>;
}
