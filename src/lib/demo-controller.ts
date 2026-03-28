import { getServerConfig } from "./config";
import type { DemoProfileApplyResponse, DemoProfileState } from "../types/demo";

type ControllerProfilesResponse = {
  profiles?: string[];
  currentProfile?: string | null;
};

class DemoControllerError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = "DemoControllerError";
    this.statusCode = statusCode;
  }
}

async function callController(path: string, init?: RequestInit) {
  const { demoControlBaseUrl } = getServerConfig();
  const url = new URL(path, demoControlBaseUrl);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
  } catch {
    throw new DemoControllerError(
      `No se pudo conectar con el simulador demo en ${demoControlBaseUrl}.`,
      502,
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : `El simulador respondio con estado ${response.status}.`;
    throw new DemoControllerError(message, response.status);
  }

  return payload;
}

export async function getDemoProfileState(): Promise<DemoProfileState> {
  const { demoControlEnabled } = getServerConfig();
  const lastUpdatedAt = new Date().toISOString();

  if (!demoControlEnabled) {
    return {
      enabled: false,
      profiles: [],
      currentProfile: null,
      lastUpdatedAt,
    };
  }

  const payload = (await callController("/profiles")) as ControllerProfilesResponse | null;
  const profiles = Array.isArray(payload?.profiles)
    ? payload.profiles.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const currentProfile = typeof payload?.currentProfile === "string" ? payload.currentProfile : null;

  return {
    enabled: true,
    profiles,
    currentProfile,
    lastUpdatedAt,
  };
}

async function resetScenario() {
  await callController("/reset", {
    method: "POST",
  });
}

async function activateProfile(profile: string) {
  try {
    await callController(`/profiles/${encodeURIComponent(profile)}/activate`, {
      method: "POST",
      body: JSON.stringify({ reset: true }),
    });
    return;
  } catch {
    await callController(`/profile/${encodeURIComponent(profile)}`, {
      method: "POST",
    });
  }
}

export async function applyDemoProfile(profile: string): Promise<DemoProfileApplyResponse> {
  const { demoControlEnabled } = getServerConfig();
  if (!demoControlEnabled) {
    throw new DemoControllerError("El control de perfiles demo esta deshabilitado.", 400);
  }

  const normalizedProfile = profile.trim();
  if (!normalizedProfile) {
    throw new DemoControllerError("Debes indicar un perfil demo valido.", 400);
  }

  await resetScenario();
  await activateProfile(normalizedProfile);

  return {
    appliedProfile: normalizedProfile,
    resetPerformed: true,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export { DemoControllerError };
