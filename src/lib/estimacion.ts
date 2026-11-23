import type {PalabraVoz} from './tipos';

/**
 * Estimación de cuánto tarda en decirse cada palabra, sin voz real.
 * Se basa en la cantidad de letras (los números se cuentan como se pronuncian)
 * y agrega pausas después de comas y puntos.
 * Ritmo aproximado: ~2,8 palabras por segundo, típico de un reel narrado.
 */
const BASE_POR_PALABRA = 0.11; // segundos
const POR_LETRA = 0.058; // segundos
const MINIMO_POR_PALABRA = 0.2;
const PAUSA_COMA = 0.2;
const PAUSA_PUNTO = 0.38;

export const separarPalabras = (texto: string): string[] =>
	texto.trim().split(/\s+/).filter(Boolean);

/** Quita tildes, signos y mayúsculas: "Corazón," -> "corazon" */
export const normalizar = (palabra: string): string =>
	palabra
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9ñ]/g, '');

const UNIDADES = [
	'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
	'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete',
	'dieciocho', 'diecinueve', 'veinte',
];
const DECENAS = ['', '', 'veinti', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

/** Número entero en palabras (solo para estimar la duración). */
export const numeroEnPalabras = (n: number): string => {
	if (n <= 20) return UNIDADES[n];
	if (n < 30) return DECENAS[2] + UNIDADES[n - 20];
	if (n < 100) {
		const u = n % 10;
		return DECENAS[Math.floor(n / 10)] + (u ? ' y ' + UNIDADES[u] : '');
	}
	if (n === 100) return 'cien';
	if (n < 1000) {
		const r = n % 100;
		return CENTENAS[Math.floor(n / 100)] + (r ? ' ' + numeroEnPalabras(r) : '');
	}
	if (n < 1_000_000) {
		const miles = Math.floor(n / 1000);
		const r = n % 1000;
		return (miles === 1 ? 'mil' : numeroEnPalabras(miles) + ' mil') + (r ? ' ' + numeroEnPalabras(r) : '');
	}
	const millones = Math.floor(n / 1_000_000);
	const r = n % 1_000_000;
	return (millones === 1 ? 'un millón' : numeroEnPalabras(millones) + ' millones') + (r ? ' ' + numeroEnPalabras(r) : '');
};

const letrasPronunciadas = (palabra: string): number => {
	const limpia = palabra.replace(/[¿?¡!.,;:…"'()«»—-]/g, '');
	const comoNumero = limpia.replace(/\./g, '');
	if (/^\d+$/.test(comoNumero) && comoNumero.length < 13) {
		return numeroEnPalabras(Number(comoNumero)).replace(/\s/g, '').length;
	}
	const extra = (limpia.match(/%/g)?.length ?? 0) * 9; // "por ciento"
	return Math.max(1, limpia.replace(/[^\p{L}\p{N}]/gu, '').length + extra);
};

const pausaDespues = (palabra: string): number => {
	if (/[.!?…]["»)]?$/.test(palabra)) return PAUSA_PUNTO;
	if (/[,;:—]["»)]?$/.test(palabra)) return PAUSA_COMA;
	return 0;
};

/** Devuelve inicio y fin (en segundos) de cada palabra de la frase. */
export const estimarTiempos = (texto: string): PalabraVoz[] => {
	let t = 0;
	return separarPalabras(texto).map((palabra) => {
		const dur = Math.max(MINIMO_POR_PALABRA, BASE_POR_PALABRA + POR_LETRA * letrasPronunciadas(palabra));
		const resultado = {texto: palabra, inicio: t, fin: t + dur};
		t += dur + pausaDespues(palabra);
		return resultado;
	});
};
