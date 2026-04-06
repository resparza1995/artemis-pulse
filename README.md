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

2. Arranca la app:

```bash
bun run dev
```

La app queda disponible en `http://localhost:4321`.

En el primer arranque la app usa valores por defecto internos. Desde el icono de `Settings` del header puedes configurar la conexion a Artemis y esos datos se persistiran en `data/settings.json`.

## Docker Compose

El repositorio incluye `docker-compose.yml` para levantar:
- `artemis`
- `app`

El servicio `app` monta un volumen en `/app/data` para conservar `settings.json` entre reinicios.

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
