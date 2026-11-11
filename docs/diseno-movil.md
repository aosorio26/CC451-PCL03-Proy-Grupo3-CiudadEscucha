# Edición móvil de Ciudad Escucha

El cambio se concentra en presentación y navegación. Se conservan el backend, la persistencia, las confirmaciones, los permisos por rol, la colaboración, los mapas, Rescue Rabbit, el asistente LLM, la voz y las preferencias de accesibilidad.

## Diseño

- Paleta verde petróleo, menta y durazno; superficies suaves, tipografía legible y tarjetas con jerarquía clara.
- Barra inferior de cinco destinos con acción central para reportar; menú secundario con las opciones autorizadas para cada usuario.
- Inicio con accesos a conversación y mapa, categorías, actividad real y comunidad.
- Plantillas originales reutilizables: encabezado, tarjeta de acción y hoja modal. No se copió una plantilla comercial.
- Filtros e instrucciones de instalación en diálogos nativos con Escape y gestión de foco. Menú modal normal y recorrido guiado conservado.
- Adaptación a 320 px, áreas seguras del teléfono, temas oscuro y alto contraste, texto ampliable y movimiento reducido heredado.

## Integración con el teléfono

- PWA con manifest, service worker y accesos rápidos a reportar, mapa y asistente.
- Centro «App y dispositivo» con instalación cuando el navegador la permite e instrucciones alternativas.
- Selector de cámara trasera mediante `capture="environment"` y galería en el formulario existente. El navegador decide la interfaz disponible.
- GPS voluntario, dictado y síntesis según soporte, compartir incidencias y borradores locales existentes.
- Sin conexión se conserva el alcance offline documentado. No se promete publicación automática ni notificaciones push con la app cerrada.

## Verificación y límites

Se conservan las once pruebas de servidor/contrato y se añaden comprobaciones de menú, filtros, instalación y manifest a las pruebas de navegador. Las capturas 09, 10 y 11 muestran la interfaz real en un viewport móvil.

La emulación de tamaño en Edge no sustituye ensayos físicos en Android/iPhone. Siguen pendientes la clave y ensayo del proveedor LLM, micrófono/voz física, instalación física y despliegue remoto. Las instrucciones para datos reales y despliegue permanecen en el README y la documentación. El rediseño no convierte esos pendientes en funcionalidades verificadas.
