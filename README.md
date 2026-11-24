# Reels de datos curiosos

Reels verticales (1080×1920, 30 fps) en español, **100 % programados** con Remotion + Three.js (`@remotion/three`): escenas 3D low-poly, subtítulos animados y voz opcional con ElevenLabs. No usa imágenes de IA ni APIs de imágenes.

Ejemplos terminados (con voz de ElevenLabs):
- [`ejemplos/paralisis-del-sueno.mp4`](ejemplos/paralisis-del-sueno.mp4): "la parálisis del sueño", 9 escenas, ~42 s.
- [`ejemplos/relatividad-einstein.mp4`](ejemplos/relatividad-einstein.mp4): "la teoría de la relatividad de Einstein", 9 escenas, ~61 s.
- [`ejemplos/abejas-reconocen-caras.mp4`](ejemplos/abejas-reconocen-caras.mp4): "las abejas reconocen caras humanas", 7 escenas, ~39 s.
- [`ejemplos/corazon-100-mil-latidos.mp4`](ejemplos/corazon-100-mil-latidos.mp4): "el corazón late 100 mil veces por día", 4 escenas, ~26 s (su guion quedó en `data/anteriores/`).

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
2. `npm run voz`: genera `public/voz/<id>.mp3` por escena (modelo `eleven_multilingual_v2`, endpoint *with-timestamps*), guarda el tiempo exacto de cada palabra en `data/voz.json` y normaliza el volumen (−16 LUFS) para que todas las escenas suenen parejas.
3. `npm run render`: usa el audio y esos tiempos en lugar de la estimación. Cada escena dura lo que dura su voz, más 0,3 s antes y 0,7 s después (que incluyen la transición).

Para ajustar la duración total, en `data/video.json`: `"voz": {"ritmo": 1.1}` acelera la voz ya generada al reproducirla (mismo tono, sin regenerar); `"voz": {"velocidad": 1.05}` cambia la velocidad con la que la genera ElevenLabs (requiere `npm run voz`).

Todos los videos terminan igual: un cierre gracioso, una enseñanza de una frase y la escena `CierreSeguime` ("Seguime para más datos que no sabías.").

Si cambiás un texto, volvé a correr `npm run voz` (solo regenera lo que cambió; `npm run voz -- --forzar` rehace todo). Una escena cuyo texto ya no coincide con su audio vuelve sola a la estimación.

## Estructura

```
data/video.json        guion (una escena por frase)
data/voz.json          tiempos de la voz (lo escribe npm run voz)
src/escenas/           una animación 3D por escena + index.ts (registro)
src/componentes/       personajes y objetos reutilizables: Avatar (persona), Durmiente (persona acostada),
                       Cama, Habitacion (cuarto de noche), CerebroConCara, Interruptor, Megafono, Einstein, Abeja, Corazon3D,
                       Cerebro, CaraFlor, Calendario, Reloj3D, RelojDerretido, Planeta, FotoCara,
                       Repelente, Ciencia (pizarrón, cohete, sábana espacio-tiempo, satélite, celular,
                       signo de pregunta, lamparita), Etiqueta, Camara, Contador, Subtitulos...
src/lib/               estimación de tiempos, línea de tiempo, agrupado de subtítulos
scripts/voz.mjs        voz con ElevenLabs
scripts/fotogramas.mjs renderiza fotogramas sueltos para revisar (npm run fotogramas -- out/f 0 90 300)
scripts/proyectar.mjs  calcula en qué píxel cae un punto 3D para una cámara (encuadre sin renderizar)
```

## Render sin GPU

Three.js necesita WebGL. En servidores sin GPU: `REMOTION_GL=swangle npm run render`. Si Remotion no puede descargar su navegador, indicá uno con `REMOTION_BROWSER=/ruta/a/chrome-headless-shell`.
