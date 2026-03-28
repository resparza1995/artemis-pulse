const DEFAULT_ARTEMIS_BASE_URL = "http://localhost:8161/console/jolokia";
const DEFAULT_ARTEMIS_USERNAME = "admin";
const DEFAULT_ARTEMIS_PASSWORD = "admin123";
const DEFAULT_POLL_INTERVAL_MS = 3000;
const DEFAULT_DEMO_CONTROL_BASE_URL = "http://localhost:7071";

function parseBoolean(value: string | undefined, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function parsePollInterval(value: string | undefined) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_POLL_INTERVAL_MS;
  }

  return parsed;
}

export function getServerConfig() {
  const env = typeof process !== "undefined" ? process.env : (import.meta as any).env;
  
  return {
    artemisBaseUrl:
      env.ARTEMIS_BASE_URL ?? (import.meta as any).env?.ARTEMIS_BASE_URL ?? DEFAULT_ARTEMIS_BASE_URL,
    artemisUsername:
      env.ARTEMIS_USERNAME ?? (import.meta as any).env?.ARTEMIS_USERNAME ?? DEFAULT_ARTEMIS_USERNAME,
    artemisPassword:
      env.ARTEMIS_PASSWORD ?? (import.meta as any).env?.ARTEMIS_PASSWORD ?? DEFAULT_ARTEMIS_PASSWORD,
    pollIntervalMs: parsePollInterval(env.POLL_INTERVAL_MS ?? (import.meta as any).env?.POLL_INTERVAL_MS),
    demoControlEnabled: parseBoolean(env.DEMO_CONTROL_ENABLED ?? (import.meta as any).env?.DEMO_CONTROL_ENABLED, false),
    demoControlBaseUrl:
      env.DEMO_CONTROL_BASE_URL ?? (import.meta as any).env?.DEMO_CONTROL_BASE_URL ?? DEFAULT_DEMO_CONTROL_BASE_URL,
  };
}

export function getBrokerLabel() {
  const { artemisBaseUrl } = getServerConfig();

  try {
    return new URL(artemisBaseUrl).host;
  } catch {
    return artemisBaseUrl;
  }
}
