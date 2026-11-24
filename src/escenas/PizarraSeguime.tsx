import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {avance, Bombilla, Brillo, LunaPizarra, NEGRO, Pizarra, rectangulo, ROJO, SolPizarra, tramo, Trazo} from '../componentes/Pizarra';
import {FUENTE} from '../lib/fuente';
import {useEscena} from '../lib/escena';

/**
 * Cierre en estilo pizarra: "Seguime para más datos que no sabías."
 * Lamparita amarilla con un signo de pregunta (se dibuja y se enciende) y un botón rojo
 * "+ Seguir" que una manito toca al final. Con `companeros`, el sol y la luna (los personajes
 * del reel del cortisol y la melatonina) saludan a los costados del botón.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const MANITO =
	'M17 4c2.2 0 4 1.8 4 4v15.5l1.6-.4c2-.5 4 .8 4.4 2.8l.2 1.1 1.3-.3c2-.4 3.9.9 4.3 2.9l.2.9 1.1-.2c2.1-.3 4 1.1 4.3 3.2l1.2 9.7C40.6 52 35.4 57 29.2 57H24c-4 0-7.6-2.2-9.5-5.7L6.7 37c-1-1.9-.4-4.3 1.5-5.3 1.7-.9 3.8-.4 5 1.1L13 34V8c0-2.2 1.8-4 4-4z';

export const PizarraSeguime: React.FC<{companeros?: boolean}> = ({companeros = false}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento} = useEscena();
	const fSeguime = momento('seguime');
	const fSabias = momento('sabías', {fin: true});

	const lampara = avance(frame, 0, 26);
	const brillo = interpolate(frame, [14, 32], [0, 1], clamp) * (0.9 + 0.1 * Math.sin(frame / 4));
	const boton = avance(frame, fSeguime - 2, 18);
	const llega = spring({frame: frame - fSabias + 8, fps, config: {damping: 14, stiffness: 120}});
	const toque = interpolate(frame, [fSabias + 6, fSabias + 10, fSabias + 16], [0, 1, 0], clamp);
	const despues = interpolate(frame, [fSabias + 10, fSabias + 26], [0, 1], clamp);
	const escalaBoton = 1 - 0.06 * toque;
	const amigos = companeros ? avance(frame, 8, 22) : 0;
	const salto = (fase: number) => -14 * Math.abs(Math.sin(frame / 7 + fase)) * despues;

	return (
		<Pizarra zoom={[1, 1.04]} foco={[540, 800]}>
			<Bombilla x={540} y={660} p={lampara} brillo={brillo} escala={1.6} signo />
			<SolPizarra x={165} y={1150 + salto(0)} p={amigos} escala={0.72} cara={despues > 0.5 ? 'feliz' : 'sonrisa'} giro={frame * 0.8} />
			<LunaPizarra x={915} y={1150 + salto(1.3)} p={tramo(amigos, 0.15, 1)} escala={1.05} cara={despues > 0.5 ? 'feliz' : 'sonrisa'} voltear />
			<Brillo x={540} y={1150} r={200} intensidad={0.7 * despues} />
			<g transform={`translate(540 1150) scale(${escalaBoton}) translate(-540 -1150)`}>
				<path d={rectangulo(290, 1075, 500, 150, 75)} fill={ROJO} opacity={tramo(boton, 0.5, 1)} />
				<Trazo d={rectangulo(290, 1075, 500, 150, 75)} p={tramo(boton, 0, 0.6)} ancho={9} color={NEGRO} />
				<text
					x={540}
					y={1175}
					textAnchor="middle"
					fontFamily={FUENTE}
					fontWeight={900}
					fontSize={76}
					fill="#FFFFFF"
					opacity={tramo(boton, 0.6, 1)}
				>
					+ Seguir
				</text>
			</g>
			{llega > 0.01 ? (
				<g transform={`translate(${615 + 220 * (1 - llega)} ${1145 + 260 * (1 - llega)}) scale(${3.2 * (1 - 0.12 * toque)})`} opacity={Math.min(1, llega * 1.5)}>
					<path d={MANITO} fill="#FFFFFF" stroke={NEGRO} strokeWidth={2.4} strokeLinejoin="round" transform="translate(-17 -4)" />
				</g>
			) : null}
		</Pizarra>
	);
};
