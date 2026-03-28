# Funcionalidades actuales de Artemis Pulse

## Resumen rapido

Hoy la app sirve sobre todo para trabajar en la vista `Explorer`.

Permite:
- ver queues y addresses del broker a traves del arbol `address -> queue`
- buscar y seleccionar una queue
- ver mensajes sin consumirlos automaticamente
- ver el detalle del mensaje seleccionado
- filtrar y ordenar los mensajes cargados
- cargar `100`, `250` o `500` mensajes por queue
- seleccionar uno o varios mensajes para operar en lote
- crear addresses
- crear queues
- publicar uno o varios mensajes de prueba
- consumir mensajes desde la UI
- limpiar una cola completa
- eliminar queues
- eliminar addresses por nombre
- mover mensajes a otra queue
- reintentar mensajes desde DLQ cuando el destino original es resoluble

No permite todavia:
- crear consumers persistentes tipo servicio conectado
- paginacion real por offset
- editar mensajes ya existentes
- historial de acciones
- listar addresses vacias como vista separada
- requeue selectivo con selector avanzado

## Vistas disponibles

### `/`
Vista `Pulse`.

Uso actual:
- resumen general del broker
- estado de queues
- backlog, DLQ y colas criticas

Es una vista de orientacion.
No es la vista principal de trabajo diario.

### `/explorer`
Vista principal de trabajo.

Uso actual:
- navegar por `address -> queue`
- buscar queues o addresses
- ver y filtrar mensajes
- abrir detalle de un mensaje
- ejecutar acciones operativas desde modales
- administrar addresses y queues desde el modal `Gestion`

## Acciones disponibles hoy

### 1. Buscar y abrir una queue
Se puede:
- buscar por nombre de queue
- buscar por address
- expandir o contraer grupos por address
- seleccionar una queue para ver sus mensajes

Flujo:
1. Ir a `/explorer`
2. Escribir en el filtro lateral
3. Seleccionar una queue
4. Ver la lista de mensajes y el panel de detalle

### 2. Ver mensajes
Se puede:
- cargar `100`, `250` o `500` mensajes de la queue seleccionada
- ver metadatos basicos del mensaje
- ver `content-type`
- ver preview del body
- ver origen original cuando el broker lo expone
- abrir el body completo del mensaje seleccionado
- ver headers y properties
- filtrar por `messageId`, `content-type` o `preview`
- ordenar por hora, prioridad o tamano

Importante:
- la lectura se hace con `browse()`
- abrir un mensaje no lo consume ni lo elimina
- el filtro y la ordenacion trabajan sobre los mensajes ya cargados en cliente

### 3. Gestionar addresses y queues
Se puede:
- abrir el modal `Gestion` desde el sidebar
- crear una address nueva
- crear una queue nueva
- eliminar una address por nombre
- ver el contexto actual de queue/address seleccionada

Importante:
- una address vacia no aparece en el arbol lateral hasta que tenga alguna queue asociada
- esa limitacion se explica dentro del propio modal `Gestion`

### 4. Crear una address
Se puede:
- crear una address nueva desde `Gestion`
- elegir `ANYCAST` o `MULTICAST`

Flujo:
1. Ir a `/explorer`
2. Pulsar `Gestion`
3. Elegir `Nueva address`
4. Rellenar el nombre de la address
5. Elegir `routing type`
6. Confirmar en el modal

### 5. Eliminar una address
Se puede:
- eliminar una address escribiendo su nombre o usando el valor pre-rellenado de la seleccion actual

Flujo:
1. Ir a `/explorer`
2. Pulsar `Gestion`
3. Elegir `Eliminar address`
4. Confirmar o editar el nombre de la address
5. Ejecutar la accion

Importante:
- si la address todavia tiene queues asociadas, Artemis rechazara la operacion
- es una accion destructiva

### 6. Crear una queue
Se puede:
- crear una queue nueva desde `Gestion`
- crear tambien la address asociada si no existia
- elegir `ANYCAST` o `MULTICAST`
- decidir si la queue es durable

Flujo:
1. Ir a `/explorer`
2. Pulsar `Gestion`
3. Elegir `Nueva queue`
4. Rellenar `address`, `queue name`, `routing type` y `durable`
5. Confirmar en el modal
6. La nueva queue aparece en el arbol lateral

### 7. Eliminar una queue
Se puede:
- eliminar la queue seleccionada desde el panel central

Flujo:
1. Seleccionar una queue en `/explorer`
2. Pulsar `Eliminar queue`
3. Confirmar en el modal
4. La queue desaparece del arbol y la vista se refresca

Importante:
- si la queue tenia mensajes, se pierden con ella
- la address asociada se conserva
- es una accion destructiva

### 8. Publicar mensajes
Se puede:
- publicar uno o varios mensajes de prueba en la queue seleccionada
- indicar body libre
- indicar headers simples en formato `clave: valor`
- decidir si el mensaje es durable
- indicar cuantas veces quieres enviar el mismo mensaje

Flujo:
1. Seleccionar una queue en `/explorer`
2. Pulsar `Publish`
3. Indicar numero de envios
4. Rellenar `body`
5. Opcionalmente anadir headers
6. Confirmar
7. Refrescar o dejar que la vista recargue la lista manualmente

### 9. Consumir mensajes
Se puede:
- consumir `N` mensajes desde la UI
- usar un consumer temporal de prueba
- sacar mensajes realmente de la cola

Flujo:
1. Seleccionar una queue en `/explorer`
2. Pulsar `Consume`
3. Indicar cuantos mensajes quieres consumir
4. Confirmar
5. La lista de mensajes y los contadores se actualizan

Importante:
- este consume es una accion operativa de prueba, no un consumer persistente
- internamente lee mensajes visibles y los elimina de la cola
- es una accion destructiva

### 10. Limpiar una cola
Se puede:
- eliminar todos los mensajes de la queue seleccionada

Flujo:
1. Seleccionar una queue en `/explorer`
2. Pulsar `Limpiar`
3. Confirmar en el modal
4. La cola queda vacia y la vista se refresca

Importante:
- esta accion es destructiva
- elimina todos los mensajes pendientes de la cola

### 11. Seleccionar mensajes por lote
Se puede:
- seleccionar mensajes individuales con checkbox
- seleccionar todos los visibles
- limpiar la seleccion actual
- lanzar acciones por lote desde la toolbar contextual

Importante:
- la seleccion se mantiene solo mientras los mensajes sigan visibles en la vista filtrada/cargada

### 12. Retry de mensajes
Se puede:
- reintentar mensajes seleccionados desde una DLQ
- usar el destino original solo cuando el broker lo expone de forma segura

Flujo:
1. Abrir una DLQ en `/explorer`
2. Seleccionar uno o varios mensajes
3. Pulsar `Retry`
4. Revisar el resumen del modal
5. Confirmar la operacion
6. La lista y los contadores se refrescan

Importante:
- solo se reintentan de forma automatica los mensajes con metadato de origen utilizable
- si un mensaje no tiene origen resoluble, debes usar `Move`
- la operacion puede terminar con exito parcial

### 13. Move de mensajes
Se puede:
- mover uno o varios mensajes seleccionados a otra queue
- elegir la queue destino desde un modal

Flujo:
1. Seleccionar una queue origen en `/explorer`
2. Marcar uno o varios mensajes
3. Pulsar `Move`
4. Elegir la queue destino
5. Confirmar
6. La lista y los contadores se actualizan

Importante:
- la queue destino debe ser distinta de la queue origen
- la operacion puede terminar con exito parcial
- es una accion operativa, no solo de lectura

## Flujos practicos que ya se pueden seguir

### Flujo A. Preparar una prueba desde cero
1. Crear una address desde `Gestion`
2. Crear una queue asociada
3. Publicar uno o varios mensajes
4. Abrirlos en la lista
5. Revisar body, headers y properties

### Flujo B. Generar datos repetidos para una prueba
1. Seleccionar la queue de trabajo
2. Pulsar `Publish`
3. Indicar `10`, `25` o el numero que necesites
4. Confirmar el body
5. Ver la cantidad generada en la lista y en el backlog

### Flujo C. Inspeccionar y recuperar mensajes de una DLQ
1. Abrir la DLQ afectada
2. Filtrar por `messageId`, `content-type` o preview
3. Seleccionar uno o varios mensajes
4. Usar `Retry` si el origen es resoluble
5. Usar `Move` si necesitas elegir destino manual

### Flujo D. Validar que una aplicacion consume bien
1. Seleccionar la queue de trabajo
2. Publicar mensajes de prueba
3. Ver si la aplicacion real los consume
4. Si hace falta, usar `Consume` manual para vaciar algunos mensajes de prueba

### Flujo E. Limpiar entorno de pruebas
1. Seleccionar la queue usada en pruebas
2. Revisar los mensajes pendientes
3. Usar `Limpiar` para dejar la queue vacia
4. Si ya no hace falta la queue, usar `Eliminar queue`
5. Si tampoco hace falta la address, usar `Eliminar address`

## Limitaciones actuales

### Lectura de mensajes
- se muestran hasta `500` mensajes por queue
- no hay paginacion real por offset
- si hay mas mensajes de los cargados, la vista sigue truncada

### Addresses
- el arbol lateral se construye a partir de queues
- una address sin queues no aparece como nodo propio en el sidebar
- para eliminar una address vacia, hoy se usa el modal indicando su nombre

### Consumers
- no existe un consumer persistente mantenido por la app
- no hay monitor de consumers conectados por aplicacion
- el boton `Consume` no crea un proceso largo; ejecuta una accion puntual

### Operaciones que todavia no existen
- paginacion real por offset
- retry con reglas avanzadas o filtros
- move con selector mas complejo o plantillas
- requeue selectivo por expresion
- consume con selector/filtro
- ack parcial avanzado
- simulador de carga completo

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
- filtrar y ordenar la lista

## Recomendacion de uso

Para trabajo diario, el flujo recomendado hoy es:
1. usar `Pulse` solo para orientarte
2. entrar en `Explorer` para trabajar de verdad
3. usar `Gestion` para preparar o limpiar estructuras
4. usar `Publish`, `Consume`, `Limpiar`, `Retry` y `Move` como herramientas de soporte para pruebas e incidencias
