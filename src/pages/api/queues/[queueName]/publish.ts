import type { APIRoute } from "astro";
import { JolokiaRequestError } from "../../../../lib/jolokia";
import { publishMessage } from "../../../../lib/artemis";

type PublishPayload = {
  body?: string;
  headers?: Record<string, string>;
  durable?: boolean;
  count?: number;
};

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

  let payload: PublishPayload;

  try {
    payload = (await request.json()) as PublishPayload;
  } catch {
    return new Response(
      JSON.stringify({
        error: "INVALID_PUBLISH_PAYLOAD",
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

  if (!payload.body?.trim()) {
    return new Response(
      JSON.stringify({
        error: "MESSAGE_BODY_REQUIRED",
        message: "Debes indicar un body para publicar el mensaje.",
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
    const result = await publishMessage({
      queueName: decodeURIComponent(queueName),
      body: payload.body,
      headers: payload.headers,
      durable: payload.durable ?? true,
      count: payload.count ?? 1,
    });

    return new Response(JSON.stringify(result), {
      status: 201,
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
        : "No se pudo publicar el mensaje en la cola seleccionada.";

    return new Response(
      JSON.stringify({
        error: status === 404 ? "QUEUE_NOT_FOUND" : "MESSAGE_PUBLISH_FAILED",
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
