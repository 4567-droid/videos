import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {AMARILLO, avance, AZUL, Garabato, Palito, Pizarra, POSE_BRAZOS_CRUZADOS, ROJO, Texto, tramo, Trazo} from '../componentes/Pizarra';
import type {PosePalito} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Parte de la culpa puede ser de dos hormonas que trabajan en equipo. Un equipo con muy mala
 * comunicación: el cortisol y la melatonina."
 * El sol (cortisol) y la luna (melatonina) de la mano bajo un cartel "EQUIPO" con un corazón.
 * Con "Un equipo con muy mala comunicación" se sueltan, se dan la espalda con los brazos
 * cruzados (¡hmpf!), el corazón se parte y el cartel se raja. Al final, sus nombres.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
type P2 = [number, number];
const mezclarPose = (a: Partial<PosePalito>, b: Partial<PosePalito>, k: number): Partial<PosePalito> => {
	const r: Partial<PosePalito> = {};
	for (const clave of ['brazoI', 'brazoD', 'piernaI', 'piernaD'] as const) {
		const va = a[clave] ?? ([24, 8] as P2);
		const vb = b[clave] ?? va;
		r[clave] = [va[0] + (vb[0] - va[0]) * k, va[1] + (vb[1] - va[1]) * k];
	}
	return r;
};
const corazon = (cx: number, cy: number, s: number) =>
	`M ${cx} ${cy + s * 0.9} C ${cx - s * 1.3} ${cy + s * 0.1} ${cx - s * 0.9} ${cy - s * 0.9} ${cx} ${cy - s * 0.35} C ${cx + s * 0.9} ${cy - s * 0.9} ${cx + s * 1.3} ${cy + s * 0.1} ${cx} ${cy + s * 0.9} Z`;
const mitad = (cx: number, cy: number, s: number, lado: -1 | 1) =>
	`M ${cx} ${cy + s * 0.9} C ${cx + lado * s * 1.3} ${cy + s * 0.1} ${cx + lado * s * 0.9} ${cy - s * 0.9} ${cx} ${cy - s * 0.35} L ${cx + lado * 0.12 * s} ${cy} L ${cx - lado * 0.1 * s} ${cy + s * 0.35} Z`;
const enojo = (cx: number, cy: number) =>
	`M ${cx - 16} ${cy - 5} Q ${cx - 6} ${cy - 6} ${cx - 5} ${cy - 16} M ${cx + 5} ${cy - 16} Q ${cx + 6} ${cy - 6} ${cx + 16} ${cy - 5} M ${cx + 16} ${cy + 5} Q ${cx + 6} ${cy + 6} ${cx + 5} ${cy + 16} M ${cx - 5} ${cy + 16} Q ${cx - 6} ${cy + 6} ${cx - 16} ${cy + 5}`;

const CARTEL = 'M 290 455 L 790 455 L 758 505 L 790 555 L 290 555 L 322 505 Z';

export const SolLunaEspaldas: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fHormonas = momento('hormonas');
	const fEquipo = momento('equipo');
	const fUn = momento('un equipo');
	const fMala = momento('mala');
	const fComunicacion = momento('comunicación');
	const fCortisol = momento('cortisol');
	const fMelatonina = momento('melatonina');

	const personajes = avance(frame, 6, 30);
	const cartel = avance(frame, fEquipo - 6, 18);
	const gira = interpolate(frame, [fUn, fUn + 14], [0, 1], clamp);
	const enojados = frame >= fMala - 2;
	const rompe = interpolate(frame, [fMala - 4, fMala + 10], [0, 1], clamp);
	const raja = avance(frame, fComunicacion, 10);
	const bronca = avance(frame, fComunicacion + 2, 12);
	const saltito = frame > fMala && frame < fMala + 10 ? -10 * Math.sin(((frame - fMala) / 10) * Math.PI) : 0;

	const xSol = 380 - 40 * gira;
	const xLuna = 700 + 40 * gira;
	const poseSol = mezclarPose({brazoI: [24, 8], brazoD: [80, 10]}, POSE_BRAZOS_CRUZADOS, gira);
	const poseLuna = mezclarPose({brazoI: [80, 10], brazoD: [24, 8]}, POSE_BRAZOS_CRUZADOS, gira);
	const latido = 1 + 0.06 * Math.sin(t * 8);

	return (
		<Pizarra zoom={[1, 1.04]} foco={[540, 820]}>
			{/* cartel EQUIPO */}
			{cartel > 0.01 ? (
				<g>
					<path d={CARTEL} fill="#FFFFFF" opacity={tramo(cartel, 0.2, 0.5)} />
					<Garabato forma={CARTEL} caja={[290, 455, 500, 100]} p={tramo(cartel, 0.4, 1)} color={AMARILLO} paso={16} opacidad={0.55} />
					<Trazo d={CARTEL} p={tramo(cartel, 0, 0.6)} ancho={8} />
					<Texto x={540} y={530} texto="EQUIPO" p={tramo(cartel, 0.4, 1)} tam={78} negrita />
					<Trazo d="M 534 452 L 552 482 L 528 502 L 556 528 L 538 560" p={raja} color={ROJO} ancho={9} />
				</g>
			) : null}
			{/* corazón entre las manos (se parte) */}
			{cartel > 0.2 ? (
				rompe < 0.01 ? (
					<g transform={`translate(540 800) scale(${latido}) translate(-540 -800)`}>
						<path d={corazon(540, 800, 46)} fill={ROJO} opacity={tramo(cartel, 0.5, 0.9)} />
						<Trazo d={corazon(540, 800, 46)} p={tramo(cartel, 0.2, 0.8)} ancho={6} />
					</g>
				) : (
					([-1, 1] as const).map((lado) => (
						<g key={lado} transform={`translate(${lado * 34 * rompe} ${26 * rompe}) rotate(${lado * 18 * rompe} 540 800)`}>
							<path d={mitad(540, 800, 46, lado)} fill={ROJO} />
							<Trazo d={mitad(540, 800, 46, lado)} p={1} ancho={6} />
						</g>
					))
				)
			) : null}

			<Palito
				x={xSol}
				y={1000 + saltito}
				p={personajes}
				escala={1.5}
				tipoCabeza="sol"
				giroRayos={t * 20}
				cara={enojados ? 'enojado' : 'sonrisa'}
				girarCara={-gira}
				pose={poseSol}
			/>
			<Palito
				x={xLuna}
				y={1000 + saltito}
				p={tramo(personajes, 0.1, 1)}
				escala={1.5}
				tipoCabeza="luna"
				cara={enojados ? 'fastidio' : 'sonrisa'}
				escalaX={-1 + 2 * gira}
				pose={poseLuna}
			/>
			{/* ¡hmpf! */}
			<Trazo d={enojo(205, 655)} p={bronca} color={ROJO} ancho={6} />
			<Trazo d={enojo(880, 655)} p={bronca} color={ROJO} ancho={6} />
			<Texto x={175} y={760} texto="¡hmpf!" p={bronca} tam={52} />
			<Texto x={905} y={760} texto="¡hmpf!" p={bronca} tam={52} />

			{/* nombres */}
			<Texto x={xSol} y={1268} texto="cortisol" p={avance(frame, fCortisol - 2, 14)} tam={68} negrita />
			<Trazo d={`M ${xSol - 110} 1290 Q ${xSol} 1302 ${xSol + 110} 1288`} p={avance(frame, fCortisol + 8, 10)} color={AMARILLO} ancho={14} />
			<Texto x={xLuna} y={1268} texto="melatonina" p={avance(frame, fMelatonina - 2, 16)} tam={68} negrita />
			<Trazo d={`M ${xLuna - 140} 1290 Q ${xLuna} 1302 ${xLuna + 140} 1288`} p={avance(frame, fMelatonina + 10, 10)} color={AZUL} ancho={14} />
			{/* "dos hormonas" */}
			<Texto x={540} y={400} texto="2 hormonas" p={avance(frame, fHormonas - 4, 14) * (1 - cartel)} tam={60} />
		</Pizarra>
	);
};
