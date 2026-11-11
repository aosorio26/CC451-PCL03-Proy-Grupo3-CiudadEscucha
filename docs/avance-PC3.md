# Reporte del avance PC3 de Ciudad Escucha

Curso CC451 Interacción Humano Computador. Fecha: 10 de noviembre de 2026, Lima.

## Introducción y alcance

Ciudad Escucha ayuda a ciudadanos de Lima a registrar incidencias y colaborar con vecinos. La PC2 definió una interacción híbrida; PC3 sustituye las simulaciones de sesión local por una aplicación con API y base de datos persistente. El operador continúa siendo de demostración, sin convenio municipal acreditado.

El inventario de pantallas y módulos, con porcentajes calculados y límites, está en `estado-avance.md`. Implementación no significa validación externa: la llamada LLM con clave real, la voz física, la instalación en un móvil y la publicación GitHub requieren evidencia adicional. No se afirma que la totalidad de capacidades obligatorias ya haya sido demostrada.

## Continuidad y trazabilidad

Las historias, criterios originales y requisitos RF-01 a RF-23, RNF-01 a RNF-11 se conservan en `requisitos-PC2.md`. La siguiente matriz enlaza cada HU con las funciones actuales. Los números separados por coma llevan el mismo prefijo indicado en la columna.

| HU    | RF       | RNF       | Pantalla o módulo          | Estado real   | Evidencia                                                   |
| ----- | -------- | --------- | -------------------------- | ------------- | ----------------------------------------------------------- |
| HU-01 | RF-01    | RNF-04,09 | Nuevo reporte              | FUNCIONAL PC3 | Formulario de 4 pasos; API y E2E                            |
| HU-02 | RF-02,21 | RNF-01,03 | Voz / formulario           | PARCIAL       | Web Speech implementada; dictado físico pendiente           |
| HU-03 | RF-03,21 | RNF-05    | Foto opcional              | FUNCIONAL PC3 | sharp valida, reencodifica y persiste; prueba API de imagen |
| HU-04 | RF-04    | RNF-04,11 | Ubicación                  | FUNCIONAL PC3 | Distrito/referencia sin GPS; mapa y coordenadas             |
| HU-05 | RF-05    | RNF-06,08 | Asistente IA               | PARCIAL       | Adaptadores reales; falta credencial y llamada remota       |
| HU-06 | RF-06    | RNF-04    | Revisión                   | FUNCIONAL PC3 | Duplicados por categoría/distrito/distancia, test API       |
| HU-07 | RF-07    | RNF-05    | Confirmación               | FUNCIONAL PC3 | API rechaza confirmed ausente; UI bloquea publicar          |
| HU-08 | RF-08    | RNF-01,03 | Mapa/lista                 | FUNCIONAL PC3 | Leaflet, clusters, burbujas y heatmap dinámico              |
| HU-09 | RF-09    | RNF-03    | Detalle                    | FUNCIONAL PC3 | Historial persistente, fecha y estado textual               |
| HU-10 | RF-10    | RNF-09    | Apoyos                     | FUNCIONAL PC3 | Clave única y autoapoyo rechazado; API/E2E                  |
| HU-11 | RF-11    | RNF-09    | Comentarios                | FUNCIONAL PC3 | Edición propia, eliminación, denuncia; API/E2E              |
| HU-12 | RF-12,22 | RNF-03,09 | Panel operador             | FUNCIONAL PC3 | Roles, confirmación, nota y avisos; API/E2E                 |
| HU-13 | RF-13    | RNF-01,11 | Ayuda contextual           | FUNCIONAL PC3 | Mascota ocultable y guía local de borrador                  |
| HU-14 | RF-14,23 | RNF-01,02 | Preferencias               | FUNCIONAL PC3 | Persistencia por perfil y vista previa                      |
| HU-15 | RF-15    | RNF-10    | Personalización ética      | PARCIAL       | Preferencias explícitas; sugerir ajustes por errores es P1  |
| HU-16 | RF-16    | RNF-07,09 | Roles                      | FUNCIONAL PC3 | Ciudadano, operador, administrador sin suplantación         |
| HU-17 | RF-17    | RNF-11    | Compartir                  | FUNCIONAL PC3 | Web Share o portapapeles con captura de error               |
| HU-18 | RF-18    | RNF-03,06 | Notificaciones / asistente | FUNCIONAL PC3 | Avisos por eventos reales; consulta estado y TTS            |
| HU-19 | RF-19    | RNF-09    | Resumen operador           | FUNCIONAL PC3 | SQL agregado por distrito y estado                          |
| HU-20 | RF-20    | RNF-01,11 | Mis reportes               | FUNCIONAL PC3 | Lista propia y seguida; filtros comunes                     |

## Arquitectura e implementación

React 18, Vite y Leaflet en navegador; Express sobre Node 24, SQLite WAL y fotos persistentes en servidor. Sesiones con cookie HttpOnly y token aleatorio cuyo hash se persiste. Contraseñas scrypt con salt. Validación Zod, consultas parametrizadas, transacciones en publicaciones/eventos, roles consultados en servidor y protección de origen. Las pruebas cubren intentos de saltar la confirmación y elevar privilegios.

El puerto `AssistantProvider` permite cambiar Groq por Gemini sin alterar formularios. El modelo solo sugiere texto y campos, y no dispone de escritura en BD. Una confirmación autenticada independiente publica un borrador con clave idempotente. El sistema presenta indisponibilidad real cuando falta API, evitando respuestas ficticias. La voz usa Web Speech con permiso voluntario, texto editable, reproducción y detener.

C4 Contexto y Contenedores se incluyen en `arquitectura.md`. La API se describe en `api.md`. La auditoría de insumos y cambios tecnológicos está en `auditoria.md`.

## Seis principios VUI

1. Personalidad: Rescue Rabbit usa lenguaje breve y respetuoso, con selección de tono explícita.
2. Revelación progresiva: guía local pide descripción y después referencia; el formulario organiza cuatro pasos.
3. Confirmación inteligente: publicación y cambios de operador requieren revisión; apoyar es reversible.
4. Prevención: límites de campos en cliente y servidor, categorías cerradas, coordenadas de Lima y consulta de duplicados.
5. Memoria controlada: preferencias declaradas y conversación solo con opción de guardar; exportar y borrar desde Ajustes.
6. Multimodalidad: dictado editable, teclado, foto opcional, mapa y lista. No depende de voz o GPS.

La guía local no es un LLM y se etiqueta como tal. Las órdenes libres de apoyo por voz y el reconocimiento remoto propio no se incluyen en este alcance.

## Accesibilidad y diseño emocional

Se utilizan landmarks, enlaces de salto, etiquetas, estados textuales, foco visible, controles de al menos 44 px salvo controles cartográficos de terceros, alternativa lista, tipografía 100–180%, alto contraste, tema claro/oscuro/automático y reducción de movimiento. El audit axe se ejecuta sobre Inicio y se documenta sin extrapolar conformidad total. Falta validación completa con lector de pantalla y personas usuarias.

Visceral: diseño verde petróleo, superficies claras y mascota original. Conductual: flujo corto, borradores, errores recuperables y confirmación. Reflexivo: historial compartido, apoyos y reconocimientos derivados de registros. Los puntos no representan beneficios municipales y no prueban identidad única de una persona; no existe verificación de ciudadanía.

## Verificación y evidencia

`tests/api.test.js` comprueba sesiones, permisos, confirmación, idempotencia, apoyos, comentarios, moderación, estados, notificaciones, relaciones, privacidad y preferencias. `tests/e2e/app.spec.js` utiliza contextos de navegador separados para Lucía, Julio y Karina, además de mapa, móvil y borrador offline. Los resultados finales están en `estado-avance.md` y `pruebas-e2e.json`. Las capturas corresponden a ejecución real.

No se realizaron entrevistas ni ensayos de satisfacción, eficiencia o efectividad con voluntarios. Las metas de PC2 (80% de éxito, menos de dos minutos, satisfacción de cuatro estrellas) siguen siendo metas, no resultados. No se atribuye un porcentaje de usabilidad a pruebas automatizadas.

## Límites y siguiente iteración

Configurar y probar el LLM real, validar voz e instalación física, documentar aceptación con usuarios y publicar el repositorio. P1: recuperación de contraseña por correo, bloqueo individual, moderación avanzada, ranking, salas, verificación anti-Sybil, PostGIS, SSE y sincronización offline completa. No hay integración oficial con municipalidades. El video y las declaraciones personales deben revisarlos y grabarlos los integrantes.
