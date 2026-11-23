# Reels de datos curiosos

Reels verticales (1080×1920, 30 fps) en español, **100 % programados** con Remotion + Three.js (`@remotion/three`): escenas 3D low-poly, subtítulos animados y voz opcional con ElevenLabs. No usa imágenes de IA ni APIs de imágenes.

Ejemplo terminado: [`ejemplos/corazon-100-mil-latidos.mp4`](ejemplos/corazon-100-mil-latidos.mp4) (tema: "el corazón late 100 mil veces por día", 4 escenas, ~28 s).

## Uso

```bash
npm install
npm run preview   # Remotion Studio: el Reel completo y cada escena por separado
npm run render    # genera out/reel.mp4
```

## Cómo pedir un video nuevo

Escribile a Claude (Claude Code) en este repo, por ejemplo:

> Hacé un reel nuevo sobre: "por qué los aviones tienen ventanas redondas"

Claude va a:

1. Escribir el guion en `data/video.json`: una frase gancho y después frases cortas (30–45 s en total), **una escena por frase**.
2. Programar una animación 3D por escena en `src/escenas/` y registrarla en `src/escenas/index.ts`.
3. Renderizar, revisar fotogramas y dejar el video en `out/reel.mp4`.

Después podés pedir ajustes puntuales: "cambiá el gancho", "la escena 3 más lenta", "colores más fríos", "otra transición", etc.

> Si el guion nombra un componente que todavía no existe, se usa una escena genérica: sirve para ver textos y tiempos antes de programar las animaciones.

## El guion: `data/video.json`

```json
{
  "tema": "el corazón late 100 mil veces por día",
  "titulo": "Tu corazón no se toma vacaciones",
  "escenas": [
    { "id": "gancho", "componente": "CorazonLatiendo", "texto": "Hoy tu corazón va a latir unas 100 mil veces, y ni siquiera se lo pediste." },
    { "id": "bomba", "componente": "BombaSangre", "texto": "Con cada latido empuja un chorrito de sangre...", "transicion": "deslizar" }
  ]
}
```

- `id`: único; también nombra el audio de la escena.
- `componente`: la escena de `src/escenas/index.ts` que la ilustra.
- `transicion` (opcional): `zoom` (por defecto), `deslizar` o `fundido`.

Sin voz, el tiempo de cada palabra se **estima según su largo** (y pausas en comas y puntos). Subtítulos y animaciones se sincronizan con esos tiempos.

## Voz con ElevenLabs (opcional)

1. Copiá `.env.example` a `.env` y completá `ELEVENLABS_API_KEY` y `VOICE_ID` (`npm run voz -- --voces` lista las voces de tu cuenta, primero las que hablan español). `.env` está en `.gitignore`: la clave nunca se sube.
2. `npm run voz`: genera `public/voz/<id>.mp3` por escena y guarda el tiempo exacto de cada palabra en `data/voz.json` (endpoint *with-timestamps*).
3. `npm run render`: usa el audio y esos tiempos en lugar de la estimación.

Si cambiás un texto, volvé a correr `npm run voz` (solo regenera lo que cambió; `npm run voz -- --forzar` rehace todo). Una escena cuyo texto ya no coincide con su audio vuelve sola a la estimación.

## Estructura

```
data/video.json        guion (una escena por frase)
data/voz.json          tiempos de la voz (lo escribe npm run voz)
src/escenas/           una animación 3D por escena + index.ts (registro)
src/componentes/       Avatar (muñeco low-poly), Corazon3D, Camara, Contador, Subtitulos, transiciones...
src/lib/               estimación de tiempos, línea de tiempo, agrupado de subtítulos
scripts/voz.mjs        voz con ElevenLabs
scripts/fotogramas.mjs renderiza fotogramas sueltos para revisar (npm run fotogramas -- out/f 0 90 300)
```

## Render sin GPU

Three.js necesita WebGL. En servidores sin GPU: `REMOTION_GL=swangle npm run render`. Si Remotion no puede descargar su navegador, indicá uno con `REMOTION_BROWSER=/ruta/a/chrome-headless-shell`.
