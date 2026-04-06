import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { AppSettings } from "../types/settings";

const DEFAULT_ARTEMIS_BASE_URL = "http://localhost:8161/console/jolokia";
const DEFAULT_ARTEMIS_USERNAME = "admin";
const DEFAULT_ARTEMIS_PASSWORD = "admin123";
const DEFAULT_POLL_INTERVAL_MS = 3000;
const SETTINGS_FILE_PATH = resolve(process.cwd(), "data", "settings.json");

function parsePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function sanitizeString(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function readStoredSettings(): Partial<AppSettings> | null {
  if (!existsSync(SETTINGS_FILE_PATH)) {
    return null;
  }

  try {
    const raw = readFileSync(SETTINGS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function getDefaultAppSettings(): AppSettings {
  return {
    artemisBaseUrl: DEFAULT_ARTEMIS_BASE_URL,
    artemisUsername: DEFAULT_ARTEMIS_USERNAME,
    artemisPassword: DEFAULT_ARTEMIS_PASSWORD,
    pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
  };
}

export function getResolvedAppSettings() {
  const defaults = getDefaultAppSettings();
  const stored = readStoredSettings();

  if (!stored) {
    return {
      settings: defaults,
      persisted: false,
    };
  }

  return {
    settings: {
      artemisBaseUrl: sanitizeString(stored.artemisBaseUrl, defaults.artemisBaseUrl),
      artemisUsername: sanitizeString(stored.artemisUsername, defaults.artemisUsername),
      artemisPassword: sanitizeString(stored.artemisPassword, defaults.artemisPassword),
      pollIntervalMs: parsePositiveInteger(stored.pollIntervalMs, defaults.pollIntervalMs),
    },
    persisted: true,
  };
}

export function saveAppSettings(input: Partial<AppSettings>) {
  const defaults = getDefaultAppSettings();
  const settings: AppSettings = {
    artemisBaseUrl: sanitizeString(input.artemisBaseUrl, defaults.artemisBaseUrl),
    artemisUsername: sanitizeString(input.artemisUsername, defaults.artemisUsername),
    artemisPassword: sanitizeString(input.artemisPassword, defaults.artemisPassword),
    pollIntervalMs: parsePositiveInteger(input.pollIntervalMs, defaults.pollIntervalMs),
  };

  mkdirSync(dirname(SETTINGS_FILE_PATH), { recursive: true });
  writeFileSync(SETTINGS_FILE_PATH, `${JSON.stringify(settings, null, 2)}\n`, "utf-8");

  return {
    settings,
    persisted: true,
  };
}
