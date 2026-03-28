import type { APIRoute } from "astro";
import { deleteAddress } from "../../../lib/artemis";
import { DemoGuardError, enforceDemoPolicy } from "../../../lib/demo-guard/policy";
import { JolokiaRequestError } from "../../../lib/jolokia";

export const DELETE: APIRoute = async ({ params, request }) => {
  const addressName = params.addressName;

  if (!addressName) {
    return new Response(
      JSON.stringify({
        error: "ADDRESS_NAME_REQUIRED",
        message: "Debes indicar el nombre de la address.",
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
    const decodedAddress = decodeURIComponent(addressName);
    const force = new URL(request.url).searchParams.get("force") === "true";

    enforceDemoPolicy({
      request,
      action: "delete-address",
      resources: [decodedAddress],
    });

    const result = await deleteAddress(decodedAddress, force);

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
        : "No se pudo eliminar la address seleccionada.";

    return new Response(
      JSON.stringify({
        error: status === 404 ? "ADDRESS_NOT_FOUND" : "ADDRESS_DELETE_FAILED",
        message,
      }),
      {
        status: /binding|queue/i.test(message) ? 409 : status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
};
