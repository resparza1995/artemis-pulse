import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AddressDeleteResponse,
  ExplorerMessageDetail,  MessageActionType,
  PublishMessageResponse,
  QueueConsumeResponse,
  QueueDeleteResponse,
  QueueMessageActionResponse,
  QueueMessagesResponse,
  QueuePurgeResponse,
} from "../../types/explorer";
import type { QueueSummary } from "../../types/queues";
import { ConsumeMessagesModal } from "./ConsumeMessagesModal";
import { CreateAddressModal } from "./CreateAddressModal";
import { CreateQueueModal } from "./CreateQueueModal";
import { DeleteAddressModal } from "./DeleteAddressModal";
import { DeleteQueueModal } from "./DeleteQueueModal";
import { ExplorerAdminModal } from "./ExplorerAdminModal";
import { ExplorerMessageDetailPanel } from "./ExplorerMessageDetailPanel";
import { ExplorerMessagesPanel } from "./ExplorerMessagesPanel";
import { ExplorerSidebar } from "./ExplorerSidebar";
import { MoveMessagesModal } from "./MoveMessagesModal";
import { PublishMessageModal } from "./PublishMessageModal";
import { PurgeQueueModal } from "./PurgeQueueModal";
import { RetryMessagesModal } from "./RetryMessagesModal";

type ExplorerViewProps = {
  brokerLabel: string;
};

type ApiError = {
  message?: string;
};

type QueueGroup = {
  address: string;
  queues: QueueSummary[];
};

type NoticeTone = "success" | "warning";

type OperationNotice = {
  tone: NoticeTone;
  message: string;
};

type MessageSortKey = "timestamp" | "priority" | "size";
type MessageSortDirection = "asc" | "desc";

type CreateAddressPayload = {
  address: string;
  routingType: "ANYCAST" | "MULTICAST";
};

type CreateQueuePayload = {
  address: string;
  queueName: string;
  routingType: "ANYCAST" | "MULTICAST";
  durable: boolean;
};

type PublishPayload = {
  body: string;
  durable: boolean;
  headers: Record<string, string>;
  count: number;
};

type QueueMessageActionPayload = {
  action: MessageActionType;
  messageIds: string[];
  destinationQueueName?: string;
};

async function parseResponse<T>(response: Response) {
  let payload: T | ApiError | null = null;

  try {
    payload = (await response.json()) as T | ApiError;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      (payload && typeof payload === "object" && "message" in payload && payload.message) ||
        "La respuesta del backend no fue valida.",
    );
  }

  return payload as T;
}

async function fetchQueues() {
  const response = await fetch("/api/queues", {
    headers: { Accept: "application/json" },
  });

  const payload = await parseResponse<QueueSummary[]>(response);

  if (!Array.isArray(payload)) {
    throw new Error("La respuesta de colas no tiene el formato esperado.");
  }

  return payload;
}

async function fetchQueueMessages(queueName: string, limit: 100 | 250 | 500) {
  const response = await fetch(
    `/api/queues/${encodeURIComponent(queueName)}/messages?limit=${limit}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  return parseResponse<QueueMessagesResponse>(response);
}

async function fetchMessageDetail(queueName: string, messageId: string) {
  const response = await fetch(
    `/api/queues/${encodeURIComponent(queueName)}/messages/${encodeURIComponent(messageId)}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  return parseResponse<ExplorerMessageDetail>(response);
}

async function createAddressRequest(payload: CreateAddressPayload) {
  const response = await fetch("/api/addresses", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<{ address: string; routingType: string; lastUpdatedAt: string }>(response);
}

async function createQueueRequest(payload: CreateQueuePayload) {
  const response = await fetch("/api/queues", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<QueueSummary>(response);
}

async function publishMessageRequest(queueName: string, payload: PublishPayload) {
  const response = await fetch(`/api/queues/${encodeURIComponent(queueName)}/publish`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<PublishMessageResponse>(response);
}

async function purgeQueueRequest(queueName: string) {
  const response = await fetch(`/api/queues/${encodeURIComponent(queueName)}/purge`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  return parseResponse<QueuePurgeResponse>(response);
}

async function consumeMessagesRequest(queueName: string, count: number) {
  const response = await fetch(`/api/queues/${encodeURIComponent(queueName)}/consume`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ count }),
  });

  return parseResponse<QueueConsumeResponse>(response);
}

async function deleteQueueRequest(queueName: string) {
  const response = await fetch(`/api/queues/${encodeURIComponent(queueName)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  return parseResponse<QueueDeleteResponse>(response);
}

async function deleteAddressRequest(address: string) {
  const response = await fetch(`/api/addresses/${encodeURIComponent(address)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  return parseResponse<AddressDeleteResponse>(response);
}

async function executeMessageActionRequest(queueName: string, payload: QueueMessageActionPayload) {
  const response = await fetch(`/api/queues/${encodeURIComponent(queueName)}/messages/actions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<QueueMessageActionResponse>(response);
}

function groupQueues(queues: QueueSummary[], search: string) {
  const query = search.trim().toLowerCase();
  const groups = new Map<string, QueueSummary[]>();

  for (const queue of queues) {
    const matchesSearch =
      query.length === 0 ||
      queue.name.toLowerCase().includes(query) ||
      queue.address.toLowerCase().includes(query);

    if (!matchesSearch) {
      continue;
    }

    const existing = groups.get(queue.address) ?? [];
    existing.push(queue);
    groups.set(queue.address, existing);
  }

  return [...groups.entries()]
    .map(([address, groupedQueues]) => ({ address, queues: groupedQueues }))
    .sort((left, right) => left.address.localeCompare(right.address))
    .map((group) => ({
      ...group,
      queues: [...group.queues].sort((left, right) => left.name.localeCompare(right.name)),
    })) satisfies QueueGroup[];
}

function compareNullableNumbers(left: number | null, right: number | null, direction: MessageSortDirection) {
  const leftValue = left ?? -1;
  const rightValue = right ?? -1;
  return direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
}

function compareNullableTimestamps(left: string | null, right: string | null, direction: MessageSortDirection) {
  const leftValue = left ? new Date(left).getTime() : -1;
  const rightValue = right ? new Date(right).getTime() : -1;
  return direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
}

function buildMessageActionNotice(result: QueueMessageActionResponse): OperationNotice {
  if (result.failed.length === 0) {
    return {
      tone: "success",
      message: `${result.action === "retry" ? "Retry" : "Move"}: ${result.succeededCount} mensaje(s) procesados en ${result.queueName}.`,
    };
  }

  if (result.succeededCount > 0) {
    return {
      tone: "warning",
      message: `${result.action === "retry" ? "Retry" : "Move"}: ${result.succeededCount} mensaje(s) procesados y ${result.failed.length} fallaron en ${result.queueName}.`,
    };
  }

  return {
    tone: "warning",
    message: `${result.action === "retry" ? "Retry" : "Move"}: no se proceso ningun mensaje. ${result.failed.length} fallaron.`,
  };
}

function ExplorerViewContent(_: ExplorerViewProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [messageFilter, setMessageFilter] = useState("");
  const [messageLimit, setMessageLimit] = useState<100 | 250 | 500>(100);
  const [messageSortKey, setMessageSortKey] = useState<MessageSortKey>("timestamp");
  const [messageSortDirection, setMessageSortDirection] = useState<MessageSortDirection>("desc");
  const [expandedAddresses, setExpandedAddresses] = useState<Record<string, boolean>>({});
  const [selectedQueueName, setSelectedQueueName] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState("");
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCreateAddressOpen, setIsCreateAddressOpen] = useState(false);
  const [isCreateQueueOpen, setIsCreateQueueOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isConsumeOpen, setIsConsumeOpen] = useState(false);
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);
  const [isDeleteQueueOpen, setIsDeleteQueueOpen] = useState(false);
  const [isDeleteAddressOpen, setIsDeleteAddressOpen] = useState(false);
  const [isRetryOpen, setIsRetryOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [operationNotice, setOperationNotice] = useState<OperationNotice | null>(null);
  const deferredSearch = useDeferredValue(search);
  const deferredMessageFilter = useDeferredValue(messageFilter);

  const queuesQuery = useQuery({
    queryKey: ["queues"],
    queryFn: fetchQueues,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const queues = queuesQuery.data ?? [];
  const queueGroups = useMemo(
    () => groupQueues(queues, deferredSearch),
    [queues, deferredSearch],
  );
  const visibleQueues = useMemo(
    () => queueGroups.flatMap((group) => group.queues),
    [queueGroups],
  );
  const selectedQueue = queues.find((queue) => queue.name === selectedQueueName);

  useEffect(() => {
    setExpandedAddresses((current) => {
      let changed = false;
      const next = { ...current };

      for (const group of queueGroups) {
        if (next[group.address] === undefined) {
          next[group.address] = true;
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [queueGroups]);

  useEffect(() => {
    setSelectedQueueName((current) => {
      if (visibleQueues.some((queue) => queue.name === current)) {
        return current;
      }

      return visibleQueues[0]?.name ?? "";
    });
  }, [visibleQueues]);

  useEffect(() => {
    setSelectedMessageIds([]);
    setSelectedMessageId("");
    setMessageFilter("");
  }, [selectedQueueName]);

  const messagesQuery = useQuery({
    queryKey: ["queue-messages", selectedQueueName, messageLimit],
    queryFn: () => fetchQueueMessages(selectedQueueName, messageLimit),
    enabled: Boolean(selectedQueueName),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const filteredMessages = useMemo(() => {
    const items = messagesQuery.data?.items ?? [];
    const query = deferredMessageFilter.trim().toLowerCase();

    const filtered = items.filter((message) => {
      if (!query) {
        return true;
      }

      return (
        message.messageId.toLowerCase().includes(query) ||
        (message.contentType ?? "").toLowerCase().includes(query) ||
        (message.preview ?? "").toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((left, right) => {
      switch (messageSortKey) {
        case "priority":
          return compareNullableNumbers(left.priority, right.priority, messageSortDirection);
        case "size":
          return compareNullableNumbers(left.size, right.size, messageSortDirection);
        case "timestamp":
        default:
          return compareNullableTimestamps(left.timestamp, right.timestamp, messageSortDirection);
      }
    });
  }, [messagesQuery.data?.items, deferredMessageFilter, messageSortKey, messageSortDirection]);

  useEffect(() => {
    setSelectedMessageIds((current) =>
      current.filter((messageId) => filteredMessages.some((message) => message.messageId === messageId)),
    );
  }, [filteredMessages]);

  useEffect(() => {
    setSelectedMessageId((current) => {
      if (filteredMessages.some((message) => message.messageId === current)) {
        return current;
      }

      return filteredMessages[0]?.messageId ?? "";
    });
  }, [filteredMessages]);

  const detailQuery = useQuery({
    queryKey: ["message-detail", selectedQueueName, selectedMessageId],
    queryFn: () => fetchMessageDetail(selectedQueueName, selectedMessageId),
    enabled: Boolean(selectedQueueName && selectedMessageId),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const selectedMessages = useMemo(
    () => filteredMessages.filter((message) => selectedMessageIds.includes(message.messageId)),
    [filteredMessages, selectedMessageIds],
  );
  const canRetrySelection = selectedMessages.some((message) => message.canRetrySafely);

  const createAddressMutation = useMutation({
    mutationFn: createAddressRequest,
    onSuccess: async (result) => {
      setIsCreateAddressOpen(false);
      setOperationNotice({
        tone: "success",
        message: `Address ${result.address} creada. Podras asociarle queues desde la UI.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
    },
  });

  const createQueueMutation = useMutation({
    mutationFn: createQueueRequest,
    onSuccess: async (queue) => {
      setIsCreateQueueOpen(false);
      setSearch("");
      setSelectedQueueName(queue.name);
      setOperationNotice({
        tone: "success",
        message: `Queue ${queue.name} creada correctamente.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (payload: PublishPayload) => {
      if (!selectedQueueName) {
        throw new Error("Selecciona primero una queue para publicar mensajes.");
      }

      return publishMessageRequest(selectedQueueName, payload);
    },
    onSuccess: async (result) => {
      setIsPublishOpen(false);
      setOperationNotice({
        tone: "success",
        message: `Se publicaron ${result.sentCount} mensaje(s) en ${result.queueName}.`,
      });
      await queryClient.invalidateQueries({
        queryKey: ["queue-messages", result.queueName, messageLimit],
      });
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
    },
  });

  const purgeMutation = useMutation({
    mutationFn: () => {
      if (!selectedQueueName) {
        throw new Error("Selecciona primero una queue para limpiarla.");
      }

      return purgeQueueRequest(selectedQueueName);
    },
    onSuccess: async (result) => {
      setIsPurgeOpen(false);
      setSelectedMessageId("");
      setSelectedMessageIds([]);
      setOperationNotice({
        tone: "success",
        message: `Se limpiaron ${result.removedCount} mensajes de ${result.queueName}.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
      await queryClient.invalidateQueries({
        queryKey: ["queue-messages", result.queueName, messageLimit],
      });
      await queryClient.invalidateQueries({
        queryKey: ["message-detail", result.queueName],
        exact: false,
      });
    },
  });

  const consumeMutation = useMutation({
    mutationFn: (count: number) => {
      if (!selectedQueueName) {
        throw new Error("Selecciona primero una queue para consumir mensajes.");
      }

      return consumeMessagesRequest(selectedQueueName, count);
    },
    onSuccess: async (result) => {
      setIsConsumeOpen(false);
      setSelectedMessageId("");
      setSelectedMessageIds([]);
      setOperationNotice({
        tone: "success",
        message: `Consumer temporal: ${result.consumedCount} mensaje(s) consumidos de ${result.queueName}.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
      await queryClient.invalidateQueries({
        queryKey: ["queue-messages", result.queueName, messageLimit],
      });
      await queryClient.invalidateQueries({
        queryKey: ["message-detail", result.queueName],
        exact: false,
      });
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => {
      if (!selectedQueueName) {
        throw new Error("Selecciona primero una queue para reintentar mensajes.");
      }

      return executeMessageActionRequest(selectedQueueName, {
        action: "retry",
        messageIds: selectedMessageIds,
      });
    },
    onSuccess: async (result) => {
      setIsRetryOpen(false);
      setSelectedMessageIds([]);
      setOperationNotice(buildMessageActionNotice(result));
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
      await queryClient.invalidateQueries({
        queryKey: ["queue-messages", result.queueName, messageLimit],
      });
      await queryClient.invalidateQueries({
        queryKey: ["message-detail", result.queueName],
        exact: false,
      });
    },
  });

  const moveMutation = useMutation({
    mutationFn: (destinationQueueName: string) => {
      if (!selectedQueueName) {
        throw new Error("Selecciona primero una queue para mover mensajes.");
      }

      return executeMessageActionRequest(selectedQueueName, {
        action: "move",
        messageIds: selectedMessageIds,
        destinationQueueName,
      });
    },
    onSuccess: async (result) => {
      setIsMoveOpen(false);
      setSelectedMessageIds([]);
      setOperationNotice(buildMessageActionNotice(result));
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
      await queryClient.invalidateQueries({
        queryKey: ["queue-messages", result.queueName, messageLimit],
      });
      await queryClient.invalidateQueries({
        queryKey: ["message-detail", result.queueName],
        exact: false,
      });
    },
  });

  const deleteQueueMutation = useMutation({
    mutationFn: () => {
      if (!selectedQueueName) {
        throw new Error("Selecciona primero una queue para eliminarla.");
      }

      return deleteQueueRequest(selectedQueueName);
    },
    onSuccess: async (result) => {
      setIsDeleteQueueOpen(false);
      setSelectedQueueName("");
      setSelectedMessageId("");
      setSelectedMessageIds([]);
      setOperationNotice({
        tone: "success",
        message: `Queue ${result.queueName} eliminada.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
      await queryClient.invalidateQueries({
        queryKey: ["queue-messages", result.queueName, messageLimit],
      });
      await queryClient.invalidateQueries({
        queryKey: ["message-detail", result.queueName],
        exact: false,
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (address: string) => deleteAddressRequest(address),
    onSuccess: async (result) => {
      setIsDeleteAddressOpen(false);
      setOperationNotice({
        tone: "success",
        message: `Address ${result.address} eliminada.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
    },
  });

  function toggleMessageSelection(messageId: string) {
    setSelectedMessageIds((current) =>
      current.includes(messageId)
        ? current.filter((item) => item !== messageId)
        : [...current, messageId],
    );
  }

  function selectAllVisible() {
    setSelectedMessageIds((current) => {
      const visibleIds = filteredMessages.map((message) => message.messageId);
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => current.includes(id));

      if (allSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return [...new Set([...current, ...visibleIds])];
    });
  }


  function openCreateAddressFromAdmin() {
    setIsAdminOpen(false);
    setIsCreateAddressOpen(true);
  }

  function openCreateQueueFromAdmin() {
    setIsAdminOpen(false);
    setIsCreateQueueOpen(true);
  }

  function openDeleteAddressFromAdmin() {
    setIsAdminOpen(false);
    setIsDeleteAddressOpen(true);
  }

  return (
    <>
      <div className="space-y-4">
        {operationNotice ? (
          <div
            className={[
              "app-notice flex items-center gap-2 text-sm",
              operationNotice.tone === "success" ? "app-notice-success" : "app-notice-warning",
            ].join(" ")}
          >
            {operationNotice.tone === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{operationNotice.message}</span>
            <button
              type="button"
              className="ml-auto text-current opacity-80 transition hover:opacity-100"
              onClick={() => setOperationNotice(null)}
            >
              cerrar
            </button>
          </div>
        ) : null}

        <section className="grid h-[calc(100vh-220px)] gap-4 overflow-y-auto xl:grid-cols-[280px_minmax(0,1fr)_380px]">
          <ExplorerSidebar
            search={search}
            onSearchChange={(value) => {
              startTransition(() => {
                setSearch(value);
              });
            }}
            groups={queueGroups}
            expandedAddresses={expandedAddresses}
            onToggleAddress={(address) => {
              setExpandedAddresses((current) => ({
                ...current,
                [address]: !current[address],
              }));
            }}
            selectedQueueName={selectedQueueName}
            onSelectQueue={(queueName) => setSelectedQueueName(queueName)}
            isLoading={queuesQuery.isLoading}
            isError={queuesQuery.isError}
            errorMessage={queuesQuery.error?.message}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />

          <ExplorerMessagesPanel
            queue={selectedQueue}
            data={messagesQuery.data}
            items={filteredMessages}
            selectedMessageId={selectedMessageId}
            selectedMessageIds={selectedMessageIds}
            messageLimit={messageLimit}
            messageFilter={messageFilter}
            messageSortKey={messageSortKey}
            messageSortDirection={messageSortDirection}
            onMessageLimitChange={setMessageLimit}
            onMessageFilterChange={(value) => {
              startTransition(() => {
                setMessageFilter(value);
              });
            }}
            onMessageSortKeyChange={setMessageSortKey}
            onToggleSortDirection={() =>
              setMessageSortDirection((current) => (current === "desc" ? "asc" : "desc"))
            }
            onSelectMessage={setSelectedMessageId}
            onToggleMessageSelection={toggleMessageSelection}
            onSelectAllVisible={selectAllVisible}
            onClearSelection={() => setSelectedMessageIds([])}
            isLoading={messagesQuery.isLoading}
            isFetching={messagesQuery.isFetching}
            isError={messagesQuery.isError}
            errorMessage={messagesQuery.error?.message}
            onRefresh={() => messagesQuery.refetch()}
            onOpenPublish={() => setIsPublishOpen(true)}
            onOpenConsume={() => setIsConsumeOpen(true)}
            onOpenPurge={() => setIsPurgeOpen(true)}
            onOpenDeleteQueue={() => setIsDeleteQueueOpen(true)}
            onOpenRetry={() => setIsRetryOpen(true)}
            onOpenMove={() => setIsMoveOpen(true)}
            canRetrySelection={canRetrySelection}
          />

          <ExplorerMessageDetailPanel
            queue={selectedQueue}
            selectedMessageId={selectedMessageId}
            detail={detailQuery.data}
            isLoading={detailQuery.isLoading}
            isFetching={detailQuery.isFetching}
            isError={detailQuery.isError}
            errorMessage={detailQuery.error?.message}
            onRefresh={() => detailQuery.refetch()}
          />
        </section>
      </div>

      <ExplorerAdminModal
        open={isAdminOpen}
        selectedAddress={selectedQueue?.address}
        selectedQueueName={selectedQueue?.name}
        onClose={() => setIsAdminOpen(false)}
        onOpenCreateAddress={openCreateAddressFromAdmin}
        onOpenCreateQueue={openCreateQueueFromAdmin}
        onOpenDeleteAddress={openDeleteAddressFromAdmin}
      />

      <CreateAddressModal
        open={isCreateAddressOpen}
        initialAddress={selectedQueue?.address}
        onClose={() => {
          if (!createAddressMutation.isPending) {
            setIsCreateAddressOpen(false);
            createAddressMutation.reset();
          }
        }}
        onSubmit={async (payload) => {
          await createAddressMutation.mutateAsync(payload);
        }}
        isPending={createAddressMutation.isPending}
        errorMessage={createAddressMutation.error?.message}
      />

      <CreateQueueModal
        open={isCreateQueueOpen}
        initialAddress={selectedQueue?.address}
        onClose={() => {
          if (!createQueueMutation.isPending) {
            setIsCreateQueueOpen(false);
            createQueueMutation.reset();
          }
        }}
        onSubmit={async (payload) => {
          await createQueueMutation.mutateAsync(payload);
        }}
        isPending={createQueueMutation.isPending}
        errorMessage={createQueueMutation.error?.message}
      />

      <PublishMessageModal
        open={isPublishOpen}
        queue={selectedQueue}
        onClose={() => {
          if (!publishMutation.isPending) {
            setIsPublishOpen(false);
            publishMutation.reset();
          }
        }}
        onSubmit={async (payload) => {
          await publishMutation.mutateAsync(payload);
        }}
        isPending={publishMutation.isPending}
        errorMessage={publishMutation.error?.message}
      />

      <ConsumeMessagesModal
        open={isConsumeOpen}
        queueName={selectedQueue?.name}
        onClose={() => {
          if (!consumeMutation.isPending) {
            setIsConsumeOpen(false);
            consumeMutation.reset();
          }
        }}
        onSubmit={async (count) => {
          await consumeMutation.mutateAsync(count);
        }}
        isPending={consumeMutation.isPending}
        errorMessage={consumeMutation.error?.message}
      />

      <PurgeQueueModal
        open={isPurgeOpen}
        queueName={selectedQueue?.name}
        onClose={() => {
          if (!purgeMutation.isPending) {
            setIsPurgeOpen(false);
            purgeMutation.reset();
          }
        }}
        onConfirm={async () => {
          await purgeMutation.mutateAsync();
        }}
        isPending={purgeMutation.isPending}
        errorMessage={purgeMutation.error?.message}
      />

      <DeleteQueueModal
        open={isDeleteQueueOpen}
        queue={selectedQueue}
        onClose={() => {
          if (!deleteQueueMutation.isPending) {
            setIsDeleteQueueOpen(false);
            deleteQueueMutation.reset();
          }
        }}
        onConfirm={async () => {
          await deleteQueueMutation.mutateAsync();
        }}
        isPending={deleteQueueMutation.isPending}
        errorMessage={deleteQueueMutation.error?.message}
      />

      <DeleteAddressModal
        open={isDeleteAddressOpen}
        initialAddress={selectedQueue?.address}
        onClose={() => {
          if (!deleteAddressMutation.isPending) {
            setIsDeleteAddressOpen(false);
            deleteAddressMutation.reset();
          }
        }}
        onConfirm={async (address) => {
          await deleteAddressMutation.mutateAsync(address);
        }}
        isPending={deleteAddressMutation.isPending}
        errorMessage={deleteAddressMutation.error?.message}
      />

      <RetryMessagesModal
        open={isRetryOpen}
        queueName={selectedQueue?.name}
        selectedMessages={selectedMessages}
        onClose={() => {
          if (!retryMutation.isPending) {
            setIsRetryOpen(false);
            retryMutation.reset();
          }
        }}
        onConfirm={async () => {
          await retryMutation.mutateAsync();
        }}
        isPending={retryMutation.isPending}
        errorMessage={retryMutation.error?.message}
      />

      <MoveMessagesModal
        open={isMoveOpen}
        queueName={selectedQueue?.name}
        selectedCount={selectedMessageIds.length}
        queues={queues}
        onClose={() => {
          if (!moveMutation.isPending) {
            setIsMoveOpen(false);
            moveMutation.reset();
          }
        }}
        onSubmit={async (destinationQueueName) => {
          await moveMutation.mutateAsync(destinationQueueName);
        }}
        isPending={moveMutation.isPending}
        errorMessage={moveMutation.error?.message}
      />
    </>
  );
}

export default function ExplorerView(props: ExplorerViewProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ExplorerViewContent {...props} />
    </QueryClientProvider>
  );
}


