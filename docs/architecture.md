# Artemis Pulse Architecture

## Overview

Artemis Pulse is built with:

- Astro for routes and server-side API endpoints.
- React for interactive views.
- TanStack Query for queries and mutations.
- Bun as runtime and package manager.
- Jolokia as the access layer for the ActiveMQ Artemis management API.
- React Flow for `Topology`.

## Main Structure

```text
src/
  features/
    explorer/
      modals/
      types.ts
    pulse/
    settings/
    topology/
      types.ts
  i18n/
  layouts/
  lib/
    artemis/
    config.ts
    jolokia.ts
    queue-status.ts
    settings-store.ts
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

## Views

### `/`

`Pulse` is the summary view:
- high-level broker metrics
- queue health overview
- quick access to problematic queues

### `/explorer`

`Explorer` is the main operational workspace:
- address and queue navigation
- message inspection
- queue and message actions
- address and queue management

### `/topology`

`Topology` shows a visual map of:
- broker
- addresses
- queues
- consumers

It also allows opening a specific queue in `Explorer`.

## API Endpoints

### Read

- `GET /api/queues`
- `GET /api/addresses`
- `GET /api/broker/metrics`
- `GET /api/topology`
- `GET /api/settings`
- `GET /api/queues/:queueName/messages`
- `GET /api/queues/:queueName/messages/:messageId`

### Write

- `POST /api/settings`
- `POST /api/addresses`
- `DELETE /api/addresses/:addressName`
- `POST /api/queues`
- `DELETE /api/queues/:queueName`
- `POST /api/queues/:queueName/publish`
- `POST /api/queues/:queueName/consume`
- `POST /api/queues/:queueName/purge`
- `POST /api/queues/:queueName/messages/actions`

## Relevant Layers

### `src/lib/artemis/`

Core Artemis and Jolokia integration layer.

Responsibilities:
- list queues and addresses
- broker metrics
- message reads
- create/delete address
- create/delete queue
- publish
- consume
- purge
- retry/move

### `src/lib/config.ts`

Resolves the active application configuration from `settings.json`.

### `src/lib/settings-store.ts`

Lightweight product settings persistence in `data/settings.json`.

Behavior:
- uses internal defaults on first startup
- if `settings.json` exists, it takes precedence
- allows a deployable product without editing source code

### `src/lib/queue-status.ts`

Contains the shared `healthy / warning / critical` classification policy used by `Pulse`, `Explorer`, and `Topology`.

### `src/lib/topology.ts`

Transforms broker data into a graph consumed by `Topology`.

### `src/i18n/`

Shared internationalization layer for Astro and React.

Responsibilities:
- locale resolution from cookie and browser settings
- shared dictionaries for `es` and `en`
- React provider and hooks for translated UI
- shared language switcher behavior in the header

## Shared UI

`src/ui/` contains reusable primitives:
- `button.tsx`
- `card.tsx`
- `badge.tsx`
- `input.tsx`
- `modal.tsx`
- `dropdown.tsx`
- `filterable-combobox.tsx`
- `toaster.tsx`

Practical rule:
- if a visual pattern repeats across features, it should move down into `ui`

## Product Settings

The header includes a `Settings` button that opens a modal to edit:
- Artemis / Jolokia URL
- username
- password
- `poll interval`

The UI talks to:
- `GET /api/settings`
- `POST /api/settings`

After saving, the page reloads so the broker label and polling interval are refreshed consistently.

## Internationalization

The header includes a language switcher for Spanish and English.

Behavior:
- Astro resolves the locale on the server side from cookie or request headers
- React views consume the same locale through `I18nProvider`
- the selected language is persisted across reloads
- user-facing API errors are returned in the active language where supported

## Data Flow

1. The user interacts with a React view.
2. The component triggers a query or mutation through TanStack Query.
3. The request goes to `/api/...`.
4. The endpoint delegates to `src/lib/...`.
5. `artemis` and `jolokia` talk to the broker.
6. The endpoint returns stable JSON.
7. The UI refreshes the view.

## Docker

The repository includes:
- `Dockerfile`
- `docker-compose.yml`

`docker-compose.yml` starts:
- `artemis`
- `app`
