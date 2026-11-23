const gauss = (x: number, c: number, w: number) => Math.exp(-((x - c) ** 2) / (2 * w * w));
/** Campana periódica (se repite en cada latido). */
const golpe = (p: number, c: number, w: number) =>
	Math.max(gauss(p, c, w), gauss(p, c - 1, w), gauss(p, c + 1, w));

/**
 * Envolvente "lub-dub" de un latido: 0 en reposo, 1 en el pico.
 * `fase` cuenta latidos: 0 → 1 es un latido completo.
 */
export const envolventeLatido = (fase: number) => {
	const p = fase - Math.floor(fase);
	return Math.min(1, golpe(p, 0.06, 0.035) + 0.55 * golpe(p, 0.24, 0.03));
};

/** Señal tipo electrocardiograma (P, QRS, T) para dibujar un monitor. */
export const ondaECG = (fase: number) => {
	const p = fase - Math.floor(fase);
	return (
		0.12 * golpe(p, 0.9, 0.03) -
		0.14 * golpe(p, 0.035, 0.008) +
		1.0 * golpe(p, 0.06, 0.011) -
		0.3 * golpe(p, 0.085, 0.01) +
		0.22 * golpe(p, 0.3, 0.045)
	);
};

/**
 * Para un ritmo que cambia con el tiempo: integra bpm(seg) y devuelve fase(seg).
 * (Con ritmo constante alcanza con fase = seg * bpm / 60.)
 */
export const crearFase = (bpm: (seg: number) => number, duracionSeg: number, inicial = 0) => {
	const paso = 1 / 240;
	const n = Math.ceil(duracionSeg / paso) + 2;
	const tabla = new Float64Array(n);
	tabla[0] = inicial;
	for (let i = 1; i < n; i++) {
		tabla[i] = tabla[i - 1] + (bpm((i - 0.5) * paso) / 60) * paso;
	}
	return (seg: number) => {
		if (seg <= 0) return inicial + (seg * bpm(0)) / 60;
		const x = seg / paso;
		const i = Math.floor(x);
		if (i >= n - 1) return tabla[n - 1] + ((seg - (n - 1) * paso) * bpm(seg)) / 60;
		return tabla[i] + (tabla[i + 1] - tabla[i]) * (x - i);
	};
};

/** Suma acumulada por frame de una velocidad (unidades/seg). Útil para desplazamientos. */
export const acumular = (velocidad: (seg: number) => number, frames: number, fps: number) => {
	const tabla = new Float64Array(frames + 1);
	for (let f = 1; f <= frames; f++) {
		tabla[f] = tabla[f - 1] + velocidad((f - 0.5) / fps) / fps;
	}
	return (frame: number) => tabla[Math.max(0, Math.min(frames, Math.floor(frame)))];
};
