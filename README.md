# Artemis Pulse

Artemis Pulse es una consola web moderna para operar e inspeccionar brokers de ActiveMQ Artemis desde una interfaz construida con Astro, React y Tailwind CSS.

La app esta orientada a tres vistas principales:
- **Pulse**: resumen operativo y cambio de perfil demo
- **Explorer**: trabajo diario sobre vinculaciones (addresses), colas (queues) y mensajes
- **Topology**: mapa de red visual del broker

---

## Arranque local

1. Instala dependencias con [Bun](https://bun.sh/):
```bash
bun install
```

2. Configura tu entorno:
```bash
cp .env.example .env
```

3. Inicia el servidor de desarrollo:
```bash
bun run dev
```

La app estara disponible en `http://localhost:4321`.

---

## Documentacion y Guias

Para mantener este README ligero, la informacion detallada se encuentra segmentada en la carpeta `docs/`. **Es altamente recomendable consultarla**.

- 📖 **[Funcionalidades de la App](docs/funcionalidades.md)**: Que operaciones estan soportadas, y flujos de trabajo recomendados.
- 🏗️ **[Arquitectura](docs/arquitectura.md)**: Estructura de carpetas, reglas de desarrollo, separation of concerns y flujos de informacion.
- 🚀 **[Modo Demo y Simulador](docs/demo-mode.md)**: Instrucciones detalladas para usar el cluster en modo demostracion via Docker Compose o arrancar el simulador (generador de trafico sintactico) en local con comandos PowerShell/Bash.

---

## Scripts Utiles

- `bun run dev`: entorno de desarrollo local.
- `bun run check`: verifica todo el tipado (TypeScript) usando Astro.
- `bun run demo:simulator`: arranca el simulador de trafico local (`docs/demo-mode.md`).
