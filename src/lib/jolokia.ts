import { getServerConfig } from "./config";

export const QUEUE_MBEAN_PATTERN =
  'org.apache.activemq.artemis:broker=*,component=addresses,address=*,subcomponent=queues,routing-type=*,queue=*';

type JolokiaSuccess<TValue> = {
  request?: unknown;
  status: number;
  value: TValue;
  timestamp?: number;
};

type JolokiaFailure = {
  status: number;
  error: string;
  stacktrace?: string;
};

export type JolokiaResponse<TValue> =
  | JolokiaSuccess<TValue>
  | JolokiaFailure;

export class JolokiaRequestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = "JolokiaRequestError";
    this.statusCode = statusCode;
  }
}

export async function jolokiaPost<TResponse>(payload: unknown) {
  const { artemisBaseUrl, artemisUsername, artemisPassword } = getServerConfig();
  const basicAuthToken = btoa(`${artemisUsername}:${artemisPassword}`);

  let response: Response;

  try {
    response = await fetch(artemisBaseUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuthToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
  } catch {
    throw new JolokiaRequestError(
      `No se pudo conectar con Jolokia en ${artemisBaseUrl}. Verifica que Artemis esté levantado.`,
    );
  }

  if (!response.ok) {
    throw new JolokiaRequestError(
      `Jolokia respondio con estado ${response.status}.`,
      response.status,
    );
  }

  try {
    return (await response.json()) as TResponse;
  } catch {
    throw new JolokiaRequestError(
      "Jolokia devolvio una respuesta que no se pudo interpretar como JSON.",
    );
  }
}

