import type { APIRoute } from "astro";
import { getBrokerMetrics } from "../../../lib/artemis";
import { JolokiaRequestError } from "../../../lib/jolokia";

export const GET: APIRoute = async () => {
  try {
    const metrics = await getBrokerMetrics();

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("BROKER_METRICS_FAILED", error);

    const message = error instanceof JolokiaRequestError ? error.message : "No se pudieron obtener las métricas del broker.";

    return new Response(
      JSON.stringify({
        error: "BROKER_METRICS_FAILED",
        message,
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