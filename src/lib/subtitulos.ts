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

/** Palabras que no deberían quedar colgando al final de un grupo ("de", "la", "un"...). */
const PALABRAS_FUNCION = new Set([
	'de', 'del', 'la', 'las', 'el', 'los', 'lo', 'un', 'una', 'unos', 'unas', 'a', 'al', 'en', 'por', 'para',
	'con', 'sin', 'y', 'e', 'o', 'u', 'que', 'se', 'tu', 'tus', 'su', 'sus', 'mi', 'mis', 'ni', 'le', 'les',
	'me', 'te', 'nos', 'muy', 'mas', 'cada',
]);
const esNumero = (p: string) => /^\d+$/.test(normalizar(p));
const continuaNumero = (p: string) => /^(mil|millon|millones|billon|billones)$/.test(normalizar(p)) || p.startsWith('%');

/** Cuánto "molesta" leer este grupo: más bajo = mejor corte. */
const costoGrupo = (grupo: {texto: string}[], siguiente?: {texto: string}) => {
	let costo = grupo.length === 1 ? 3 : grupo.length === 2 ? 1 : 0;
	// no cruzar comas ni puntos dentro de un grupo
	for (let i = 0; i < grupo.length - 1; i++) if (terminaFrase(grupo[i].texto)) costo += 6;
	const ultima = grupo[grupo.length - 1].texto;
	if (siguiente && !terminaFrase(ultima)) {
		if (PALABRAS_FUNCION.has(normalizar(ultima))) costo += 3.5;
		// no separar "100 | mil" ni "3 mil | millones"
		if ((esNumero(ultima) || normalizar(ultima) === 'mil') && continuaNumero(siguiente.texto)) costo += 6;
	}
	return costo;
};

/**
 * Parte las palabras de una escena en grupos de hasta 3 eligiendo los cortes
 * más naturales (programación dinámica sobre costoGrupo).
 */
export const agrupar = <T extends {texto: string}>(palabras: T[]): T[][] => {
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
