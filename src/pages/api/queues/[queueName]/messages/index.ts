import type { APIRoute } from "astro";
import { JolokiaRequestError } from "../../../../../lib/jolokia";
import { listQueueMessages } from "../../../../../lib/artemis";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;

function parseLimit(value: string | null) {
  const parsed = Number(value ?? DEFAULT_LIMIT);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

export const GET: APIRoute = async ({ params, url }) => {
  const queueName = params.queueName;

  if (!queueName) {
    return new Response(
      JSON.stringify({
        error: "QUEUE_NAME_REQUIRED",
        message: "Debes indicar el nombre de la cola.",
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
    const messages = await listQueueMessages(
      decodeURIComponent(queueName),
      parseLimit(url.searchParams.get("limit")),
    );

    return new Response(JSON.stringify(messages), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const status = error instanceof JolokiaRequestError ? error.statusCode : 502;
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron obtener los mensajes de la cola.";

    return new Response(
      JSON.stringify({
        error: status === 404 ? "QUEUE_MESSAGES_NOT_FOUND" : "QUEUE_MESSAGES_FETCH_FAILED",
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
