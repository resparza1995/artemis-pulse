# Funcionalidades actuales de Artemis Pulse

## Resumen rapido

Hoy la app sirve sobre todo para trabajar en la vista `Explorer`.

Permite:
- ver queues y addresses del broker a traves del arbol `address -> queue`
- buscar y seleccionar una queue
- ver mensajes sin consumirlos automaticamente
- ver el detalle del mensaje seleccionado
- crear addresses
- crear queues
- publicar uno o varios mensajes de prueba
- consumir mensajes desde la UI
- limpiar una cola completa
- eliminar queues
- eliminar addresses por nombre

No permite todavia:
- crear consumers persistentes tipo servicio conectado
- reintentar mensajes a otra queue
- mover mensajes manualmente entre queues
- editar mensajes ya existentes
- paginacion real de mensajes
- historial de acciones
- listar addresses vacias como vista separada

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
- ver hasta 100 mensajes por queue
- abrir detalle de un mensaje
- ejecutar acciones operativas desde modal

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
- cargar hasta 100 mensajes de la queue seleccionada
- ver metadatos basicos del mensaje
- ver `content-type`
- ver preview del body
- abrir el body completo del mensaje seleccionado
- ver headers y properties

Importante:
- la lectura se hace con `browse()`
- abrir un mensaje no lo consume ni lo elimina

### 3. Crear una address
Se puede:
- crear una address nueva desde el sidebar
- elegir `ANYCAST` o `MULTICAST`

Flujo:
1. Ir a `/explorer`
2. Pulsar `Address`
3. Rellenar el nombre de la address
4. Elegir `routing type`
5. Confirmar en el modal

Importante:
- una address recien creada no aparece en el arbol lateral hasta que tenga alguna queue asociada
- aun asi puede usarse despues para crear una queue o eliminarse por nombre

### 4. Eliminar una address
Se puede:
- eliminar una address escribiendo su nombre o usando el valor pre-rellenado de la seleccion actual

Flujo:
1. Ir a `/explorer`
2. Pulsar `Eliminar address`
3. Confirmar o editar el nombre de la address
4. Ejecutar la accion

Importante:
- si la address todavia tiene queues asociadas, Artemis rechazara la operacion
- es una accion destructiva

### 5. Crear una queue
Se puede:
- crear una queue nueva desde el boton `Queue`
- crear tambien la address asociada si no existia
- elegir `ANYCAST` o `MULTICAST`
- decidir si la queue es durable

Flujo:
1. Ir a `/explorer`
2. Pulsar `Queue`
3. Rellenar `address`, `queue name`, `routing type` y `durable`
4. Confirmar en el modal
5. La nueva queue aparece en el arbol lateral

### 6. Eliminar una queue
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

### 7. Publicar mensajes
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
7. La lista puede refrescarse para ver los mensajes generados

Importante:
- el mensaje se publica sobre la address de la queue seleccionada
- el mismo body se envia `N` veces segun el contador indicado
- el body se envia y despues puede leerse desde la propia UI

### 8. Consumir mensajes
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

### 9. Limpiar una cola
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

## Flujos practicos que ya se pueden seguir

### Flujo A. Preparar una prueba desde cero
1. Crear una address
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

### Flujo C. Validar que una aplicacion consume bien
1. Seleccionar la queue de trabajo
2. Publicar mensajes de prueba
3. Ver si la aplicacion real los consume
4. Si hace falta, usar `Consume` manual para vaciar algunos mensajes de prueba

### Flujo D. Limpiar entorno de pruebas
1. Seleccionar la queue usada en pruebas
2. Revisar los mensajes pendientes
3. Usar `Limpiar` para dejar la queue vacia
4. Si ya no hace falta la queue, usar `Eliminar queue`
5. Si tampoco hace falta la address, usar `Eliminar address`

### Flujo E. Inspeccionar un fallo de datos
1. Abrir `/explorer`
2. Buscar la queue o DLQ afectada
3. Abrir un mensaje
4. Revisar body, headers y properties
5. Decidir si publicas nuevos mensajes de prueba, consumes algunos o limpias la cola

## Limitaciones actuales

### Lectura de mensajes
- se muestran hasta 100 mensajes por queue
- no hay paginacion real
- si hay muchos mensajes, la vista se trunca

### Addresses
- el arbol lateral se construye a partir de queues
- una address sin queues no aparece como nodo propio en el sidebar
- para eliminar una address vacia, hoy se usa el modal indicando su nombre

### Consumers
- no existe un consumer persistente mantenido por la app
- no hay monitor de consumers conectados por aplicacion
- el boton `Consume` no crea un proceso largo; ejecuta una accion puntual

### Operaciones que todavia no existen
- retry a cola original
- move a otra queue
- requeue selectivo
- consume con selector/filtro
- ack parcial avanzado
- envio por lotes con plantillas distintas
- simulador de carga completo

## Acciones destructivas

Estas acciones modifican o eliminan datos del broker:
- `Consume`
- `Limpiar`
- `Eliminar queue`
- `Eliminar address`

Estas acciones no son destructivas:
- buscar queues
- ver mensajes
- abrir detalle
- crear address
- crear queue
- publicar mensajes

## Recomendacion de uso

Para trabajo diario, el flujo recomendado hoy es:
1. usar `Pulse` solo para orientarte
2. entrar en `Explorer` para trabajar de verdad
3. usar `Address`, `Queue`, `Publish`, `Consume`, `Limpiar`, `Eliminar queue` y `Eliminar address` como herramientas de soporte para pruebas y limpieza consciente
