# Ciudad Escucha

PWA cívica para Lima Metropolitana. Avance PC3 de CC451, 10 de noviembre de 2026. Código original basado en los requisitos de Ciudad Escucha PC2 y los patrones funcionales de ReportaTuCalle, sin copiar su implementación.

## Entrega final: Rescue Rabbit 1 y Rescue Rabbit 2

- **Rescue Rabbit 1:** conejo original, conexión OpenAI (`gpt-5-mini`).
- **Rescue Rabbit 2:** conejo de casco naranja, conexión Gemini (`gemini-3.5-flash-lite`).
- En la aplicación se muestran únicamente los nombres e imágenes de las mascotas. «Cambiar mascota» guarda la elección de cada usuario y cambia automáticamente la conexión del chat y la voz. La mascota permanece visible en ambas pantallas y en «¿Te ayudo?».
- El perfil guarda emoción declarada, ritmo, preferencias y aprendizaje de uso. Se puede desactivar la adaptación y borrar sus contadores desde Ajustes.

### Solo debes ingresar las dos claves

Copia `.env.example` a `.env` si aún no existe y completa `OPENAI_API_KEY` y `GEMINI_API_KEY`. Los modelos y la selección ya están implementados. Alternativa: `powershell -ExecutionPolicy Bypass -File .\Configurar-IA.ps1`, que solicita ambas claves con entrada oculta. Reinicia el servidor una vez; después puedes cambiar de mascota sin editar archivos ni reiniciar.

No se reescribe un proveedor global en `.env` cada vez que alguien cambia de mascota: eso cambiaría la conexión de todos los usuarios. Las claves son globales del servidor y la selección es individual en SQLite. No se exponen claves ni nombres de modelos al navegador.

Lee [la verificación final de requisitos](docs/verificacion-final.md) y [las cuentas para pruebas](docs/cuentas-prueba.md). El ZIP no contiene claves ni la base local de pruebas.

## Versión de identidad visual y asistente integrado

El inicio utiliza el logo y el parque proporcionados por Arturo. El chat entrega una tarjeta con el borrador y permite editarla o confirmar su publicación en la base de datos. El modo de voz utiliza el mismo asistente IA, con instrucciones breves y escucha continua. El micrófono de la cabecera reconoce «Modo Solo Voz». Elegir un punto del mapa completa dirección y distrito mediante OpenStreetMap cuando hay información disponible.

**Para activar la IA:** esta entrega no contiene una clave. Ejecuta `powershell -ExecutionPolicy Bypass -File .\Configurar-IA.ps1 -Proveedor ambos` (o una sola mascota con `openai` o `gemini`), introduce tu clave en la entrada oculta y reinicia `npm start`. Puedes verificar el proveedor con `node --env-file-if-exists=.env scripts/verificar-ia.mjs`. No compartas `.env`. Sin configurar el proveedor, el chat y la voz indican que el asistente no está disponible; no simulan inteligencia artificial.

Consulta [flujo actual, pruebas y límites](docs/asistente-y-diseno.md).

## Ampliación de accesibilidad y roles · 11 de noviembre

- `/voz`: creación, corrección, revisión y confirmación verbal; consultas por distrito, propios/resueltos y por nombre de vecino.
- `/rapido`: propuesta IA y edición completa sin recorrer cuatro pasos. Conserva el formulario guiado.
- Operador/administrador: entrada directa a gestión y navegación por tareas.
- Amigos aceptados con enlaces a perfiles y publicaciones; cinco niveles con progreso.
- Ilustración original de barrio; Rescue Rabbit permanece en el asistente.

**Cuenta nueva:** `elena@demo.local`, contraseña `CiudadDemo2026!`, ciudadana con modo voz y alto contraste. Ejecuta `npm run seed` para añadirla sin borrar los datos existentes.

Consulta [comandos de voz, pruebas y límites](docs/ampliacion-accesible.md).

## Avatar y más cuentas de prueba

En Perfil puedes subir, reemplazar o quitar tu avatar (JPG, PNG o WebP, hasta 5 MB). Se recorta al centro a 512 × 512 y se eliminan metadatos.

Hay **13 cuentas demo** y 16 reportes adicionales con estados variados. Ejecuta `npm run seed` para añadirlas sin borrar datos previos. Todas usan `CiudadDemo2026!`. Consulta [cuentas y escenarios](docs/cuentas-prueba.md).

## Ejecutar en Windows

Esta edición incorpora el rediseño móvil: navegación inferior, tarjetas táctiles, menú accesible, filtros en una hoja modal, cámara y centro de instalación. Conserva los flujos y permisos PC3. Consulta [el detalle del rediseño](docs/diseno-movil.md) y [el estado verificable y pendientes](docs/estado-avance.md).

Requisito: Node.js 24 LTS o posterior. Descomprime el proyecto y abre PowerShell en esta carpeta:

```powershell
npm ci
Copy-Item .env.example .env
npm run seed
npm run build
npm start
```

Abre **http://localhost:3000**. Alternativa: `powershell -ExecutionPolicy Bypass -File .\Iniciar.ps1`. El script usa la política únicamente para ese proceso; no cambia la configuración del equipo. No abras `index.html` directamente. Mantén la terminal abierta. Ctrl+C detiene el servidor. Los datos permanecen en `data/ciudad.sqlite` y las fotos en `data/uploads`.

En desarrollo: `npm run server` y, en otra terminal, `npm run dev` (puerto 5173). La entrega precompilada está en `dist/`; después de instalar dependencias también puedes ejecutar directamente `npm start`.

## Cuentas de evaluación

Solo si ejecutaste el seed con `DEMO_MODE=true`. Contraseña común **CiudadDemo2026!**:

| Cuenta            | Rol                | Funciones                                                 |
| ----------------- | ------------------ | --------------------------------------------------------- |
| lucia@demo.local  | Ciudadana          | Reportar, comentar, apoyar a otros, seguir y personalizar |
| julio@demo.local  | Ciudadano          | Cuenta independiente para colaboración                    |
| karina@demo.local | Operadora demo     | Lo anterior, estados, asignación, resumen, moderación     |
| admin@demo.local  | Administrador demo | Lo anterior y administración de roles                     |

El registro público siempre crea ciudadanos. No hay selector que suplante sesiones. Las contraseñas se guardan con scrypt y salt; la cookie es HttpOnly y el servidor almacena solo su hash. Los roles se consultan desde BD en cada solicitud.

## IA real

En `.env`, configura una de estas opciones. **No uses prefijos VITE para secretos.**

```dotenv
LLM_PROVIDER=groq
LLM_MODEL=openai/gpt-oss-20b
LLM_API_KEY=tu_clave_privada
```

Alternativa: `LLM_PROVIDER=gemini`, `LLM_MODEL=gemini-3.5-flash-lite` y una clave de Google AI Studio. Reinicia el servidor. Recomendación inicial: Groq GPT OSS 20B para texto breve; Gemini Flash-Lite como proveedor alternativo. Es una elección de ingeniería para este flujo, no un benchmark comparativo. Modelos y disponibilidad se deben confirmar en tu cuenta. Fuentes consultadas: [modelos Groq](https://console.groq.com/docs/models), [modelos Gemini](https://ai.google.dev/gemini-api/docs/models), [compatibilidad Gemini](https://ai.google.dev/gemini-api/docs/openai).

El adaptador `AssistantProvider` está en `server/assistant.js`. Hay timeout de 18 s y un reintento solo por 429/5xx. Se limita el contexto, valida JSON y separa sugerencias de acciones autenticadas. El modelo no escribe en BD. El borrador conversacional se prepara y se publica mediante endpoints separados, con confirmación e idempotencia. La app pide consentimiento antes de enviar texto al proveedor. Sin clave se indica claramente que el LLM no está disponible; la guía local no se presenta como IA.

**No se ha ejecutado una llamada real a estos proveedores: no se proporcionó una clave.** Configurar y demostrar esa llamada es un pendiente obligatorio de la PC3. El dictado usa Web Speech, no el LLM. El navegador puede enviar audio a su proveedor de reconocimiento; se activa solo al pulsar. Se conserva texto editable antes de enviar. STT depende del navegador, permisos y red; TTS depende de voces instaladas. Texto funciona como alternativa.

## Datos reales y despliegue

Lee [guía de datos y despliegue](docs/despliegue.md). El proyecto admite reportes manuales con foto real y carga JSON validada. El seed es opcional, idempotente y nunca corre al iniciar el servidor. Producción debe usar una base nueva sin cuentas demo, HTTPS, almacenamiento persistente y copias de seguridad.

```powershell
node --env-file-if-exists=.env scripts/import-reports.js docs/datos-reales-ejemplo.json responsable@dominio.pe
# Solo después de reemplazar y revisar los datos:
node --env-file-if-exists=.env scripts/import-reports.js mis-datos.json responsable@dominio.pe --commit
```

## Verificar

```powershell
npm test
# Con el servidor de demostración en marcha y Microsoft Edge instalado:
npm run test:e2e
```

Los tests API usan una base temporal independiente. Las pruebas E2E crean reportes de prueba en la base demo del servidor en puerto 3000: nunca ejecutarlas contra producción. Evidencia y resultados: [avance](docs/avance-PC3.md), [estado y limitaciones](docs/estado-avance.md), [guion](docs/demo-PC3.md), [arquitectura](docs/arquitectura.md).

## Estructura

- `src/`: React, vistas de reportes, mapa, conversación, cuentas y accesibilidad.
- `server/`: autenticación, esquema/migración SQLite, dominio, reportes y puerto LLM.
- `scripts/`: importación, administración local y copias.
- `tests/`: integración API y recorridos de navegador.
- `public/`: mascota original, iconos y recursos.
- `docs/`: trazabilidad, evidencia, arquitectura, instalación y exposición.

SQLite permite un despliegue único sencillo. No está planteado para múltiples réplicas ni cargas municipales masivas; para esa fase se debe migrar a PostgreSQL/PostGIS. `node:sqlite` muestra un aviso de API experimental en Node 24; el lockfile y las pruebas delimitan la versión validada.

## Entrega académica y licencias

Licencia MIT para código original. La imagen suministrada por el usuario no tiene una licencia independiente acreditada: se conserva como recurso de evaluación, no se atribuyen derechos de redistribución comercial. Ver `THIRD_PARTY_NOTICES.md`.

La rúbrica contiene dos nombres de ZIP: `CC451-PC03-Proy-...` y `CC451-PCL03-Proy-...`. Se entrega un ZIP de trabajo; confirmar con el docente cuál usar antes de subirlo. La fecha de entrega indicada es **miércoles 11 de noviembre de 2026, 14:30, Lima**. El repositorio está listo para GitHub, pero no fue publicado. El video debe grabarlo el equipo. El documento de aporte se incluye en .doc y .docx, convertido y revisado con Word. Es una declaración para completar y revisar; no atribuye trabajo a compañeros.
