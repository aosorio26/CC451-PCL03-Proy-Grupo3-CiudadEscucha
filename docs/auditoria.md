# Auditoría de los insumos

## PC3 y continuidad de PC2

Se leyeron la rúbrica PC3 y el reporte PC2 completo, sus HU y requisitos, README, prototipo híbrido y diagrama de contenedores. La rúbrica exige 70% de pantallas y módulos, voz, LLM intercambiable, PWA, personalización, colaboración, Norman, GitHub, C4, instalación, ejemplos y licencia. Ponderación: informe 7, funcionalidad 7, sustentación 4, calidad 2. La PC2 tiene cuatro integrantes y el video no debe superar 12 minutos; cada uno dispone de tres minutos. Para tres o menos, máximo nueve minutos.

La PC2 no incluye backend. Su README reconoce simulaciones. El HTML contiene incidencias embebidas, mapa esquemático y dictado preparado; dispone de TTS y preferencias locales. Tiene licencia MIT. Se conserva la alternativa híbrida conversación + mapa, los actores y la numeración de historias/requisitos, no el supuesto de que una sesión local equivale a colaboración.

## Stack real de ReportaTuCalle

`frontend/package.json`: React 18.3.1, Vite 8.0.16, plugin React 6.0.2, Tailwind 3.4.4, Leaflet 1.9.4, react-leaflet 4.2.1, markercluster, STOMP/SockJS. `backend/pom.xml`: Java 21, Spring Boot 3.5.14, Spring Security, JPA, PostgreSQL, PostGIS JDBC, Hibernate Spatial, Flyway, JWT y Cloudinary. No se toma como autoridad una versión discordante del README.

Se inspeccionaron SecurityConfig, ReportController, UserController y rutas/vistas. Roles reales CITIZEN, SUPERVISOR, ADMIN; autorización por anotaciones, actualización de estados/asignación, reportes cercanos, eliminación/edición, SSE ciudadano y servidor. Hay componentes de navegación duplicados y variantes ROLE_SUPERVISOR en frontend. No se verificó la ejecución de ese proyecto ni se declara compatible por haber leído su código.

No se encontró LICENSE en su ZIP. Se reutiliza conocimiento del comportamiento, no código: permisos separados, filtros, agrupaciones cartográficas, apoyos y gestión. No se arrastran configuraciones, claves ni datos privados del proyecto de referencia.

## Inventario previo y decisiones

| Elemento                  | Insumo                           | Acción PC3                                             |
| ------------------------- | -------------------------------- | ------------------------------------------------------ |
| Identidad, HU/RF/RNF      | Definidos en PC2                 | Mantener y trazar a implementación                     |
| Mascota                   | PNG entregado                    | Copiar original; derivar iconos PWA                    |
| Interfaz híbrida          | Prototipo simulado               | Implementar React modular y navegación real            |
| Persistencia/multiusuario | Ausentes PC2                     | API Node, SQLite, sesiones y restricciones             |
| Roles                     | Simulados PC2; reales referencia | Validación servidor ciudadano/operador/admin           |
| Voz                       | Dictado simulado; TTS parcial    | Web Speech, transcripción editable y texto alternativo |
| LLM                       | Simulado PC2                     | Puerto y adaptadores remotos; pendiente clave real     |
| PWA                       | Propuesta PC2                    | Manifest, service worker, offline básico               |
| Comunidad                 | Planeada/parcial                 | Comentarios, apoyos, follows, amistad, avisos          |
| Datos                     | Ejemplos en HTML                 | Seed explícito, importador JSON, fotos persistentes    |
| Evidencia                 | Capturas del prototipo           | Nuevas capturas de ejecución y tests                   |

El usuario autorizó elegir opciones más sencillas para PWA/despliegue. Por ello se usa un solo servidor Node 24 con SQLite y volumen persistente. Reduce requisitos de instalación, mantiene colaboración real y separa servicios en módulos. No se presenta como PostGIS ni como arquitectura distribuida. El prototipo anterior se conserva únicamente en los insumos del trabajo, no se copia al producto final.
