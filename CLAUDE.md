# Guía para Claude: reels de datos curiosos

Reels verticales 1080×1920 a 30 fps, en español, 100 % programados con Remotion + Three.js (`@remotion/three`). Sin imágenes de IA ni APIs de imágenes. Antes de seguir trabajando, leé `ESTADO.md` (qué está hecho y qué falta).

## Estructura del proyecto
```
data/video.json          guion del video actual (una escena por frase)
data/voz.json            tiempos por palabra de la voz (lo escribe npm run voz)
data/anteriores/         guiones de videos anteriores
public/voz/<id>.mp3      audio de cada escena
src/Root.tsx, Reel.tsx   composición "Reel" + una composición por escena (carpeta "Escenas")
src/escenas/             una animación 3D por escena + index.ts (registro por nombre)
src/componentes/         piezas reutilizables (ver abajo)
src/lib/                 línea de tiempo, estimación de tiempos, subtítulos, latido, fuente
scripts/voz.mjs          voz con ElevenLabs (with-timestamps) + normalización de volumen
scripts/fotogramas.mjs   renderiza fotogramas sueltos para revisar
ejemplos/                mp4 terminados
```
Componentes: `Escenario3D`, `Camara` (+ `temblor`, `proyectar`), `Subtitulos`, `Contador`, `Etiqueta`, `Tilde`, `Avatar` (persona; poses reposo/caminar/correr/saludar/celebrar/señalar/escribir, `expresion`, `cejas`, `cabeza`), `Einstein`, `Abeja`, `Corazon3D`, `Cerebro`, `CaraFlor`/`FlorChica`, `Calendario` (`encabezado`), `FotoCara`, `GotaAzucar`, `Reloj3D`, `RelojDerretido`, `Planeta`/`Estrellas`, `Repelente`, `Ciencia.tsx` (Pizarron, Nave, SabanaEspacioTiempo, Satelite, Celular, SignoPregunta, Lamparita), `Segmento`, `useTexturaCanvas`, `Efectos` (Destellos, Resplandor, OndasLatido, Cielo, SombraSuave). Revisalos antes de crear algo nuevo.

## Cómo se crea un video nuevo
1. **Guion** → guardá el `data/video.json` actual en `data/anteriores/` y escribí el nuevo: `{tema, titulo, voz?: {velocidad?, ritmo?}, escenas: [{id (kebab-case), componente (PascalCase), texto, transicion?: zoom|deslizar|fundido}]}`. Si el usuario trae el guion, usalo **textual**. Si no: gancho primero, frases cortas, 30–45 s, datos verificados.
2. **Tono**: español rioplatense con voseo ("sos", "te movés", "Seguime"); números en cifras ("100 mil", "1905").
3. **Regla fija del final (todos los videos, en este orden):** 1) cierre gracioso, 2) enseñanza de una frase, 3) escena `CierreSeguime` con el texto "Seguime para más datos que no sabías."
4. **Voz**: `NODE_USE_ENV_PROXY=1 npm run voz` (en tu máquina alcanza `npm run voz`). Genera solo lo que cambió (`-- --forzar` rehace todo; `-- --voces` lista voces). Voz actual: Charlie (`VOICE_ID` en `.env`), modelo `eleven_multilingual_v2`.
5. **Duración**: cada escena dura su voz + 0,3 s antes + 0,7 s después (incluye la transición de 0,5 s). Para acercarse a una duración pedida usá `"voz": {"ritmo": 1.1}` (acelera la reproducción, mismo tono, sin regenerar) o `"velocidad"` (ElevenLabs, requiere regenerar).
6. **Escenas**: un componente por escena en `src/escenas/`, registrado en `index.ts`. Si falta, se usa `EscenaGenerica`.
7. **Verificar**: `npm run typecheck`; `npm run fotogramas -- out/fotogramas 0 90 300 ...` y mirarlos; `npm run render` → `out/reel.mp4`; comprobar sincronía con `ffmpeg silencedetect` y volumen (~−17 LUFS).
8. Copiar el mp4 a `ejemplos/<nombre>.mp4`, actualizar `ESTADO.md`, commit y push.

En la nube (sin GPU ni descarga de Chrome): `REMOTION_GL=swangle REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell` delante de `npm run render` / `npm run fotogramas`.

## Reglas técnicas
- `Escenario3D` (fondo CSS + ThreeCanvas + overlay HTML) y `Camara` en cada escena; la cámara siempre se mueve.
- Sincronizar con `useEscena().momento('palabra')` (frame relativo; acepta varias palabras, `{fin: true}`, `{ocurrencia: n}`).
- Todo determinístico: `useCurrentFrame()` y `random('semilla')`; nunca `Math.random()`, `Date.now()` ni `useFrame`.
- Nada de imágenes, texturas descargadas ni emojis: geometrías, `<canvas>` (`useTexturaCanvas`) o SVG.
- Muchas copias → `instancedMesh` + geometrías de bajo detalle.
- Zonas: subtítulos 250–500 px desde arriba; números/etiquetas 1340–1600 px; nada importante en los últimos ~300 px ni pegado a los bordes. HTML anclado a 3D con `proyectar()`.

## Estilo visual (común a todas las series)
- Personajes y objetos 3D simples, low-poly o "juguete", colores vivos; fondos con degradé radial saturado; destellos flotando; viñeta suave.
- Subtítulos grandes arriba, 3 palabras por vez, palabra activa en amarillo `#FFD23F`, Inter Black (900) en mayúsculas con contorno negro.
- Transiciones suaves (zoom, deslizar, fundido) de 0,5 s; contadores grandes con etiqueta tipo pastilla.

Por serie:
- **Cuerpo humano** (corazón): corazón 3D brillante, Avatar corriendo, contadores con números grandes, fondos rosa/violeta/azul.
- **Animales** (abejas): `Abeja` mascota expresiva (cejas, boca, brazos), fotos de caras dibujadas, `CaraFlor`, fondos celeste/verde/rosa.
- **Ciencia / historia** (relatividad): `Einstein` (pelo blanco, bigote), relojes, cohete, grilla espacio-tiempo, eclipse, satélite, fondos espaciales azul/violeta y aula cálida.

## Voz y clave de ElevenLabs
- La clave está **solo** en `.env` (`ELEVENLABS_API_KEY`, `VOICE_ID`). `.env` está en `.gitignore` y **nunca se sube al repo** (es público): no escribirla en código, README, ESTADO ni commits.
- Antes de cada commit: `git status` (que `.env` aparezca ignorado) y buscar la clave en el diff (`git diff --cached | grep -F "$ELEVENLABS_API_KEY"` leyendo la clave desde `.env`, sin escribirla).
- `.env` no persiste entre contenedores: en una sesión nueva puede faltar; si falta, pedírselo al usuario.
- El entorno de nube "videos" permite `api.elevenlabs.io`.
