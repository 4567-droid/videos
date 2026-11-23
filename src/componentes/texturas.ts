import {useThree} from '@react-three/fiber';
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {useDelayRender} from 'remotion';
import * as THREE from 'three';
import {FUENTE} from '../lib/fuente';

/**
 * Texturas dibujadas con <canvas> 2D (todo generado por código, sin imágenes).
 * Si el dibujo usa texto, espera a que cargue Inter antes de dibujar y frena el
 * render (delayRender) hasta que la textura esté en pantalla.
 */
export const useTexturaCanvas = (
	clave: string,
	ancho: number,
	alto: number,
	dibujar: (ctx: CanvasRenderingContext2D) => void,
	conTexto = false,
): THREE.CanvasTexture | null => {
	const advance = useThree((s) => s.advance);
	const {delayRender, continueRender} = useDelayRender();
	const espera = useRef<number | null>(null);
	const especificacion = `900 64px ${FUENTE}`;

	const crear = () => {
		const canvas = document.createElement('canvas');
		canvas.width = ancho;
		canvas.height = alto;
		dibujar(canvas.getContext('2d')!);
		const textura = new THREE.CanvasTexture(canvas);
		textura.colorSpace = THREE.SRGBColorSpace;
		textura.anisotropy = 8;
		return textura;
	};

	const [textura, setTextura] = useState<THREE.CanvasTexture | null>(() =>
		!conTexto || document.fonts.check(especificacion) ? crear() : null,
	);

	useLayoutEffect(() => {
		if (textura) return;
		espera.current = delayRender(`Textura "${clave}": esperando la fuente`);
		let vigente = true;
		document.fonts.load(especificacion).then(() => {
			if (vigente) setTextura(crear());
		});
		return () => {
			vigente = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useLayoutEffect(() => {
		if (!textura || espera.current === null) return;
		advance(performance.now()); // dibuja ya con la textura antes de liberar el fotograma
		continueRender(espera.current);
		espera.current = null;
	}, [textura, advance, continueRender]);

	useEffect(
		() => () => {
			if (espera.current !== null) continueRender(espera.current);
			textura?.dispose();
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	return textura;
};

// ---------------------------------------------------------------------------
// Dibujos

/** Retrato estilo caricatura para las "fotos" del experimento. */
export const dibujarRetrato = (ctx: CanvasRenderingContext2D, variante: 'a' | 'b') => {
	const W = ctx.canvas.width;
	const H = ctx.canvas.height;
	const cx = W / 2;
	const esA = variante === 'a';
	const piel = esA ? '#F2C29B' : '#B9784D';
	const pelo = esA ? '#5B3A29' : '#1E1E24';

	ctx.fillStyle = esA ? '#FFD6E0' : '#CDEBFF';
	ctx.fillRect(0, 0, W, H);
	// fondo con círculos suaves
	ctx.fillStyle = esA ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.4)';
	ctx.beginPath();
	ctx.arc(W * 0.85, H * 0.15, 90, 0, Math.PI * 2);
	ctx.fill();

	// pelo largo detrás (A)
	if (esA) {
		ctx.fillStyle = pelo;
		ctx.beginPath();
		ctx.ellipse(cx, H * 0.47, 178, 238, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillRect(cx - 178, H * 0.47, 356, 150);
	}
	// hombros
	ctx.fillStyle = esA ? '#2EC4B6' : '#FF8C42';
	ctx.beginPath();
	ctx.ellipse(cx, H + 30, 235, 190, 0, Math.PI, 0);
	ctx.fill();
	// cuello
	ctx.fillStyle = piel;
	ctx.fillRect(cx - 46, H * 0.6, 92, 120);
	// cara
	ctx.beginPath();
	ctx.ellipse(cx, H * 0.45, 138, 168, 0, 0, Math.PI * 2);
	ctx.fill();
	// orejas
	for (const lado of [-1, 1]) {
		ctx.beginPath();
		ctx.ellipse(cx + lado * 138, H * 0.46, 22, 34, 0, 0, Math.PI * 2);
		ctx.fill();
	}
	// pelo de arriba
	ctx.fillStyle = pelo;
	ctx.beginPath();
	if (esA) {
		ctx.ellipse(cx, H * 0.3, 150, 92, 0, Math.PI, 0);
		ctx.fill();
		ctx.beginPath();
		ctx.ellipse(cx - 60, H * 0.31, 110, 60, -0.35, 0, Math.PI * 2);
		ctx.fill();
	} else {
		ctx.ellipse(cx, H * 0.29, 142, 78, 0, Math.PI, 0);
		ctx.fill();
		ctx.fillRect(cx - 142, H * 0.28, 22, 60);
		ctx.fillRect(cx + 120, H * 0.28, 22, 60);
	}
	// ojos
	const yOjo = H * 0.45;
	for (const lado of [-1, 1]) {
		const x = cx + lado * 52;
		ctx.fillStyle = '#FFFFFF';
		ctx.beginPath();
		ctx.ellipse(x, yOjo, 26, 18, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = esA ? '#2F7D4A' : '#3B2416';
		ctx.beginPath();
		ctx.arc(x, yOjo, 13, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#111111';
		ctx.beginPath();
		ctx.arc(x, yOjo, 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#FFFFFF';
		ctx.beginPath();
		ctx.arc(x + 5, yOjo - 5, 4, 0, Math.PI * 2);
		ctx.fill();
		// cejas
		ctx.strokeStyle = pelo;
		ctx.lineWidth = esA ? 8 : 12;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.arc(x, yOjo - 8, 34, Math.PI * 1.2, Math.PI * 1.8);
		ctx.stroke();
	}
	// anteojos (B)
	if (!esA) {
		ctx.strokeStyle = '#1E1E24';
		ctx.lineWidth = 8;
		for (const lado of [-1, 1]) {
			ctx.beginPath();
			ctx.arc(cx + lado * 52, yOjo, 38, 0, Math.PI * 2);
			ctx.stroke();
		}
		ctx.beginPath();
		ctx.moveTo(cx - 14, yOjo - 4);
		ctx.lineTo(cx + 14, yOjo - 4);
		ctx.stroke();
	}
	// nariz
	ctx.strokeStyle = esA ? '#D9966C' : '#8A5333';
	ctx.lineWidth = 7;
	ctx.beginPath();
	ctx.moveTo(cx, yOjo + 12);
	ctx.quadraticCurveTo(cx - 14, yOjo + 48, cx + 6, yOjo + 52);
	ctx.stroke();
	// barba (B)
	if (!esA) {
		ctx.fillStyle = 'rgba(30,30,36,0.85)';
		ctx.beginPath();
		ctx.ellipse(cx, H * 0.55, 128, 92, 0, 0.15, Math.PI - 0.15);
		ctx.fill();
	}
	// boca
	ctx.strokeStyle = esA ? '#C9184A' : '#F4F1DE';
	ctx.lineWidth = esA ? 10 : 9;
	ctx.beginPath();
	ctx.arc(cx, yOjo + 62, 34, Math.PI * 0.15, Math.PI * 0.85);
	ctx.stroke();
	// mejillas
	ctx.fillStyle = 'rgba(255,107,129,0.35)';
	for (const lado of [-1, 1]) {
		ctx.beginPath();
		ctx.arc(cx + lado * 86, yOjo + 42, 22, 0, Math.PI * 2);
		ctx.fill();
	}
	// aros (A)
	if (esA) {
		ctx.fillStyle = '#FFD23F';
		for (const lado of [-1, 1]) {
			ctx.beginPath();
			ctx.arc(cx + lado * 140, H * 0.53, 11, 0, Math.PI * 2);
			ctx.fill();
		}
	}
};

/** Hoja de calendario: "DÍA" arriba en franja roja y el número grande. */
export const dibujarHojaCalendario = (ctx: CanvasRenderingContext2D, dia: number) => {
	const W = ctx.canvas.width;
	const H = ctx.canvas.height;
	ctx.fillStyle = '#FFFFFF';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#EF233C';
	ctx.fillRect(0, 0, W, H * 0.26);
	ctx.fillStyle = '#FFFFFF';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = `900 ${Math.round(H * 0.15)}px ${FUENTE}`;
	ctx.fillText('DÍA', W / 2, H * 0.135);
	ctx.fillStyle = '#2B2D42';
	ctx.font = `900 ${Math.round(H * 0.56)}px ${FUENTE}`;
	ctx.fillText(String(dia), W / 2, H * 0.64);
};

/**
 * Etiqueta del repelente: texto + abeja tachada. El texto corre a lo largo del eje
 * de la lata (rotado 90°) para que se lea con la lata acostada en el piso.
 */
export const dibujarEtiquetaRepelente = (ctx: CanvasRenderingContext2D) => {
	const W = ctx.canvas.width;
	const H = ctx.canvas.height;
	const g = ctx.createLinearGradient(0, 0, W, 0);
	g.addColorStop(0, '#16A34A');
	g.addColorStop(0.5, '#38D66B');
	g.addColorStop(1, '#16A34A');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, H);
	// el frente de la lata es el centro horizontal de la textura (u = 0,5)
	ctx.save();
	ctx.translate(W / 2, H / 2);
	ctx.rotate(-Math.PI / 2);
	// franjas a lo largo
	ctx.fillStyle = 'rgba(255,255,255,0.3)';
	ctx.fillRect(-H / 2, -W * 0.13, H, 10);
	ctx.fillRect(-H / 2, W * 0.13 - 10, H, 10);
	// texto
	ctx.fillStyle = '#FFFFFF';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = `900 64px ${FUENTE}`;
	ctx.fillText('REPELENTE', 46, 4);
	// abeja tachada
	const r = 40;
	const x = -H / 2 + 62;
	ctx.fillStyle = '#FFC93C';
	ctx.beginPath();
	ctx.ellipse(x, 0, r * 0.72, r * 0.48, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = '#2E2118';
	for (const dx of [-0.25, 0.12]) ctx.fillRect(x + dx * r, -r * 0.48, r * 0.18, r * 0.96);
	ctx.strokeStyle = '#EF233C';
	ctx.lineWidth = 9;
	ctx.beginPath();
	ctx.arc(x, 0, r, 0, Math.PI * 2);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(x - r * 0.7, -r * 0.7);
	ctx.lineTo(x + r * 0.7, r * 0.7);
	ctx.stroke();
	ctx.restore();
};
