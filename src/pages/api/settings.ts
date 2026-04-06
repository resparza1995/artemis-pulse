import type { APIRoute } from "astro";
import { getResolvedAppSettings, saveAppSettings } from "../../lib/settings-store";
import type { AppSettings } from "../../types/settings";

export const GET: APIRoute = async () => {
  try {
    const payload = getResolvedAppSettings();

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "SETTINGS_FETCH_FAILED",
        message: error instanceof Error ? error.message : "No se pudieron cargar los settings.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  let payload: Partial<AppSettings> = {};

  try {
    payload = (await request.json()) as Partial<AppSettings>;
  } catch {
    return new Response(
      JSON.stringify({
        error: "INVALID_SETTINGS_PAYLOAD",
        message: "El body de la solicitud no es JSON valido.",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const result = saveAppSettings(payload);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "SETTINGS_SAVE_FAILED",
        message: error instanceof Error ? error.message : "No se pudieron guardar los settings.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
};
