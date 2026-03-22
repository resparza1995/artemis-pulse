import type { APIRoute } from "astro";
import { createAddress } from "../../lib/artemis";
import { JolokiaRequestError } from "../../lib/jolokia";

type CreateAddressPayload = {
  address?: string;
  routingType?: "ANYCAST" | "MULTICAST";
};

export const POST: APIRoute = async ({ request }) => {
  let payload: CreateAddressPayload;

  try {
    payload = (await request.json()) as CreateAddressPayload;
  } catch {
    return new Response(
      JSON.stringify({
        error: "INVALID_ADDRESS_PAYLOAD",
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
    const address = await createAddress({
      address: payload.address ?? "",
      routingType: payload.routingType ?? "ANYCAST",
    });

    return new Response(JSON.stringify(address), {
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
        : "No se pudo crear la address solicitada.";

    return new Response(
      JSON.stringify({
        error: status === 409 ? "ADDRESS_ALREADY_EXISTS" : "ADDRESS_CREATE_FAILED",
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
