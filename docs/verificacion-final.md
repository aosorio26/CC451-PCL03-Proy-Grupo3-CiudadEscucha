# Verificación final · Ciudad Escucha

Fecha: 11 de noviembre de 2026. Este documento diferencia implementación, evidencia automatizada y validación externa pendiente. No equivale a certificación de accesibilidad ni a pruebas con usuarios reales.

| Requisito | Implementación y evidencia | Límite de la verificación |
|---|---|---|
| LLM remoto o local, intercambiable | Capa `AssistantProvider` / `CompatibleProvider`; Rabbit 1 selecciona OpenAI y Rabbit 2 Gemini. Dos usuarios con elecciones distintas se verifican en API con transportes simulados. | Falta ingresar claves válidas y ejecutar llamadas reales con ambas cuentas. No se requiere LLM local porque el requisito admite remoto. |
| PWA | Manifest, service worker, precache de 19 entradas, instalación disponible según navegador y borrador manual offline. Compilación y registro SW comprobados en Edge. | Instalar y ensayar físicamente en Android/iOS antes de una afirmación integral. |
| Personalización continua | Preferencias persistentes, emoción declarada, tono, velocidad, pausa; contadores privados de conversaciones, correcciones y dificultades de voz. Adaptación automática del ritmo y la ayuda. Desactivación y borrado disponibles. | La emoción la declara el usuario; no se infieren estados psicológicos. Los errores registrados son de interacción/voz, no diagnósticos de la persona. |
| Multiusuario con salas, compartición **o** colaboración | Sesiones independientes, reportes compartidos, comentarios, apoyos, seguimiento, amistades, perfiles, roles y notificaciones. Prueba de colaboración con varios contextos independientes. | No hay salas de chat; se cumple la alternativa de colaboración y compartición. |
| Norman: visceral | Dos personajes visibles, identidad azul/verde, ilustraciones y presentación móvil coherente. La mascota seleccionada aparece en chat, voz y acceso flotante. | La evaluación estética con usuarios queda pendiente. |
| Norman: conductual | Conversación breve, borrador editable, confirmación explícita, recuperación de errores, dictado completo, ritmo adaptable y controles accesibles. | Reconocimiento acústico y lectura audible requieren micrófono/altavoz físico. |
| Norman: reflexivo | Perfiles, historial, niveles, puntos restantes y avances de la comunidad. | Los datos demo no representan atención municipal real. |
| Microinteracciones y retroalimentación afectiva | Estados de escucha/lectura, feedback al guardar/publicar, selección visual de mascota, pulsación táctil y movimiento reducido. El prompt usa tono y emoción declarados para acompañar sin inventar emociones. | Las respuestas afectivas de los proveedores reales requieren un ensayo con clave. |

## Las dos mascotas

1. **Rescue Rabbit 1** conserva `public/rescue-rabbit.png`, la imagen original. Usa OpenAI, modelo `gpt-5-mini` configurable con `OPENAI_MODEL`.
2. **Rescue Rabbit 2** usa `public/rescue-rabbit-2.png`, el conejo de casco naranja proporcionado en la última solicitud. Usa Gemini, modelo `gemini-3.5-flash-lite` configurable con `GEMINI_MODEL`.

La imagen adicional del cuy se conserva en los archivos originales del usuario; no sustituye al conejo original ni agrega una tercera conexión. En la interfaz, «Cambiar mascota» muestra las imágenes y sus nombres. Los detalles de proveedor están en esta documentación de administración.

Las claves se guardan solo en `.env`: `OPENAI_API_KEY` y `GEMINI_API_KEY`. El servidor lee ambas al arrancar y usa la correspondiente a la mascota elegida. Cambiar una selección global en el archivo por cada clic rompería el aislamiento multiusuario, por eso la selección se persiste en la cuenta y el archivo no se reescribe en ejecución. No hay cambio silencioso hacia otro proveedor si la clave elegida falta.

## Activación

```powershell
npm ci
Copy-Item .env.example .env # solo si todavía no existe
powershell -ExecutionPolicy Bypass -File .\Configurar-IA.ps1
npm run seed
npm run build
npm start
```

El configurador solicita ambas claves sin mostrarlas. Si prefieres editar `.env`, solo completa las dos variables de clave. No sobrescribas un `.env` existente que ya tenga datos válidos. Para probar la conectividad: `node --env-file-if-exists=.env scripts/verificar-ia.mjs`; consume la cuota de cada proveedor y no imprime las claves.

Referencias de integración: [GPT-5 mini](https://developers.openai.com/api/docs/models/gpt-5-mini), [salida JSON de OpenAI](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat) y [Gemini Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite). El acceso efectivo depende de la cuenta y cuota contratadas.

## Pruebas

19 pruebas Node aprobadas: incluyen selección aislada de proveedores, ausencia de secretos en configuración pública, persistencia, adaptación tras dificultades, desactivación y borrado del aprendizaje, colaboración y confirmaciones.

12 pruebas de navegador: regresión de reportes, avatar, voz y chat, geocodificación, roles, accesibilidad y cambio de mascota persistente. La instancia de pruebas usa `API_RATE_LIMIT=1200` para la carga artificial de múltiples sesiones; el valor normal sigue siendo 240. Proveedores y audio se simulan en los tests que los necesitan. Las imágenes de `docs/capturas` son capturas del navegador; una respuesta de IA de esas pruebas no acredita una llamada externa real.

La entrega está preparada para completar las claves y realizar la validación externa. No se afirma haber validado generación remota, voz física ni instalación física sin esos ensayos.
