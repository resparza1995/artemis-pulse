type DemoGuardConfig = {
  enabled: boolean;
  allowedPrefix: string;
  rateLimitWindowMs: number;
  rateLimitMaxWrites: number;
  autoResetEnabled: boolean;
  autoResetIntervalMs: number;
  autoResetProfile: string;
};

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function getDemoGuardConfig(): DemoGuardConfig {
  return {
    enabled: parseBoolean(import.meta.env.DEMO_GUARD_ENABLED, false),
    allowedPrefix: (import.meta.env.DEMO_ALLOWED_PREFIX ?? "demo.").trim().toLowerCase(),
    rateLimitWindowMs: parsePositiveInteger(import.meta.env.DEMO_RATE_LIMIT_WINDOW_MS, 60000),
    rateLimitMaxWrites: parsePositiveInteger(import.meta.env.DEMO_RATE_LIMIT_MAX_WRITES, 20),
    autoResetEnabled: parseBoolean(import.meta.env.DEMO_AUTO_RESET_ENABLED, false),
    autoResetIntervalMs: parsePositiveInteger(import.meta.env.DEMO_AUTO_RESET_INTERVAL_MS, 600000),
    autoResetProfile: (import.meta.env.DEMO_AUTO_RESET_PROFILE ?? "steady").trim(),
  };
}
