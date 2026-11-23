import * as THREE from 'three';

export type V3 = [number, number, number];

export const TAU = Math.PI * 2;

const cacheTexturas = new Map<string, THREE.Texture>();

/**
 * Textura de degradé radial generada con <canvas> (sin imágenes externas).
 * Se usa para resplandores y sombras suaves.
 */
export const texturaRadial = (clave: string, paradas: [number, string][], tam = 256): THREE.Texture => {
	const enCache = cacheTexturas.get(clave);
	if (enCache) return enCache;
	const canvas = document.createElement('canvas');
	canvas.width = tam;
	canvas.height = tam;
	const ctx = canvas.getContext('2d')!;
	const g = ctx.createRadialGradient(tam / 2, tam / 2, 0, tam / 2, tam / 2, tam / 2);
	paradas.forEach(([pos, color]) => g.addColorStop(pos, color));
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, tam, tam);
	const textura = new THREE.CanvasTexture(canvas);
	textura.colorSpace = THREE.SRGBColorSpace;
	cacheTexturas.set(clave, textura);
	return textura;
};

export const texturaResplandor = () =>
	texturaRadial('resplandor', [
		[0, 'rgba(255,255,255,1)'],
		[0.22, 'rgba(255,255,255,0.55)'],
		[0.55, 'rgba(255,255,255,0.12)'],
		[1, 'rgba(255,255,255,0)'],
	]);

export const texturaSombra = () =>
	texturaRadial('sombra', [
		[0, 'rgba(0,0,0,0.55)'],
		[0.5, 'rgba(0,0,0,0.25)'],
		[1, 'rgba(0,0,0,0)'],
	]);

export const limitar = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x));

/** Interpolación suave 0..1 */
export const suavizar = (x: number) => {
	const t = limitar(x);
	return t * t * (3 - 2 * t);
};
