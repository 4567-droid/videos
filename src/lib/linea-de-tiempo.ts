import {estimarTiempos, normalizar, separarPalabras} from './estimacion';
import type {EscenaCalculada, LineaDeTiempo, VideoJSON, VozJSON} from './tipos';

export const FPS = 30;
export const ANCHO = 1080;
export const ALTO = 1920;

/** Duración de cada transición entre escenas (frames). */
export const TRANSICION = 15;

/** Silencio antes de que empiece a hablar cada escena (segundos). */
const ENTRADA_PRIMERA = 0.1;
const ENTRADA = 0.3;
/** Margen después de la última palabra (segundos). Incluye la transición. */
const SALIDA = 0.7;
const SALIDA_FINAL = 1.6;
const DURACION_MINIMA = 2.5;
/** Cuánto audio se deja sonar después de la última palabra (segundos). */
const COLA_AUDIO = 0.3;

const mismoTexto = (a: string, b: string) =>
	separarPalabras(a).map(normalizar).join(' ') === separarPalabras(b).map(normalizar).join(' ');

/**
 * Convierte el guion (y la voz, si existe) en frames concretos:
 * dónde empieza cada escena y cuándo se dice cada palabra.
 */
export const calcularLineaDeTiempo = (video: VideoJSON, voz: VozJSON, fps = FPS): LineaDeTiempo => {
	const escenas: EscenaCalculada[] = [];
	const total = video.escenas.length;

	video.escenas.forEach((escena, indice) => {
		const vozEscena = voz.escenas?.[escena.id];
		const conVoz = Boolean(vozEscena && mismoTexto(vozEscena.texto, escena.texto) && vozEscena.palabras.length > 0);
		if (vozEscena && !conVoz) {
			console.warn(`[voz] El texto de "${escena.id}" cambió: uso tiempos estimados. Corré "npm run voz" de nuevo.`);
		}

		const palabrasSeg = conVoz ? vozEscena!.palabras : estimarTiempos(escena.texto);
		// Con voz, la escena dura lo que dura lo hablado (sin el silencio final del audio).
		const finHabla = palabrasSeg.at(-1)?.fin ?? 0;
		const entrada = indice === 0 ? ENTRADA_PRIMERA : ENTRADA;
		const salida = indice === total - 1 ? SALIDA_FINAL : SALIDA;
		const duracion = Math.ceil(Math.max(DURACION_MINIMA, entrada + finHabla + salida) * fps);

		const anterior = escenas.at(-1);
		const inicio = anterior ? anterior.inicio + anterior.duracion - TRANSICION : 0;

		escenas.push({
			id: escena.id,
			indice,
			esUltima: indice === total - 1,
			componente: escena.componente,
			texto: escena.texto,
			props: escena.props ?? {},
			transicion: escena.transicion ?? 'zoom',
			inicio,
			duracion,
			conVoz,
			palabras: palabrasSeg.map((p) => ({
				texto: p.texto,
				inicio: Math.round((entrada + p.inicio) * fps),
				fin: Math.max(Math.round((entrada + p.inicio) * fps) + 1, Math.round((entrada + p.fin) * fps)),
			})),
			// el audio se corta (con fundido) un poco después de la última palabra:
			// así una respiración final no se pisa con la voz de la escena siguiente
			audio: conVoz
				? {
						src: vozEscena!.audio,
						desde: Math.round(entrada * fps),
						duracion: Math.ceil(Math.min(vozEscena!.duracion, finHabla + COLA_AUDIO) * fps),
					}
				: null,
		});
	});

	const ultima = escenas.at(-1);
	return {escenas, duracionTotal: ultima ? ultima.inicio + ultima.duracion : fps};
};
