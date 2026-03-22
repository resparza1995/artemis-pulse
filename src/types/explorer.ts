export type ExplorerMessageSummary = {
  messageId: string;
  timestamp: string | null;
  priority: number | null;
  size: number | null;
  contentType: string | null;
  preview: string | null;
  deliveryCount: number | null;
};

export type QueueMessagesResponse = {
  queueName: string;
  address: string;
  items: ExplorerMessageSummary[];
  limit: number;
  truncated: boolean;
  totalKnownMessages: number | null;
  lastUpdatedAt: string;
};

export type ExplorerMessageDetail = {
  messageId: string;
  timestamp: string | null;
  priority: number | null;
  size: number | null;
  contentType: string | null;
  preview: string | null;
  deliveryCount: number | null;
  body: string | null;
  headers: Record<string, unknown>;
  properties: Record<string, unknown>;
  raw: Record<string, unknown>;
};

export type QueueConsumeResponse = {
  queueName: string;
  requested: number;
  consumedCount: number;
  items: ExplorerMessageDetail[];
  lastUpdatedAt: string;
};

export type QueuePurgeResponse = {
  queueName: string;
  removedCount: number;
  lastUpdatedAt: string;
};

export type QueueDeleteResponse = {
  queueName: string;
  deleted: boolean;
  lastUpdatedAt: string;
};

export type AddressDeleteResponse = {
  address: string;
  deleted: boolean;
  lastUpdatedAt: string;
};

export type PublishMessageResponse = {
  address: string;
  queueName: string;
  messageIds: string[];
  sentCount: number;
  lastUpdatedAt: string;
};
