# Artemis Pulse

Artemis Pulse is a web app for managing and inspecting Artemis ActiveMQ brokers via an interface built using Astro, React and Tailwind CSS.

The app is organised around three views:
- `Pulse`: an operational overview of the broker.
- `Explorer`: day-to-day management of addresses, queues and messages.
- `Topology`: a visual map of the broker and its relationships.

📷 Screenshots [here](docs/app-preview.md)  

## Features

- **Real-time Explorer**: Inspect queues, addresses, counters (consumers, messages) and payloads, displayed in a structured format.
- **Broker Management**: Create and delete *Addresses/Queues* (including cascading deletes) from the UI.
- **Message Operations**: *Publish*, *Consume* as a temporary consumer, and queue purging (*Purge*).
- **Advanced DLQ Management (Incident Resolution)**: 
  - Intelligent automatic banner when messages are in the DLQ.
  - *Retry* / *Retry All*: Automatically re-queue failed messages to their original destination.
  - *Move* / *Move All*: Move problematic messages to secondary processing queues.
- **Topology Dashboard**: Interactive visual map showing the relationships, health and routing of the entire broker.

---

## Run local

1. Install dependencies [Bun](https://bun.sh/):
```bash
bun install
```

2. Start the app:

```bash
bun run dev
```

The app is available at `http://localhost:4321`.

On first launch, the app uses internal default values. From the `Settings` icon in the header, you can configure the connection to Artemis and this data will be persisted in `data/settings.json`.

## Docker Hub

You can run Artemis Pulse directly from Docker Hub without downloading the source code:
Download the image:

```bash
docker pull fytta/artemis-pulse:latest
```

Run it:

```bash
docker run -p 4321:4321 -v artemis-pulse-data:/app/data fytta/artemis-pulse:latest
```

Then open `http://localhost:4321`.

The mounted volume preserves `data/settings.json`, so the Artemis connection configured from the `Settings` modal survives container restarts.

## Docker Compose

The repository includes `docker-compose.yml` to start:
- `artemis`
- `app`

The `app` service mounts a volume at `/app/data` to preserve `settings.json` across restarts.

Start:

```bash
docker compose up --build
```

## Useful scripts

- `bun run dev`: local development environment.
- `bun run check`: type validation with Astro.
- `bun test`: unit tests.

## Documentation

- [Architecture](docs/architecture.md)
- [Features](docs/features.md)
