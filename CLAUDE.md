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
scripts/proyectar.mjs    píxel donde cae cada punto 3D para una cámara (encuadrar sin renderizar)
ejemplos/                mp4 terminados
```
Componentes: `Escenario3D`, `Camara` (+ `temblor`, `proyectar`), `Subtitulos`, `Contador`, `Etiqueta`, `Tilde`, `Avatar` (persona; poses reposo/caminar/correr/saludar/celebrar/señalar/escribir, `expresion` feliz/preocupada/serena, `cejas`, `cabeza`, `encoger` hombros, `giroCabeza`, `brazos` fijos por codo y mano, `enMano`), `Einstein`, `Abeja`, `Corazon3D`, `Cerebro`, `CaraFlor`/`FlorChica`, `Calendario` (`encabezado`), `FotoCara`, `GotaAzucar`, `Reloj3D`, `RelojDerretido`, `Planeta`/`Estrellas`, `Repelente`, `Ciencia.tsx` (Pizarron, Nave, SabanaEspacioTiempo, Satelite, Celular, SignoPregunta, Lamparita), `Segmento`, `useTexturaCanvas`, `Efectos` (Destellos, Resplandor, OndasLatido, Cielo, SombraSuave), `Dormir.tsx` (LucesNoche, Habitacion con ventana y luna, Cama, `Durmiente`: persona acostada con `abiertos`/`mirar`/`cejas`/`boca`, `antifaz`, `manta`, `abrazaAlmohada` y `apagado` para brazos y piernas grises), `Interruptor.tsx` (CerebroConCara, Interruptor ON/OFF, Cable con pulsos, NubeSueno, Megafono), `CuartoCerebro` (cama + cerebro + interruptor), `Amor.tsx` (Mano y `BrazoCerebro` de goma, Frasco, Carrito "pedidos habituales", CorazonChico, GloboCorazon, Cartel con texto, Escaner de resonancia, Portarretrato con foto borrosa, CelularChico, `ZonaBrillo` para zonas que se encienden dentro del cerebro, Sol, Nube, CorazonRoto en SVG). `Durmiente` también tiene `taparse` (almohada sobre la cara). Estilo pizarra (2D, SVG): `Pizarra.tsx` (`Pizarra`, `Trazo` que se dibuja solo, `Flecha`, `Texto` a mano letra por letra, `Garabato` para rellenar con resaltador, `Brillo`, `Tilde`, `Cruz`, `Pregunta`, `NubePensamiento`, `Palito` personaje de palitos con poses (`POSE_BRAZOS_CRUZADOS`, `poseCorrer`), `pelo` despeinado o gorro de dormir, `enMano` y `tipoCabeza` normal/sol/luna, `Cara` con 17 caras expresivas (feliz, agotado con ojeras, enojado, asustado, culpable, guiño, bostezo, dormido, mareado, alerta, fastidio...), `SolPizarra` y `LunaPizarra` (personajes con cara), `RelojPizarra` (despertador con campanas, cara, agujas enredadas), `CamaPizarra`, `Celular`, `Rayo`, `Gota`, `Zzz`, `Estrella`, `curvaSuave`, `CerebroPizarra` con el "circuito de recompensa" que se enciende, `Bombilla`). Curvas de cortisol y melatonina para gráficos: `src/escenas/curvas-hormonas.ts`. Misterio 3D (`Misterio.tsx`): `EscenarioMisterio` (fondo violeta, niebla con `fog` + bancos de bruma, `LucesMisterio` dramáticas, piso con charco de luz, partículas), `CajaMisterio` (caja de cartón con signo de pregunta turquesa brillante; `temblor`, `abrir` con rendija de luz violeta, `rayosX` para ver adentro, `desanimo`), `Gato` (caricaturesco atigrado: sentado o `echado` durmiendo, `ojos`, `cara` normal/feliz/enojado/sorpresa, `maullido`, `pata`, `mirar`, `pupilas`, modo `fantasma` translúcido con borde de luz), `GatosSuperpuestos` (los dos estados: despierto turquesa + dormido lila con `Zzz3D`), `Atomo`, `Bolita`, `Moneda` (gato despierto/dormido), `HiloLuz`, `Cartel3D` (texto en canvas), `Lupa`, `Plato`, `Molecula`, `Schrodinger` (Avatar con bata, moño y anteojos redondos). `Avatar` también acepta `torso` (extras pegados al torso) y `guino`. `Pizarron` acepta `clave` + `dibujar` (contenido propio) y `patas={false}` (flotante). `PalabrasClave` (palabras grandes con golpe, se configuran en el guion) y `src/lib/planos.ts` (`camaraPlanos`: lista de planos con cortes secos o movimientos suaves y deriva continua). Revisalos antes de crear algo nuevo.

## Cómo se crea un video nuevo
1. **Guion** → guardá el `data/video.json` actual en `data/anteriores/` y escribí el nuevo: `{tema, titulo, voz?: {velocidad?, ritmo?}, escenas: [{id (kebab-case), componente (PascalCase), texto, transicion?: zoom|deslizar|fundido|destello|borrar|borrar-saludo|borrar-cansado|borrar-giro, pausas?: [{antes, segundos}], ritmo?: 1.05, claves?: [{palabra, texto?, color?, y?}]}]}`. Si el usuario trae el guion, usalo **textual**. Si no: gancho primero, frases cortas, 30–45 s, datos verificados.
2. **Tono**: español rioplatense con voseo ("sos", "te movés", "Seguime"); números en cifras ("100 mil", "1905").
3. **Regla fija del final (todos los videos, en este orden):** 1) cierre gracioso, 2) enseñanza de una frase, 3) en temas sensibles (consumo, salud mental), aviso de ayuda (Argentina: línea 141 de SEDRONAR, gratuita, anónima, 24 h; verificar que siga vigente), 4) escena `CierreSeguime` (o `PizarraSeguime` en estilo pizarra) con el texto "Seguime para más datos que no sabías."
4. **Voz**: `NODE_USE_ENV_PROXY=1 npm run voz` (en tu máquina alcanza `npm run voz`). Genera solo lo que cambió (`-- --forzar` rehace todo; `-- --voces` lista voces). Voz actual: Charlie (`VOICE_ID` en `.env`), modelo `eleven_multilingual_v2`. Para un tono más calmo: `"voz": {"estabilidad": 0.62, "estilo": 0.12}` (por defecto 0.45 y 0.3; cambiarlos regenera); con humor: `0.42` y `0.38`. **Pausas cómicas**: con `estilo` alto ElevenLabs ya deja silencios de 0,5–0,85 s antes de los remates; si hace falta más, `"pausas": [{"antes": "palabra", "segundos": 0.15}]` en la escena agrega silencio sin regenerar (la voz se parte en tramos y todo se corre).
5. **Duración**: cada escena dura su voz + 0,3 s antes + 0,7 s después (incluye la transición de 0,5 s). Para acercarse a una duración pedida usá `"voz": {"ritmo": 1.1}` (acelera la reproducción, mismo tono, sin regenerar) o `"velocidad"` (ElevenLabs, requiere regenerar). Un `ritmo` por escena multiplica el general (para acelerar hacia el final). Las **pausas dramáticas** van igual que las cómicas: con `estilo` 0.4 ElevenLabs ya deja 0,5–0,9 s antes de los giros; sumá 0,1–0,35 s solo donde no alcanza.
6. **Escenas**: un componente por escena en `src/escenas/`, registrado en `index.ts`. Si falta, se usa `EscenaGenerica`.
7. **Verificar**: `npm run typecheck`; encuadrar con `node scripts/proyectar.mjs`; `npm run fotogramas -- out/fotogramas 0 90 300 ...` y mirarlos (si el usuario pide pocos: un fotograma chico por escena para chequear números sin mirarlos + 2 o 3 a la vista); `npm run render` → `out/reel.mp4`; comprobar sincronía con `ffmpeg silencedetect` y volumen (~−17 LUFS).
8. Copiar el mp4 a `ejemplos/<nombre>.mp4`, actualizar `ESTADO.md`, commit y push.

En la nube (sin GPU ni descarga de Chrome): `REMOTION_GL=swangle REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell` delante de `npm run render` / `npm run fotogramas`.

## Temas sensibles (drogas, salud mental)
- Tono calmo, empático, sin juzgar ni glorificar. No mostrar personas consumiendo, sustancias, jeringas, pastillas ni objetos de consumo; nada de dosis, métodos ni marcas. Representar con cerebros, circuitos, flechas y personajes de palitos.
- Antes de renderizar, verificar cada dato con la evidencia y suavizar lo absoluto ("puede", "suele", "casi todas"), cambiando lo mínimo del guion del usuario y avisándole qué se cambió.

## Reglas técnicas
- `Escenario3D` (fondo CSS + ThreeCanvas + overlay HTML) y `Camara` en cada escena; la cámara siempre se mueve.
- Sincronizar con `useEscena().momento('palabra')` (frame relativo; acepta varias palabras, `{fin: true}`, `{ocurrencia: n}`).
- Todo determinístico: `useCurrentFrame()` y `random('semilla')`; nunca `Math.random()`, `Date.now()` ni `useFrame`.
- Nada de imágenes, texturas descargadas ni emojis: geometrías, `<canvas>` (`useTexturaCanvas`) o SVG.
- Muchas copias → `instancedMesh` + geometrías de bajo detalle.
- `useTexturaCanvas` usa hooks de R3F: llamalo en un componente que esté dentro del canvas (hijo de `Escenario3D`), nunca en el cuerpo de la escena.
- Zonas: subtítulos 250–500 px desde arriba; números/etiquetas 1340–1600 px; nada importante en los últimos ~300 px ni pegado a los bordes. HTML anclado a 3D con `proyectar()`.

## Estilo visual (común a todas las series)
- Personajes y objetos 3D simples, low-poly o "juguete", colores vivos; fondos con degradé radial saturado; destellos flotando; viñeta suave.
- Subtítulos grandes arriba, 3 palabras por vez, palabra activa en amarillo `#FFD23F`, Inter Black (900) en mayúsculas con contorno negro.
- Transiciones suaves (zoom, deslizar, fundido) de 0,5 s; contadores grandes con etiqueta tipo pastilla.

Por serie:
- **Cuerpo humano** (corazón): corazón 3D brillante, Avatar corriendo, contadores con números grandes, fondos rosa/violeta/azul.
- **Animales** (abejas): `Abeja` mascota expresiva (cejas, boca, brazos), fotos de caras dibujadas, `CaraFlor`, fondos celeste/verde/rosa.
- **Ciencia / historia** (relatividad): `Einstein` (pelo blanco, bigote), relojes, cohete, grilla espacio-tiempo, eclipse, satélite, fondos espaciales azul/violeta y aula cálida.
- **Emociones** (por qué cuesta dejar un amor): tono empático, sin burla; la noche aclara escena a escena hasta el amanecer (fondos azul noche → lavanda → rosa → durazno), cámara lenta, transiciones de fundido. Cerebro con cara y brazos de goma (`BrazoCerebro`), persona con poses fijas (`brazos`), voz calma (`estabilidad`/`estilo`). Cierre con `CierreSeguime` y `props.fondo` de amanecer.
- **Pizarra** (dopamina y drogas; cortisol y melatonina): `"estilo": "pizarra"` en `data/video.json` → fondo blanco, dibujos SVG a marcador negro con toques de amarillo `#FFD23F` y rojo, rótulos con letra manuscrita (`FUENTE_MANO`, Patrick Hand local), subtítulos **abajo** (los dibujos van entre y 150 y 1360) y transición `borrar` (un borrador pasa y la escena nueva se dibuja). El cerebro dibujado es la figura recurrente. Cierre con `PizarraSeguime` (`props.companeros: true` suma al sol y la luna saludando). Con humor (cortisol y melatonina): sol (cortisol) y luna (melatonina) como personajes de palitos, caras muy expresivas, un chiste corto por escena y, cada tanto, el borrador con gesto (`borrar-saludo`, `borrar-cansado`, `borrar-giro`).
- **Misterio** (el gato de Schrödinger): noche violeta profunda con azules y toques de turquesa, niebla suave, luces dramáticas y la `CajaMisterio` con el signo de pregunta brillante como figura recurrente. Gato caricaturesco y simpático; nunca daño ni un gato muerto: "vivo y muerto" = `GatosSuperpuestos` (despierto + dormido con "zzz"). Retención: `camaraPlanos` con un corte o movimiento cada 3–5 s, `claves` en cada escena (palabras grandes con golpe), algo siempre en movimiento (niebla, partículas, temblor, cola), transición `destello` en los giros y `ritmo` por escena que sube hacia el final. Voz `estabilidad` 0.42 / `estilo` 0.4. Cierre con `CierreSeguime` y `props.fondo` violeta.
- **Sueño / noche** (parálisis del sueño): cuarto de noche con luna (`Habitacion`), `Durmiente` en la `Cama` (pijama rosa, manta azul con estrellas), cerebro con cara, interruptor ON/OFF, fondos azul/violeta. Usa `luces={false}` + `LucesNoche` y cierra con `CierreSeguime` con `props.fondo` nocturno.

## Voz y clave de ElevenLabs
- La clave está **solo** en `.env` (`ELEVENLABS_API_KEY`, `VOICE_ID`). `.env` está en `.gitignore` y **nunca se sube al repo** (es público): no escribirla en código, README, ESTADO ni commits.
- Antes de cada commit: `git status` (que `.env` aparezca ignorado) y buscar la clave en el diff (`git diff --cached | grep -F "$ELEVENLABS_API_KEY"` leyendo la clave desde `.env`, sin escribirla).
- `.env` no persiste entre contenedores: en una sesión nueva puede faltar; si falta, pedírselo al usuario.
- El entorno de nube "videos" permite `api.elevenlabs.io`.
