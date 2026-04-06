# Artemis Pulse

Artemis Pulse is a web app for managing and inspecting Artemis ActiveMQ brokers via an interface built using Astro, React and Tailwind CSS.

The app is organised around three views:
- `Pulse`: an operational overview of the broker.
- `Explorer`: day-to-day management of addresses, queues and messages.
- `Topology`: a visual map of the broker and its relationships.

## Local startup

1. Install dependencies:

```bash
bun install
```

2. Start the app:

```bash
bun run dev
```

The app is available at `http://localhost:4321`.

On first launch, the app uses internal default values. From the `Settings` icon in the header, you can configure the connection to Artemis and this data will be persisted in `data/settings.json`.

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
