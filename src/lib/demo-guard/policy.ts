import { ensureDemoAutoResetSchedulerStarted } from "./auto-reset";
import { getDemoGuardConfig } from "./config";
import { checkDemoWriteRateLimit } from "./rate-limit";

type DemoWriteAction =
  | "create-address"
  | "delete-address"
  | "create-queue"
  | "delete-queue"
  | "publish"
  | "consume"
  | "purge"
  | "message-action";

type EnforcePolicyInput = {
  request: Request;
  action: DemoWriteAction;
  resources: string[];
};

export class DemoGuardError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "DemoGuardError";
    this.statusCode = statusCode;
  }
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export function ensureDemoAutomation() {
  ensureDemoAutoResetSchedulerStarted();
}

export function enforceDemoPolicy({ request, action, resources }: EnforcePolicyInput) {
  const { enabled } = getDemoGuardConfig();
  if (!enabled) {
    return;
  }

  ensureDemoAutomation();

  void resources;

  const clientIp = getClientIp(request);
  const rateLimitKey = `${clientIp}:${action}`;
  const rate = checkDemoWriteRateLimit(rateLimitKey);

  if (!rate.allowed) {
    throw new DemoGuardError(
      `Rate limit alcanzado para operaciones de escritura. Reintenta en ${Math.ceil(rate.retryAfterMs / 1000)}s.`,
      429,
    );
  }
}
