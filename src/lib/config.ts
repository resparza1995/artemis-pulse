import { getResolvedAppSettings } from "./settings-store";

export function getServerConfig() {
  return getResolvedAppSettings().settings;
}

export function getBrokerLabel() {
  const { artemisBaseUrl } = getServerConfig();

  try {
    return new URL(artemisBaseUrl).host;
  } catch {
    return artemisBaseUrl;
  }
}
