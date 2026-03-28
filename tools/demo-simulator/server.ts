type RoutingType = "ANYCAST" | "MULTICAST";

type DemoQueue = {
  name: string;
  address: string;
  routingType: RoutingType;
  durable: boolean;
};

type TrafficRule =
  | {
      type: "produce";
      queueName: string;
      intervalMs: number;
      batchSize: number;
    }
  | {
      type: "drain";
      queueName: string;
      intervalMs: number;
      batchSize: number;
    };

type DemoProfile = {
  name: string;
  description: string;
  queues: DemoQueue[];
  rules: TrafficRule[];
};

type JolokiaSuccess<T> = {
  status: number;
  value: T;
};

type JolokiaFailure = {
  status: number;
  error?: string;
};

type JolokiaResponse<T> = JolokiaSuccess<T> | JolokiaFailure;

const ARTEMIS_JOLOKIA_URL =
  process.env.ARTEMIS_BASE_URL ?? "http://localhost:8161/console/jolokia";
const ARTEMIS_USER = process.env.ARTEMIS_USERNAME ?? "admin";
const ARTEMIS_PASSWORD = process.env.ARTEMIS_PASSWORD ?? "admin123";
const SIMULATOR_PORT = Number(process.env.DEMO_SIMULATOR_PORT ?? "7071");
const AUTO_PROFILE = (process.env.DEMO_AUTO_PROFILE ?? "steady").trim().toLowerCase();
const DEMO_PREFIX = "demo.";

const QUEUE_MBEAN_PATTERN =
  'org.apache.activemq.artemis:broker=*,component=addresses,address=*,subcomponent=queues,routing-type=*,queue=*';
const BROKER_MBEAN_PATTERN = "org.apache.activemq.artemis:broker=*";
const ADDRESS_MBEAN_PATTERN =
  "org.apache.activemq.artemis:broker=*,component=addresses,address=*";

const profiles: Record<string, DemoProfile> = {
  steady: {
    name: "steady",
    description: "Flujo equilibrado, backlog moderado y estable.",
    queues: [
      { name: "demo.orders.in", address: "demo.orders", routingType: "ANYCAST", durable: true },
      { name: "demo.billing.in", address: "demo.billing", routingType: "ANYCAST", durable: true },
      { name: "demo.notify.in", address: "demo.notify", routingType: "ANYCAST", durable: true },
      { name: "demo.orders.dlq", address: "demo.orders", routingType: "ANYCAST", durable: true },
    ],
    rules: [
      { type: "produce", queueName: "demo.orders.in", intervalMs: 900, batchSize: 6 },
      { type: "produce", queueName: "demo.billing.in", intervalMs: 1200, batchSize: 4 },
      { type: "produce", queueName: "demo.notify.in", intervalMs: 700, batchSize: 8 },
      { type: "drain", queueName: "demo.orders.in", intervalMs: 1000, batchSize: 5 },
      { type: "drain", queueName: "demo.billing.in", intervalMs: 1400, batchSize: 4 },
      { type: "drain", queueName: "demo.notify.in", intervalMs: 850, batchSize: 7 },
    ],
  },
  incident: {
    name: "incident",
    description: "Subida de backlog, consumo degradado y DLQ creciendo.",
    queues: [
      { name: "demo.orders.in", address: "demo.orders", routingType: "ANYCAST", durable: true },
      { name: "demo.billing.in", address: "demo.billing", routingType: "ANYCAST", durable: true },
      { name: "demo.notify.in", address: "demo.notify", routingType: "ANYCAST", durable: true },
      { name: "demo.orders.dlq", address: "demo.orders", routingType: "ANYCAST", durable: true },
    ],
    rules: [
      { type: "produce", queueName: "demo.orders.in", intervalMs: 350, batchSize: 16 },
      { type: "produce", queueName: "demo.billing.in", intervalMs: 650, batchSize: 9 },
      { type: "produce", queueName: "demo.notify.in", intervalMs: 500, batchSize: 10 },
      { type: "produce", queueName: "demo.orders.dlq", intervalMs: 900, batchSize: 3 },
      { type: "drain", queueName: "demo.billing.in", intervalMs: 2000, batchSize: 3 },
    ],
  },
  recovery: {
    name: "recovery",
    description: "Normalizacion tras incidente, drenando backlog de forma agresiva.",
    queues: [
      { name: "demo.orders.in", address: "demo.orders", routingType: "ANYCAST", durable: true },
      { name: "demo.billing.in", address: "demo.billing", routingType: "ANYCAST", durable: true },
      { name: "demo.notify.in", address: "demo.notify", routingType: "ANYCAST", durable: true },
      { name: "demo.orders.dlq", address: "demo.orders", routingType: "ANYCAST", durable: true },
    ],
    rules: [
      { type: "produce", queueName: "demo.orders.in", intervalMs: 1200, batchSize: 4 },
      { type: "produce", queueName: "demo.billing.in", intervalMs: 1400, batchSize: 3 },
      { type: "produce", queueName: "demo.notify.in", intervalMs: 900, batchSize: 5 },
      { type: "drain", queueName: "demo.orders.in", intervalMs: 420, batchSize: 20 },
      { type: "drain", queueName: "demo.billing.in", intervalMs: 560, batchSize: 14 },
      { type: "drain", queueName: "demo.notify.in", intervalMs: 420, batchSize: 18 },
      { type: "drain", queueName: "demo.orders.dlq", intervalMs: 620, batchSize: 12 },
    ],
  },
};

let activeTimers: Timer[] = [];
let currentProfile: string | null = null;
let brokerMBeanCache: string | null = null;

function getAuthToken() {
  return btoa(`${ARTEMIS_USER}:${ARTEMIS_PASSWORD}`);
}

async function jolokiaPost<T>(payload: unknown): Promise<T> {
  const response = await fetch(ARTEMIS_JOLOKIA_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getAuthToken()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Jolokia HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

function extractObjectProperty(objectName: string, propertyName: string) {
  const pattern = new RegExp(`${propertyName}=(?:"([^"]*)"|([^,]+))`);
  const match = objectName.match(pattern);
  return (match?.[1] ?? match?.[2] ?? "").trim();
}

async function getBrokerMBean() {
  if (brokerMBeanCache) {
    return brokerMBeanCache;
  }

  const response = await jolokiaPost<JolokiaResponse<string[]>>({
    type: "search",
    mbean: BROKER_MBEAN_PATTERN,
  });

  if (!("value" in response) || !Array.isArray(response.value) || response.value.length === 0) {
    throw new Error("No se encontro broker MBean.");
  }

  brokerMBeanCache = response.value[0];
  return brokerMBeanCache;
}

async function searchQueueObjectNames() {
  const response = await jolokiaPost<JolokiaResponse<string[]>>({
    type: "search",
    mbean: QUEUE_MBEAN_PATTERN,
  });

  if (!("value" in response) || !Array.isArray(response.value)) {
    return [];
  }

  return response.value;
}

async function searchAddressObjectNames() {
  const response = await jolokiaPost<JolokiaResponse<string[]>>({
    type: "search",
    mbean: ADDRESS_MBEAN_PATTERN,
  });

  if (!("value" in response) || !Array.isArray(response.value)) {
    return [];
  }

  return response.value;
}

async function execOperation(
  mbean: string,
  operation: string,
  args: unknown[],
  allowFailure = false,
) {
  const response = await jolokiaPost<JolokiaResponse<unknown>>({
    type: "exec",
    mbean,
    operation,
    arguments: args,
  });

  if ((response.status ?? 0) !== 200 && !allowFailure) {
    const error = "error" in response && response.error ? response.error : "Operacion fallo";
    throw new Error(error);
  }

  return response;
}

async function createAddressIfMissing(brokerMBean: string, address: string, routingType: RoutingType) {
  await execOperation(
    brokerMBean,
    "createAddress(java.lang.String,java.lang.String)",
    [address, routingType],
    true,
  );
}

async function createQueueIfMissing(
  brokerMBean: string,
  queue: DemoQueue,
) {
  await execOperation(
    brokerMBean,
    "deployQueue(java.lang.String,java.lang.String,java.lang.String,boolean)",
    [queue.address, queue.name, "", queue.durable],
    true,
  );
}

function getAddressObjectName(address: string, brokerMBean: string) {
  const brokerName = extractObjectProperty(brokerMBean, "broker");
  return `org.apache.activemq.artemis:address="${address}",broker="${brokerName}",component=addresses`;
}

function encodeBody(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function publishToQueue(queue: DemoQueue, amount: number) {
  if (amount <= 0) {
    return;
  }

  const brokerMBean = await getBrokerMBean();
  const addressObjectName = getAddressObjectName(queue.address, brokerMBean);
  const headers = {
    "x-demo-profile": currentProfile ?? "none",
    "x-demo-queue": queue.name,
  };

  for (let index = 0; index < amount; index += 1) {
    const payload = JSON.stringify({
      id: crypto.randomUUID(),
      profile: currentProfile,
      queue: queue.name,
      createdAt: new Date().toISOString(),
      sequence: index + 1,
    });

    await execOperation(
      addressObjectName,
      "sendMessage(java.util.Map,int,java.lang.String,boolean,java.lang.String,java.lang.String,boolean)",
      [headers, 4, encodeBody(payload), true, ARTEMIS_USER, ARTEMIS_PASSWORD, true],
    );
  }
}

async function getQueueObjectName(queueName: string) {
  const objectNames = await searchQueueObjectNames();
  return objectNames.find(
    (item) => extractObjectProperty(item, "queue").toLowerCase() === queueName.toLowerCase(),
  );
}

async function browseQueue(queueName: string) {
  const queueObjectName = await getQueueObjectName(queueName);
  if (!queueObjectName) {
    return [];
  }

  const response = await jolokiaPost<JolokiaResponse<Record<string, unknown>[]>>({
    type: "exec",
    mbean: queueObjectName,
    operation: "browse()",
  });

  if (!("value" in response) || !Array.isArray(response.value)) {
    return [];
  }

  return response.value;
}

function getNumericMessageId(record: Record<string, unknown>) {
  const value = record.messageID ?? record.messageId;
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function drainQueue(queueName: string, amount: number) {
  if (amount <= 0) {
    return;
  }

  const queueObjectName = await getQueueObjectName(queueName);
  if (!queueObjectName) {
    return;
  }

  const messages = await browseQueue(queueName);
  const toRemove = messages
    .slice(0, amount)
    .map((message) => getNumericMessageId(message))
    .filter((id): id is number => id !== null);

  for (const messageId of toRemove) {
    await execOperation(
      queueObjectName,
      "removeMessage(long)",
      [messageId],
      true,
    );
  }
}

function clearTraffic() {
  for (const timer of activeTimers) {
    clearInterval(timer);
  }
  activeTimers = [];
}

async function resetDemoResources() {
  clearTraffic();
  currentProfile = null;

  const brokerMBean = await getBrokerMBean();
  const queueObjectNames = await searchQueueObjectNames();

  const demoQueueNames = queueObjectNames
    .map((objectName) => extractObjectProperty(objectName, "queue"))
    .filter((queueName) => queueName.startsWith(DEMO_PREFIX));

  for (const queueName of demoQueueNames) {
    await execOperation(
      brokerMBean,
      "destroyQueue(java.lang.String,boolean,boolean)",
      [queueName, false, false],
      true,
    );
  }

  const addressObjectNames = await searchAddressObjectNames();
  const demoAddresses = addressObjectNames
    .map((objectName) => extractObjectProperty(objectName, "address"))
    .filter((address) => address.startsWith(DEMO_PREFIX));

  for (const address of demoAddresses) {
    await execOperation(
      brokerMBean,
      "deleteAddress(java.lang.String)",
      [address],
      true,
    );
  }
}

async function provisionProfile(profile: DemoProfile) {
  const brokerMBean = await getBrokerMBean();

  const uniqueAddresses = [...new Set(profile.queues.map((queue) => queue.address))];
  for (const address of uniqueAddresses) {
    await createAddressIfMissing(brokerMBean, address, "ANYCAST");
  }

  for (const queue of profile.queues) {
    await createQueueIfMissing(brokerMBean, queue);
  }
}

function startProfileTraffic(profile: DemoProfile) {
  clearTraffic();

  for (const rule of profile.rules) {
    const queue = profile.queues.find((item) => item.name === rule.queueName);
    if (!queue) {
      continue;
    }

    const timer = setInterval(async () => {
      try {
        if (rule.type === "produce") {
          await publishToQueue(queue, rule.batchSize);
        } else {
          await drainQueue(queue.name, rule.batchSize);
        }
      } catch (error) {
        console.error("DEMO_RULE_EXECUTION_FAILED", rule, error);
      }
    }, Math.max(150, rule.intervalMs));

    activeTimers.push(timer);
  }
}

async function applyProfile(profileName: string) {
  const normalized = profileName.trim().toLowerCase();
  const profile = profiles[normalized];
  if (!profile) {
    throw new Error(`Perfil desconocido: ${profileName}`);
  }

  await resetDemoResources();
  await provisionProfile(profile);
  currentProfile = profile.name;
  startProfileTraffic(profile);

  return profile;
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function getPathname(url: string) {
  try {
    return new URL(url).pathname;
  } catch {
    return "/";
  }
}

async function handleRequest(request: Request) {
  const pathname = getPathname(request.url);
  const method = request.method.toUpperCase();

  if (method === "GET" && pathname === "/health") {
    return jsonResponse(200, {
      ok: true,
      currentProfile,
      at: new Date().toISOString(),
    });
  }

  if (method === "GET" && pathname === "/profiles") {
    return jsonResponse(200, {
      profiles: Object.keys(profiles),
      currentProfile,
    });
  }

  if (method === "POST" && pathname === "/reset") {
    try {
      await resetDemoResources();
      return jsonResponse(200, {
        reset: true,
        currentProfile,
      });
    } catch (error) {
      return jsonResponse(500, {
        message: error instanceof Error ? error.message : "No se pudo resetear el escenario.",
      });
    }
  }

  const activateMatch = pathname.match(/^\/profiles\/([^/]+)\/activate$/i);
  const aliasMatch = pathname.match(/^\/profile\/([^/]+)$/i);
  const profileToken = activateMatch?.[1] ?? aliasMatch?.[1] ?? null;

  if (method === "POST" && profileToken) {
    const profileName = decodeURIComponent(profileToken);
    try {
      const profile = await applyProfile(profileName);
      return jsonResponse(200, {
        appliedProfile: profile.name,
        description: profile.description,
        resetPerformed: true,
        at: new Date().toISOString(),
      });
    } catch (error) {
      return jsonResponse(400, {
        message: error instanceof Error ? error.message : "No se pudo activar el perfil.",
      });
    }
  }

  return jsonResponse(404, {
    message: "Not found",
  });
}

async function bootstrap() {
  if (AUTO_PROFILE && profiles[AUTO_PROFILE]) {
    try {
      await applyProfile(AUTO_PROFILE);
      console.log("DEMO_PROFILE_AUTO_APPLIED", AUTO_PROFILE);
    } catch (error) {
      console.error("DEMO_PROFILE_AUTO_FAILED", error);
    }
  }

  Bun.serve({
    port: SIMULATOR_PORT,
    fetch: handleRequest,
  });

  console.log(
    `Demo simulator running on :${SIMULATOR_PORT} (jolokia=${ARTEMIS_JOLOKIA_URL})`,
  );
}

void bootstrap();
