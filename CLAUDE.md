# Guía para Claude: reels de datos curiosos

Cuando el usuario da un tema, hacé el video completo siguiendo estas convenciones.

## 1. Guion → `data/video.json`
- Primera escena = **gancho** (dato sorprendente o afirmación directa). Después frases cortas (≈10–18 palabras), **una escena por frase**, 30–45 s en total (~2,8 palabras/seg; `npx remotion compositions` muestra la duración).
- Español neutro (evitá imperativos con voseo o tuteo marcados), números en cifras ("100 mil", "150") para que se lean en los subtítulos. Chequeá que los datos sean correctos.
- `id` en kebab-case, `componente` en PascalCase. Si el texto cambia y hay voz generada, avisá que hay que correr `npm run voz`.

## 2. Escenas → `src/escenas/<Componente>.tsx` + registro en `src/escenas/index.ts`
- Base: `Escenario3D` (fondo CSS + `ThreeCanvas` + `overlay` HTML) y `Camara` (posición calculada por frame; la cámara siempre se mueve).
- Sincronizá con el guion usando `useEscena().momento('palabra')` (frame relativo a la escena; acepta varias palabras y `{fin: true}`).
- Todo determinístico: `useCurrentFrame()` y `random('semilla')` de remotion; nunca `Math.random()`, `Date.now()` ni `useFrame` de R3F.
- Objetos simples, claros y de colores vivos; estética low-poly (`flatShading`). Personas → `Avatar` (`reposo`, `caminar`, `correr`, `saludar`, `celebrar`, mezclables con `mezcla`).
- Muchas copias → `instancedMesh` + geometrías de bajo detalle (ej. `obtenerGeometriaCorazon('bajo')`).
- Nada de imágenes, texturas descargadas ni emojis: todo se genera con código (geometrías, `<canvas>`, SVG).
- Zonas: subtítulos ~250–500 px desde arriba; números/etiquetas ~1340–1600 px (`Contador`); no pongas nada importante en los últimos ~300 px ni pegado al borde derecho (interfaz de Reels/TikTok). Para anclar HTML a un objeto 3D usá `proyectar()`.

## 3. Verificación
- `npm run typecheck`
- Fotogramas sueltos: `npm run fotogramas -- out/fotogramas 0 90 300 ...` y mirarlos (texto legible, nada tapado, sin objetos cortados).
- `npm run render` → `out/reel.mp4`.
- En la nube (sin GPU ni descarga de Chrome): `REMOTION_GL=swangle REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell`.

## Voz (ElevenLabs)
- La clave va **solo** en `.env` (`ELEVENLABS_API_KEY`, `VOICE_ID`); `.env` está en `.gitignore`. Nunca escribirla en código, README ni commits (el repo es público). Antes de commitear: `git status` y verificar que `.env` no esté incluido.
- `npm run voz -- --voces` lista voces; `npm run voz` genera solo lo que cambió (`-- --forzar` rehace todo).
- En la nube, Node necesita el proxy: `NODE_USE_ENV_PROXY=1 npm run voz`. El entorno "videos" permite `api.elevenlabs.io`.
