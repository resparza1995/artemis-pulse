import type { APIRoute } from "astro";
import { createQueue, listQueues } from "../../lib/artemis";
import { DemoGuardError, enforceDemoPolicy } from "../../lib/demo-guard/policy";
import { JolokiaRequestError } from "../../lib/jolokia";

type CreateQueuePayload = {
  address?: string;
  queueName?: string;
  routingType?: "ANYCAST" | "MULTICAST";
  durable?: boolean;
};

export const GET: APIRoute = async () => {
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
        message: "No se pudieron obtener las colas.",
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
  let payload: CreateQueuePayload;

  try {
    payload = (await request.json()) as CreateQueuePayload;
  } catch {
    return new Response(
      JSON.stringify({
        error: "INVALID_QUEUE_PAYLOAD",
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
    enforceDemoPolicy({
      request,
      action: "create-queue",
      resources: [payload.address ?? "", payload.queueName ?? ""],
    });

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
    const status = error instanceof DemoGuardError
      ? error.statusCode
      : error instanceof JolokiaRequestError
        ? error.statusCode
        : 502;
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo crear la cola solicitada.";

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
