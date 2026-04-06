export type AppSettings = {
  artemisBaseUrl: string;
  artemisUsername: string;
  artemisPassword: string;
  pollIntervalMs: number;
};

export type AppSettingsResponse = {
  settings: AppSettings;
  persisted: boolean;
};
