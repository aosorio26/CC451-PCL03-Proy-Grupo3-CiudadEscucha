# Preparación de datos reales y despliegue

## Entorno local separado

No conviertas los ejemplos en denuncias reales ni reutilices contraseñas demo. Detén el servidor. Conserva tu carpeta `data` para la evaluación y cambia `DATA_DIR=./data-real`, `DEMO_MODE=false` en `.env`. Inicia con `npm start`: se crea un esquema vacío. Registra tu cuenta desde la interfaz y ejecuta `node --env-file-if-exists=.env scripts/admin.js` para asignarle administración con acceso local al servidor. Después podrás gestionar roles desde el panel. No hay endpoint público de promoción.

## Ingresar información

1. Por la interfaz: título, categoría, descripción, distrito/referencia, coordenadas aproximadas, urgencia declarada y fotografía opcional. Revisión y confirmación final.
2. Por lotes: copia `datos-reales-ejemplo.json`; reemplaza todos los campos por información que tengas autorización de compartir. Los distritos y categorías válidos están en `/api/config`. Ejecuta el importador sin `--commit` para validar. La escritura usa una transacción; cualquier error cancela el lote. No se cambia el estado a Resuelto mediante importación.
3. Las fotos pasan por `/api/uploads` autenticado: JPG/PNG/WebP hasta 5 MB, límite de píxeles, reencodificación WebP y eliminación de metadatos. Para lotes con fotos, primero carga cada imagen con una cuenta y usa la URL devuelta. No se admiten URL externas arbitrarias.

La importación no evita automáticamente duplicados semánticos; revisa el lote antes. Los duplicados del formulario usan categoría, distrito y distancia aproximada de 700 m. No afirman equivalencia real.

## Hosting sencillo

Usa un servidor Docker o alojamiento Node con **un proceso y disco persistente**, no hosting puramente estático ni funciones efímeras. Incluidos Dockerfile y Compose. El comando de construcción es `npm ci && npm run build`; el de inicio, `npm start`. Puerto de escucha configurable.

Variables de producción:

```dotenv
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
APP_ORIGIN=https://tu-dominio.pe
DATA_DIR=/ruta/persistente/ciudad
DEMO_MODE=false
LLM_PROVIDER=groq
LLM_MODEL=openai/gpt-oss-20b
LLM_API_KEY=clave_en_el_gestor_de_secretos_del_host
```

En Docker, `DATA_DIR` se fija a `/app/data` y se monta el volumen `ciudad_data`. Coloca un proxy HTTPS delante del puerto local 3000. `NODE_ENV=production` activa cookies Secure: abrir por HTTP en ese modo impedirá el inicio de sesión; usa HTTPS. No publiques el archivo `.env` ni la base de datos. El servidor aplica comprobación de Origin y cabecera de petición en cambios, rate limit, sesiones HttpOnly, validación y consultas parametrizadas. Si el host exige `trust proxy`, configura únicamente los saltos/proxies conocidos; no activar confianza global sin revisión.

La aplicación usa polling cada 12 segundos en vez de SSE para simplificar reconexión y despliegue. Si la red cae, el siguiente ciclo reintenta. Las acciones no se confirman como exitosas hasta recibir respuesta. Reintentos de publicación con la misma clave no duplican incidencias.

## Copia y restauración

`node --env-file-if-exists=.env scripts/backup.js ruta-de-copia` crea snapshot SQLite y copia fotos. Haz la copia durante una ventana sin cargas de fotos si necesitas consistencia exacta entre archivos y BD. Para restaurar: detén el servidor, conserva el directorio actual y copia `ciudad.sqlite` y `uploads` de la copia al nuevo `DATA_DIR`. No mezcles archivos WAL antiguos. Prueba `/api/health` y un reporte después de restaurar.

## PWA y conectividad

Manifest, iconos 192/512 y service worker precargan recursos estáticos. No se cachean endpoints de sesión, API ni fotos privadas. La lista pública consultada se conserva localmente para lectura básica. Los borradores se separan por usuario; evita incluir información sensible en dispositivos compartidos. Al recargar completamente sin red, solo se recupera vista pública: la sesión debe validarse al volver la conexión. En una sesión ya abierta se puede escribir un borrador offline y publicar manualmente cuando vuelva la red. No hay sincronización avanzada en segundo plano.

La instalación depende del navegador: botón Instalar cuando dispara `beforeinstallprompt`; en iOS se usa Compartir > Añadir a pantalla de inicio. La instalación nativa y el micrófono deben validarse físicamente en el equipo de sustentación.
