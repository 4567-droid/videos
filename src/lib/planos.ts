import {Easing} from 'remotion';
import {temblor} from '../componentes/Camara';
import type {V3} from '../componentes/utilidades3d';

/**
 * Planos de cámara cinematográficos: una lista de encuadres que cambian en frames concretos
 * (normalmente sincronizados con palabras). Cada plano puede entrar con corte seco (llegada 0)
 * o con un movimiento suave, y durante el plano la cámara sigue derivando (dolly/paneo lento),
 * así siempre hay algo en movimiento. Sirve para la regla de "un corte o movimiento cada 3–5 s".
 */
export type Plano = {
	/** frame (relativo a la escena) donde empieza el plano */
	desde: number;
	pos: V3;
	mira: V3;
	fov?: number;
	/** desplazamiento de la cámara por segundo mientras dura el plano */
	deriva?: V3;
	/** desplazamiento del punto al que mira, por segundo */
	derivaMira?: V3;
	/** frames que tarda en llegar desde el plano anterior (0 = corte seco) */
	llegada?: number;
};

const sumar = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const suave = Easing.inOut(Easing.cubic);

export const camaraPlanos = (
	frame: number,
	fps: number,
	planos: Plano[],
	{intensidadTemblor = 0.7}: {intensidadTemblor?: number} = {},
): {posicion: V3; mirarA: V3; fov: number} => {
	let i = 0;
	planos.forEach((p, k) => {
		if (frame >= p.desde) i = k;
	});
	const estado = (k: number) => {
		const p = planos[k];
		const s = Math.max(0, (frame - p.desde) / fps);
		return {pos: sumar(p.pos, p.deriva ?? [0, 0, 0], s), mira: sumar(p.mira, p.derivaMira ?? [0, 0, 0], s), fov: p.fov ?? 45};
	};
	let actual = estado(i);
	const llegada = planos[i].llegada ?? 0;
	if (i > 0 && llegada > 0 && frame < planos[i].desde + llegada) {
		const k = suave((frame - planos[i].desde) / llegada);
		const previo = estado(i - 1);
		actual = {pos: mezclar(previo.pos, actual.pos, k), mira: mezclar(previo.mira, actual.mira, k), fov: previo.fov + (actual.fov - previo.fov) * k};
	}
	return {posicion: sumar(actual.pos, temblor(frame / fps, intensidadTemblor)), mirarA: actual.mira, fov: actual.fov};
};
