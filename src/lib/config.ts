const DEFAULT_ARTEMIS_BASE_URL = "http://localhost:8161/console/jolokia";
const DEFAULT_ARTEMIS_USERNAME = "admin";
const DEFAULT_ARTEMIS_PASSWORD = "admin123";
const DEFAULT_POLL_INTERVAL_MS = 3000;

function parsePollInterval(value: string | undefined) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_POLL_INTERVAL_MS;
  }

  return parsed;
}

export function getServerConfig() {
  return {
    artemisBaseUrl:
      import.meta.env.ARTEMIS_BASE_URL ?? DEFAULT_ARTEMIS_BASE_URL,
    artemisUsername:
      import.meta.env.ARTEMIS_USERNAME ?? DEFAULT_ARTEMIS_USERNAME,
    artemisPassword:
      import.meta.env.ARTEMIS_PASSWORD ?? DEFAULT_ARTEMIS_PASSWORD,
    pollIntervalMs: parsePollInterval(import.meta.env.POLL_INTERVAL_MS),
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
