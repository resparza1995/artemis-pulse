# Artemis Pulse

Artemis Pulse es una consola web para operar e inspeccionar brokers de ActiveMQ Artemis desde una interfaz construida con Astro, React y Tailwind CSS.

La app esta orientada a tres vistas:

- `Pulse`: resumen operativo y cambio de perfil demo
- `Explorer`: trabajo diario sobre addresses, queues y mensajes
- `Topology`: mapa visual del broker

## Stack

- Astro 6
- React 19
- Tailwind CSS 4
- TanStack Query
- Bun
- Jolokia
- React Flow

## Arranque local

1. Instala dependencias:

```bash
bun install
```

2. Crea `.env` a partir de `.env.example`.

3. Arranca la app:

```bash
bun run dev
```

4. Abre:

```text
http://localhost:4321
```

## Modo demo

La app incluye un simulador para generar trafico y cambiar escenarios desde `Pulse`.

Documentacion completa:
- `docs/demo-mode.md`

### Opcion 1. Demo completa con Docker

```bash
docker compose up --build
```

Servicios levantados:
- App: `http://localhost:4321`
- Artemis: `http://localhost:8161`
- Demo simulator: `http://localhost:7071`

### Opcion 2. Demo local sin Docker

Necesitas tres procesos:

1. Artemis levantado y accesible en `http://localhost:8161/console/jolokia`
2. Simulador demo
3. App Artemis Pulse

#### Arrancar el simulador

PowerShell:

```powershell
$env:ARTEMIS_BASE_URL="http://localhost:8161/console/jolokia"
$env:ARTEMIS_USERNAME="admin"
$env:ARTEMIS_PASSWORD="admin"
$env:DEMO_SIMULATOR_PORT="7071"
$env:DEMO_AUTO_PROFILE="steady"
bun run demo:simulator
```

#### Arrancar la app en modo demo

PowerShell:

```powershell
$env:ARTEMIS_BASE_URL="http://localhost:8161/console/jolokia"
$env:ARTEMIS_USERNAME="admin"
$env:ARTEMIS_PASSWORD="admin"
$env:DEMO_CONTROL_ENABLED="true"
$env:DEMO_CONTROL_BASE_URL="http://localhost:7071"
$env:DEMO_GUARD_ENABLED="true"
$env:DEMO_RATE_LIMIT_WINDOW_MS="60000"
$env:DEMO_RATE_LIMIT_MAX_WRITES="20"
$env:DEMO_AUTO_RESET_ENABLED="true"
$env:DEMO_AUTO_RESET_INTERVAL_MS="600000"
$env:DEMO_AUTO_RESET_PROFILE="steady"
bun run dev
```

### Perfiles demo

- `steady`: trafico equilibrado
- `incident`: backlog y tension operativa
- `recovery`: drenado y vuelta a estado saludable

## Documentacion

- `docs/funcionalidades.md`
- `docs/arquitectura.md`
- `docs/demo-mode.md`

## Scripts utiles

- `bun run dev`
- `bun run check`
- `bun run test`
- `bun run demo:simulator`
