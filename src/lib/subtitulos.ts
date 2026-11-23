import {normalizar} from './estimacion';
import type {LineaDeTiempo} from './tipos';

export const PALABRAS_POR_GRUPO = 3;

export type PalabraSubtitulo = {
	/** Texto a mostrar (sin comas ni puntos finales) */
	texto: string;
	/** frames globales */
	inicio: number;
	fin: number;
};

export type GrupoSubtitulo = {
	palabras: PalabraSubtitulo[];
	inicio: number;
	fin: number;
};

const limpiar = (p: string) => p.replace(/[.,;:…]+$/u, '').replace(/^["«(]+|["»)]+$/gu, '');
const terminaFrase = (p: string) => /[.,;:!?…]["»)]?$/.test(p);

/** Artículos, preposiciones y pronombres: no deberían quedar colgando al final de un grupo. */
const PALABRAS_FUNCION = new Set([
	'de', 'del', 'la', 'las', 'el', 'los', 'lo', 'un', 'una', 'unos', 'unas', 'a', 'al', 'en', 'por', 'para',
	'con', 'sin', 'se', 'tu', 'tus', 'su', 'sus', 'mi', 'mis', 'le', 'les', 'me', 'te', 'nos', 'muy', 'mas', 'cada',
]);
/** Conjunciones: molesta menos que cierren un grupo ("¿Sabías que / las abejas..."). */
const CONJUNCIONES = new Set(['que', 'y', 'e', 'o', 'u', 'ni', 'pero', 'si', 'como']);
/** Números escritos en letras ("un millón", "ochenta mil millones"). */
const NUMEROS_EN_LETRAS = new Set([
	'un', 'uno', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
	'trece', 'catorce', 'quince', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta',
	'noventa', 'cien', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos',
	'setecientos', 'ochocientos', 'novecientos',
]);
const esNumero = (p: string) => /^\d+$/.test(normalizar(p)) || NUMEROS_EN_LETRAS.has(normalizar(p));
const continuaNumero = (p: string) => /^(mil|millon|millones|billon|billones)$/.test(normalizar(p)) || p.startsWith('%');
const letras = (p: string) => normalizar(p).length;

/** Un grupo que dura menos que esto (frames) no llega a leerse. */
const MINIMO_LEGIBLE = 12;

type PalabraAgrupable = {texto: string; inicio?: number; fin?: number};

/** Cuánto "molesta" leer este grupo: más bajo = mejor corte. */
const costoGrupo = (grupo: PalabraAgrupable[], siguiente?: PalabraAgrupable) => {
	// una palabra sola está bien si es larga ("EXPERIMENTO"), molesta si es corta ("PERO")
	let costo = grupo.length === 1 ? (letras(grupo[0].texto) >= 8 ? 1.5 : 3) : grupo.length === 2 ? 1 : 0;
	// no cruzar comas ni puntos dentro de un grupo
	for (let i = 0; i < grupo.length - 1; i++) if (terminaFrase(grupo[i].texto)) costo += 6;
	const ultima = grupo[grupo.length - 1];
	if (siguiente && !terminaFrase(ultima.texto)) {
		const n = normalizar(ultima.texto);
		if (PALABRAS_FUNCION.has(n)) costo += 3.5;
		else if (CONJUNCIONES.has(n)) costo += 2;
		// no separar "100 | mil", "ochenta | mil" ni "3 mil | millones"
		if ((esNumero(ultima.texto) || n === 'mil') && continuaNumero(siguiente.texto)) costo += 8;
	}
	// grupos que pasan demasiado rápido
	if (grupo[0].inicio !== undefined && ultima.fin !== undefined && ultima.fin - grupo[0].inicio < MINIMO_LEGIBLE) {
		costo += 2.5;
	}
	return costo;
};

/**
 * Parte las palabras de una escena en grupos de hasta 3 eligiendo los cortes
 * más naturales (programación dinámica sobre costoGrupo).
 */
export const agrupar = <T extends PalabraAgrupable>(palabras: T[]): T[][] => {
	const n = palabras.length;
	const costo = new Array<number>(n + 1).fill(Infinity);
	const corte = new Array<number>(n + 1).fill(0);
	costo[0] = 0;
	for (let i = 1; i <= n; i++) {
		for (let k = 1; k <= Math.min(PALABRAS_POR_GRUPO, i); k++) {
			const c = costo[i - k] + costoGrupo(palabras.slice(i - k, i), palabras[i]);
			if (c < costo[i]) {
				costo[i] = c;
				corte[i] = i - k;
			}
		}
	}
	const grupos: T[][] = [];
	for (let i = n; i > 0; i = corte[i]) grupos.unshift(palabras.slice(corte[i], i));
	return grupos;
};

/** Margen que el último grupo de cada escena queda en pantalla tras la última palabra. */
const MANTENER = 10;

export const calcularGrupos = (linea: LineaDeTiempo): GrupoSubtitulo[] => {
	const resultado: GrupoSubtitulo[] = [];
	linea.escenas.forEach((escena, i) => {
		const siguiente = linea.escenas[i + 1];
		const limiteEscena = siguiente
			? siguiente.inicio + (siguiente.palabras[0]?.inicio ?? 0)
			: escena.inicio + escena.duracion;

		const globales = escena.palabras.map((p) => ({
			texto: p.texto,
			inicio: escena.inicio + p.inicio,
			fin: escena.inicio + p.fin,
		}));
		const grupos = agrupar(globales);
		grupos.forEach((g, j) => {
			const sig = grupos[j + 1];
			const fin = sig ? sig[0].inicio : Math.min(limiteEscena, g.at(-1)!.fin + MANTENER);
			resultado.push({
				// el primer subtítulo del video ya se ve completo en el fotograma 0 (miniatura)
				inicio: i === 0 && j === 0 ? -10 : g[0].inicio,
				fin,
				palabras: g.map((p) => ({...p, texto: limpiar(p.texto)})),
			});
		});
	});
	return resultado;
};
