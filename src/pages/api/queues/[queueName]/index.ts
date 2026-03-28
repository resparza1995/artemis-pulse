import type { APIRoute } from "astro";
import { deleteQueue } from "../../../../lib/artemis";
import { DemoGuardError, enforceDemoPolicy } from "../../../../lib/demo-guard/policy";
import { JolokiaRequestError } from "../../../../lib/jolokia";

export const DELETE: APIRoute = async ({ params, request }) => {
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
    const decodedQueueName = decodeURIComponent(queueName);

    enforceDemoPolicy({
      request,
      action: "delete-queue",
      resources: [decodedQueueName],
    });

    const result = await deleteQueue(decodedQueueName);

    return new Response(JSON.stringify(result), {
      status: 200,
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
        : "No se pudo eliminar la cola seleccionada.";

    return new Response(
      JSON.stringify({
        error: status === 404 ? "QUEUE_NOT_FOUND" : "QUEUE_DELETE_FAILED",
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
