import type { APIRoute } from "astro";
import { listQueues } from "../../lib/artemis";
import { buildTopologyGraph } from "../../lib/topology";
import type { TopologyResponse } from "../../types/topology";

export const GET: APIRoute = async () => {
  try {
    const queues = await listQueues();
    const lastUpdatedAt =
      queues[0]?.lastUpdatedAt ?? new Date().toISOString();
    const graph = buildTopologyGraph({ queues, nowIso: lastUpdatedAt });

    const payload: TopologyResponse = {
      graph,
      lastUpdatedAt,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TOPOLOGY_FETCH_FAILED", error);

    return new Response(
      JSON.stringify({
        error: "TOPOLOGY_FETCH_FAILED",
        message: "No se pudo construir la topologia del broker.",
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
