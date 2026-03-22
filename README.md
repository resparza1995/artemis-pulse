# Artemis Pulse

Artemis Pulse es una consola web moderna para operar y observar colas de **ActiveMQ Artemis** desde una interfaz construida con **Astro**, **React** y **Tailwind CSS**.

El objetivo es ofrecer una experiencia que ayude a diagnosticar y operar con artemis.

## Stack

- Astro 6
- React 19
- Tailwind CSS 4
- TanStack Query
- Bun como runtime y gestor de paquetes
- Astro Node adapter para servir la app en modo server
- Jolokia como puente de integración con Artemis

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
