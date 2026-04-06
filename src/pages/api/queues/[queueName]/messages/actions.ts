import type { APIRoute } from "astro";
import { executeQueueMessageAction } from "../../../../../lib/artemis";
import { JolokiaRequestError } from "../../../../../lib/jolokia";
import type { MessageActionType } from "../../../../../features/explorer/types";

type QueueMessageActionPayload = {
  action?: MessageActionType;
  messageIds?: string[];
  destinationQueueName?: string;
};

function isValidAction(value: unknown): value is MessageActionType {
  return value === "retry" || value === "move";
}

export const POST: APIRoute = async ({ params, request }) => {
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

  let payload: QueueMessageActionPayload;

  try {
    payload = (await request.json()) as QueueMessageActionPayload;
  } catch {
    return new Response(
      JSON.stringify({
        error: "INVALID_MESSAGE_ACTION_PAYLOAD",
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

  if (!isValidAction(payload.action)) {
    return new Response(
      JSON.stringify({
        error: "MESSAGE_ACTION_INVALID",
        message: "La accion indicada no es valida.",
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
    const decodedQueueName = decodeURIComponent(queueName);

    const result = await executeQueueMessageAction({
      queueName: decodedQueueName,
      action: payload.action,
      messageIds: Array.isArray(payload.messageIds) ? payload.messageIds : [],
      destinationQueueName: payload.destinationQueueName,
    });

    return new Response(JSON.stringify(result), {
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
        : "No se pudo ejecutar la accion solicitada sobre los mensajes.";

    return new Response(
      JSON.stringify({
        error: status === 404 ? "QUEUE_MESSAGES_NOT_FOUND" : "QUEUE_MESSAGE_ACTION_FAILED",
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
