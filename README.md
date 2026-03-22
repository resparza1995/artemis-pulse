# Artemis Pulse

A modern operations console for ActiveMQ Artemis.

Artemis Pulse es una consola web moderna para operar y observar colas de **ActiveMQ Artemis** desde una interfaz construida con **Astro**, **React** y **Tailwind CSS**.

La app expone una vista principal orientada a operación en tiempo casi real sobre Jolokia, con foco en salud del broker, backlog, DLQ y detalle contextual de colas. El objetivo es reducir la dependencia de la consola nativa de Artemis y ofrecer una experiencia más clara para diagnóstico y operación.

## Stack

- Astro 6
- React 19
- Tailwind CSS 4
- TanStack Query
- Bun como runtime y gestor de paquetes
- Astro Node adapter para servir la app en modo server
- Jolokia como puente de integración con Artemis

## Estado actual

- La app vive en la raíz del workspace.
- Existe una base funcional del dashboard principal.
- El backend interno ya consulta Jolokia con Basic Auth y normaliza el listado de colas.
- `GET /api/queues` está implementado y devuelve un `QueueSummary` normalizado.
- La UI ya muestra filtros locales, estados visuales, selección de cola y panel lateral de detalle.
- La detección de DLQ se basa en convención de nombre.
- `bun run check` pasa correctamente.
- `bun run build` sigue fallando por un problema del toolchain de Astro en este entorno, no por errores de TypeScript de la app.

## Arranque

1. Instala dependencias con Bun:

```bash
bun install
```

2. Crea tu archivo `.env` a partir de `.env.example`.

3. Arranca la app:

```bash
bun run dev
```

4. Abre la URL que muestre Astro, normalmente:

```text
http://localhost:4321
```

## Variables de entorno

Ejemplo:

```env
ARTEMIS_BASE_URL=http://localhost:8161/console/jolokia
ARTEMIS_USERNAME=admin
ARTEMIS_PASSWORD=admin
POLL_INTERVAL_MS=3000
```

## Vistas planeadas

### Pulse

Es la pantalla principal del producto. Está orientada a control operativo en tiempo real y combina:

- mini-cards de estado del broker
- grid o heatmap de colas
- panel lateral con detalle de la cola seleccionada
- filtros rápidos para errores, colas activas y colas vacías

### Explorer

Es la vista de gestión y contenido. Su objetivo es inspeccionar mensajes y operar sobre colas de forma directa. Incluye:

- visor de mensajes
- lectura de body con formato JSON o XML
- acciones de `purge`, `send` y `move`
- flujo orientado a productividad operativa

### Topology

Es una vista de diagnóstico diferida. Se usará para representar el flujo entre broker, addresses, queues y consumers de forma simplificada. No es prioridad del MVP actual, pero ya está contemplada como vista propia.

## Limitaciones conocidas

- Artemis debe estar levantado para que el backend devuelva datos reales.
- La conexión actual asume Jolokia en `http://localhost:8161/console/jolokia`.
- La credencial documentada en el entorno actual es `admin/admin`.
- `bun run build` todavía tiene un bloqueo externo relacionado con Astro en este entorno Windows + Bun.
- La primera iteración del producto sigue centrada en lectura; las acciones mutativas de `Explorer` están planificadas pero aún no implementadas.
