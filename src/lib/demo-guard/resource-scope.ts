import { getDemoGuardConfig } from "./config";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function isAllowedDemoResource(resourceName: string) {
  const { allowedPrefix } = getDemoGuardConfig();
  if (!allowedPrefix) {
    return true;
  }

  return normalize(resourceName).startsWith(allowedPrefix);
}

export function assertAllowedDemoResource(resourceName: string) {
  if (!isAllowedDemoResource(resourceName)) {
    throw new Error(
      `Operacion bloqueada en demo publica: "${resourceName}" no pertenece al namespace permitido.`,
    );
  }
}
