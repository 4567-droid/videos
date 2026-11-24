import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {avance, GRIS, NEGRO, Palito, Pizarra, POSE_MANOS_CABEZA, POSE_PARADO, ROJO, Texto, tramo, Trazo} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Cuando se deja, el cerebro tarda en reequilibrarse. Pueden aparecer ansiedad, malestar y ganas
 * intensas. No se trata solo de voluntad: es un sistema que se acostumbró."
 * Una balanza desnivelada que oscila sin llegar a equilibrarse. Abajo, el personaje se sostiene la
 * cabeza; alrededor se escriben "ansiedad", "malestar" y "ganas". Al final: "sistema acostumbrado".
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const PIVOTE: [number, number] = [540, 400];

export const BalanzaAbstinencia: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fReequilibrarse = momento('reequilibrarse');
	const fPueden = momento('pueden');
	const fAnsiedad = momento('ansiedad');
	const fMalestar = momento('malestar');
	const fGanas = momento('ganas');
	const fSistema = momento('sistema');

	const balanza = avance(frame, 4, 40);
	const oscila = interpolate(frame, [fReequilibrarse - 20, fReequilibrarse], [0, 1], clamp);
	const ang = 14 + 9 * Math.sin(t * 2.6) * oscila;
	const persona = avance(frame, fPueden - 10, 30);
	const manos = avance(frame, fAnsiedad - 6, 12);
	const palabras = [fAnsiedad, fMalestar, fGanas].map((f) => avance(frame, f - 4, 18));
	const sistema = avance(frame, fSistema - 4, 26);
	const rad = (ang * Math.PI) / 180;
	const extremo = (lado: number): [number, number] => [PIVOTE[0] + lado * Math.cos(rad) * 240, PIVOTE[1] + lado * Math.sin(rad) * 240];
	const pose = {
		brazoI: [POSE_PARADO.brazoI[0] + (POSE_MANOS_CABEZA.brazoI[0] - POSE_PARADO.brazoI[0]) * manos, POSE_PARADO.brazoI[1] + (POSE_MANOS_CABEZA.brazoI[1] - POSE_PARADO.brazoI[1]) * manos] as [number, number],
		brazoD: [POSE_PARADO.brazoD[0] + (POSE_MANOS_CABEZA.brazoD[0] - POSE_PARADO.brazoD[0]) * manos, POSE_PARADO.brazoD[1] + (POSE_MANOS_CABEZA.brazoD[1] - POSE_PARADO.brazoD[1]) * manos] as [number, number],
	};

	return (
		<Pizarra>
			{/* balanza */}
			<Trazo d="M 470 790 L 540 745 L 610 790 Z" p={tramo(balanza, 0, 0.2)} />
			<Trazo d={`M 540 760 L 540 ${PIVOTE[1]}`} p={tramo(balanza, 0.15, 0.35)} />
			{balanza > 0.3
				? [-1, 1].map((lado) => {
						const [ex, ey] = extremo(lado);
						return (
							<g key={lado}>
								<Trazo d={`M ${ex} ${ey} L ${ex - 60} ${ey + 120} M ${ex} ${ey} L ${ex + 60} ${ey + 120}`} p={tramo(balanza, 0.5, 0.75)} ancho={6} />
								<Trazo d={`M ${ex - 85} ${ey + 120} Q ${ex} ${ey + 185} ${ex + 85} ${ey + 120} Z`} p={tramo(balanza, 0.6, 0.9)} />
							</g>
						);
					})
				: null}
			{balanza > 0.3 ? <Trazo d={`M ${extremo(-1)[0]} ${extremo(-1)[1]} L ${extremo(1)[0]} ${extremo(1)[1]}`} p={tramo(balanza, 0.3, 0.55)} ancho={10} /> : null}
			{balanza > 0.5 ? <circle cx={PIVOTE[0]} cy={PIVOTE[1]} r={14} fill={ROJO} /> : null}
			<Texto x={540} y={860} texto="sistema acostumbrado" p={sistema} tam={54} color={NEGRO} />

			{/* persona */}
			<Palito x={540} y={1110} p={persona} escala={1.25} pose={pose} cara="preocupada" />
			{manos > 0.5
				? [0, 1, 2].map((i) => (
						<Trazo key={i} d={`M ${430 - i * 10} ${880 + i * 28} l -40 -10`} p={tramo(manos, 0.5, 1)} color={GRIS} ancho={6} />
					))
				: null}
			<Texto x={220} y={980} texto="ansiedad" p={palabras[0]} tam={60} color={ROJO} rotar={-6} />
			<Texto x={860} y={1000} texto="malestar" p={palabras[1]} tam={60} rotar={5} />
			<Texto x={235} y={1200} texto="ganas" p={palabras[2]} tam={72} color={ROJO} rotar={-4} negrita />
		</Pizarra>
	);
};
