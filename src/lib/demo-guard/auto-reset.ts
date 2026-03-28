import { applyDemoProfile } from "../demo-controller";
import { getDemoGuardConfig } from "./config";

let schedulerStarted = false;
let isRunning = false;
let timerRef: ReturnType<typeof setInterval> | null = null;

async function runAutoResetTick() {
  if (isRunning) {
    return;
  }

  const { enabled, autoResetEnabled, autoResetProfile } = getDemoGuardConfig();
  if (!enabled || !autoResetEnabled) {
    return;
  }

  isRunning = true;
  try {
    await applyDemoProfile(autoResetProfile);
    console.info("DEMO_AUTO_RESET_OK", {
      profile: autoResetProfile,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DEMO_AUTO_RESET_FAILED", error);
  } finally {
    isRunning = false;
  }
}

export function ensureDemoAutoResetSchedulerStarted() {
  if (schedulerStarted) {
    return;
  }

  const { enabled, autoResetEnabled, autoResetIntervalMs } = getDemoGuardConfig();
  if (!enabled || !autoResetEnabled) {
    return;
  }

  schedulerStarted = true;
  timerRef = setInterval(() => {
    void runAutoResetTick();
  }, Math.max(60000, autoResetIntervalMs));

  console.info("DEMO_AUTO_RESET_SCHEDULER_STARTED", {
    intervalMs: Math.max(60000, autoResetIntervalMs),
  });
}

export function stopDemoAutoResetSchedulerForTests() {
  if (timerRef) {
    clearInterval(timerRef);
    timerRef = null;
  }
  schedulerStarted = false;
}
