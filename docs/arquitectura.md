# Arquitectura de Artemis Pulse

## Resumen

Artemis Pulse esta construido con:

- Astro para rutas y endpoints server-side.
- React para las vistas interactivas.
- TanStack Query para queries y mutaciones.
- Bun como runtime y package manager.
- Jolokia como capa de acceso al management API de ActiveMQ Artemis.
- React Flow para `Topology`.

## Estructura principal

```text
src/
  features/
    explorer/
      modals/
      types.ts
    pulse/
    topology/
      types.ts
  layouts/
  lib/
    artemis/
    config.ts
    jolokia.ts
    queue-status.ts
    topology.ts
    toast.ts
    utils.ts
  pages/
    api/
  styles/
  types/
  ui/
docs/
.agents/
```

## Vistas

### `/`

`Pulse` es la vista de resumen:
- metricas globales del broker
- estado de queues
- acceso rapido a colas problematicas

### `/explorer`

`Explorer` es la vista principal de trabajo:
- navegacion por address y queue
- inspeccion de mensajes
- operaciones sobre queues y mensajes
- gestion de addresses y queues

### `/topology`

`Topology` representa visualmente:
- broker
- addresses
- queues
- consumers

Tambien permite abrir una queue concreta en `Explorer`.

## Endpoints

### Lectura

- `GET /api/queues`
- `GET /api/addresses`
- `GET /api/broker/metrics`
- `GET /api/topology`
- `GET /api/queues/:queueName/messages`
- `GET /api/queues/:queueName/messages/:messageId`

### Escritura

- `POST /api/addresses`
- `DELETE /api/addresses/:addressName`
- `POST /api/queues`
- `DELETE /api/queues/:queueName`
- `POST /api/queues/:queueName/publish`
- `POST /api/queues/:queueName/consume`
- `POST /api/queues/:queueName/purge`
- `POST /api/queues/:queueName/messages/actions`

## Capas relevantes

### `src/lib/artemis/`

Nucleo de integracion con Artemis y Jolokia.

Responsabilidades:
- listar queues y addresses
- metricas del broker
- lectura de mensajes
- create/delete address
- create/delete queue
- publish
- consume
- purge
- retry/move

### `src/lib/config.ts`

Lee y normaliza configuracion de entorno del broker.

### `src/lib/queue-status.ts`

Contiene la politica compartida de clasificacion `healthy / warning / critical` usada por `Pulse`, `Explorer` y `Topology`.

### `src/lib/topology.ts`

Transforma datos del broker en un grafo para `Topology`.

## UI compartida

`src/ui/` contiene primitivas reutilizables:
- `button.tsx`
- `card.tsx`
- `badge.tsx`
- `input.tsx`
- `modal.tsx`
- `dropdown.tsx`
- `filterable-combobox.tsx`
- `toaster.tsx`

Regla practica:
- si un patron visual se repite entre features, debe bajar a `ui`

## Flujo de datos

1. El usuario interactua con una vista React.
2. El componente lanza una query o mutation con TanStack Query.
3. La llamada va a `/api/...`.
4. El endpoint delega en `src/lib/...`.
5. `artemis` y `jolokia` hablan con el broker.
6. El endpoint devuelve JSON estable.
7. La UI refresca la vista.

## Docker

El repo incluye:
- `Dockerfile`
- `docker-compose.yml`

`docker-compose.yml` levanta:
- `artemis`
- `app`
