import type {
  AddressDeleteResponse,
  ExplorerMessageDetail,
  ExplorerMessageSummary,
  MessageActionType,
  PublishMessageResponse,
  QueueConsumeResponse,
  QueueDeleteResponse,
  QueueMessageActionResponse,
  QueueMessagesResponse,
  QueuePurgeResponse,
} from "../types/explorer";
import type { QueueSummary } from "../types/queues";
import {
  jolokiaPost,
  JolokiaRequestError,
  QUEUE_MBEAN_PATTERN,
  type JolokiaResponse,
} from "./jolokia";
import { getServerConfig } from "./config";
import { getQueueStatus, isDlqQueue } from "./queue-status";

type QueueAttributes = {
  Address?: string;
  Name?: string;
  ConsumerCount?: number;
  MessageCount?: number;
  DeliveringCount?: number;
  ScheduledCount?: number;
};

type CreateAddressInput = {
  address: string;
  routingType: "ANYCAST" | "MULTICAST";
};

type CreateQueueInput = {
  address: string;
  queueName: string;
  routingType: "ANYCAST" | "MULTICAST";
  durable: boolean;
};

type ConsumeMessagesInput = {
  queueName: string;
  count: number;
};

type PublishMessageInput = {
  queueName: string;
  body: string;
  headers?: Record<string, string>;
  durable?: boolean;
  count?: number;
};

type QueueMessageActionInput = {
  queueName: string;
  action: MessageActionType;
  messageIds: string[];
  destinationQueueName?: string;
};

type JolokiaSearchResponse = JolokiaResponse<string[]>;
type JolokiaReadResponse = JolokiaResponse<QueueAttributes>;
type JolokiaExecResponse<TValue = string> = JolokiaResponse<TValue>;

const QUEUE_ATTRIBUTES = [
  "Address",
  "Name",
  "ConsumerCount",
  "MessageCount",
  "DeliveringCount",
  "ScheduledCount",
] as const;
const BROKER_MBEAN_PATTERN = 'org.apache.activemq.artemis:broker=*';
const SUPPORTED_MESSAGE_LIMITS = new Set([100, 250, 500]);

function extractObjectProperty(objectName: string, propertyName: string) {
  const pattern = new RegExp(`${propertyName}=(?:"([^"]*)"|([^,]+))`);
  const match = objectName.match(pattern);
  const rawValue = match?.[1] ?? match?.[2];

  if (!rawValue) {
    return "";
  }

  return rawValue.trim();
}

function normalizeQueueName(value: string) {
  return value.trim().toLowerCase();
}

function getFirstDefined(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return null;
}

function getStringValue(record: Record<string, unknown>, keys: string[]) {
  const value = getFirstDefined(record, keys);

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function getNumberValue(record: Record<string, unknown>, keys: string[]) {
  const value = getFirstDefined(record, keys);

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric) && numeric > 0) {
    return new Date(numeric).toISOString();
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return value;
}

function decodeBodyPreview(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const bytes = value.filter((item): item is number => typeof item === "number");

  if (bytes.length === 0) {
    return null;
  }

  try {
    return new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    return null;
  }
}

function getStringProperties(record: Record<string, unknown>) {
  const value = record.StringProperties;

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function normalizeMessageBody(record: Record<string, unknown>) {
  const directValue = getFirstDefined(record, [
    "body",
    "Body",
    "text",
    "Text",
    "messageText",
    "MessageText",
  ]);

  if (typeof directValue === "string") {
    return directValue;
  }

  const bodyPreview = decodeBodyPreview(record.BodyPreview);
  if (bodyPreview) {
    return bodyPreview;
  }

  if (directValue !== null && directValue !== undefined) {
    try {
      return JSON.stringify(directValue, null, 2);
    } catch {
      return String(directValue);
    }
  }

  return null;
}

function createPreview(body: string | null) {
  if (!body) {
    return null;
  }

  const preview = body.replace(/\s+/g, " ").trim();
  if (preview.length === 0) {
    return null;
  }

  return preview.length > 140 ? `${preview.slice(0, 137)}...` : preview;
}

function getOriginalMetadata(record: Record<string, unknown>) {
  const stringProperties = getStringProperties(record);
  const originalQueue =
    getStringValue(record, [
      "OriginalQueue",
      "originalQueue",
      "_AMQ_ORIG_QUEUE",
      "HDR_ORIGINAL_QUEUE",
      "JMSOriginalQueue",
    ]) ??
    getStringValue(stringProperties, [
      "OriginalQueue",
      "originalQueue",
      "_AMQ_ORIG_QUEUE",
      "HDR_ORIGINAL_QUEUE",
      "JMSOriginalQueue",
    ]);

  const originalAddress =
    getStringValue(record, [
      "OriginalAddress",
      "originalAddress",
      "_AMQ_ORIG_ADDRESS",
      "HDR_ORIGINAL_ADDRESS",
      "JMSOriginalAddress",
    ]) ??
    getStringValue(stringProperties, [
      "OriginalAddress",
      "originalAddress",
      "_AMQ_ORIG_ADDRESS",
      "HDR_ORIGINAL_ADDRESS",
      "JMSOriginalAddress",
    ]);

  return {
    originalQueue,
    originalAddress,
    canRetrySafely: Boolean(originalQueue || originalAddress),
  };
}

function splitMessageMetadata(record: Record<string, unknown>) {
  const headers = {
    ...Object.fromEntries(
      Object.entries(record).filter(([key]) =>
        /^(JMS|AMQ|HDR_|_AMQ|_HQ|OriginalQueue|originalQueue|OriginalAddress|originalAddress)/i.test(key),
      ),
    ),
    ...getStringProperties(record),
  };
  const knownKeys = new Set([
    "messageID",
    "messageId",
    "userID",
    "timestamp",
    "expiration",
    "priority",
    "size",
    "durable",
    "address",
    "queue",
    "body",
    "Body",
    "text",
    "Text",
    "messageText",
    "MessageText",
    "type",
    "contentType",
    "ContentType",
    "content-type",
    "JMSPriority",
    "JMSDeliveryMode",
    "JMSMessageID",
    "JMSCorrelationID",
    "JMSTimestamp",
    "JMSExpiration",
    "JMSDestination",
    "JMSReplyTo",
    "JMSRedelivered",
    "JMSXDeliveryCount",
    "deliveryCount",
    "redeliveryCounter",
    "BodyPreview",
    "PropertiesText",
    "StringProperties",
    "ShortProperties",
    "ByteProperties",
    "LongProperties",
    "IntProperties",
    "DoubleProperties",
    "BooleanProperties",
    "FloatProperties",
    "largeMessage",
    "protocol",
    "persistentSize",
    "redelivered",
    "OriginalQueue",
    "originalQueue",
    "OriginalAddress",
    "originalAddress",
    "_AMQ_ORIG_QUEUE",
    "_AMQ_ORIG_ADDRESS",
    "HDR_ORIGINAL_QUEUE",
    "HDR_ORIGINAL_ADDRESS",
    "JMSOriginalQueue",
    "JMSOriginalAddress",
  ]);

  const properties = Object.fromEntries(
    Object.entries(record).filter(([key]) => !knownKeys.has(key) && !(key in headers)),
  );

  return { headers, properties };
}

function normalizeMessageSummary(record: Record<string, unknown>) {
  const messageId = getStringValue(record, [
    "messageID",
    "messageId",
    "JMSMessageID",
    "userID",
  ]);

  if (!messageId) {
    return null;
  }

  const body = normalizeMessageBody(record);
  const brokerMessageId = getNumberValue(record, ["messageID", "messageId"]);
  const originalMetadata = getOriginalMetadata(record);

  return {
    messageId,
    brokerMessageId,
    originalAddress: originalMetadata.originalAddress,
    originalQueue: originalMetadata.originalQueue,
    canRetrySafely: originalMetadata.canRetrySafely,
    timestamp: normalizeTimestamp(
      getStringValue(record, ["timestamp", "JMSTimestamp"]),
    ),
    priority: getNumberValue(record, ["priority", "JMSPriority"]),
    size: getNumberValue(record, ["size", "persistentSize"]),
    contentType:
      getStringValue(record, [
        "contentType",
        "ContentType",
        "content-type",
        "HDR_CONTENT_TYPE",
      ]) ??
      getStringValue(getStringProperties(record), ["content-type", "Content-Type"]),
    preview: createPreview(body),
    deliveryCount: getNumberValue(record, [
      "JMSXDeliveryCount",
      "deliveryCount",
      "redeliveryCounter",
    ]),
  } satisfies ExplorerMessageSummary;
}

function normalizeMessageDetail(record: Record<string, unknown>) {
  const summary = normalizeMessageSummary(record);

  if (!summary) {
    return null;
  }

  const { headers, properties } = splitMessageMetadata(record);

  return {
    ...summary,
    body: normalizeMessageBody(record),
    headers,
    properties,
    raw: record,
  } satisfies ExplorerMessageDetail;
}

function normalizeQueue(
  objectName: string,
  attributes: QueueAttributes,
  lastUpdatedAt: string,
) {
  const name = attributes.Name || extractObjectProperty(objectName, "queue");
  const address =
    attributes.Address || extractObjectProperty(objectName, "address") || name;
  const messageCount = Number(attributes.MessageCount ?? 0);
  const consumerCount = Number(attributes.ConsumerCount ?? 0);
  const deliveringCount = Number(attributes.DeliveringCount ?? 0);
  const scheduledCount = Number(attributes.ScheduledCount ?? 0);

  return {
    name,
    address,
    messageCount,
    consumerCount,
    deliveringCount,
    scheduledCount,
    isDlq: isDlqQueue(name),
    status: getQueueStatus(messageCount, consumerCount),
    lastUpdatedAt,
  } satisfies QueueSummary;
}

function sortQueues(queues: QueueSummary[]) {
  const rank = {
    critical: 0,
    warning: 1,
    healthy: 2,
  } as const;

  return queues.sort((left, right) => {
    if (rank[left.status] !== rank[right.status]) {
      return rank[left.status] - rank[right.status];
    }

    if (left.messageCount !== right.messageCount) {
      return right.messageCount - left.messageCount;
    }

    return left.name.localeCompare(right.name);
  });
}

function getJolokiaErrorMessage(response: JolokiaResponse<unknown>, fallbackMessage: string) {
  if ("error" in response && typeof response.error === "string" && response.error.trim()) {
    return response.error;
  }

  return fallbackMessage;
}

function clampCount(value: number | undefined, fallback = 1) {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.min(Math.floor(parsed), 100));
}

function normalizeMessageLimit(value: number | undefined, fallback = 100) {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const normalized = Math.floor(parsed);
  return SUPPORTED_MESSAGE_LIMITS.has(normalized) ? normalized : fallback;
}

async function searchQueueMBeans() {
  const response = await jolokiaPost<JolokiaSearchResponse>({
    type: "search",
    mbean: QUEUE_MBEAN_PATTERN,
  });

  if (response.status !== 200 || !("value" in response)) {
    throw new JolokiaRequestError("No se pudo listar las colas desde Jolokia.");
  }

  return Array.isArray(response.value) ? response.value : [];
}

async function getBrokerObjectName() {
  const response = await jolokiaPost<JolokiaSearchResponse>({
    type: "search",
    mbean: BROKER_MBEAN_PATTERN,
  });

  if (response.status !== 200 || !("value" in response) || !Array.isArray(response.value)) {
    throw new JolokiaRequestError("No se pudo localizar el broker en Jolokia.");
  }

  const broker = response.value[0];

  if (!broker) {
    throw new JolokiaRequestError("No se encontro ningun broker Artemis expuesto en Jolokia.");
  }

  return broker;
}

function getAddressObjectName(address: string, brokerObjectName: string) {
  const brokerName = extractObjectProperty(brokerObjectName, "broker");
  return `org.apache.activemq.artemis:address="${address}",broker="${brokerName}",component=addresses`;
}

function getBase64Body(body: string) {
  const bytes = new TextEncoder().encode(body);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function isAddressAlreadyExistsError(error: unknown) {
  return error instanceof Error && /Address already exists/i.test(error.message);
}

function isQueueAlreadyExistsError(error: unknown) {
  return error instanceof Error && /queue already exists/i.test(error.message);
}

async function ensureAddressExists(
  brokerObjectName: string,
  address: string,
  routingType: "ANYCAST" | "MULTICAST",
) {
  try {
    const response = await jolokiaPost<JolokiaExecResponse>({
      type: "exec",
      mbean: brokerObjectName,
      operation: "createAddress(java.lang.String,java.lang.String)",
      arguments: [address, routingType],
    });

    if (response.status !== 200) {
      throw new JolokiaRequestError(
        getJolokiaErrorMessage(response, "No se pudo crear la address solicitada."),
      );
    }
  } catch (error) {
    if (!isAddressAlreadyExistsError(error)) {
      throw error;
    }
  }
}

async function getQueueObjectName(queueName: string) {
  const objectNames = await searchQueueMBeans();
  const targetName = normalizeQueueName(queueName);

  const objectName = objectNames.find((candidate) => {
    const name = extractObjectProperty(candidate, "queue");
    return normalizeQueueName(name) === targetName;
  });

  if (!objectName) {
    throw new JolokiaRequestError(
      `No se encontro la cola "${queueName}" en Artemis.`,
      404,
    );
  }

  return objectName;
}

async function readQueueAttributes(objectNames: string[]) {
  if (objectNames.length === 0) {
    return [];
  }

  const response = await jolokiaPost<JolokiaReadResponse[]>(
    objectNames.map((objectName) => ({
      type: "read",
      mbean: objectName,
      attribute: [...QUEUE_ATTRIBUTES],
    })),
  );

  if (!Array.isArray(response)) {
    throw new JolokiaRequestError(
      "Jolokia no devolvio la lista esperada de atributos para las colas.",
    );
  }

  return response;
}

async function readQueueMessagesAsJson(objectName: string) {
  const response = await jolokiaPost<JolokiaExecResponse<Record<string, unknown>[]>>({
    type: "exec",
    mbean: objectName,
    operation: "browse()",
  });

  if (response.status !== 200 || !("value" in response)) {
    throw new JolokiaRequestError(
      "No se pudieron obtener los mensajes de la cola desde Jolokia.",
    );
  }

  return Array.isArray(response.value)
    ? response.value.filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      )
    : [];
}

async function executeBooleanQueueOperation(
  objectName: string,
  operation: string,
  argumentsList: unknown[],
  fallbackMessage: string,
) {
  const response = await jolokiaPost<JolokiaExecResponse<boolean>>({
    type: "exec",
    mbean: objectName,
    operation,
    arguments: argumentsList,
  });

  if (response.status !== 200 || !("value" in response) || response.value !== true) {
    throw new JolokiaRequestError(getJolokiaErrorMessage(response, fallbackMessage));
  }
}

export async function listQueues() {
  const objectNames = await searchQueueMBeans();

  if (objectNames.length === 0) {
    return [];
  }

  const readResponses = await readQueueAttributes(objectNames);
  const lastUpdatedAt = new Date().toISOString();

  const queues = readResponses
    .map((response, index) => {
      if (response.status !== 200 || !("value" in response) || !response.value) {
        return null;
      }

      return normalizeQueue(objectNames[index] ?? "", response.value, lastUpdatedAt);
    })
    .filter((queue): queue is QueueSummary => queue !== null);

  if (queues.length === 0 && objectNames.length > 0) {
    throw new JolokiaRequestError(
      "Se encontro informacion de colas en Jolokia, pero no se pudo normalizar la respuesta.",
    );
  }

  return sortQueues(queues);
}

function normalizePercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value * 100)));
}

function normalizeMemoryUsage(memoryAttribute: unknown): number {
  if (!memoryAttribute || typeof memoryAttribute !== "object") {
    return 0;
  }

  const data = memoryAttribute as Record<string, unknown>;
  const used = getNumberValue(data, ["used"]);
  const max = getNumberValue(data, ["max"]);

  if (used === null || max === null || max <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((used / max) * 100)));
}

export async function getBrokerMetrics() {
  const queues = await listQueues();

  const totalMessages = queues.reduce((sum, item) => sum + item.messageCount, 0);
  const queueCount = queues.length;
  const criticalQueueCount = queues.filter((q) => q.status === "critical").length;
  const lastUpdatedAt = new Date().toISOString();

  let cpuUsage = 0;
  let memoryUsage = 0;

  try {
    const osResponse = await jolokiaPost<{
      ProcessCpuLoad?: number;
      SystemCpuLoad?: number;
    }>({
      type: "read",
      mbean: "java.lang:type=OperatingSystem",
      attribute: ["ProcessCpuLoad", "SystemCpuLoad"],
    });

    if (osResponse && "value" in osResponse && osResponse.value) {
      const processCpu = getNumberValue(osResponse.value as Record<string, unknown>, ["ProcessCpuLoad"]);
      const systemCpu = getNumberValue(osResponse.value as Record<string, unknown>, ["SystemCpuLoad"]);
      cpuUsage = normalizePercent(processCpu ?? systemCpu ?? 0);
    }
  } catch (error) {
    console.warn("BROKER_METRICS_OS_ERROR", error);
  }

  try {
    const memoryResponse = await jolokiaPost<{ HeapMemoryUsage?: unknown }>({
      type: "read",
      mbean: "java.lang:type=Memory",
      attribute: ["HeapMemoryUsage"],
    });

    if (memoryResponse && "value" in memoryResponse && memoryResponse.value) {
      memoryUsage = normalizeMemoryUsage((memoryResponse.value as Record<string, unknown>).HeapMemoryUsage);
    }
  } catch (error) {
    console.warn("BROKER_METRICS_MEMORY_ERROR", error);
  }

  return {
    cpuUsage,
    memoryUsage,
    totalMessages,
    queueCount,
    criticalQueueCount,
    lastUpdatedAt,
  };
}

export async function listQueueMessages(queueName: string, limit = 100) {
  const normalizedLimit = normalizeMessageLimit(limit, 100);
  const [objectName, queues] = await Promise.all([
    getQueueObjectName(queueName),
    listQueues(),
  ]);
  const queue = queues.find(
    (candidate) => normalizeQueueName(candidate.name) === normalizeQueueName(queueName),
  );

  if (!queue) {
    throw new JolokiaRequestError(
      `No se encontro la cola "${queueName}" en el resumen del broker.`,
      404,
    );
  }

  const rawMessages = await readQueueMessagesAsJson(objectName);
  const normalizedMessages = rawMessages
    .map((record) => normalizeMessageSummary(record))
    .filter((message): message is ExplorerMessageSummary => message !== null);
  const cappedItems = normalizedMessages.slice(0, normalizedLimit);

  return {
    queueName: queue.name,
    address: queue.address,
    items: cappedItems,
    limit: normalizedLimit,
    truncated: normalizedMessages.length > normalizedLimit,
    totalKnownMessages: normalizedMessages.length,
    lastUpdatedAt: new Date().toISOString(),
  } satisfies QueueMessagesResponse;
}

export async function getQueueMessageDetail(queueName: string, messageId: string) {
  const objectName = await getQueueObjectName(queueName);
  const rawMessages = await readQueueMessagesAsJson(objectName);
  const normalized = rawMessages
    .map((record) => normalizeMessageDetail(record))
    .find((message) => message?.messageId === messageId);

  if (!normalized) {
    throw new JolokiaRequestError(
      `No se encontro el mensaje "${messageId}" en la cola "${queueName}".`,
      404,
    );
  }

  return normalized;
}

export async function createAddress(input: CreateAddressInput) {
  const address = input.address.trim();

  if (!address) {
    throw new JolokiaRequestError("El nombre de la address es obligatorio.", 400);
  }

  const brokerObjectName = await getBrokerObjectName();

  try {
    const response = await jolokiaPost<JolokiaExecResponse>({
      type: "exec",
      mbean: brokerObjectName,
      operation: "createAddress(java.lang.String,java.lang.String)",
      arguments: [address, input.routingType],
    });

    if (response.status !== 200) {
      throw new JolokiaRequestError(
        getJolokiaErrorMessage(response, `No se pudo crear la address "${address}".`),
      );
    }
  } catch (error) {
    if (isAddressAlreadyExistsError(error)) {
      throw new JolokiaRequestError(`La address "${address}" ya existe.`, 409);
    }

    throw error;
  }

  return {
    address,
    routingType: input.routingType,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function createQueue(input: CreateQueueInput) {
  const address = input.address.trim();
  const queueName = input.queueName.trim();

  if (!address || !queueName) {
    throw new JolokiaRequestError(
      "La direccion y el nombre de la cola son obligatorios.",
      400,
    );
  }

  const brokerObjectName = await getBrokerObjectName();

  await ensureAddressExists(brokerObjectName, address, input.routingType);

  try {
    const deployResponse = await jolokiaPost<JolokiaExecResponse>({
      type: "exec",
      mbean: brokerObjectName,
      operation: "deployQueue(java.lang.String,java.lang.String,java.lang.String,boolean)",
      arguments: [address, queueName, "", input.durable],
    });

    if (deployResponse.status !== 200) {
      throw new JolokiaRequestError(
        getJolokiaErrorMessage(
          deployResponse,
          `No se pudo crear la cola "${queueName}".`,
        ),
      );
    }
  } catch (error) {
    if (isQueueAlreadyExistsError(error)) {
      throw new JolokiaRequestError(`La cola "${queueName}" ya existe.`, 409);
    }

    throw error;
  }

  const queues = await listQueues();
  const createdQueue = queues.find(
    (queue) => normalizeQueueName(queue.name) === normalizeQueueName(queueName),
  );

  if (!createdQueue) {
    throw new JolokiaRequestError(
      `La cola "${queueName}" se creo, pero no aparecio en el refresco del broker.`,
    );
  }

  return createdQueue;
}

export async function publishMessage(input: PublishMessageInput) {
  const queueName = input.queueName.trim();
  const queueObjectName = await getQueueObjectName(queueName);
  const address = extractObjectProperty(queueObjectName, "address");
  const brokerObjectName = await getBrokerObjectName();
  const addressObjectName = getAddressObjectName(address, brokerObjectName);
  const { artemisUsername, artemisPassword } = getServerConfig();
  const count = clampCount(input.count, 1);

  const headers = {
    ...(input.headers ?? {}),
  } as Record<string, string>;
  const messageIds: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const response = await jolokiaPost<JolokiaExecResponse<string>>({
      type: "exec",
      mbean: addressObjectName,
      operation:
        "sendMessage(java.util.Map,int,java.lang.String,boolean,java.lang.String,java.lang.String,boolean)",
      arguments: [
        headers,
        4,
        getBase64Body(input.body),
        input.durable ?? true,
        artemisUsername,
        artemisPassword,
        true,
      ],
    });

    if (response.status !== 200 || !("value" in response)) {
      throw new JolokiaRequestError(
        getJolokiaErrorMessage(
          response,
          `No se pudo publicar el mensaje en la direccion "${address}".`,
        ),
      );
    }

    if (typeof response.value === "string" && response.value.trim()) {
      messageIds.push(response.value);
    }
  }

  return {
    address,
    queueName,
    messageIds,
    sentCount: count,
    lastUpdatedAt: new Date().toISOString(),
  } satisfies PublishMessageResponse;
}

function getNumericMessageId(record: Record<string, unknown>) {
  const numericId = getNumberValue(record, ["messageID", "messageId"]);
  return numericId !== null ? numericId : null;
}

async function removeMessageById(objectName: string, messageId: number) {
  await executeBooleanQueueOperation(
    objectName,
    "removeMessage(long)",
    [messageId],
    `No se pudo eliminar el mensaje ${messageId} de la cola.`,
  );
}

export async function purgeQueue(queueName: string) {
  const objectName = await getQueueObjectName(queueName);
  const response = await jolokiaPost<JolokiaExecResponse<number>>({
    type: "exec",
    mbean: objectName,
    operation: "removeAllMessages()",
  });

  if (response.status !== 200 || !("value" in response) || typeof response.value !== "number") {
    throw new JolokiaRequestError(`No se pudo limpiar la cola "${queueName}".`);
  }

  return {
    queueName,
    removedCount: response.value,
    lastUpdatedAt: new Date().toISOString(),
  } satisfies QueuePurgeResponse;
}

export async function deleteQueue(queueName: string) {
  const normalizedQueueName = queueName.trim();

  if (!normalizedQueueName) {
    throw new JolokiaRequestError("Debes indicar la cola que quieres eliminar.", 400);
  }

  const brokerObjectName = await getBrokerObjectName();
  const response = await jolokiaPost<JolokiaExecResponse>({
    type: "exec",
    mbean: brokerObjectName,
    operation: "destroyQueue(java.lang.String,boolean,boolean)",
    arguments: [normalizedQueueName, false, false],
  });

  if (response.status !== 200) {
    const message = getJolokiaErrorMessage(
      response,
      `No se pudo eliminar la cola "${normalizedQueueName}".`,
    );

    if (/does not exist|not found/i.test(message)) {
      throw new JolokiaRequestError(message, 404);
    }

    throw new JolokiaRequestError(message);
  }

  return {
    queueName: normalizedQueueName,
    deleted: true,
    lastUpdatedAt: new Date().toISOString(),
  } satisfies QueueDeleteResponse;
}

export async function deleteAddress(address: string) {
  const normalizedAddress = address.trim();

  if (!normalizedAddress) {
    throw new JolokiaRequestError("Debes indicar la address que quieres eliminar.", 400);
  }

  const brokerObjectName = await getBrokerObjectName();
  const response = await jolokiaPost<JolokiaExecResponse>({
    type: "exec",
    mbean: brokerObjectName,
    operation: "deleteAddress(java.lang.String)",
    arguments: [normalizedAddress],
  });

  if (response.status !== 200) {
    const message = getJolokiaErrorMessage(
      response,
      `No se pudo eliminar la address "${normalizedAddress}".`,
    );

    if (/does not exist|not found/i.test(message)) {
      throw new JolokiaRequestError(message, 404);
    }

    throw new JolokiaRequestError(message);
  }

  return {
    address: normalizedAddress,
    deleted: true,
    lastUpdatedAt: new Date().toISOString(),
  } satisfies AddressDeleteResponse;
}

export async function consumeMessages(input: ConsumeMessagesInput) {
  const queueName = input.queueName.trim();
  const requested = clampCount(input.count, 1);
  const objectName = await getQueueObjectName(queueName);
  const rawMessages = await readQueueMessagesAsJson(objectName);
  const selectedRecords = rawMessages.slice(0, requested);
  const consumableMessages = selectedRecords
    .map((record) => {
      const detail = normalizeMessageDetail(record);
      const numericMessageId = getNumericMessageId(record);

      if (!detail || numericMessageId === null) {
        return null;
      }

      return {
        detail,
        numericMessageId,
      };
    })
    .filter(
      (
        item,
      ): item is {
        detail: ExplorerMessageDetail;
        numericMessageId: number;
      } => item !== null,
    );

  for (const message of consumableMessages) {
    await removeMessageById(objectName, message.numericMessageId);
  }

  return {
    queueName,
    requested,
    consumedCount: consumableMessages.length,
    items: consumableMessages.map((message) => message.detail),
    lastUpdatedAt: new Date().toISOString(),
  } satisfies QueueConsumeResponse;
}

export async function executeQueueMessageAction(input: QueueMessageActionInput) {
  const queueName = input.queueName.trim();
  const action = input.action;
  const destinationQueueName = input.destinationQueueName?.trim();
  const requestedMessageIds = [...new Set(input.messageIds.map((id) => id.trim()).filter(Boolean))];

  if (!queueName) {
    throw new JolokiaRequestError("Debes indicar la queue origen de la operacion.", 400);
  }

  if (requestedMessageIds.length === 0) {
    throw new JolokiaRequestError("Debes seleccionar al menos un mensaje para ejecutar la accion.", 400);
  }

  if (action === "move") {
    if (!destinationQueueName) {
      throw new JolokiaRequestError("Debes indicar la queue destino para mover mensajes.", 400);
    }

    if (normalizeQueueName(destinationQueueName) === normalizeQueueName(queueName)) {
      throw new JolokiaRequestError("La queue destino debe ser distinta de la queue origen.", 400);
    }
  }

  const objectName = await getQueueObjectName(queueName);
  const rawMessages = await readQueueMessagesAsJson(objectName);
  const byMessageId = new Map(
    rawMessages
      .map((record) => normalizeMessageDetail(record))
      .filter((message): message is ExplorerMessageDetail => message !== null)
      .map((message) => [message.messageId, message]),
  );

  const failed: Array<{ messageId: string; reason: string }> = [];
  let succeededCount = 0;

  for (const messageId of requestedMessageIds) {
    const message = byMessageId.get(messageId);

    if (!message) {
      failed.push({
        messageId,
        reason: "El mensaje ya no esta disponible en la cola origen.",
      });
      continue;
    }

    if (message.brokerMessageId === null) {
      failed.push({
        messageId,
        reason: "No se pudo resolver el identificador interno del broker para este mensaje.",
      });
      continue;
    }

    if (action === "retry" && !message.canRetrySafely) {
      failed.push({
        messageId,
        reason: "El mensaje no expone destino original reutilizable. Usa Move para elegir una queue destino.",
      });
      continue;
    }

    try {
      if (action === "retry") {
        await executeBooleanQueueOperation(
          objectName,
          "retryMessage(long)",
          [message.brokerMessageId],
          `No se pudo reintentar el mensaje ${messageId}.`,
        );
      } else {
        await executeBooleanQueueOperation(
          objectName,
          "moveMessage(long,java.lang.String)",
          [message.brokerMessageId, destinationQueueName],
          `No se pudo mover el mensaje ${messageId} a ${destinationQueueName}.`,
        );
      }

      succeededCount += 1;
    } catch (error) {
      failed.push({
        messageId,
        reason:
          error instanceof Error
            ? error.message
            : "La operacion sobre el mensaje fallo por un error no controlado.",
      });
    }
  }

  return {
    queueName,
    action,
    requestedCount: requestedMessageIds.length,
    succeededCount,
    failed,
    lastUpdatedAt: new Date().toISOString(),
  } satisfies QueueMessageActionResponse;
}
