# Arquitectura de Artemis Pulse

## Objetivo de este documento

Este documento sirve como punto de entrada para alguien que empieza a desarrollar en Artemis Pulse.

La idea es entender rapido:
- como esta organizado el proyecto
- donde vive cada responsabilidad
- como se conecta la UI con Artemis
- como esta montado el sistema de estilos

## Resumen de la arquitectura

Artemis Pulse es una aplicacion web montada con:
- Astro para rutas, shell y endpoints server
- React para las vistas interactivas
- TanStack Query para carga de datos y mutaciones en cliente
- Bun como runtime y gestor de paquetes
- Jolokia como capa de acceso al management API de ActiveMQ Artemis

La arquitectura sigue una separacion sencilla:
1. `pages` define rutas y endpoints
2. `components` renderiza la UI
3. `lib` concentra integracion, normalizacion y reglas de dominio
4. `types` define contratos compartidos
5. `styles` define la base visual global

## Estructura del proyecto

```text
src/
  components/
    dashboard/
    ui/
  layouts/
  lib/
  pages/
    api/
  styles/
  types/
docs/
.agents/
```

### `src/pages`
Responsabilidad:
- definir rutas visibles de la app
- definir endpoints backend consumidos por la propia UI

Archivos importantes:
- [index.astro](e:\code-workspaces\artemis-ui\src\pages\index.astro)
  Vista `Pulse`, usada como dashboard general
- [explorer.astro](e:\code-workspaces\artemis-ui\src\pages\explorer.astro)
  Vista principal de trabajo diario
- [api/queues.ts](e:\code-workspaces\artemis-ui\src\pages\api\queues.ts)
  Listado de colas y creacion de queue
- [api/addresses.ts](e:\code-workspaces\artemis-ui\src\pages\api\addresses.ts)
  Creacion de address
- [api/addresses/[addressName].ts](e:\code-workspaces\artemis-ui\src\pages\api\addresses\[addressName].ts)
  Eliminacion de address
- [api/queues/[queueName]/index.ts](e:\code-workspaces\artemis-ui\src\pages\api\queues\[queueName]\index.ts)
  Eliminacion de queue
- [api/queues/[queueName]/publish.ts](e:\code-workspaces\artemis-ui\src\pages\api\queues\[queueName]\publish.ts)
  Publicacion de mensajes
- [api/queues/[queueName]/consume.ts](e:\code-workspaces\artemis-ui\src\pages\api\queues\[queueName]\consume.ts)
  Consumo puntual de mensajes
- [api/queues/[queueName]/purge.ts](e:\code-workspaces\artemis-ui\src\pages\api\queues\[queueName]\purge.ts)
  Limpieza completa de cola
- [api/queues/[queueName]/messages/index.ts](e:\code-workspaces\artemis-ui\src\pages\api\queues\[queueName]\messages\index.ts)
  Listado de mensajes de una queue
- [api/queues/[queueName]/messages/[messageId].ts](e:\code-workspaces\artemis-ui\src\pages\api\queues\[queueName]\messages\[messageId].ts)
  Detalle de mensaje

Criterio actual:
- la UI nunca habla directamente con Artemis desde el navegador
- todo pasa por endpoints propios en `src/pages/api`

## Division de responsabilidades

### 1. Layout y shell
Responsabilidad:
- estructura comun de pagina
- navegacion entre vistas
- header, contexto de broker y contenedor general

Archivo principal:
- [MainLayout.astro](e:\code-workspaces\artemis-ui\src\layouts\MainLayout.astro)

Aqui viven:
- la barra superior
- la navegacion `Pulse / Explorer`
- el marco visual comun
- la carga de estilos globales

Regla practica:
- si un cambio afecta a toda la app, probablemente pertenece aqui
- si afecta a una vista concreta, no deberia ir en este layout

### 2. Componentes de dominio (`src/components/dashboard`)
Responsabilidad:
- construir las vistas de producto
- encapsular la logica de interaccion de cada pantalla
- componer modales, tablas, filtros y paneles de detalle

Subgrupos actuales:
- componentes de `Pulse`
- componentes de `Explorer`
- modales de acciones operativas

Archivo clave:
- [ExplorerView.tsx](e:\code-workspaces\artemis-ui\src\components\dashboard\ExplorerView.tsx)

`ExplorerView` es hoy el mejor ejemplo del patron actual:
- carga datos con React Query
- mantiene estado local de seleccion y modales
- ejecuta mutaciones
- delega el render real a subcomponentes mas pequenos

Otros componentes importantes:
- [ExplorerSidebar.tsx](e:\code-workspaces\artemis-ui\src\components\dashboard\ExplorerSidebar.tsx)
- [ExplorerMessagesPanel.tsx](e:\code-workspaces\artemis-ui\src\components\dashboard\ExplorerMessagesPanel.tsx)
- [ExplorerMessageDetailPanel.tsx](e:\code-workspaces\artemis-ui\src\components\dashboard\ExplorerMessageDetailPanel.tsx)
- modales como [CreateQueueModal.tsx](e:\code-workspaces\artemis-ui\src\components\dashboard\CreateQueueModal.tsx), [CreateAddressModal.tsx](e:\code-workspaces\artemis-ui\src\components\dashboard\CreateAddressModal.tsx) o [PublishMessageModal.tsx](e:\code-workspaces\artemis-ui\src\components\dashboard\PublishMessageModal.tsx)

Regla practica:
- la logica de una vista vive en su componente raiz
- los subcomponentes deben ser lo mas presentacionales posible
- las acciones operativas se exponen con modales dedicados

### 3. Componentes base (`src/components/ui`)
Responsabilidad:
- primitivas reutilizables de interfaz
- consistencia visual y de comportamiento

Archivos clave:
- [button.tsx](e:\code-workspaces\artemis-ui\src\components\ui\button.tsx)
- [card.tsx](e:\code-workspaces\artemis-ui\src\components\ui\card.tsx)
- [badge.tsx](e:\code-workspaces\artemis-ui\src\components\ui\badge.tsx)
- [table.tsx](e:\code-workspaces\artemis-ui\src\components\ui\table.tsx)
- [input.tsx](e:\code-workspaces\artemis-ui\src\components\ui\input.tsx)
- [textarea.tsx](e:\code-workspaces\artemis-ui\src\components\ui\textarea.tsx)
- [modal.tsx](e:\code-workspaces\artemis-ui\src\components\ui\modal.tsx)

Regla practica:
- si un patron visual se repite, deberia bajar a `ui`
- si un componente conoce Artemis, queues o mensajes, no deberia estar en `ui`

### 4. Capa de integracion y dominio (`src/lib`)
Responsabilidad:
- comunicacion con Jolokia
- normalizacion de respuestas de Artemis
- reglas de negocio simples del broker
- acceso a configuracion server

Archivos clave:
- [jolokia.ts](e:\code-workspaces\artemis-ui\src\lib\jolokia.ts)
  Cliente HTTP server-side hacia Jolokia
- [artemis.ts](e:\code-workspaces\artemis-ui\src\lib\artemis.ts)
  Orquestacion principal contra Artemis
- [config.ts](e:\code-workspaces\artemis-ui\src\lib\config.ts)
  Lectura de variables de entorno
- [queue-status.ts](e:\code-workspaces\artemis-ui\src\lib\queue-status.ts)
  Reglas de estado y deteccion de DLQ
- [utils.ts](e:\code-workspaces\artemis-ui\src\lib\utils.ts)
  Utilidades generales de UI

`artemis.ts` es el nucleo del backend de la app.
Aqui se centraliza:
- listado de queues
- lectura de mensajes
- detalle de mensaje
- create/delete address
- create/delete queue
- publish
- consume
- purge

Regla importante:
- la logica de Artemis no debe duplicarse en los endpoints
- los endpoints deben ser finos y delegar en `src/lib/artemis.ts`

### 5. Contratos tipados (`src/types`)
Responsabilidad:
- compartir tipos entre backend y frontend
- dar estabilidad a los contratos de datos internos

Archivos actuales:
- [queues.ts](e:\code-workspaces\artemis-ui\src\types\queues.ts)
- [explorer.ts](e:\code-workspaces\artemis-ui\src\types\explorer.ts)

Aqui viven tipos como:
- `QueueSummary`
- `ExplorerMessageSummary`
- `ExplorerMessageDetail`
- respuestas de operaciones como `QueuePurgeResponse`, `QueueDeleteResponse` o `PublishMessageResponse`

Regla practica:
- si un shape de datos cruza capas, debe vivir en `types`

## Flujo de datos

El flujo normal es este:

1. El usuario interactua con una vista React
2. El componente ejecuta una query o mutation con TanStack Query
3. La llamada va a `/api/...`
4. El endpoint valida y delega en `src/lib/artemis.ts`
5. `artemis.ts` habla con Jolokia a traves de `jolokia.ts`
6. La respuesta se normaliza
7. El endpoint devuelve JSON estable a la UI
8. La UI actualiza tablas, paneles y notificaciones

Ejemplo real de `Publish`:
1. `PublishMessageModal` recoge body, headers y count
2. `ExplorerView` ejecuta la mutation
3. `POST /api/queues/:queueName/publish`
4. `publishMessage()` en [artemis.ts](e:\code-workspaces\artemis-ui\src\lib\artemis.ts)
5. `sendMessage(...)` sobre el MBean de Artemis
6. invalidacion de queries en cliente
7. refresco visual de queue y mensajes

## Como estan organizados los estilos

La parte de estilos esta montada en tres capas.

### 1. Tokens globales en `src/styles/global.css`
Archivo principal:
- [global.css](e:\code-workspaces\artemis-ui\src\styles\global.css)

Aqui se definen:
- variables CSS de color
- superficies
- sombras
- radios
- tipografias
- tokens semanticos de estado
- clases utilitarias globales de la app

La idea no es usar colores sueltos por toda la app, sino apoyarse en tokens como:
- `--background`
- `--card`
- `--primary`
- `--success`
- `--warning`
- `--critical`
- `--surface-panel`
- `--border`

Tambien se exportan a Tailwind mediante `@theme inline`, para poder usar clases como:
- `bg-card`
- `text-foreground`
- `text-muted-foreground`
- `text-primary`

### 2. Clases de shell y componentes globales
Dentro del mismo [global.css](e:\code-workspaces\artemis-ui\src\styles\global.css) hay clases compartidas como:
- `.app-panel`
- `.app-panel-muted`
- `.app-control`
- `.app-empty-state`
- `.app-notice-*`
- `.app-table-shell`
- `.app-modal`

Estas clases sirven para dos cosas:
- evitar repetir combinaciones largas de utilidades Tailwind
- fijar una identidad visual comun en toda la app

Regla practica:
- si un patron aparece en muchas pantallas, conviene extraerlo aqui
- si es demasiado especifico de una unica vista, mejor dejarlo local al componente

### 3. Primitivas `ui`
Los componentes de `src/components/ui` consumen esos tokens y clases base.
Por eso la mayor parte del look real sale de la combinacion de:
- variables globales
- utilidades Tailwind
- wrappers reutilizables como `Button`, `Card`, `Badge` o `Modal`

Esto permite cambiar la paleta o el tono visual tocando pocos sitios:
1. `global.css`
2. componentes base de `ui`
3. ajustes puntuales en vistas con estilos hardcodeados

## Responsabilidades por carpeta

### `docs/`
Documentacion funcional y tecnica del proyecto.

Hoy incluye:
- [funcionalidades.md](e:\code-workspaces\artemis-ui\docs\funcionalidades.md)
- [arquitectura.md](e:\code-workspaces\artemis-ui\docs\arquitectura.md)
- otros documentos de apoyo del producto

### `.agents/`
Memoria operativa y documentos de trabajo para continuar el desarrollo sin reconstruir contexto completo.

Aqui viven:
- memoria del estado actual
- TODOs
- planes por vista
- lecciones aprendidas
- planes de test

No forma parte del runtime de la app, pero si del flujo de desarrollo.

## Decisiones de diseño actuales

- `Explorer` es la vista principal de trabajo
- `Pulse` se mantiene como vista de orientacion general
- la UI no expone Artemis directamente al cliente
- los endpoints propios actuan como backend intermedio
- la logica de broker se concentra en `src/lib/artemis.ts`
- el sistema visual se apoya en tokens globales + primitivas `ui`
- las acciones destructivas pasan por modales de confirmacion

## Como orientarse rapido al entrar al proyecto

Si alguien entra nuevo, el recorrido recomendado es:

1. Leer [README.md](e:\code-workspaces\artemis-ui\README.md)
2. Leer [funcionalidades.md](e:\code-workspaces\artemis-ui\docs\funcionalidades.md)
3. Leer este documento
4. Revisar [ExplorerView.tsx](e:\code-workspaces\artemis-ui\src\components\dashboard\ExplorerView.tsx)
5. Revisar [artemis.ts](e:\code-workspaces\artemis-ui\src\lib\artemis.ts)
6. Revisar [global.css](e:\code-workspaces\artemis-ui\src\styles\global.css)

Con esos tres puntos se entiende casi toda la app:
- vista principal
- backend real
- sistema visual

## Reglas practicas para seguir evolucionando la arquitectura

- Si es una operacion sobre Artemis, primero pensar si pertenece en `artemis.ts`
- Si es una ruta nueva, mantener el endpoint fino y sin logica duplicada
- Si una vista crece demasiado, extraer subcomponentes y mantener la coordinacion en el componente raiz
- Si un patron visual se repite, bajarlo a `ui` o a `global.css`
- Evitar meter colores hardcodeados directamente en las vistas cuando ya exista un token semantico
- Mantener `Explorer` orientado a uso diario y `Pulse` orientado a estado general
