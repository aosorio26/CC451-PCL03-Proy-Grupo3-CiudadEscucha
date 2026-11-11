# Estado verificable del avance PC3

Verificación más reciente: `verificacion-final.md` (mascotas y personalización continua).

Fecha de corte: 10 de noviembre de 2026, Lima. Los porcentajes describen el inventario implementado en este paquete, no una nota ni una certificación. Una pantalla funcional puede pertenecer a un módulo con validación externa pendiente.

## Pantallas

Se cuentan 18 rutas con propósito propio; no se cuentan modales, temas ni pasos como pantallas adicionales.

| Pantalla           | Ruta             | Estado                                                       |
| ------------------ | ---------------- | ------------------------------------------------------------ |
| Inicio de sesión   | /login           | FUNCIONAL PC3                                                |
| Registro           | /registro        | FUNCIONAL PC3                                                |
| Bienvenida         | /bienvenida      | FUNCIONAL PC3                                                |
| Inicio y actividad | /                | FUNCIONAL PC3                                                |
| Mapa y lista       | /mapa            | FUNCIONAL PC3                                                |
| Nuevo reporte      | /reportar        | FUNCIONAL PC3                                                |
| Detalle            | /incidencias/:id | FUNCIONAL PC3                                                |
| Conversación y VUI | /asistente       | PARCIAL: guía y acciones reales, falta ensayo LLM/voz física |
| Comunidad          | /comunidad       | FUNCIONAL PC3                                                |
| Perfil propio      | /perfil          | FUNCIONAL PC3                                                |
| Perfil vecino      | /vecinos/:id     | FUNCIONAL PC3                                                |
| Mis reportes       | /mis-reportes    | FUNCIONAL PC3                                                |
| Preferencias       | /ajustes         | FUNCIONAL PC3                                                |
| Gestión por rol    | /operador        | FUNCIONAL PC3                                                |
| Notificaciones     | /notificaciones  | FUNCIONAL PC3                                                |
| App y dispositivo | /dispositivo | FUNCIONAL PC3: guía y detección; instalación física pendiente |

**15 / 18 × 100 = 83,3% de pantallas funcionales en el alcance PC3.** La vista de administrador es una sección autorizada del panel, no una pantalla contada por separado.

Las nuevas rutas `/voz` y `/rapido` se registran como PARCIALES en la validación integral: los flujos automáticos pasan, pero faltan audio físico y proveedor LLM real. El aumento del inventario no implica pérdida de funciones anteriores. Véase `ampliacion-accesible.md`.

## Módulos

| Módulo                 | Estado        | Evidencia o límite                                                                       |
| ---------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| Autenticación y roles  | FUNCIONAL PC3 | Registro, login, logout, cookies y autorización probados; correo de recuperación P1      |
| Usuarios y perfiles    | FUNCIONAL PC3 | Perfil propio/público, alias y biografía; API y navegador                                |
| Preferencias           | FUNCIONAL PC3 | BD, temas, contraste, tamaño, memoria y exportación                                      |
| Reportes e historial   | FUNCIONAL PC3 | Confirmación, idempotencia y estados transaccionales                                     |
| Categorías             | FUNCIONAL PC3 | 12 categorías validadas por servidor                                                     |
| Ubicación y mapas      | FUNCIONAL PC3 | 43 distritos, manual/mapa/GPS opcional, clusters, burbujas, calor/lista                  |
| Apoyos                 | FUNCIONAL PC3 | Unicidad, retirada, no autoapoyo, notificación                                           |
| Comentarios            | FUNCIONAL PC3 | Crear, editar, borrar propio, denunciar                                                  |
| Relaciones vecinales   | FUNCIONAL PC3 | Follow unilateral, amistad con aceptación                                                |
| Notificaciones         | FUNCIONAL PC3 | Eventos persistentes, leído/no leído y polling                                           |
| Gamificación           | PARCIAL       | Puntos derivados e insignias; no verificación anti-multicuenta                           |
| Asistente LLM          | PARCIAL       | Adaptadores y contrato probado con transporte simulado; falta clave real                 |
| Voz                    | PARCIAL       | Web Speech real en código; falta reconocimiento y TTS físicos                            |
| Onboarding             | FUNCIONAL PC3 | Recorrido omisible y persistente, ayuda por navegación                                   |
| Moderación básica      | FUNCIONAL PC3 | Denuncia y ocultación autorizada probadas                                                |
| Analítica básica       | FUNCIONAL PC3 | Conteos reales por distrito/estado y asignación                                          |
| PWA y offline          | PARCIAL       | Build, manifest, SW y borrador offline probados; instalación física pendiente            |
| Operación y despliegue | PARCIAL       | Arranque Node local probado, importador y Docker entregados; hosting remoto no ejecutado |

**13 / 18 × 100 = 72,2% de módulos funcionales dentro del inventario PC3; 5 parciales.** Las capacidades obligatorias LLM/voz/PWA requieren completar las verificaciones señaladas antes de afirmar cumplimiento integral de la rúbrica. Los módulos P1 adicionales no se presentan como implementados.

La revisión actual del asistente y la identidad visual se describe en `asistente-y-diseno.md`. El modo de voz anterior por comandos fijos fue sustituido por conversación con LLM; únicamente confirmar, cancelar, repetir y detener son controles locales.

## Pruebas ejecutadas

- `npm run build`: compilación de producción y service worker correctos; precache de 19 entradas, aproximadamente 1,68 MiB.
- `npm test`: 19 pruebas aprobadas. Incluyen 10 de integración API y una de contrato LLM con transporte explícitamente simulado. La prueba de foto genera una imagen, carga, verifica WebP persistente y rechaza contenido ajeno.
- Playwright en Microsoft Edge: 12 pruebas aprobadas, con contextos separados, registro, recorrido, comunidad, permisos y texto al 180%; resultados definitivos en `pruebas-e2e.json`.
- axe-core: análisis automatizado del Inicio con etiquetas WCAG 2 A/AA y 2.1 AA, sin violaciones tras corregir contraste. No es certificación WCAG 2.2 de toda la app.
- Móvil: anchuras 390 y 320 px sin desbordamiento horizontal del Inicio; controles grandes y navegación inferior.
- Importador JSON: validación sin escritura ejecutada con el archivo de ejemplo. Copia SQLite/fotos creada correctamente en un directorio de verificación.
- `npm audit --omit=dev`: cero vulnerabilidades reportadas tras actualizar dependencias. Esto no demuestra ausencia de toda vulnerabilidad.
- Cartografía OpenStreetMap: tras corregir la URL canónica y la política de referencia, se verificaron 10 de 10 teselas visibles cargadas; captura 02 actualizada. El aviso de carga/fallo y la lista permanecen como recuperación ante pérdida de red.
- El proveedor LLM remoto, micrófono físico, voces audibles, instalación como app, Docker en servidor y publicación GitHub **no** se probaron. No hubo estudio con usuarios ni lector de pantalla.

## Capturas genuinas

`01-inicio-desktop.png`, `02-mapa-calor.png`, `03-colaboracion.png`, `04-accesibilidad-oscuro.png`, `05-inicio-movil.png` y las capturas adicionales generadas por el test de pantallas están en `capturas/`. Incluyen datos del seed y registros creados durante la prueba; no son imágenes generadas ni prototipos dibujados.

## Pendientes P1 y límites concretos

- Recuperación por correo, bloqueo individual, respuestas anidadas, ranking avanzado, salas y notificaciones push.
- Herramientas libres por voz para apoyar/seguir, STT remoto propio y flujo conversacional de foto antes de revisión (la foto sí se admite en el formulario compartido).
- Moderación compleja, prevención de identidades múltiples, validación oficial de incidencias e integración municipal.
- Filtro de fecha final y radio configurable; actualmente fecha inicial y geografía/distrito.
- Sincronización offline avanzada: tras recarga completa sin red se muestra vista pública guardada, y se requiere conexión para revalidar sesión. Los borradores no se publican automáticamente.
- Recomendaciones de accesibilidad basadas en errores de uso; se respetan preferencias explícitas sin inferencias emocionales.
- Puntos de resolución corresponden a estados registrados por operador demo, no a verificación gubernamental.
- SQLite/volumen para un único servidor; no escalar horizontalmente con múltiples copias independientes de la BD.

## Entrega que debe completar el equipo

Configurar clave LLM y ensayar, validar voz e instalación física, revisar aporte personal, grabar exposición, publicar GitHub y confirmar el nombre final del ZIP. El código y la documentación son publicables, pero no se inventa una URL de repositorio ni un despliegue realizado.

