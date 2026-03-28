# Artemis Pulse

Artemis Pulse es una consola web moderna para operar e inspeccionar brokers de ActiveMQ Artemis desde una interfaz construida con Astro, React y Tailwind CSS.

La app esta orientada a tres vistas principales:
- **Pulse**: resumen operativo y cambio de perfil demo
- **Explorer**: trabajo diario sobre vinculaciones (addresses), colas (queues) y mensajes
- **Topology**: mapa de red visual del broker

## Despliegue en CubePath con Dokploy

Accede [aquí](http://vps22550.cubepath.net:4321/) para probar la app.  
Hay un pequeño servicio simulando movientos en el broker de artemis para poder ver el funcionamiento real.  
🚀 [Detalle del Modo Demo](docs/demo-mode.md)

### ¿Cómo se ha desplegado?
Para gestionar todo el proceso de despliegue se ha utilizado [CubePath](https://cubepath.com/).

Se ha creado una máquina virtual para alojar el servicio de Dokploy.  
Dentro de Dokploy, se ha configurado un nuevo proyecto:
- Se ha añadido un servicio de tipo Compose, ya que toda la infraestructura está definida mediante un archivo docker-compose.yml y sus correspondientes Dockerfile.

Se ha vinculado este repositorio de GitHub con Dokploy, indicando:
- La ruta al archivo docker-compose.yml
- La rama del repositorio para desplegar   

Finalmente, se ha habilitado la opción de auto-deploy, de modo que el despliegue se ejecuta automáticamente cada vez que se realiza un push a la rama configurada.

Con estos pasos, el despliegue queda completamente operativo.

<img width="1552" height="471" alt="dokploy" src="https://github.com/user-attachments/assets/3bdf2aca-825d-408c-800b-8f49113ce8a5" />

---

## Resumen de funcionalidades

- **Explorador en tiempo real**: Inspección de colas, addresses, contadores (consumers, mensajes) y payloads visualizados estructuradamente.
- **Gestión del Broker**: Crea y elimina *Addresses/Queues* (incluso borradores en cascada) desde la UI.
- **Operaciones de Mensajes**: *Publish*, *Consume* como consumidor temporal, y vaciado de colas (*Purge*).
- **Gestiones Avanzadas de DLQ (Corrección de incidencias)**: 
  - Banner automático inteligente cuando hay mensajes en DLQ.
  - *Retry* / *Retry All*: Reencolar automáticamente fallos a su originario destino.
  - *Move* / *Move All*: Volcar mensajes problemáticos a colas de tratamiento secundario.
- **Panel de Topología**: Mapa visual interactivo mostrando las relaciones, salud y enrutamiento del broker entero.

📖 [Ver detalle completo de funcionalidades](docs/funcionalidades.md)

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
- 🏗️ **[Arquitectura](docs/arquitectura.md)**: Estructura de carpetas, reglas de desarrollo, separation of concerns y flujos de informacion.

---

## Scripts Utiles

- `bun run dev`: entorno de desarrollo local.
- `bun run check`: verifica todo el tipado (TypeScript) usando Astro.
- `bun run demo:simulator`: arranca el simulador de trafico local (`docs/demo-mode.md`).
