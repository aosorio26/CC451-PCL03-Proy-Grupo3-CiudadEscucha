# Contrato API REST

Base `/api`, JSON UTF-8. Cambios requieren `X-Requested-With: CiudadEscucha` y Origin permitido si existe. Cookie `ce_session` HttpOnly, SameSite=Lax, Secure en producción; validez siete días. Respuesta de error JSON `{error: mensaje}`. 400 validación, 401 sesión, 403 permiso/origen, 404 recurso, 429 límite, 503 LLM ausente.

| Método y ruta                      | Acceso                       | Datos o resultado                                  |
| ---------------------------------- | ---------------------------- | -------------------------------------------------- |
| GET /config, /health               | Público                      | Catálogos, demo, LLM, salud                        |
| POST /auth/register                | Público limitado             | name, email, password; rol siempre ciudadano       |
| POST /auth/login                   | Público limitado             | email, password; cookie y perfil                   |
| POST /auth/logout                  | Sesión si existe             | Invalida cookie y registro                         |
| GET /me                            | Público                      | Perfil propio o null                               |
| PUT /me                            | Autenticado                  | name, bio                                          |
| PUT /preferences                   | Autenticado                  | Esquema completo `prefsSchema`                     |
| GET /export                        | Autenticado                  | Perfil, historial y reportes propios               |
| GET /reports                       | Público                      | Lista común; apoyado/seguido según sesión          |
| POST /reports/duplicates           | Autenticado                  | Datos del borrador; casos misma categoría a <700 m |
| POST /reports                      | Autenticado                  | `reportSchema` + confirmed:true                    |
| GET /reports/:id                   | Público                      | Detalle, historial y comentarios visibles          |
| PUT /reports/:id/support           | Autenticado                  | active:boolean; prohíbe autoapoyo                  |
| PUT /reports/:id/follow            | Autenticado                  | active:boolean                                     |
| POST /reports/:id/comments         | Autenticado                  | body de 2 a 1000 caracteres                        |
| PUT, DELETE /comments/:id          | Autor                        | Editar body o eliminar                             |
| POST /comments/:id/flag            | Autenticado                  | reason de 3 a 250 caracteres                       |
| GET /notifications                 | Autenticado                  | Últimos 100 avisos propios                         |
| PUT /notifications/read            | Autenticado                  | Marcar propios como leídos                         |
| GET /users, /users/:id             | Autenticado                  | Perfiles sin correo; respeta visibilidad           |
| GET /relations                     | Autenticado                  | Relaciones que incluyen a la sesión                |
| PUT /users/:id/relation            | Autenticado                  | kind:follow/friend; action:request/accept/remove   |
| GET /operator/summary              | Operador/admin               | Distrito/estado, personal y denuncias              |
| PUT /operator/reports/:id          | Operador/admin               | status, note, assigned, confirmed:true             |
| PUT /operator/comments/:id/hide    | Operador/admin               | Ocultar comentario                                 |
| PUT /admin/users/:id/role          | Admin                        | role; prohíbe cambiar el propio                    |
| POST /uploads                      | Autenticado                  | image: data URL JPG/PNG/WebP; retorna url          |
| GET, DELETE /assistant/history     | Autenticado                  | Historial propio o borrado                         |
| POST /assistant/message            | Autenticado y consentimiento | message, draft opcional, consent:true              |
| POST /assistant/drafts             | Autenticado                  | Borrador validado, id y duplicados                 |
| POST /assistant/drafts/:id/confirm | Autor del borrador           | confirmed:true; publicación idempotente            |

Los campos canónicos y sus límites están en `server/domain.js`. Las publicaciones usan UUID estable. `request_key` opcional permite reintentos idempotentes; el frontend siempre envía uno. No hay endpoint de escritura SQL, consulta arbitraria o selección de otro usuario mediante el cliente.

## Avatar

`PUT /api/me/avatar` requiere sesión. Recibe `{ "image": "data:image/png;base64,..." }` (también JPEG/WebP), o `{ "image": null }` para retirar. Solo modifica al usuario autenticado. Devuelve su cuenta actualizada. Valida tamaño máximo 5 MB y decodificación, limita píxeles, recorta a 512 × 512 y reencodifica WebP sin metadatos. La migración añade `users.avatar` sin borrar registros. Los perfiles privados no exponen la URL en la respuesta pública; los archivos de uploads son recursos públicos y retirar el avatar del perfil no revoca copias descargadas ni enlaces previos.

## Conversación y ubicación actualizadas

`POST /api/assistant/message` acepta `message`, `draft` parcial, `consent:true`, `mode:text|voice` y hasta diez entradas `{role,text}` en `conversation`. Devuelve `reply`, `intent`, `draft` combinado y validado, `ready`, y opcionalmente `reports` y `count`. El LLM propone consultas estructuradas; el servidor filtra los reportes y respeta perfiles privados. La respuesta nunca escribe un reporte. `POST /api/assistant/drafts` prepara una revisión; `/api/assistant/drafts/:id/confirm` persiste solo con `confirmed:true` y permite reintentos sin duplicar el reporte.

`GET /api/geocode/reverse?lat=...&lng=...` requiere sesión y coordenadas dentro del ámbito de Lima. Retorna `address`, `district` reconocido o null y atribución. La caché en memoria y una cola global limitan la instancia a una consulta externa cada 1,1 s. Hay timeout, límite de cola y respuestas de error recuperables. No se adivina el distrito por proximidad a su centro. Para despliegue de múltiples instancias se necesita una cuota/caché compartida o proveedor propio.

## Mascotas y personalización continua

`/api/config` incluye `mascots: [{id,name,image,available}]` sin claves, proveedores ni modelos. `/api/preferences` persiste `mascotId` (`rabbit1` o `rabbit2`), `adaptive`, `emotion` declarada y `voicePause`. El servidor elige el adaptador por la preferencia autenticada, no por un proveedor arbitrario enviado en el mensaje. No modifica `.env` durante las peticiones.

`POST /api/me/usage` admite solo `voiceError` o `voiceTurn`. Las conversaciones y correcciones las registra el propio servidor. Cada dos dificultades de voz, si la adaptación está activa, se amplía la pausa a 8 s y se reduce la velocidad a un máximo de 0,85; cada tres correcciones se selecciona el tono guiado. `DELETE /api/me/usage` borra los contadores. Se almacenan en `users.learning`, son privados y no aparecen en perfiles ajenos. Las preferencias actuales permanecen editables y no se borran al limpiar los contadores.
