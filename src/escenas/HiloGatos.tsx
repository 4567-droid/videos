import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara, proyectar} from '../componentes/Camara';
import {Etiqueta} from '../componentes/Etiqueta';
import {Bolita, EscenarioMisterio, GatosSuperpuestos, HiloLuz, LILA, TURQUESA} from '../componentes/Misterio';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';
import {camaraPlanos} from '../lib/planos';

/**
 * "Entonces, según esa idea, el átomo está desintegrado y no desintegrado. Y como el gato depende
 * del átomo… ¿el gato también?"
 * El átomo desdoblado (azul: no desintegrado; roja: desintegrado) flota arriba; dos hilos de luz
 * bajan hasta los dos gatos translúcidos superpuestos. Termina con un primer plano de los gatos.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const AZUL = '#3D8BFF';
const ROJO = '#FF3D6E';
const ATOMO_A: V3 = [-0.95, 2.7, -0.4];
const ATOMO_B: V3 = [-0.35, 2.75, -0.5];
const GATOS: V3 = [0.75, 0, 0.3];

export const HiloGatos: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;
	const fDesintegrado = momento('desintegrado');
	const fNo = momento('no desintegrado');
	const fGato = momento('gato');
	const fDepende = momento('depende');
	const fTambien = momento('¿el gato');

	const hilos = interpolate(frame, [fDepende - 4, fDepende + 18], [0, 1], clamp);
	const gatos = interpolate(frame, [fGato - 8, fGato + 6], [0, 1], clamp);
	const vib = 0.03;

	const planos = [
		{desde: 0, pos: [-0.2, 2.6, 3.4] as V3, mira: [-0.65, 2.65, -0.45] as V3, deriva: [-0.2, 0.02, -0.08] as V3},
		{desde: fGato - 6, pos: [-1.6, 2.1, 5.6] as V3, mira: [0, 1.6, 0] as V3, deriva: [0.25, -0.03, -0.25] as V3, llegada: 14},
		{desde: fTambien - 3, pos: [1.0, 1.25, 2.6] as V3, mira: [0.75, 0.85, 0.3] as V3, deriva: [0, 0.02, -0.18] as V3},
		{desde: duracion + 1, pos: [0, 0, 0] as V3, mira: [0, 0, 0] as V3},
	];
	const {posicion, mirarA, fov} = camaraPlanos(frame, fps, planos);
	const ancla = (p: V3) => proyectar(p, posicion, mirarA, width, height, fov);
	const eA = ancla([ATOMO_A[0], ATOMO_A[1] + 0.35, ATOMO_A[2]]);
	const eB = ancla([ATOMO_B[0], ATOMO_B[1] + 0.35, ATOMO_B[2]]);
	const etiquetas = frame < fTambien - 3;

	return (
		<EscenarioMisterio
			t={t}
			overlay={
				etiquetas ? (
					<>
						<Etiqueta x={eB.x + 60} y={eB.y - 10} texto="desintegrado" aparicion={interpolate(frame, [fDesintegrado - 4, fDesintegrado + 6], [0, 1], clamp)} fondo={ROJO} color="#FFFFFF" tamano={38} />
						<Etiqueta x={eA.x - 60} y={eA.y + 110} texto="no desintegrado" aparicion={interpolate(frame, [fNo - 2, fNo + 8], [0, 1], clamp)} fondo={AZUL} color="#FFFFFF" tamano={38} anclaje="centro" />
					</>
				) : null
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} fov={fov} />
			<Bolita color={AZUL} radio={0.24} position={[ATOMO_A[0] + vib * Math.sin(t * 57), ATOMO_A[1] + vib * Math.cos(t * 43), ATOMO_A[2]]} />
			<Bolita color={ROJO} radio={0.24} position={[ATOMO_B[0] - vib * Math.cos(t * 51), ATOMO_B[1] + vib * Math.sin(t * 39), ATOMO_B[2]]} />
			{hilos > 0.01 ? (
				<>
					<HiloLuz t={t} desde={ATOMO_A} hasta={[GATOS[0] - 0.1, 1.45, GATOS[2]]} curva={[0.3, 0.5, 0.3]} color={TURQUESA} progreso={hilos} />
					<HiloLuz t={t + 0.5} desde={ATOMO_B} hasta={[GATOS[0] + 0.25, 0.75, GATOS[2] + 0.4]} curva={[0.4, 0.3, 0.2]} color={LILA} progreso={hilos} />
				</>
			) : null}
			<GatosSuperpuestos t={t} opacidad={0.85 * gatos} titilar={0.5} position={GATOS} rotation={[0, -0.25, 0]} scale={0.95} />
		</EscenarioMisterio>
	);
};
