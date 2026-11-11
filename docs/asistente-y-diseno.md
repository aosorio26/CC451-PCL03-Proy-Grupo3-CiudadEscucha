**Actualización:** la configuración de proveedores de este documento fue sustituida por [verificacion-final.md](verificacion-final.md): Rabbit 1 usa OpenAI y Rabbit 2 Gemini, con dos claves independientes.

# Asistente integrado e identidad visual

## Lo que cambió

- Logo y escena del parque suministrados por el usuario. Identidad azul y verde, tarjetas claras y navegación móvil. Las referencias a PC3, evaluación y equipo de demostración salen de la interfaz. Los registros ficticios conservan «Ejemplo» para no presentarlos como denuncias reales.
- Chat con borrador visible: el asistente transforma el relato en campos estructurados, pregunta solo lo que falta, conserva el contexto de la conversación y aplica correcciones. Se puede editar todo el formulario o marcar la revisión y confirmar desde la tarjeta.
- El backend valida el borrador. La IA no recibe herramientas de escritura. El usuario confirma; el servidor guarda el reporte y evita duplicados al reintentar la misma confirmación.
- El modo solo voz usa exactamente el mismo motor de conversación y proveedor que el chat, no el antiguo cuestionario determinista. Confirmar/cancelar/detener/repetir son controles locales de seguridad. Las consultas de reportes las ejecuta el servidor a partir de filtros estructurados, nunca de SQL generado.
- Introducción corta: «Diga: crear reporte, modificar reporte o consultar reporte». Las preguntas no mencionan longitudes de caracteres. Se puede pedir «leer borrador» y después «confirmar reporte».
- Micrófono principal: pulsa el icono de micrófono, di «Modo Solo Voz» y espera la transición. El modo pregunta verbalmente si autorizas enviar la conversación al proveedor. El permiso inicial del navegador sigue siendo necesario.
- Dictado manual: escucha continua, conserva todos los segmentos y permite terminar con un botón. El modo manos libres espera 3, 5 u 8 segundos de silencio (5 por defecto); los turnos admiten hasta dos minutos y se reanudan si el navegador corta una sesión. No se escucha mientras la app lee la respuesta.
- Mapa y GPS: consultan dirección y distrito, con comprobación de respuestas atrasadas para no sobrescribir una elección más reciente o una edición manual. Si la consulta falla se conservan las coordenadas y se pide completar la referencia y el distrito.

## Activar y verificar el proveedor

La copia de trabajo revisada tenía `LLM_PROVIDER=none` y no tenía clave. Por tanto, no era posible generar respuestas reales de IA. El paquete mantiene fuera los secretos.

1. Ejecuta `powershell -ExecutionPolicy Bypass -File .\Configurar-IA.ps1 -Proveedor openai` o cambia el proveedor a `gemini`.
2. Introduce tu clave en el prompt oculto. Se guarda únicamente en `.env` local. No lo publiques.
3. Reinicia el servidor y ejecuta `node --env-file-if-exists=.env scripts/verificar-ia.mjs` para probar una solicitud real. Esa llamada utiliza tu cuota del proveedor.
4. En el chat, autoriza el envío de texto y cuenta el problema con ubicación. Revisa la tarjeta antes de confirmar.

Modelos previstos: Groq `openai/gpt-oss-20b` y Gemini `gemini-3.5-flash-lite`, intercambiables mediante `LLM_MODEL`. Consulta la [documentación de Groq](https://console.groq.com/docs/tool-use/overview) y [Gemini](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite). No se afirma cuota gratuita ni disponibilidad para una cuenta concreta.

## Verificación

- 17 pruebas Node: API, aislamiento, privacidad de avatar, proveedor simulado, validación y persistencia del borrador, confirmación idempotente, geocodificación y acumulación/reinicio del dictado.
- 11 pruebas en Edge (instancia de pruebas con `API_RATE_LIMIT=1200` para soportar las sesiones simultáneas; el valor normal sigue en 240 por minuto): regresión de colaboración/roles, avatar, tarjetas del chat y persistencia real con respuesta IA simulada, mapa con respuesta geográfica simulada, comando del menú y conversación de voz con audio/IA simulados, accesibilidad del inicio y tamaño móvil.
- Geocodificación externa comprobada en Miraflores: devolvió «Virgen Milagrosa» y distrito «Miraflores» para un punto de prueba público.
- Capturas de navegador en `docs/capturas`; `16-chat-borrador.png` utiliza una respuesta IA simulada explícitamente durante la prueba. No acredita una conexión real al proveedor.

Falta probar con una clave válida y micrófono físico. La precisión de voz, la lectura audible y los permisos varían por dispositivo/navegador. La [API de reconocimiento](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) no garantiza funcionamiento offline. La geocodificación usa [Nominatim](https://operations.osmfoundation.org/policies/nominatim/) con caché y limitación global por instancia; se puede cambiar el proveedor en `.env`. El servicio devuelve referencias de OpenStreetMap, que deben poder corregirse.

Los perfiles, avatares, amistades, niveles, roles, borradores manuales y confirmaciones existentes se conservan. «Modificar reporte» en el asistente se refiere al borrador en preparación; cambiar el estado de una incidencia publicada sigue requiriendo un operador autorizado.
