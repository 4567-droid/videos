/**
 * Curvas esquemáticas (0..1) de cortisol y melatonina a lo largo del día, para los gráficos
 * de la pizarra. No son mediciones: siguen la forma típica (pico de cortisol ~30–45 min
 * después de despertar a las 7; melatonina que sube de noche y baja a la mañana).
 */
const suave = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** Cortisol según la hora (0–24 h), con despertar a las 7. */
export const cortisol = (hora: number) => {
	const h = ((hora % 24) + 24) % 24;
	if (h <= 2) return 0.1;
	if (h <= 7) return 0.1 + 0.5 * Math.pow((h - 2) / 5, 1.6);
	if (h <= 7.6) return 0.6 + 0.4 * Math.sin(((Math.PI / 2) * (h - 7)) / 0.6);
	return 0.1 + 0.9 * Math.exp(-(h - 7.6) / 5);
};

/** Melatonina según la hora (puede pasar de 24: 30 = 6 de la mañana). `corrimiento` la atrasa (h). */
export const melatonina = (hora: number, corrimiento = 0) => {
	const x = hora - corrimiento;
	return 0.06 + 0.94 * suave((x - 21) / 3) * (1 - suave((x - 29.5) / 3)) * (0.86 + 0.14 * Math.exp(-(((x - 27) / 2.5) ** 2)));
};

/** Punto a lo largo de una polilínea según la fracción de su largo (0..1) y el ángulo ahí. */
export const puntoEnPolilinea = (pts: [number, number][], fraccion: number): {x: number; y: number; angulo: number} => {
	const largos = [0];
	for (let i = 1; i < pts.length; i++) largos.push(largos[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
	const objetivo = Math.min(1, Math.max(0, fraccion)) * largos[largos.length - 1];
	let i = 1;
	while (i < pts.length - 1 && largos[i] < objetivo) i++;
	const tramo = largos[i] - largos[i - 1] || 1;
	const k = (objetivo - largos[i - 1]) / tramo;
	const [x0, y0] = pts[i - 1];
	const [x1, y1] = pts[i];
	return {x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, angulo: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI};
};

/** Muestrea una función en puntos de pantalla. */
export const muestrear = (f: (x: number) => number, desde: number, hasta: number, aPixel: (x: number, y: number) => [number, number], pasos = 120) => {
	const pts: [number, number][] = [];
	for (let i = 0; i <= pasos; i++) {
		const x = desde + ((hasta - desde) * i) / pasos;
		pts.push(aPixel(x, f(x)));
	}
	return pts;
};

export const polilinea = (pts: [number, number][]) => `M ${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')}`;
