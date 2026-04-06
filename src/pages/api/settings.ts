import type { APIRoute } from "astro";
import { getLocaleFromRequest, getMessages } from "../../i18n";
import { getResolvedAppSettings, saveAppSettings } from "../../lib/settings-store";
import type { AppSettings } from "../../types/settings";

function resolveMessages(request: Request) {
  return getMessages(
    getLocaleFromRequest({
      cookie: request.headers.get("cookie"),
      acceptLanguage: request.headers.get("accept-language"),
    }),
  );
}

export const GET: APIRoute = async ({ request }) => {
  const messages = resolveMessages(request);

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
        message: error instanceof Error ? error.message : messages.settings.fetchError,
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
  const messages = resolveMessages(request);
  let payload: Partial<AppSettings> = {};

  try {
    payload = (await request.json()) as Partial<AppSettings>;
  } catch {
    return new Response(
      JSON.stringify({
        error: "INVALID_SETTINGS_PAYLOAD",
        message: messages.explorer.view.backendInvalid,
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
        message: error instanceof Error ? error.message : messages.settings.saveError,
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
