import type { APIRoute } from "astro";
import { applyDemoProfile, DemoControllerError, getDemoProfileState } from "../../../lib/demo-controller";
import { ensureDemoAutomation } from "../../../lib/demo-guard/policy";

type ApplyPayload = {
  profile?: string;
};

export const GET: APIRoute = async () => {
  try {
    ensureDemoAutomation();
    const state = await getDemoProfileState();

    return new Response(JSON.stringify(state), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const status = error instanceof DemoControllerError ? error.statusCode : 502;
    const message = error instanceof Error ? error.message : "No se pudo obtener el estado demo.";

    return new Response(
      JSON.stringify({
        error: "DEMO_PROFILE_STATE_FAILED",
        message,
      }),
      {
        status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  let payload: ApplyPayload = {};

  try {
    payload = (await request.json()) as ApplyPayload;
  } catch {
    payload = {};
  }

  try {
    ensureDemoAutomation();
    const result = await applyDemoProfile(payload.profile ?? "");

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const status = error instanceof DemoControllerError ? error.statusCode : 502;
    const message = error instanceof Error ? error.message : "No se pudo aplicar el perfil demo.";

    return new Response(
      JSON.stringify({
        error: "DEMO_PROFILE_APPLY_FAILED",
        message,
      }),
      {
        status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
};
