# Requisitos originales preservados de PC2

Transcripción del reporte PC2. Se preservan IDs y criterios; los estados se actualizan en avance-PC3.md.

4. Historias de usuario con criterios de aceptación

**HU-01:** Ciudadano Como ciudadano, quiero describir un problema rápidamente para dejar constancia del incidente Criterio de aceptación: Texto, categoría, ubicación y confirmación. En caso de retroceder, se conserva lo ingresado.

**HU-02:** Ciudadano con barreras (problemas) de escritura Como ciudadano con barreras de escritura, quiero poder dictar y corregir la transcripción para no depender del teclado Criterio de aceptación: Implementar dictado por voz y mostrar edición de texto, existe alternativa manual.

**HU-03:** Ciudadano Como ciudadano, quiero adjuntar una fotografía opcional para explicar mejor la incidencia Criterio de aceptación: Se puede omitir foto.

**HU-04:** Ciudadano sin GPS disponible Como ciudadano, quiero elegir distrito y una referencia manual para ubicar el problema Criterio de aceptación: Selector de distrito y referencia con API de mapa, no requiere GPS

**HU-05:** Ciudadano Como ciudadano, quiero que un asistente me sugiera categoría y texto para ahorrar esfuerzo Criterio de aceptación: Sugerencia implementada, como usuario puedo editar o rechazar

**HU-06:** Vecino Como vecino, quiero ver casos similares antes de crear otro para no duplicar reportes Criterio de aceptación: Permite ir a reporte existente y apoyarlo

**HU-07:** Ciudadano Como vecino, quiero revisar toda la información antes de compartirla para evitar errores Criterio de aceptación: Resumen previo y botón de edición, confirmación expresa a modo de pregunta.

**HU-08:** Vecino Como vecino, quiero encontrar incidencias en un mapa visual para saber dónde ayudar Criterio de aceptación: Burbujas según apoyo de vecinos, opción de lista textual

**HU-09:** Ciudadano Como ciudadano, quiero consultar el estado de mi reporte para conocer avances Criterio de aceptación: Estados textuales y fecha de actualización simulada

**HU-10:** Vecino Como vecino, quiero apoyar un problema existente para hacer visible su importancia Criterio de aceptación: Apoyo confirmado, el contador se actualizó y se previno la repetición

**HU-11:** Vecino Como vecino, quiero comentar una incidencia para aportar contexto útil Criterio de aceptación: Se añade comentarios de un vecino al reporte.

**HU-12:** Operador municipal Como operador municipal, quiero revisar y cambiar estados para ordenar la atención Criterio de aceptación: Listado con filtros y actualización de estado

**HU-13:** Persona con poca experiencia digital Como persona con poca experiencia digital, quiero recibir ayuda amigable para completar tareas Criterio de aceptación: asistente/agente de guía contextual, no bloquea el flujo y puede desactivarse cuando el usuario ya no lo necesite

**HU-14:** Persona con discapacidad visual parcial Como persona con discapacidad visual parcial, quiero configurar tamaño de texto, el contraste y zona de interés para poder utilizar la aplicación por mi cuenta Criterio de aceptación: Preferencias personalizables por usuario

**HU-15:** Usuario frecuente Como usuario frecuente, quiero que el sistema recuerde mis preferencias, por ejemplo a la hora de necesitar guia en algunas acciones y en otras no, sin invadir mi privacidad para tener mayor comodidad al usar la aplicación Criterio de aceptación: Diseño de personalización ética, sin inferir emociones sin permiso

**HU-16:** Equipo de ciudadanía y municipio Como miembro del equipo de ciudadanía y/o municipio, quiero diferenciar permisos y vistas para colaborar Criterio de aceptación: Modelos de tres vistas dependiendo el rol del usuario

**HU-17:** Vecino Como vecino, quiero compartir un reporte para que otros vecinos lo encuentren Criterio de aceptación: Acción copiar código/URL de referencia.

**HU-18:** Ciudadano Como ciudadano, quiero recibir avisos de progreso reales para conocer el estado del incidente que reporté. Criterio de aceptación: El asistente contextual de la aplicación comenta cambio de estado.

**HU-19:** Operador municipal Quiero un panorama agregado por distrito para priorizar la resolución de incidencias Criterio de aceptación: Implementación del módulo que muestre los datos resumidos de cada distrito.

**HU-20:** Ciudadano Quiero ver mis reportes y filtrar tipos para seguirlos fácilmente Criterio de aceptación: Lista con filtro por estado/categoría y botón de detalle 5. Requisitos funcionales y no funcionales ID Tipo Prioridad Descripción del requisito

**RF-01 ** FR Alta Crear un reporte urbano por texto en pasos guiados

**RF-02 ** FR Alta Dictado, transcripción y revisión del contenido por voz

**RF-03 ** FR Alta Asociar fotografía de evidencia opcional al reporte

**RF-04 ** FR Alta Indicar distrito y ubicación en mapa esquemático o por texto

**RF-05 ** FR Alta Sugerir categoría y resumen mediante asistente tipo LLM

**RF-06 ** FR Alta Revisar reportes posiblemente duplicados antes de publicar

**RF-07 ** FR Alta Exigir confirmación antes de publicar

**RF-08 ** FR Alta Mostrar incidencias en mapa vivo con burbujas por apoyo

**RF-09 ** FR Alta Consultar detalle y progreso de una incidencia

**RF-10 ** FR Alta El sistema debe permitir que los vecinos apoyen una incidencia que ya fue reportada.

**RF-11 ** FR Media Permitir comentarios de colaboración vecinal

**RF-12 ** FR Alta Permitir a operador consultar reportes y modificar estado

**RF-13 ** FR Alta El sistema debe mostrar ayuda al usuario según la pantalla o función que esté utilizando.

**RF-14 ** FR Alta Guardar preferencias de texto, contraste y notificaciones

**RF-15 ** FR Media Ajustar guía y mensajes a preferencias y errores

**RF-16 ** FR Alta Ofrecer funciones para perfiles ciudadano, vecino y operador

**RF-17 ** FR Media Compartir un enlace o código de reporte entre vecinos

**RF-18 ** FR Media Presentar seguimiento emocional centrado en el avance real

**RF-19 ** FR Media Crear resumen colectivo de incidencias por zona para operador

**RF-20 ** FR Alta Habilitar historial del ciudadano y filtros por categoría

**RF-21 ** FR Alta Ofrecer alternativas de entrada sin micrófono ni cámara

**RF-22 ** FR Alta Incluir ayuda y confirmación antes de cambios del operador

**RF-23 ** FR Media Permitir selección de zonas y temas favoritos

**RNF-01 ** NFR Alta Interfaz legible y navegación por teclado

**RNF-02 ** NFR Alta Alto contraste y ajuste de tamaño de tipografía

**RNF-03 ** NFR Alta Mensajes accesibles y sin depender solo del color

**RNF-04 ** NFR Alta Objetivo de reporte breve en menos de 5 pasos

**RNF-05 ** NFR Alta Minimizar datos personales

**RNF-06 ** NFR Alta No presentar sugerencia de IA como datos reales

**RNF-07 ** NFR Media PWA instalable con funcionamiento progresivo

**RNF-08 ** NFR Media Capa independiente para cambiar proveedor LLM

**RNF-09 ** NFR Alta Multiusuario real con autenticación y autorización por roles

**RNF-10 ** NFR Alta Evitar forzar cambios en las preferencias, preguntar antes

**RNF-11 ** NFR Alta Compatibilidad con portátil y teléfono
