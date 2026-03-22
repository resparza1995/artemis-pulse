import type { APIRoute } from "astro";
import { getQueueMessageDetail } from "../../../../../lib/artemis";
import { JolokiaRequestError } from "../../../../../lib/jolokia";

export const GET: APIRoute = async ({ params }) => {
  const queueName = params.queueName;
  const messageId = params.messageId;

  if (!queueName || !messageId) {
    return new Response(
      JSON.stringify({
        error: "MESSAGE_LOOKUP_INVALID",
        message: "Debes indicar la cola y el identificador del mensaje.",
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
    const detail = await getQueueMessageDetail(
      decodeURIComponent(queueName),
      decodeURIComponent(messageId),
    );

    return new Response(JSON.stringify(detail), {
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
        : "No se pudo obtener el detalle del mensaje.";

    return new Response(
      JSON.stringify({
        error: status === 404 ? "MESSAGE_NOT_FOUND" : "MESSAGE_FETCH_FAILED",
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
