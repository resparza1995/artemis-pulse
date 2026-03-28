# Arquitectura de Artemis Pulse

## Objetivo

Este documento describe la arquitectura real del proyecto a dia de hoy:

- como esta organizada la app
- como se conectan UI, backend y Artemis
- donde vive cada responsabilidad
- como funciona el modo demo

## Resumen

Artemis Pulse esta construido con:

- Astro para rutas, shell y endpoints server-side
- React para las vistas interactivas
- TanStack Query para queries y mutaciones en cliente
- Bun como runtime y package manager
- Jolokia como capa de acceso al management API de ActiveMQ Artemis
- React Flow para la vista `Topology`

La separacion principal es esta:

1. `src/pages` define rutas y endpoints
2. `src/components` compone la UI
3. `src/lib` concentra integracion, dominio y protecciones
4. `src/types` define contratos compartidos
5. `src/styles` define tokens y patrones visuales globales
6. `tools/` agrupa utilidades auxiliares como el simulador demo

## Estructura del proyecto

```text
src/
  components/
    dashboard/
    topology/
    ui/
  layouts/
  lib/
    demo-guard/
  pages/
    api/
  styles/
  types/
docs/
tools/
  demo-simulator/
.agents/
```

## Rutas visibles

### `/`
Vista `Pulse`.

Responsabilidad:
- resumen operativo del broker
- metricas globales
- colas a revisar
- selector de perfil demo

### `/explorer`
Vista principal de trabajo.

Responsabilidad:
- navegar por addresses y queues
- inspeccionar mensajes
- ejecutar operaciones operativas
- crear y eliminar addresses/queues

### `/topology`
Vista visual del broker.

Responsabilidad:
- representar broker, addresses, queues y consumers
- localizar nodos con problemas
- abrir una queue concreta en `Explorer`

## Endpoints principales

### Artemis y dominio
- `GET /api/queues`
- `GET /api/addresses`
- `GET /api/broker/metrics`
- `GET /api/topology`
- `GET /api/queues/:queueName/messages`
- `GET /api/queues/:queueName/messages/:messageId`
- `POST /api/addresses`
- `DELETE /api/addresses/:addressName`
- `POST /api/queues`
- `DELETE /api/queues/:queueName`
- `POST /api/queues/:queueName/publish`
- `POST /api/queues/:queueName/consume`
- `POST /api/queues/:queueName/purge`
- `POST /api/queues/:queueName/messages/actions`

### Demo
- `GET /api/demo/profile`
- `POST /api/demo/profile`

Criterio arquitectonico:
- el navegador nunca habla directamente con Artemis
- toda llamada pasa por endpoints propios en `src/pages/api`

## Capa de UI

### `src/layouts`
`MainLayout.astro` contiene:
- header comun
- contexto de broker
- navegacion `Pulse / Explorer / Topology`
- shell visual de la app

### `src/components/dashboard`
Aqui viven las pantallas y modales de negocio de `Pulse` y `Explorer`.

Componentes clave:
- `QueueDashboard.tsx`
- `ExplorerView.tsx`
- `ExplorerSidebar.tsx`
- `ExplorerMessagesPanel.tsx`
- `ExplorerMessageDetailPanel.tsx`
- modales de create/delete/publish/consume/move/retry

### `src/components/topology`
Aqui vive la vista `Topology`.

Componentes clave:
- `TopologyView.tsx`
- `TopologyCanvas.tsx`
- `TopologyDetailPanel.tsx`
- `TopologyToolbar.tsx`
- `TopologyLegend.tsx`

### `src/components/ui`
Primitivas reutilizables:
- `button.tsx`
- `card.tsx`
- `badge.tsx`
- `input.tsx`
- `modal.tsx`
- `filterable-combobox.tsx`
- `dropdown.tsx`

Regla practica:
- si un patron visual o de interaccion se repite, debe bajar a `ui`

## Capa de dominio e integracion

### `src/lib/artemis.ts`
Es el nucleo del backend de la app.

Responsabilidades:
- listar queues
- listar addresses
- metricas del broker
- lectura de mensajes
- create/delete address
- create/delete queue
- publish
- consume
- purge
- retry/move
- construccion de datos para `Topology`

### `src/lib/jolokia.ts`
Cliente HTTP hacia Jolokia.

### `src/lib/config.ts`
Lectura y normalizacion de variables de entorno.

### `src/lib/topology.ts`
Transforma datos del broker en un grafo consumible por `Topology`.

### `src/lib/demo-controller.ts`
Proxy hacia el simulador demo.

Responsabilidades:
- obtener perfiles disponibles
- aplicar perfil demo
- resetear escenario

### `src/lib/demo-guard/`
Capa aislada para demo publica.

Responsabilidades actuales:
- rate limit de escrituras por IP/accion
- auto-reset periodico del escenario demo

Nota:
- la restriccion por prefijo `demo.*` ya no esta activa
- la capa se mantiene encapsulada para poder desmontarla facil despues de la demo

## Contratos tipados

En `src/types` viven los shapes compartidos entre backend y frontend.

Archivos clave:
- `queues.ts`
- `explorer.ts`
- `topology.ts`
- `demo.ts`

Regla practica:
- si un dato cruza capas, debe vivir en `src/types`

## Flujo de datos

Flujo habitual:

1. el usuario interactua con una vista React
2. el componente ejecuta una query o mutation con TanStack Query
3. la llamada va a `/api/...`
4. el endpoint delega en `src/lib/...`
5. `artemis.ts` o `demo-controller.ts` habla con el servicio correspondiente
6. la respuesta se normaliza
7. el endpoint devuelve JSON estable
8. la UI refresca estado y vistas

Ejemplo de `Publish`:

1. `PublishMessageModal` recoge body, headers y count
2. `ExplorerView` ejecuta la mutation
3. `POST /api/queues/:queueName/publish`
4. `publishMessage()` en `src/lib/artemis.ts`
5. `sendMessage(...)` sobre el MBean de Artemis
6. invalidacion de queries
7. refresco visual de queue y mensajes

## Modo demo

La demo se apoya en tres servicios:

1. `artemis`
2. `app`
3. `demo-simulator`

### Simulador

`tools/demo-simulator/server.ts`:
- crea trafico de prueba
- expone perfiles `steady`, `incident`, `recovery`
- soporta `reset + apply`

### Integracion en UI

`Pulse` muestra:
- estado del modo demo
- perfil actual
- selector de perfil
- boton `Aplicar perfil`

### Auto-reset

Si `DEMO_AUTO_RESET_ENABLED=true`, la capa `demo-guard` re-aplica el perfil base cada intervalo configurado.

## Sistema visual

La base visual esta en `src/styles/global.css`.

Define:
- tokens de color
- superficies y bordes
- radios y sombras
- tipografias
- clases globales tipo `app-panel`, `app-control`, `app-notice`, `app-modal`

Encima de eso, `src/components/ui` encapsula patrones reutilizables.

## Docker y despliegue demo

El repo incluye:
- `Dockerfile`
- `Dockerfile.simulator`
- `docker-compose.yml`

`docker-compose.yml` levanta:
- Artemis
- app
- demo-simulator

## Reglas practicas

- Si una operacion toca Artemis, primero pensar en `src/lib/artemis.ts`
- Si una vista crece demasiado, extraer subcomponentes y mantener la coordinacion en el componente raiz
- Si un patron visual se repite, bajarlo a `src/components/ui`
- Si una proteccion existe solo para la demo, mantenerla fuera del flujo principal en `src/lib/demo-guard/`
- Mantener `Explorer` como vista principal de trabajo y `Pulse` como vista de resumen
