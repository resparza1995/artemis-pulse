# Modo Demo

## Objetivo

El modo demo permite mostrar `Pulse`, `Explorer` y `Topology` con datos en tiempo real, cambiando entre escenarios reproducibles desde la propia UI de `Pulse`.

La arquitectura usa tres servicios:

1. `artemis` (broker).
2. `app` (Artemis Pulse).
3. `demo-simulator` (generador de trafico y controlador de perfiles).

## Perfiles disponibles

- `steady`: trafico equilibrado y backlog estable.
- `incident`: subida de backlog y crecimiento de DLQ.
- `recovery`: drenado agresivo y normalizacion.

## Como funciona el cambio de perfil

Cuando pulsas `Aplicar perfil` en `Pulse`, la app hace:

1. `POST /api/demo/profile` con el perfil elegido.
2. El backend de la app llama al simulador:
   - `POST /reset` (limpieza total del escenario actual)
   - `POST /profiles/:profile/activate` (o fallback `POST /profile/:profile`)
3. Tras aplicar el perfil, la app invalida/refresca queries (`queues`, `metrics`, `demoProfileState`).

Esto garantiza que no se mezclen datos del perfil anterior.

## API esperada del simulador

- `GET /profiles` -> `{ profiles: string[], currentProfile: string | null }`
- `POST /reset`
- `POST /profiles/:profile/activate`
- Alias soportado: `POST /profile/:profile`
- `GET /health`

## Variables de entorno de la app

- `DEMO_CONTROL_ENABLED=true|false`
- `DEMO_CONTROL_BASE_URL=http://demo-simulator:7071`
- `DEMO_GUARD_ENABLED=true|false`
- `DEMO_RATE_LIMIT_WINDOW_MS=60000`
- `DEMO_RATE_LIMIT_MAX_WRITES=20`
- `DEMO_AUTO_RESET_ENABLED=true|false`
- `DEMO_AUTO_RESET_INTERVAL_MS=600000`
- `DEMO_AUTO_RESET_PROFILE=steady`

Si `DEMO_CONTROL_ENABLED=false`, el selector de perfiles en `Pulse` queda deshabilitado.

Si `DEMO_GUARD_ENABLED=true`, las operaciones de escritura:

- aplican rate limit por IP y accion (respuesta `429` al exceder),
- y pueden ejecutar auto-reset periodico del escenario (10 min por defecto).

## Simulador local (sin Docker)

1. Arranca Artemis.
2. Configura envs:

```bash
ARTEMIS_BASE_URL=http://localhost:8161/console/jolokia
ARTEMIS_USERNAME=admin
ARTEMIS_PASSWORD=admin123
DEMO_SIMULATOR_PORT=7071
DEMO_AUTO_PROFILE=steady
```

3. Lanza el simulador:

```bash
bun run demo:simulator
```

## Simulador con Docker Compose

Arranque completo:

```bash
docker compose up --build
```

Servicios:

- App: `http://localhost:4321`
- Artemis Console: `http://localhost:8161`
- Demo Simulator API: `http://localhost:7071`

## Estructura de codigo

- Simulador: `tools/demo-simulator/server.ts`
- Proxy API en app: `src/pages/api/demo/profile.ts`
- Cliente de control demo: `src/lib/demo-controller.ts`
- UI de perfil en Pulse: `src/components/dashboard/QueueDashboard.tsx`
- Compose: `docker-compose.yml`
