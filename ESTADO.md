# Estado del proyecto

Última actualización: 2026-11-24 (cortisol y melatonina). Rama de trabajo: `ccr-d4fb5546-weghzx`.

## Videos terminados (con voz de ElevenLabs)
| Video | Escenas | Duración | mp4 | Guion |
|---|---|---|---|---|
| El corazón late 100 mil veces por día | 4 | ~26 s | `ejemplos/corazon-100-mil-latidos.mp4` | `data/anteriores/corazon-100-mil-latidos.json` |
| Las abejas reconocen caras humanas | 7 | ~39 s | `ejemplos/abejas-reconocen-caras.mp4` | `data/anteriores/abejas-reconocen-caras.json` |
| La teoría de la relatividad de Einstein | 9 | ~61 s | `ejemplos/relatividad-einstein.mp4` | `data/anteriores/relatividad-einstein.json` |
| La parálisis del sueño | 9 | ~42 s | `ejemplos/paralisis-del-sueno.mp4` | `data/anteriores/paralisis-del-sueno.json` |
| Por qué cuesta tanto dejar un amor | 10 | ~61 s | `ejemplos/dejar-un-amor.mp4` | `data/anteriores/dejar-un-amor.json` |
| Por qué cuesta tanto dejar una droga (dopamina, estilo pizarra) | 15 | ~113 s | `ejemplos/dopamina-drogas.mp4` | `data/anteriores/dopamina-drogas.json` |
| Cortisol y melatonina (estilo pizarra con humor) | 13 | ~109 s | `ejemplos/cortisol-melatonina.mp4` | `data/video.json` (actual) |

## Video a medias
Ninguno. El último (cortisol y melatonina, estilo pizarra con humor) quedó renderizado, revisado y subido. Su guion es el `data/video.json` actual y sus audios están en `public/voz/`.

Pendientes menores:
- Los videos del corazón y las abejas se hicieron antes de la regla fija del final y no la cumplen.
- Los audios de los videos anteriores ya no están en `public/voz/` (quedan en el historial de git): para re-renderizar uno hay que restaurar su guion desde `data/anteriores/` y correr `npm run voz`, que vuelve a gastar créditos.

## Próximos pasos
1. Al pedir un video nuevo: guardar `data/video.json` en `data/anteriores/cortisol-melatonina.json` antes de reemplazarlo.
2. Seguir la regla del final: cierre gracioso → enseñanza de una frase → aviso de ayuda solo si el tema es sensible (el usuario pidió explícitamente no ponerlo en el de cortisol y melatonina) → `CierreSeguime` o `PizarraSeguime` ("Seguime para más datos que no sabías."). Para la serie de noche, `CierreSeguime` lleva `props.fondo` con un degradé azul/violeta.
3. Verificar que exista `.env` (clave + `VOICE_ID`); si la sesión es nueva puede faltar.
4. Decidir si se siguen guardando los mp4 en `ejemplos/`: ya suman ~180 MB en el historial del repo.
5. Opcional: adaptar los videos del corazón y las abejas a la regla del final; considerar música de fondo.
