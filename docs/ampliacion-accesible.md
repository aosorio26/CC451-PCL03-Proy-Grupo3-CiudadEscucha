# Documento histórico de la ampliación inicial

**Sustituido para el flujo de voz y chatbot por [asistente-y-diseno.md](asistente-y-diseno.md).** Las instrucciones de comandos fijos de abajo describen la versión anterior, no la actual.

# Ampliación accesible · 11 de noviembre de 2026

## Cuenta de evaluación

Ejecuta `npm run seed` con `DEMO_MODE=true`. Se añade Elena (`elena@demo.local`, `CiudadDemo2026!`) sin borrar las otras cuentas. Sigue siendo ciudadana: baja visión es una preferencia de accesibilidad, no un privilegio de seguridad. Su inicio abre `/voz`, con contraste alto y texto ampliado. Cualquier ciudadano puede activar ese inicio en Ajustes o en la pantalla de voz.

## Uso por voz

Tras iniciar sesión, pulsa Activar modo de voz y autoriza el micrófono. Esta activación y los permisos dependen del navegador: la web no puede saltarlos. Usa las ayudas de accesibilidad del dispositivo para iniciar sesión o activar ese control si necesitas hacerlo sin tacto.

Una vez activo, la aplicación lee, escucha y continúa sin botones:

- «Crear reporte»: solicita título, descripción, categoría y dirección; toma el distrito de preferencias y urgencia media, ambos leídos y editables antes de publicar.
- «Cambiar título», «cambiar descripción», «cambiar categoría», «cambiar distrito», «cambiar dirección», «cambiar urgencia», «cambiar latitud» o «cambiar longitud»: responde después con el nuevo valor.
- «Confirmar publicación»: solo funciona después de completar y escuchar la revisión. Conserva la clave de idempotencia ante reintentos de red.
- «Reportes del distrito Los Olivos», «reportes de mi distrito», «mis reportes» y «mis reportes resueltos» consultan el servidor.
- «Reportes de Lucía» consulta el perfil público de ese vecino. No evita su configuración de privacidad. Si el nombre no es único, informa de la ambigüedad.
- «Siguiente», «anterior» y «detalle» recorren y leen resultados.
- «Repetir», «ayuda», «cancelar» y «detener» permiten recuperar el flujo.

Los reportes de voz no requieren foto. Las coordenadas iniciales son aproximadas al distrito y se anuncian como tales; se pueden cambiar por voz. La cámara y fotos se gestionan desde el formulario visual. Cambiar de pantalla o esconder la app detiene el micrófono. Una pausa o error de permisos/red se anuncia; se limita la repetición ante silencio. El borrador de voz vive en la sesión de esa pantalla: no se promete recuperación tras cerrarla. Los borradores del formulario mantienen su guardado local.

El reconocimiento depende del navegador, la red y el dispositivo; no se promete voz offline. Consulta [SpeechRecognition en MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/start). La lectura utiliza volumen audible aunque la preferencia general estuviera silenciada, porque este modo depende de la voz.

## Creación rápida y edición

En `/rapido`, describe la incidencia y autoriza enviar el texto al proveedor LLM configurado. La propuesta abre todos los campos del formulario: título, descripción, categoría, distrito, referencia, coordenadas, urgencia, foto y texto alternativo. Nada se publica por recibir una respuesta de IA. Cambiar campos invalida la confirmación previa. La alternativa manual se identifica como manual y no simula IA.

El formulario original de cuatro pasos se conserva. La edición rápida modifica el borrador antes de publicar, no permite reescribir estados de gestión ni cambiar autoría de reportes existentes.

## Gestión y comunidad

El operador y administrador entran directamente a `/operador`; su barra inferior muestra Gestión, Mapa, Avisos y Perfil. Los filtros rápidos priorizan pendientes, urgencia alta y casos en atención. Gestionar lleva al editor de estado, conservando nota, responsable y confirmación.

Mis amigos muestra amistades aceptadas con acceso a perfiles y sus publicaciones, respetando privacidad. Los niveles son Primera voz (0), Vecino atento (50), Aliado del barrio (150), Impulsor comunitario (350) y Referente vecinal (700). Se muestra el progreso y los puntos restantes. El cálculo existente asigna 10 por reporte en atención/resuelto, 2 por apoyo y 5 adicionales por resuelto; cambiar de nivel no otorga permisos.

## Evidencia y pendientes

13 pruebas de Node: API, contrato LLM con transporte simulado y comandos de voz. 8 pruebas de navegador: regresión, entrada del operador, niveles/amigos, edición rápida y cadena escuchar-responder con APIs de audio simuladas. Las simulaciones comprueban el control del flujo; no evalúan precisión acústica ni sustituyen pruebas con personas con baja visión.

Pendientes externos: configurar la clave del proveedor, ensayar generación real, reconocimiento/lectura físicos, instalación en Android/iOS y despliegue. No se añadieron claves al paquete. La ilustración `public/barrio.svg` es original y no requiere un servicio externo; la mascota permanece en el asistente.
