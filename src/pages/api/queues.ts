import type { APIRoute } from "astro";
import { getLocaleFromRequest, getMessages } from "../../i18n";
import { createQueue, listQueues } from "../../lib/artemis";
import { JolokiaRequestError } from "../../lib/jolokia";

type CreateQueuePayload = {
  address?: string;
  queueName?: string;
  routingType?: "ANYCAST" | "MULTICAST";
  durable?: boolean;
};

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
    const queues = await listQueues();

    return new Response(JSON.stringify(queues), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("QUEUE_FETCH_FAILED", error);

    return new Response(
      JSON.stringify({
        error: "QUEUE_FETCH_FAILED",
        message: messages.explorer.sidebar.fetchError,
      }),
      {
        status: 502,
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
  let payload: CreateQueuePayload;

  try {
    payload = (await request.json()) as CreateQueuePayload;
  } catch {
    return new Response(
      JSON.stringify({
        error: "INVALID_QUEUE_PAYLOAD",
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
    const queue = await createQueue({
      address: payload.address ?? "",
      queueName: payload.queueName ?? "",
      routingType: payload.routingType ?? "ANYCAST",
      durable: payload.durable ?? true,
    });

    return new Response(JSON.stringify(queue), {
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
        : messages.explorer.modals.createQueue.pending;

    return new Response(
      JSON.stringify({
        error: status === 409 ? "QUEUE_ALREADY_EXISTS" : "QUEUE_CREATE_FAILED",
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
