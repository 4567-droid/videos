import {buscarPalabra, estimarTiempos, normalizar, separarPalabras} from './estimacion';
import type {EscenaCalculada, EscenaJSON, LineaDeTiempo, PalabraVoz, TipoTransicion, VideoJSON, VozJSON} from './tipos';

export const FPS = 30;
export const ANCHO = 1080;
export const ALTO = 1920;

/** Duración de cada transición entre escenas (frames). */
export const TRANSICION = 15;

/** Las transiciones con gesto del borrador duran más (frames). */
export const DURACION_TRANSICION: Partial<Record<TipoTransicion, number>> = {
	'borrar-saludo': 24,
	'borrar-cansado': 27,
	'borrar-giro': 21,
};
export const duracionDeTransicion = (tipo: TipoTransicion) => DURACION_TRANSICION[tipo] ?? TRANSICION;

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

type Pausa = {indice: number; segundos: number; corte: number};

/**
 * Pausas cómicas: para cada una, la palabra donde empieza y el punto de corte (segundos de
 * salida), en el medio del silencio entre esa palabra y la anterior.
 */
const ubicarPausas = (escena: EscenaJSON, palabras: PalabraVoz[]): Pausa[] => {
	const pausas: Pausa[] = [];
	for (const pausa of escena.pausas ?? []) {
		const encontrada = buscarPalabra(
			palabras.map((p) => p.texto),
			pausa.antes,
			pausa.ocurrencia ?? 1,
		);
		if (!encontrada || encontrada.inicio === 0 || !(pausa.segundos > 0)) {
			console.warn(`[pausas] "${pausa.antes}" no está en "${escena.id}" (o es la primera palabra): la salteo.`);
			continue;
		}
		const i = encontrada.inicio;
		pausas.push({indice: i, segundos: pausa.segundos, corte: (palabras[i - 1].fin + palabras[i].inicio) / 2});
	}
	return pausas.sort((a, b) => a.indice - b.indice);
};

/**
 * Convierte el guion (y la voz, si existe) en frames concretos:
 * dónde empieza cada escena y cuándo se dice cada palabra.
 */
export const calcularLineaDeTiempo = (video: VideoJSON, voz: VozJSON, fps = FPS): LineaDeTiempo => {
	const escenas: EscenaCalculada[] = [];
	const total = video.escenas.length;
	const tipoDe = (escena: EscenaJSON): TipoTransicion => escena.transicion ?? (video.estilo === 'pizarra' ? 'borrar' : 'zoom');

	video.escenas.forEach((escena, indice) => {
		const vozEscena = voz.escenas?.[escena.id];
		const conVoz = Boolean(vozEscena && mismoTexto(vozEscena.texto, escena.texto) && vozEscena.palabras.length > 0);
		if (vozEscena && !conVoz) {
			console.warn(`[voz] El texto de "${escena.id}" cambió: uso tiempos estimados. Corré "npm run voz" de nuevo.`);
		}

		// ritmo: reproduce la voz más rápido o más lento (con el mismo tono) sin regenerarla
		const ritmo = conVoz ? Math.min(2, Math.max(0.5, video.voz?.ritmo ?? 1)) : 1;
		const originales = conVoz
			? vozEscena!.palabras.map((p) => ({...p, inicio: p.inicio / ritmo, fin: p.fin / ritmo}))
			: estimarTiempos(escena.texto);

		// pausas cómicas: todo lo que viene después de cada corte se corre
		const pausas = ubicarPausas(escena, originales);
		const corrimiento = (i: number) => pausas.filter((p) => p.indice <= i).reduce((a, p) => a + p.segundos, 0);
		const palabrasSeg = originales.map((p, i) => ({...p, inicio: p.inicio + corrimiento(i), fin: p.fin + corrimiento(i)}));

		// las transiciones con gesto duran más: se agrega ese tiempo antes y después de la voz
		const tipo = tipoDe(escena);
		const duracionTransicion = indice > 0 ? duracionDeTransicion(tipo) : 0;
		const siguiente = video.escenas[indice + 1];
		const extraEntrada = Math.max(0, duracionTransicion - TRANSICION) / fps;
		const extraSalida = siguiente ? Math.max(0, duracionDeTransicion(tipoDe(siguiente)) - TRANSICION) / fps : 0;

		// Con voz, la escena dura lo que dura lo hablado (sin el silencio final del audio).
		const finHabla = palabrasSeg.at(-1)?.fin ?? 0;
		const entrada = (indice === 0 ? ENTRADA_PRIMERA : ENTRADA) + extraEntrada;
		const salida = (indice === total - 1 ? SALIDA_FINAL : SALIDA) + extraSalida;
		const duracion = Math.ceil(Math.max(DURACION_MINIMA, entrada + finHabla + salida) * fps);

		const anterior = escenas.at(-1);
		const inicio = anterior ? anterior.inicio + anterior.duracion - duracionTransicion : 0;

		// tramos de audio: uno por cada pausa + 1 (el audio se corta en el silencio y sigue después)
		let tramos: {desde: number; duracion: number; recorte: number}[] = [];
		if (conVoz) {
			const finAudio = Math.min(vozEscena!.duracion / ritmo, (originales.at(-1)?.fin ?? 0) + COLA_AUDIO);
			const cortes = [0, ...pausas.map((p) => p.corte), finAudio];
			let acumulado = 0;
			tramos = cortes.slice(0, -1).map((desdeSeg, k) => {
				if (k > 0) acumulado += pausas[k - 1].segundos;
				const desde = Math.round((entrada + desdeSeg + acumulado) * fps);
				const hasta = Math.round((entrada + cortes[k + 1] + acumulado) * fps);
				return {desde, duracion: Math.max(1, hasta - desde), recorte: Math.round(desdeSeg * ritmo * fps)};
			});
		}

		escenas.push({
			id: escena.id,
			indice,
			esUltima: indice === total - 1,
			componente: escena.componente,
			texto: escena.texto,
			props: escena.props ?? {},
			transicion: tipo,
			duracionTransicion,
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
			audio: conVoz ? {src: vozEscena!.audio, velocidad: ritmo, tramos} : null,
		});
	});

	const ultima = escenas.at(-1);
	return {escenas, duracionTotal: ultima ? ultima.inicio + ultima.duracion : fps};
};
