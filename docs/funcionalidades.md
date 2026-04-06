# Funcionalidades actuales de Artemis Pulse

## Resumen

La app permite trabajar con ActiveMQ Artemis desde tres vistas:

- `Pulse`: resumen del estado del broker y colas a revisar.
- `Explorer`: vista principal de trabajo sobre addresses, queues y mensajes.
- `Topology`: mapa visual del broker con acceso directo a `Explorer`.

## Pulse

Uso actual:
- metricas globales del broker
- backlog, DLQ y colas criticas
- refresco manual
- acceso directo a queues problemáticas en `Explorer`

## Explorer

Uso actual:
- navegar por `address -> queue`
- ver addresses vacias en el arbol lateral
- buscar queues o addresses
- listar mensajes sin consumirlos automaticamente
- abrir detalle del mensaje
- filtrar y ordenar mensajes cargados
- cargar `100`, `250` o `500` mensajes por queue
- seleccionar mensajes de forma individual o por lote

### Gestion de broker

Se puede:
- crear addresses
- eliminar addresses
- crear queues
- eliminar queues

### Operaciones sobre mensajes

Se puede:
- publicar mensajes
- consumir mensajes
- limpiar una queue
- mover mensajes
- reintentar mensajes desde DLQ
- ejecutar `Retry All` y `Move All` cuando aplica

## Topology

Uso actual:
- representar broker, addresses, queues y consumers
- filtrar por texto, DLQ, consumers y problemas
- inspeccionar el detalle de cada nodo
- abrir una queue concreta en `Explorer`

## Politica de estados

Las tres vistas usan la misma politica compartida:

- `critical` si el backlog supera el umbral critico o si hay mensajes sin consumers
- `warning` si el backlog supera el umbral de warning
- `healthy` en el resto

## Flujos comunes

### Preparar una prueba

1. Crear una address.
2. Crear una queue.
3. Publicar mensajes.
4. Inspeccionarlos desde `Explorer`.

### Limpiar un entorno de prueba

1. Seleccionar la queue.
2. Limpiar mensajes si hace falta.
3. Eliminar la queue.
4. Eliminar la address si ya no se usa.

### Trabajar con una DLQ

1. Abrir la DLQ en `Explorer`.
2. Revisar mensajes y origen.
3. Ejecutar `Retry`, `Retry All`, `Move` o `Move All`.

## Limitaciones actuales

- no hay paginacion real por offset
- no existe un consumer persistente gestionado por la app
- no hay historial de acciones
- no hay requeue selectivo avanzado por expresion

## Acciones destructivas

Estas acciones modifican o eliminan datos del broker:
- `Consume`
- `Limpiar`
- `Eliminar queue`
- `Eliminar address`
- `Move`
- `Retry`

Estas acciones no son destructivas:
- buscar queues
- ver mensajes
- abrir detalle
- crear address
- crear queue
- publicar mensajes
