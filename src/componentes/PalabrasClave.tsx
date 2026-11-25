import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FUENTE} from '../lib/fuente';
import {TRANSICION} from '../lib/linea-de-tiempo';
import type {LineaDeTiempo} from '../lib/tipos';

/**
 * Palabras clave grandes con "golpe": cuando la voz dice la palabra, el texto cae desde grande,
 * rebota, sacude un poco y deja una onda expansiva. Se ve en la zona de etiquetas (1340–1600 px).
 * Además, `golpeDeClaves()` da un pequeño zoom de toda la imagen en ese momento.
 */

export type ClaveGlobal = {texto: string; inicio: number; fin: number; color: string; y: number};

const TURQUESA = '#5CFFE4';
/** Cuánto queda en pantalla cada palabra clave (frames), si no la pisa la siguiente. */
const DURACION_CLAVE = 42;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const calcularClaves = (linea: LineaDeTiempo): ClaveGlobal[] => {
	const todas = linea.escenas.flatMap((escena) =>
		escena.claves.map((c) => ({
			texto: c.texto,
			inicio: escena.inicio + c.inicio,
			// se va antes de la transición de salida de su escena
			limite: escena.esUltima ? escena.inicio + escena.duracion : escena.inicio + escena.duracion - TRANSICION,
			color: c.color ?? TURQUESA,
			y: c.y ?? 1480,
		})),
	);
	todas.sort((a, b) => a.inicio - b.inicio);
	return todas.map((c, i) => ({
		texto: c.texto,
		inicio: c.inicio,
		fin: Math.min(c.inicio + DURACION_CLAVE, c.limite, (todas[i + 1]?.inicio ?? Infinity) - 1),
		color: c.color,
		y: c.y,
	}));
};

/** 0..1: impulso que dura ~0,4 s después de cada palabra clave (para el zoom de golpe). */
export const golpeDeClaves = (claves: ClaveGlobal[], frame: number) =>
	claves.reduce((max, c) => Math.max(max, interpolate(frame - c.inicio, [-1, 2, 13], [0, 1, 0], clamp)), 0);

const contorno = (radio: number, pasos = 16) =>
	new Array(pasos)
		.fill(0)
		.map((_, i) => {
			const a = (i / pasos) * Math.PI * 2;
			return `${(Math.cos(a) * radio).toFixed(1)}px ${(Math.sin(a) * radio).toFixed(1)}px 0 #0A0618`;
		})
		.join(', ');
const BORDE = contorno(7);

export const PalabrasClave: React.FC<{claves: ClaveGlobal[]}> = ({claves}) => {
	const frame = useCurrentFrame();
	const {fps, width} = useVideoConfig();
	const clave = claves.find((c) => frame >= c.inicio && frame < c.fin);
	if (!clave) return null;

	const f = frame - clave.inicio;
	const golpe = spring({frame: f, fps, config: {damping: 9, stiffness: 340, mass: 0.6}});
	const salida = interpolate(frame, [clave.fin - 7, clave.fin], [0, 1], clamp);
	const escala = interpolate(golpe, [0, 1], [2.3, 1]) * (1 - 0.12 * salida);
	const sacudida = Math.max(0, 1 - f / 9);
	const dx = Math.sin(f * 2.7) * 14 * sacudida;
	const dy = Math.cos(f * 3.3) * 9 * sacudida;
	const onda = interpolate(f, [1, 16], [0, 1], clamp);
	// largo del texto -> tamaño (que nunca se salga del ancho)
	const tamano = Math.min(150, (width * 0.86) / (Math.max(4, clave.texto.length) * 0.66));

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{/* sombra oscura detrás, para que se lea sobre cualquier fondo */}
			<div
				style={{
					position: 'absolute',
					left: width / 2 - 470,
					top: clave.y - 120,
					width: 940,
					height: 240,
					background: 'radial-gradient(ellipse at 50% 50%, rgba(8,4,22,0.62) 0%, rgba(8,4,22,0.35) 45%, rgba(8,4,22,0) 72%)',
					opacity: Math.min(1, f / 4) * (1 - salida),
				}}
			/>
			{/* onda expansiva */}
			<div
				style={{
					position: 'absolute',
					left: width / 2 - 260,
					top: clave.y - 130,
					width: 520,
					height: 260,
					borderRadius: '50%',
					border: `${Math.max(1, 10 * (1 - onda))}px solid ${clave.color}`,
					opacity: 0.8 * (1 - onda),
					transform: `scale(${0.4 + 1.3 * onda})`,
					boxShadow: `0 0 40px ${clave.color}`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 0,
					width,
					top: clave.y,
					display: 'flex',
					justifyContent: 'center',
					transform: `translate(${dx}px, calc(-50% + ${dy}px)) rotate(-4deg) scale(${escala})`,
					opacity: Math.min(1, f / 3 + 0.2) * (1 - salida),
				}}
			>
				<span
					style={{
						fontFamily: FUENTE,
						fontWeight: 900,
						fontSize: tamano,
						lineHeight: 1,
						letterSpacing: '-0.02em',
						color: clave.color,
						whiteSpace: 'nowrap',
						textShadow: `${BORDE}, 0 12px 0 #0A0618, 0 0 46px ${clave.color}AA, 0 0 90px ${clave.color}66`,
					}}
				>
					{clave.texto}
				</span>
			</div>
		</AbsoluteFill>
	);
};
