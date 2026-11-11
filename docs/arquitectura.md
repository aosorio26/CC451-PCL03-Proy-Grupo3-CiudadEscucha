# Arquitectura C4 actual

## Nivel 1 Contexto

```mermaid
C4Context
  title Ciudad Escucha Contexto PC3
  Person(ciudadano, "Ciudadano o vecino", "Reporta y colabora desde una cuenta propia")
  Person(operador, "Operador de demostración", "Revisa y actualiza estados")
  Person(admin, "Administrador", "Gestiona permisos")
  System(app, "Ciudad Escucha", "PWA colaborativa para Lima")
  System_Ext(llm, "Groq o Gemini", "Sugerencias IA con consentimiento")
  System_Ext(osm, "OpenStreetMap", "Cartografía pública")
  System_Ext(voz, "Servicios de voz del navegador", "STT y TTS según disponibilidad")
  Rel(ciudadano, app, "Publica, sigue, comenta y personaliza", "HTTPS")
  Rel(operador, app, "Gestiona incidencias", "HTTPS")
  Rel(admin, app, "Asigna roles", "HTTPS")
  Rel(app, llm, "Solicita sugerencias, nunca escritura directa", "HTTPS")
  Rel(app, osm, "Consulta teselas con atribución", "HTTPS")
  Rel(app, voz, "Dictado voluntario y lectura con control", "Web Speech")
```

## Nivel 2 Contenedores

```mermaid
C4Container
  title Ciudad Escucha Contenedores PC3
  Person(vecino, "Lucía y Julio", "Sesiones independientes")
  Person(staff, "Karina y administrador", "Roles de demostración")
  System_Boundary(ce, "Ciudad Escucha") {
    Container(pwa, "Cliente PWA", "React 18, Vite, Leaflet", "18 rutas, voz, accesibilidad, borradores locales")
    Container(api, "API y archivos estáticos", "Node 24, Express", "Sesiones, validación, roles, comunidad, notificaciones, puerto AssistantProvider")
    ContainerDb(db, "Base persistente", "SQLite WAL", "Usuarios, sesiones hash, reportes, historial, relaciones y preferencias")
    Container(media, "Almacén de fotos", "Volumen persistente", "WebP reencodificado sin metadatos")
  }
  System_Ext(llm, "Proveedor LLM", "Groq o Gemini intercambiable")
  System_Ext(osm, "OpenStreetMap", "Teselas")
  Rel(vecino, pwa, "Usa voz, texto, teclado o mapa")
  Rel(staff, pwa, "Accede a vistas autorizadas")
  Rel(pwa, api, "JSON y cookie HttpOnly; consulta novedades cada 12 s", "HTTPS")
  Rel(api, db, "Consultas parametrizadas y transacciones")
  Rel(api, media, "Valida y almacena fotografías")
  Rel(api, llm, "Texto consentido; timeout y validación JSON", "HTTPS")
  Rel(pwa, osm, "Teselas; alternativa textual", "HTTPS")
```

En despliegue, API, archivos estáticos y adaptador LLM son módulos de un mismo proceso. La PWA vive en el navegador, SQLite y fotos en un volumen. La separación del diagrama es lógica; no implica microservicios. Las preferencias son tablas del mismo servidor, a diferencia de la propuesta conceptual PC2.

## Flujo multiusuario

Lucía confirma una publicación. La API valida sesión y campos, inserta reporte, evento inicial y seguimiento en una transacción. Julio obtiene el registro mediante su propia cookie, apoya con clave única `(usuario, reporte)` y comenta. Se crean notificaciones para autor/seguidores. Karina cambia el estado con autorización explícita; se guarda actor, nota y fecha, y se notifica. El polling recupera cambios; recargar consulta la misma BD. No hay estado compartido basado en localStorage.

## Frontera de confianza de IA

`AssistantProvider.suggest` devuelve únicamente texto/campos sugeridos. El contexto incluye hasta cinco reportes propios y seis turnos si hay consentimiento para guardar. La salida se valida con Zod. `POST /assistant/drafts` prepara un borrador autenticado; `POST /assistant/drafts/:id/confirm` valida autor y confirmación, con clave idempotente. Las consultas de estado y memoria en lenguaje acotado usan datos de API y se etiquetan como guía local. No se ejecutan instrucciones del modelo ni HTML procedente del usuario. Quedan P1 herramientas libres por voz para apoyar/seguir y STT remoto propio.

