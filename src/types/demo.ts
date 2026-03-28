export type DemoProfileState = {
  enabled: boolean;
  profiles: string[];
  currentProfile: string | null;
  lastUpdatedAt: string;
};

export type DemoProfileApplyResponse = {
  appliedProfile: string;
  resetPerformed: boolean;
  lastUpdatedAt: string;
};
