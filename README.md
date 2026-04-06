# Artemis Pulse

Artemis Pulse es una consola web para operar e inspeccionar brokers de ActiveMQ Artemis desde una interfaz construida con Astro, React y Tailwind CSS.

La app se organiza alrededor de tres vistas:
- `Pulse`: resumen operativo del broker.
- `Explorer`: trabajo diario sobre addresses, queues y mensajes.
- `Topology`: mapa visual del broker y sus relaciones.

## Arranque local

1. Instala dependencias:

```bash
bun install
```

2. Crea tu entorno local:

```bash
cp .env.example .env
```

3. Arranca la app:

```bash
bun run dev
```

La app queda disponible en `http://localhost:4321`.

## Variables de entorno

`.env.example` incluye:

```env
ARTEMIS_BASE_URL=http://localhost:8161/console/jolokia
ARTEMIS_USERNAME=admin
ARTEMIS_PASSWORD=admin
POLL_INTERVAL_MS=3000
```

## Docker Compose

El repositorio incluye `docker-compose.yml` para levantar:
- `artemis`
- `app`

Arranque:

```bash
docker compose up --build
```

## Scripts utiles

- `bun run dev`: entorno de desarrollo local.
- `bun run check`: validacion de tipos con Astro.
- `bun test`: pruebas unitarias.

## Documentacion

- [Arquitectura](docs/arquitectura.md)
- [Funcionalidades](docs/funcionalidades.md)
